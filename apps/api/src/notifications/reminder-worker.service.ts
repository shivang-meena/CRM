import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrmCoreService } from '../crm/crm-core.service';

@Injectable()
export class ReminderWorkerService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private stopping = false;
  private logger = new Logger(ReminderWorkerService.name);
  constructor(private prisma: PrismaService, private core: CrmCoreService, private config: ConfigService) {}
  onModuleInit() {
    if (this.config.get<string>('CRM_REMINDER_WORKER_ENABLED') === 'false') return;
    this.timer = setInterval(() => { void this.tick(); }, 30000);
    void this.tick();
  }
  onModuleDestroy() { this.stopping = true; if (this.timer) clearInterval(this.timer); }
  private async tick() {
    if (this.running || this.stopping) return;
    this.running = true;
    try {
      const candidates = await this.prisma.leadReminder.findMany({ where: { status: 'PENDING', deletedAt: null, remindAt: { lte: new Date() }, OR: [{ leadId: null }, { lead: { deletedAt: null } }] }, orderBy: [{ remindAt: 'asc' }, { id: 'asc' }], take: 50, select: { id: true, leadId: true } });
      for (const candidate of candidates) {
        if (this.stopping) break;
        await this.prisma.$transaction(async tx => {
          // Lead-linked reminders keep the existing lead lock order. Independent reminders lock only themselves.
          if (candidate.leadId) {
            await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "leads" WHERE "id" = ${candidate.leadId} FOR UPDATE`);
            const lead = await tx.lead.findFirst({ where: { id: candidate.leadId, deletedAt: null } });
            if (!lead) return;
          }
          await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "lead_reminders" WHERE "id" = ${candidate.id} FOR UPDATE`);
          const reminder = await tx.leadReminder.findUnique({ where: { id: candidate.id }, include: { followUp: true, meeting: true } });
          if (!reminder || reminder.deletedAt || reminder.status !== 'PENDING' || reminder.remindAt > new Date()) return;
          const target = reminder.followUp ?? reminder.meeting;
          const active = !target || !target.deletedAt && ['PENDING','TODO','IN_PROGRESS','SCHEDULED'].includes(target.status);
          const actor = { id: 'system', name: 'Reminder service' };
          if (!active) {
            await tx.leadReminder.update({ where: { id: reminder.id }, data: { status: 'CANCELLED', version: { increment: 1 }, updatedById: actor.id, updatedByName: actor.name } });
            if (reminder.leadId) await this.core.history(tx, reminder.leadId, actor, 'REMINDER', reminder.id, 'CANCELLED', 'Reminder cancelled because its linked activity is no longer pending');
            return;
          }
          await tx.crmNotification.upsert({ where: { reminderId: reminder.id }, create: { leadId: reminder.leadId, reminderId: reminder.id, recipientId: reminder.recipientId, title: reminder.title, message: reminder.message }, update: {} });
          await tx.leadReminder.update({ where: { id: reminder.id }, data: { status: 'TRIGGERED', triggeredAt: new Date(), version: { increment: 1 }, updatedById: actor.id, updatedByName: actor.name } });
          if (reminder.leadId) await this.core.history(tx, reminder.leadId, actor, 'REMINDER', reminder.id, 'TRIGGERED', 'In-app reminder delivered: ' + reminder.title);
        });
      }
    } catch {
      this.logger.error('Reminder processing failed; pending reminders will be retried on the next interval.');
    } finally { this.running = false; }
  }
}
