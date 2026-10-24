import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { currentAdminId } from '../tenant/tenant-context';
import { Actor, CrmCoreService } from '../crm/crm-core.service';
import { ListQueryDto, VersionDto } from '../crm/crm.dto';

type StandaloneKind = 'meetings' | 'reminders';

const config = {
  meetings: { delegate: 'leadMeeting', time: 'startAt', statuses: ['SCHEDULED', 'COMPLETED', 'CANCELLED'], pending: ['SCHEDULED'] },
  reminders: { delegate: 'leadReminder', time: 'remindAt', statuses: ['PENDING', 'TRIGGERED', 'DISMISSED', 'CANCELLED'], pending: ['PENDING'] },
} as const;

@Injectable()
export class StandaloneActivitiesService {
  constructor(private prisma: PrismaService, private core: CrmCoreService) {}

  private db(kind: StandaloneKind) { return (this.prisma as any)[config[kind].delegate] as any; }

  private fields(kind: StandaloneKind, input: Record<string, any>) {
    const allowed = kind === 'meetings'
      ? ['title', 'agenda', 'startAt', 'endAt', 'timezone', 'mode', 'location', 'meetingUrl', 'attendees', 'assignedTo']
      : ['title', 'message', 'remindAt'];
    const output: Record<string, any> = {};
    for (const key of allowed) if (input[key] !== undefined) {
      output[key] = ['startAt', 'endAt', 'remindAt'].includes(key) ? new Date(input[key]) : input[key];
    }
    return output;
  }

  private validate(kind: StandaloneKind, row: Record<string, any>) {
    if (kind === 'meetings' && new Date(row.endAt) <= new Date(row.startAt)) {
      throw new BadRequestException('Meeting end must be after its start.');
    }
    if (kind === 'reminders' && (row.followUpId || row.meetingId)) {
      throw new BadRequestException('Standalone reminders cannot be linked to a lead activity.');
    }
  }

  private where(kind: StandaloneKind, query: ListQueryDto) {
    const c = config[kind];
    if (query.status && !(c.statuses as readonly string[]).includes(query.status)) throw new BadRequestException('Invalid status filter');
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) throw new BadRequestException('Date range is invalid');
    const where: Record<string, any> = {
      leadId: null,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { title: { contains: query.search.trim(), mode: 'insensitive' } } : {}),
      ...((query.from || query.to) ? { [c.time]: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lt: new Date(query.to) } : {}) } } : {}),
    };
    if (query.overdue) {
      const overdue = { status: { in: [...c.pending] }, [c.time]: { lt: new Date() } };
      where.AND = query.overdue === 'true' ? [overdue] : [{ NOT: overdue }];
    }
    return where;
  }

  async list(kind: StandaloneKind, query: ListQueryDto & { unpaged?: boolean }) {
    const where = this.where(kind, query);
    const c = config[kind];
    const db = this.db(kind);
    const [items, total, completed] = await Promise.all([
      db.findMany({ where, ...(query.unpaged ? {} : { skip: (query.page - 1) * query.pageSize, take: query.pageSize }), orderBy: [{ [c.time]: 'asc' }, { id: 'asc' }] }),
      db.count({ where }),
      db.count({ where: { ...where, status: kind === 'reminders' ? 'DISMISSED' : 'COMPLETED' } }),
    ]);
    return { items: items.map((item: any) => ({ ...item, independent: true, lead: null })), total, completed, page: query.page, pageSize: query.pageSize };
  }

  async listAll(kind: StandaloneKind, query: ListQueryDto) {
    return this.list(kind, { ...query, page: 1, pageSize: 100, unpaged: true });
  }

  async one(kind: StandaloneKind, id: string) {
    const row = await this.db(kind).findFirst({ where: { id, leadId: null, deletedAt: null } });
    if (!row) throw new NotFoundException('Record not found');
    return { ...row, independent: true, lead: null };
  }

  async create(kind: StandaloneKind, input: Record<string, any>, actor: Actor) {
    const hash = this.core.hash({ kind, input });
    const existing = await this.db(kind).findFirst({ where: { createdById: actor.id, requestKey: input.requestKey } });
    if (existing) { this.core.replay(existing, hash); return existing; }
    const fields = this.fields(kind, input);
    this.validate(kind, { ...input, ...fields });
    const row = await this.db(kind).create({ data: {
      adminId: currentAdminId(),
      ...fields,
      leadId: null,
      createdById: actor.id,
      createdByName: actor.name,
      requestKey: input.requestKey,
      requestHash: hash,
      ...(kind === 'reminders' ? { recipientId: actor.id } : {}),
    } });
    return { ...row, independent: true, lead: null };
  }

  async change(kind: StandaloneKind, id: string, input: Record<string, any>, actor: Actor, action: 'update' | 'complete' | 'cancel' | 'dismiss' | 'delete') {
    const db = this.db(kind);
    const before = await db.findFirst({ where: { id, leadId: null, deletedAt: null } });
    if (!before) throw new NotFoundException('Record not found');
    this.core.version(before, input.version);
    const pending = (config[kind].pending as readonly string[]).includes(before.status);
    if (action === 'update' && !pending) throw new BadRequestException('Only pending activities can be edited.');
    if (['complete', 'cancel'].includes(action) && !pending) throw new BadRequestException('This activity is no longer pending.');
    if (action === 'complete' && kind === 'reminders') throw new BadRequestException('Dismiss reminders instead.');
    if (action === 'dismiss' && (kind !== 'reminders' || !['PENDING', 'TRIGGERED'].includes(before.status))) throw new BadRequestException('This reminder cannot be dismissed.');
    const data: Record<string, any> = action === 'update' ? this.fields(kind, input) : {};
    if (action === 'update') this.validate(kind, { ...before, ...data });
    if (action === 'complete') Object.assign(data, { status: 'COMPLETED', completedAt: new Date(), ...(kind === 'meetings' ? { outcome: input.outcome ?? null } : {}) });
    if (action === 'cancel') data.status = 'CANCELLED';
    if (action === 'dismiss') Object.assign(data, { status: 'DISMISSED', dismissedAt: new Date() });
    if (action === 'delete') data.deletedAt = new Date();
    const after = await db.update({ where: { id }, data: { ...data, updatedById: actor.id, updatedByName: actor.name, version: { increment: 1 } } });
    return { ...after, independent: true, lead: null };
  }

  async remove(kind: StandaloneKind, id: string, body: VersionDto, actor: Actor) { return this.change(kind, id, body, actor, 'delete'); }
}
