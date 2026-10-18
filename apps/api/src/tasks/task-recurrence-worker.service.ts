import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, StandaloneTaskStatus, TaskHistoryAction, TaskRecurrenceFrequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MAX_BATCH = 50;

function istParts(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(value);
  const get = (type: string) => Number(parts.find(item => item.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month') - 1, day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

function fromIstParts(parts: ReturnType<typeof istParts>) { return new Date(Date.UTC(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second) - 330 * 60000); }
function lastDay(year: number, month: number) { return new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); }

function nextOccurrence(value: Date, frequency: TaskRecurrenceFrequency, interval: number) {
  const next = istParts(value);
  if (frequency === 'DAILY') next.day += interval;
  if (frequency === 'WEEKLY') next.day += interval * 7;
  if (frequency === 'MONTHLY') {
    const day = next.day;
    next.day = 1;
    next.month += interval;
    next.day = Math.min(day, lastDay(next.year, next.month));
  }
  return fromIstParts(next);
}

@Injectable()
export class TaskRecurrenceWorkerService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private stopping = false;
  private logger = new Logger(TaskRecurrenceWorkerService.name);

  constructor(private prisma: PrismaService, private config: ConfigService) {}

  onModuleInit() {
    // Recurrence is source-ready but opt-in so this feature never starts a worker during migration/deployment work.
    if (this.config.get<string>('CRM_TASK_RECURRENCE_WORKER_ENABLED') !== 'true') return;
    this.timer = setInterval(() => { void this.tick(); }, 60000);
    void this.tick();
  }

  onModuleDestroy() { this.stopping = true; if (this.timer) clearInterval(this.timer); }

  private async tick() {
    if (this.running || this.stopping) return;
    this.running = true;
    try { await this.processBatch(); } catch { this.logger.error('Task recurrence processing failed; missed occurrences will be retried.'); }
    finally { this.running = false; }
  }

  async processBatch(now = new Date()) {
    const series = await this.prisma.taskRecurrenceSeries.findMany({
      where: { active: true, nextOccurrenceAt: { lte: now }, OR: [{ recurrenceEndsAt: null }, { recurrenceEndsAt: { gte: now } }] },
      orderBy: [{ nextOccurrenceAt: 'asc' }, { id: 'asc' }], take: MAX_BATCH,
    });
    for (const candidate of series) {
      if (this.stopping) break;
      await this.prisma.$transaction(async tx => {
        const locked = await tx.taskRecurrenceSeries.findUnique({ where: { id: candidate.id } });
        if (!locked || !locked.active || locked.nextOccurrenceAt > now) return;
        const occurrenceStart = locked.nextOccurrenceAt;
        const occurrenceEnd = new Date(occurrenceStart.getTime() + locked.durationMinutes * 60000);
        const next = nextOccurrence(occurrenceStart, locked.frequency, locked.interval);
        if (locked.recurrenceEndsAt && occurrenceStart > locked.recurrenceEndsAt) {
          await tx.taskRecurrenceSeries.update({ where: { id: locked.id }, data: { active: false, version: { increment: 1 } } });
          return;
        }
        const requestHash = `${locked.id}:${occurrenceStart.toISOString()}`;
        const existing = await tx.task.findFirst({ where: { recurrenceSeriesId: locked.id, occurrenceAt: occurrenceStart }, select: { id: true } });
        if (!existing) {
          const task = await tx.task.create({ data: {
            subject: locked.subject, description: locked.description, priority: locked.priority, status: StandaloneTaskStatus.NEW,
            labelId: locked.labelId, startAt: occurrenceStart, endAt: occurrenceEnd, assignedTo: locked.assignedTo,
            createdById: locked.createdById, createdByName: locked.createdByName, requestKey: `recurrence_${requestHash}`, requestHash,
            recurrenceSeriesId: locked.id, occurrenceAt: occurrenceStart,
          } });
          await tx.taskHistory.create({ data: { taskId: task.id, action: TaskHistoryAction.OCCURRENCE_GENERATED, actorId: 'system', actorName: 'Task recurrence service', changes: { occurrenceAt: occurrenceStart.toISOString() } as Prisma.InputJsonObject } });
        }
        const active = !locked.recurrenceEndsAt || next <= locked.recurrenceEndsAt;
        await tx.taskRecurrenceSeries.update({ where: { id: locked.id }, data: { nextOccurrenceAt: next, active, version: { increment: 1 } } });
      });
    }
    return { processed: series.length };
  }
}
