import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { HistoryEntity, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { currentAdminId } from '../tenant/tenant-context';
import { CrmCoreService, Tx } from '../crm/crm-core.service';
import { AssigneesService } from '../crm/assignees.service';
import { ListQueryDto, VersionDto } from '../crm/crm.dto';
import { activityPermissions, assertPermissions, hasPermission } from '../auth/permissions';
import type { AuthenticatedUser, ModulePermission } from '../auth/permissions';

export type ActivityKind = 'followups' | 'meetings' | 'reminders';
const config = {
  followups: { delegate: 'leadFollowUp', entity: 'FOLLOWUP', time: 'scheduledAt', pending: ['PENDING'], statuses: ['PENDING','COMPLETED','CANCELLED'], target: 'followUpId' },
  meetings: { delegate: 'leadMeeting', entity: 'MEETING', time: 'startAt', pending: ['SCHEDULED'], statuses: ['SCHEDULED','COMPLETED','CANCELLED'], target: 'meetingId' },
  reminders: { delegate: 'leadReminder', entity: 'REMINDER', time: 'remindAt', pending: ['PENDING'], statuses: ['PENDING','TRIGGERED','DISMISSED','CANCELLED'], target: '' },
} as const;
// Only the four fixed delegates above can reach this adapter; controllers use concrete validated DTOs.
type Delegate = { findFirst(args: any): Promise<any>; findMany(args: any): Promise<any[]>; count(args: any): Promise<number>; create(args: any): Promise<any>; update(args: any): Promise<any> };

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService, private core: CrmCoreService, private assignees: AssigneesService) {}
  private db(tx: Tx, kind: ActivityKind) { return tx[config[kind].delegate] as unknown as Delegate; }

  private fields(kind: ActivityKind, input: Record<string, any>) {
    const allowed = {
      followups: ['title','description','scheduledAt','channel','assignedTo'],
      meetings: ['title','agenda','startAt','endAt','timezone','mode','location','meetingUrl','attendees','assignedTo'],
      reminders: ['title','message','remindAt','followUpId','meetingId'],
    }[kind];
    const output: Record<string, any> = {};
    for (const key of allowed) if (input[key] !== undefined) {
      output[key] = ['scheduledAt','dueAt','startAt','endAt','remindAt'].includes(key) ? new Date(input[key]) : input[key];
    }
    return output;
  }

  private async validate(tx: Tx, kind: ActivityKind, leadId: string, row: Record<string, any>) {
    if (kind === 'meetings' && new Date(row.endAt) <= new Date(row.startAt)) throw new BadRequestException('Meeting end must be after its start.');
    if (kind !== 'reminders') return;
    const targets = (['followUpId','meetingId'] as const).filter(k => row[k]);
    if (targets.length > 1) throw new BadRequestException('Choose at most one linked activity.');
    if (targets.length) {
      const target = targets[0], linkedKind = target === 'followUpId' ? 'followups' : 'meetings';
      const linked = await this.db(tx, linkedKind).findFirst({ where: { id: row[target], leadId, deletedAt: null } });
      if (!linked || !(config[linkedKind].pending as readonly string[]).includes(linked.status)) throw new BadRequestException('The linked activity must be pending and belong to this lead.');
    }
  }

  async list(kind: ActivityKind, leadId: string | undefined, query: ListQueryDto & { unpaged?: boolean }) {
    if (leadId && !await this.prisma.lead.findFirst({ where: { id: leadId, deletedAt: null } })) throw new NotFoundException('Lead not found');
    const c = config[kind];
    if (query.status && !(c.statuses as readonly string[]).includes(query.status)) throw new BadRequestException('Invalid status filter');
    if (query.priority) throw new BadRequestException('Invalid priority filter');
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) throw new BadRequestException('Date range is invalid');
    const now = new Date();
    const where: Record<string, any> = {
      ...(leadId ? { leadId } : {}), deletedAt: null, lead: { deletedAt: null },
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.search ? { title: { contains: query.search.trim(), mode: 'insensitive' } } : {}),
      ...((query.from || query.to) ? { [c.time]: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lt: new Date(query.to) } : {}) } } : {}),
    };
    if (query.overdue) {
      const overdue = { status: { in: [...c.pending] }, [c.time]: { lt: now } };
      where.AND = query.overdue === 'true' ? [overdue] : [{ NOT: overdue }];
    }
    const db = this.db(this.prisma, kind);
    const [items, total, completed] = await Promise.all([
      db.findMany({ where, include: { lead: { select: { id: true, name: true } } }, ...(query.unpaged ? {} : { skip: (query.page - 1) * query.pageSize, take: query.pageSize }), orderBy: [{ [c.time]: 'asc' }, { id: 'asc' }] }),
      db.count({ where }),
      db.count({ where: { ...where, status: kind === 'reminders' ? 'DISMISSED' : 'COMPLETED' } }),
    ]);
    return { items, total, completed, page: query.page, pageSize: query.pageSize };
  }

  async listAll(kind: ActivityKind, leadId: string | undefined, query: ListQueryDto) {
    return this.list(kind, leadId, { ...query, page: 1, pageSize: 100, unpaged: true });
  }

  async one(kind: ActivityKind, leadId: string, id: string) {
    const row = await this.db(this.prisma, kind).findFirst({ where: { id, leadId, deletedAt: null, lead: { deletedAt: null } } });
    if (!row) throw new NotFoundException('Record not found');
    return row;
  }

  async create(kind: ActivityKind, leadId: string, input: Record<string, any>, actor: AuthenticatedUser) {
    if (kind !== 'reminders' && input.reminderAt) assertPermissions(actor, 'reminder');
    return this.prisma.$transaction(async tx => {
      await this.core.lockLead(tx, leadId);
      const db = this.db(tx, kind), hash = this.core.hash({ leadId, kind, input });
      const existing = await db.findFirst({ where: { createdById: actor.id, requestKey: input.requestKey } });
      if (existing) { this.core.replay(existing, hash); return existing; }
      const fields = this.fields(kind, input);
      const assignment = await this.assignees.resolve(tx, input, actor);
      Object.assign(fields, assignment, kind === 'reminders' ? { recipientId: assignment.assignedToId } : {});
      await this.validate(tx, kind, leadId, fields);
      const row = await db.create({ data: { ...fields, adminId: currentAdminId(), leadId, createdById: actor.id, createdByName: actor.name, requestKey: input.requestKey, requestHash: hash } });
      await this.core.history(tx, leadId, actor, config[kind].entity, row.id, 'CREATED', `${row.title} added; assigned to ${assignment.assignedTo}`, { assignedTo: null, assignedToId: null }, assignment);
      if (kind === 'followups') await this.core.syncFollowUp(tx, leadId);
      if (kind !== 'reminders' && input.reminderAt) {
        const reminder = await tx.leadReminder.create({ data: {
          adminId: currentAdminId(),
          leadId, title: row.title, remindAt: new Date(input.reminderAt), ...assignment, recipientId: assignment.assignedToId!,
          createdById: actor.id, createdByName: actor.name, [config[kind].target]: row.id,
        } });
        await this.core.history(tx, leadId, actor, 'REMINDER', reminder.id, 'CREATED', `Linked reminder added; assigned to ${assignment.assignedTo}`);
      }
      return row;
    });
  }

  async change(kind: ActivityKind, leadId: string, id: string, input: Record<string, any>, actor: AuthenticatedUser, action: 'update' | 'complete' | 'cancel' | 'dismiss' | 'delete') {
    if (kind !== 'reminders' && action === 'update' && input.updateLinkedReminder && input.reminderAt) assertPermissions(actor, 'reminder');
    return this.prisma.$transaction(async tx => {
      await this.core.lockLead(tx, leadId);
      const db = this.db(tx, kind);
      const before = await db.findFirst({ where: { id, leadId, deletedAt: null } });
      if (!before) throw new NotFoundException('Record not found');
      this.core.version(before, input.version);
      const pending = (config[kind].pending as readonly string[]).includes(before.status);
      if (action === 'update' && !pending) throw new BadRequestException('Only pending activities can be edited.');
      if (['complete','cancel'].includes(action) && !pending) throw new BadRequestException('This activity is no longer pending.');
      if (action === 'complete' && kind === 'reminders') throw new BadRequestException('Dismiss reminders instead.');
      if (action === 'dismiss' && (kind !== 'reminders' || !['PENDING','TRIGGERED'].includes(before.status))) throw new BadRequestException('This reminder cannot be dismissed.');
      const data = action === 'update' ? this.fields(kind, input) : {};
      if (action === 'update') {
        const assignment = await this.assignees.resolve(tx, input, actor, before);
        Object.assign(data, assignment, kind === 'reminders' && assignment.assignedToId ? { recipientId: assignment.assignedToId } : {});
      }
      if (action === 'complete') Object.assign(data, { status: 'COMPLETED', completedAt: new Date(), outcome: input.outcome ?? null });
      if (action === 'cancel') data.status = 'CANCELLED';
      if (action === 'dismiss') Object.assign(data, { status: 'DISMISSED', dismissedAt: new Date() });
      if (action === 'delete') data.deletedAt = new Date();
      if (action === 'update') await this.validate(tx, kind, leadId, { ...before, ...data });
      const after = await db.update({ where: { id }, data: { ...data, updatedById: actor.id, updatedByName: actor.name, version: { increment: 1 } } });
      if (kind === 'followups') await this.core.syncFollowUp(tx, leadId);
      if (kind !== 'reminders') {
        const target = { [config[kind].target]: id };
        if (action !== 'update') await this.core.cancelReminders(tx, leadId, target, actor);
        else if (input.updateLinkedReminder && input.reminderAt) {
          const reminders = await tx.leadReminder.findMany({ where: { leadId, ...target, deletedAt: null, status: 'PENDING' } });
          for (const reminder of reminders) {
            const changed = await tx.leadReminder.update({ where: { id: reminder.id }, data: { remindAt: new Date(input.reminderAt), version: { increment: 1 }, updatedById: actor.id, updatedByName: actor.name } });
            await this.core.history(tx, leadId, actor, 'REMINDER', reminder.id, 'UPDATED', 'Linked reminder rescheduled', reminder, changed);
          }
        }
      }
      const actions = { update: 'UPDATED', complete: 'COMPLETED', cancel: 'CANCELLED', dismiss: 'DISMISSED', delete: 'DELETED' } as const;
      const assignmentSummary = action === 'update' ? this.assignees.summary(before, after) : null;
      await this.core.history(tx, leadId, actor, config[kind].entity, id, actions[action], after.title + ' ' + action + (assignmentSummary ? `; ${assignmentSummary}` : ''), before, after);
      return after;
    });
  }

  async summary(leadId: string, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async tx => {
      const lead = await tx.lead.findFirst({ where: { id: leadId, deletedAt: null } });
      if (!lead) throw new NotFoundException('Lead not found');
      const counts: Record<string, number> = {}, pending: Record<string, number> = {}, overdue: Record<string, number> = {};
      for (const kind of Object.keys(config) as ActivityKind[]) {
        if (!hasPermission(actor, activityPermissions[kind])) {
          counts[kind] = 0;
          pending[kind] = 0;
          if (kind === 'followups') overdue[kind] = 0;
          continue;
        }
        const db = this.db(tx, kind), c = config[kind], base = { leadId, deletedAt: null };
        counts[kind] = await db.count({ where: base });
        pending[kind] = await db.count({ where: { ...base, status: { in: [...c.pending] } } });
        if (kind === 'followups') overdue[kind] = await db.count({ where: { ...base, status: { in: [...c.pending] }, [c.time]: { lt: new Date() } } });
      }
      counts.quotations = 0;
      counts.invoices = 0;
      overdue.invoices = 0;
      if (hasPermission(actor, 'invoice')) {
        counts.quotations = await tx.salesDocument.count({ where: { leadId, deletedAt: null, type: 'QUOTATION' } });
        counts.invoices = await tx.salesDocument.count({ where: { leadId, deletedAt: null, type: 'INVOICE' } });
        const invoices = await tx.salesDocument.findMany({ where: { leadId, deletedAt: null, type: 'INVOICE', status: 'ISSUED', nextPaymentDate: { lt: new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) + 'T00:00:00Z') }, dueAmount: { gt: 0 } } });
        overdue.invoices = invoices.length;
      }
      return { counts, pending, overdue, nextFollowUpAt: lead.nextFollowUpAt };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  async history(leadId: string, query: ListQueryDto, actor: AuthenticatedUser) {
    if (!await this.prisma.lead.findFirst({ where: { id: leadId, deletedAt: null } })) throw new NotFoundException('Lead not found');
    const entityPermissions: Record<HistoryEntity, ModulePermission> = {
      LEAD: 'lead', FOLLOWUP: 'lead', REMINDER: 'reminder',
      MEETING: 'meeting', QUOTATION: 'invoice', INVOICE: 'invoice', PAYMENT: 'invoice',
    };
    const entityTypes = (Object.keys(entityPermissions) as HistoryEntity[])
      .filter(entity => hasPermission(actor, entityPermissions[entity]));
    const where = { leadId, entityType: { in: entityTypes }, ...(query.search ? { summary: { contains: query.search, mode: 'insensitive' as const } } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.leadHistory.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
      this.prisma.leadHistory.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
}
