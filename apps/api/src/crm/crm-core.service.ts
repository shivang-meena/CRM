import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { HistoryAction, HistoryEntity, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';

export type Actor = { id: string; name: string };
export type Tx = Prisma.TransactionClient;

function plain(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Prisma.Decimal) return value.toString();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, plain(v)]));
  }
  return value;
}

@Injectable()
export class CrmCoreService {
  hash(payload: unknown) { return createHash('sha256').update(JSON.stringify(plain(payload))).digest('hex'); }

  async lockLead(tx: Tx, id: string) {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "leads" WHERE "id" = ${id} FOR UPDATE`);
    const lead = await tx.lead.findFirst({ where: { id, deletedAt: null } });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  version(record: { version: number }, expected: number) {
    if (record.version !== expected) throw new ConflictException('This record changed. Refresh before saving again.');
  }

  replay(record: { requestHash: string | null }, hash: string) {
    if (record.requestHash !== hash) throw new ConflictException('This submission key was already used for different content.');
  }

  async history(tx: Tx, leadId: string, actor: Actor, entityType: HistoryEntity, entityId: string,
    action: HistoryAction, summary: string, before?: unknown, after?: unknown) {
    const changes: Record<string, unknown> = {};
    if (before && after && typeof before === 'object' && typeof after === 'object') {
      const a = plain(before) as Record<string, unknown>, b = plain(after) as Record<string, unknown>;
      for (const key of Object.keys(b)) {
        if (['updatedAt', 'version', 'updatedById', 'updatedByName', 'requestKey', 'requestHash'].includes(key)) continue;
        if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) changes[key] = { before: a[key] ?? null, after: b[key] };
      }
    }
    return tx.leadHistory.create({ data: {
      leadId, actorId: actor.id, actorName: actor.name, entityType, entityId, action, summary,
      ...(Object.keys(changes).length ? { changes: changes as Prisma.InputJsonObject } : {}),
    } });
  }

  async syncFollowUp(tx: Tx, leadId: string) {
    const next = await tx.leadFollowUp.findFirst({
      where: { leadId, deletedAt: null, status: 'PENDING' },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    });
    const previous = await tx.lead.findUnique({ where: { id: leadId }, select: { nextFollowUpAt: true } });
    if (previous?.nextFollowUpAt?.getTime() !== next?.scheduledAt?.getTime()) {
      await tx.lead.update({ where: { id: leadId }, data: { nextFollowUpAt: next?.scheduledAt ?? null, version: { increment: 1 } } });
    }
  }

  async cancelReminders(tx: Tx, leadId: string, target: { followUpId?: string; meetingId?: string }, actor: Actor) {
    const rows = await tx.leadReminder.findMany({ where: { leadId, ...target, deletedAt: null, status: 'PENDING' } });
    for (const row of rows) {
      await tx.leadReminder.update({ where: { id: row.id }, data: {
        status: 'CANCELLED', version: { increment: 1 }, updatedById: actor.id, updatedByName: actor.name,
      } });
      await this.history(tx, leadId, actor, 'REMINDER', row.id, 'CANCELLED', 'Linked reminder cancelled');
    }
  }
}
