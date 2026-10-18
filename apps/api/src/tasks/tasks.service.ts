import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StandaloneTaskPriority, StandaloneTaskStatus, TaskHistoryAction, TaskRecurrenceFrequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Actor, CrmCoreService, Tx } from '../crm/crm-core.service';
import {
  ChangeTaskStatusDto, CreateStandaloneTaskDto, CreateTaskLabelDto, TaskQueryDto,
  UpdateStandaloneTaskDto, UpdateTaskRecurrenceSeriesDto,
} from './dto/task.dto';

const BOARD_STATUSES: StandaloneTaskStatus[] = ['NEW', 'IN_FEEDBACK', 'COMPLETED', 'REJECTED', 'PROCESSING'];
const INCLUDE = { label: true, recurrenceSeries: true } as const;
const COMPLETED_OR_REJECTED: StandaloneTaskStatus[] = ['COMPLETED', 'REJECTED'];

function date(value: string | Date | null | undefined) { return value == null ? null : new Date(value); }
function normalized(value: string) { return value.trim().toLocaleLowerCase('en-IN'); }

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService, private core: CrmCoreService) {}

  private async label(tx: Tx, labelId: string | null | undefined) {
    if (!labelId) return;
    const label = await tx.taskLabel.findFirst({ where: { id: labelId, deletedAt: null } });
    if (!label) throw new BadRequestException('Task label not found.');
  }

  private async recordHistory(tx: Tx, taskId: string, actor: Actor, action: TaskHistoryAction, before?: unknown, after?: unknown) {
    const changes: Record<string, unknown> = {};
    if (before && after && typeof before === 'object' && typeof after === 'object') {
      const a = before as Record<string, unknown>, b = after as Record<string, unknown>;
      for (const key of ['subject', 'description', 'priority', 'status', 'labelId', 'startAt', 'endAt', 'assignedTo', 'completedAt']) {
        const beforeValue = a[key] instanceof Date ? a[key].toISOString() : a[key] ?? null;
        const afterValue = b[key] instanceof Date ? b[key].toISOString() : b[key] ?? null;
        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) changes[key] = { before: beforeValue, after: afterValue };
      }
    }
    return tx.taskHistory.create({ data: {
      taskId, action, actorId: actor.id, actorName: actor.name,
      ...(Object.keys(changes).length ? { changes: changes as Prisma.InputJsonObject } : {}),
    } });
  }

  private where(query: TaskQueryDto): Prisma.TaskWhereInput {
    if (query.from && query.to && new Date(query.from) >= new Date(query.to)) throw new BadRequestException('Date range is invalid.');
    const conditions: Prisma.TaskWhereInput[] = [];
    const search = query.search?.trim();
    if (search) conditions.push({ OR: [
      { subject: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ] });
    if (query.status) conditions.push({ status: query.status });
    if (query.priority) conditions.push({ priority: query.priority });
    if (query.labelId) conditions.push({ labelId: query.labelId });
    if (query.assignedTo?.trim()) conditions.push({ assignedTo: { contains: query.assignedTo.trim(), mode: 'insensitive' } });
    if (query.from || query.to) conditions.push({
      ...(query.from ? { endAt: { gte: new Date(query.from) } } : {}),
      ...(query.to ? { startAt: { lt: new Date(query.to) } } : {}),
    });
    if (query.overdue === 'true') conditions.push({ endAt: { lt: new Date() }, status: { notIn: COMPLETED_OR_REJECTED } });
    if (query.overdue === 'false') conditions.push({ OR: [
      { endAt: { gte: new Date() } }, { status: { in: COMPLETED_OR_REJECTED } },
    ] });
    return { deletedAt: null, ...(conditions.length ? { AND: conditions } : {}) };
  }

  private validateDates(startAt: Date, endAt: Date, recurrenceEndsAt?: Date | null) {
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
      throw new BadRequestException('End Date must be after Start Date.');
    }
    if (recurrenceEndsAt && (Number.isNaN(recurrenceEndsAt.getTime()) || recurrenceEndsAt < startAt)) {
      throw new BadRequestException('Recurrence end date must be on or after Start Date.');
    }
  }

  private fields(input: CreateStandaloneTaskDto | UpdateStandaloneTaskDto, actor: Actor, existing?: { status: StandaloneTaskStatus; completedAt: Date | null }) {
    const subject = input.subject?.trim();
    if (subject !== undefined && !subject) throw new BadRequestException('Subject is required.');
    const startAt = input.startAt === undefined ? undefined : new Date(input.startAt);
    const endAt = input.endAt === undefined ? undefined : new Date(input.endAt);
    if (startAt && endAt) this.validateDates(startAt, endAt, input.recurrenceEndsAt === undefined ? null : date(input.recurrenceEndsAt));
    const status = input.status ?? existing?.status ?? StandaloneTaskStatus.NEW;
    const completedAt = status === StandaloneTaskStatus.COMPLETED
      ? existing?.status === StandaloneTaskStatus.COMPLETED ? existing.completedAt : new Date()
      : null;
    return {
      ...(subject !== undefined ? { subject } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.status !== undefined ? { status } : {}),
      ...(input.labelId !== undefined ? { labelId: input.labelId || null } : {}),
      ...(startAt ? { startAt } : {}), ...(endAt ? { endAt } : {}),
      ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo.trim() || actor.name } : {}),
      ...(input.status !== undefined ? { completedAt } : {}),
    };
  }

  async list(query: TaskQueryDto) {
    const where = this.where(query);
    const [items, total] = await Promise.all([
      this.prisma.task.findMany({ where, include: INCLUDE, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ endAt: 'asc' }, { id: 'asc' }] }),
      this.prisma.task.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async board(query: TaskQueryDto) {
    const base = this.where(query);
    const columns = await Promise.all(BOARD_STATUSES.map(async status => {
      const where = { AND: [base, { status }] } as Prisma.TaskWhereInput;
      const [items, total] = await Promise.all([
        this.prisma.task.findMany({ where, include: INCLUDE, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ endAt: 'asc' }, { id: 'asc' }] }),
        this.prisma.task.count({ where }),
      ]);
      return { status, items, total, page: query.page, pageSize: query.pageSize };
    }));
    return { columns };
  }

  async summary(query: TaskQueryDto) {
    const where = this.where(query);
    const [status, priority, overdue] = await Promise.all([
      Promise.all(BOARD_STATUSES.map(async value => ({ status: value, total: await this.prisma.task.count({ where: { AND: [where, { status: value }] } }) }))),
      Promise.all((['LOW', 'MEDIUM', 'HIGH'] as StandaloneTaskPriority[]).map(async value => ({ priority: value, total: await this.prisma.task.count({ where: { AND: [where, { priority: value }] } }) }))),
      this.prisma.task.count({ where: { AND: [where, { endAt: { lt: new Date() }, status: { notIn: COMPLETED_OR_REJECTED } }] } }),
    ]);
    return { total: status.reduce((sum, item) => sum + item.total, 0), status, priority, overdue };
  }

  async one(id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, deletedAt: null }, include: INCLUDE });
    if (!task) throw new NotFoundException('Task not found.');
    return task;
  }

  async history(id: string) {
    if (!await this.prisma.task.findUnique({ where: { id }, select: { id: true } })) throw new NotFoundException('Task not found.');
    return this.prisma.taskHistory.findMany({ where: { taskId: id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  }

  async create(input: CreateStandaloneTaskDto, actor: Actor) {
    const startAt = new Date(input.startAt), endAt = new Date(input.endAt);
    const recurrenceEndsAt = input.recurrenceEndsAt === undefined ? null : date(input.recurrenceEndsAt);
    this.validateDates(startAt, endAt, recurrenceEndsAt);
    if (input.recursive && !input.frequency) throw new BadRequestException('Choose a recurrence frequency.');
    const hash = this.core.hash({ ...input, subject: input.subject.trim(), startAt: startAt.toISOString(), endAt: endAt.toISOString(), recurrenceEndsAt: recurrenceEndsAt?.toISOString() ?? null });
    return this.prisma.$transaction(async tx => {
      const existing = await tx.task.findFirst({ where: { createdById: actor.id, requestKey: input.requestKey }, include: INCLUDE });
      if (existing) { this.core.replay(existing, hash); return existing; }
      await this.label(tx, input.labelId);
      const taskFields = this.fields({ ...input, startAt: startAt.toISOString(), endAt: endAt.toISOString() }, actor);
      const durationMinutes = Math.max(1, Math.ceil((endAt.getTime() - startAt.getTime()) / 60000));
      let recurrenceSeriesId: string | undefined;
      if (input.recursive) {
        const series = await tx.taskRecurrenceSeries.create({ data: {
          subject: taskFields.subject!, description: taskFields.description ?? null, priority: taskFields.priority ?? StandaloneTaskPriority.LOW,
          labelId: taskFields.labelId ?? null, assignedTo: taskFields.assignedTo!, createdById: actor.id, createdByName: actor.name,
          frequency: input.frequency!, interval: input.interval ?? 1, timezone: 'Asia/Kolkata', anchorStartAt: startAt,
          durationMinutes, recurrenceEndsAt, nextOccurrenceAt: startAt, active: true,
        } });
        recurrenceSeriesId = series.id;
      }
      const row = await tx.task.create({
        data: {
          ...taskFields,
          labelId: taskFields.labelId ?? null,
          recurrenceSeriesId: recurrenceSeriesId ?? null,
          occurrenceAt: recurrenceSeriesId ? startAt : null,
          createdById: actor.id,
          createdByName: actor.name,
          requestKey: input.requestKey,
          requestHash: hash,
        } as Prisma.TaskUncheckedCreateInput,
        include: INCLUDE,
      });
      await this.recordHistory(tx, row.id, actor, TaskHistoryAction.CREATED, undefined, row);
      if (recurrenceSeriesId) await this.recordHistory(tx, row.id, actor, TaskHistoryAction.RECURRENCE_STARTED, undefined, { recurrenceSeriesId, frequency: input.frequency, interval: input.interval ?? 1, recurrenceEndsAt });
      return row;
    });
  }

  async update(id: string, input: UpdateStandaloneTaskDto, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const before = await tx.task.findFirst({ where: { id, deletedAt: null }, include: INCLUDE });
      if (!before) throw new NotFoundException('Task not found.');
      this.core.version(before, input.version);
      const mergedStart = input.startAt === undefined ? before.startAt : new Date(input.startAt);
      const mergedEnd = input.endAt === undefined ? before.endAt : new Date(input.endAt);
      this.validateDates(mergedStart, mergedEnd);
      await this.label(tx, input.labelId === undefined ? before.labelId : input.labelId);
      const data: Record<string, any> = this.fields(input, actor, before);
      if (input.startAt === undefined) data.startAt = mergedStart;
      if (input.endAt === undefined) data.endAt = mergedEnd;
      let recurrenceBefore = before.recurrenceSeriesId ? await tx.taskRecurrenceSeries.findUnique({ where: { id: before.recurrenceSeriesId } }) : null;
      let recurrenceChanged = false;
      if (input.recursive === true && !recurrenceBefore) {
        if (!input.frequency) throw new BadRequestException('Choose a recurrence frequency.');
        const series = await tx.taskRecurrenceSeries.create({ data: {
          subject: data.subject ?? before.subject, description: data.description ?? before.description, priority: data.priority ?? before.priority,
          labelId: data.labelId === undefined ? before.labelId : data.labelId, assignedTo: data.assignedTo ?? before.assignedTo,
          createdById: before.createdById, createdByName: before.createdByName, frequency: input.frequency, interval: input.interval ?? 1,
          timezone: 'Asia/Kolkata', anchorStartAt: mergedStart, durationMinutes: Math.max(1, Math.ceil((mergedEnd.getTime() - mergedStart.getTime()) / 60000)),
          recurrenceEndsAt: input.recurrenceEndsAt === undefined ? null : date(input.recurrenceEndsAt), nextOccurrenceAt: mergedStart, active: true,
        } });
        data.recurrenceSeriesId = series.id; data.occurrenceAt = mergedStart; recurrenceBefore = series; recurrenceChanged = true;
      } else if (recurrenceBefore && input.recursive === false) {
        await tx.taskRecurrenceSeries.update({ where: { id: recurrenceBefore.id }, data: { active: false, version: { increment: 1 } } });
        recurrenceChanged = true;
      } else if (recurrenceBefore && (input.recursive === true || input.frequency || input.interval || input.recurrenceEndsAt !== undefined)) {
        await tx.taskRecurrenceSeries.update({ where: { id: recurrenceBefore.id }, data: {
          ...(input.frequency ? { frequency: input.frequency } : {}), ...(input.interval ? { interval: input.interval } : {}),
          ...(input.recurrenceEndsAt !== undefined ? { recurrenceEndsAt: date(input.recurrenceEndsAt) } : {}), active: true, version: { increment: 1 },
        } });
        recurrenceChanged = true;
      }
      const after = await tx.task.update({ where: { id }, data: { ...data, updatedById: actor.id, updatedByName: actor.name, version: { increment: 1 } }, include: INCLUDE });
      const action = before.status !== after.status ? TaskHistoryAction.STATUS_CHANGED : before.labelId !== after.labelId ? TaskHistoryAction.LABEL_CHANGED : TaskHistoryAction.UPDATED;
      await this.recordHistory(tx, id, actor, action, before, after);
      if (recurrenceChanged) await this.recordHistory(tx, id, actor, TaskHistoryAction.RECURRENCE_UPDATED, before.recurrenceSeriesId ? { recurrenceSeriesId: before.recurrenceSeriesId } : undefined, { recurrenceSeriesId: after.recurrenceSeriesId, active: input.recursive !== false });
      return after;
    });
  }

  async changeStatus(id: string, input: ChangeTaskStatusDto, actor: Actor) {
    return this.update(id, { version: input.version, status: input.status }, actor);
  }

  async remove(id: string, version: number, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const before = await tx.task.findFirst({ where: { id, deletedAt: null }, include: INCLUDE });
      if (!before) throw new NotFoundException('Task not found.');
      this.core.version(before, version);
      const after = await tx.task.update({ where: { id }, data: { deletedAt: new Date(), updatedById: actor.id, updatedByName: actor.name, version: { increment: 1 } }, include: INCLUDE });
      await this.recordHistory(tx, id, actor, TaskHistoryAction.DELETED, before, after);
      return { success: true };
    });
  }

  async labels() { return this.prisma.taskLabel.findMany({ where: { deletedAt: null }, orderBy: [{ name: 'asc' }, { id: 'asc' }] }); }

  async createLabel(input: CreateTaskLabelDto) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException('Label name is required.');
    const normalizedName = normalized(name);
    if (await this.prisma.taskLabel.findFirst({ where: { normalizedName, deletedAt: null } })) throw new ConflictException('An active label with this name already exists.');
    return this.prisma.taskLabel.create({ data: { name, normalizedName, colour: input.colour } });
  }

  async updateSeries(id: string, input: UpdateTaskRecurrenceSeriesDto, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const before = await tx.taskRecurrenceSeries.findUnique({ where: { id } });
      if (!before) throw new NotFoundException('Recurrence series not found.');
      this.core.version(before, input.version);
      const after = await tx.taskRecurrenceSeries.update({ where: { id }, data: {
        ...(input.frequency ? { frequency: input.frequency } : {}), ...(input.interval ? { interval: input.interval } : {}),
        ...(input.recurrenceEndsAt !== undefined ? { recurrenceEndsAt: date(input.recurrenceEndsAt) } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}), version: { increment: 1 },
      } });
      const task = await tx.task.findFirst({ where: { recurrenceSeriesId: id, occurrenceAt: before.anchorStartAt }, select: { id: true } });
      if (task) await this.recordHistory(tx, task.id, actor, TaskHistoryAction.RECURRENCE_UPDATED, before, after);
      return after;
    });
  }

  async stopSeries(id: string, version: number, actor: Actor) {
    return this.updateSeries(id, { version, active: false }, actor);
  }

  statuses() { return BOARD_STATUSES; }
  frequencies() { return [TaskRecurrenceFrequency.DAILY, TaskRecurrenceFrequency.WEEKLY, TaskRecurrenceFrequency.MONTHLY]; }
}
