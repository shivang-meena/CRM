import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CalendarEventCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Actor, CrmCoreService } from '../crm/crm-core.service';
import { CalendarItemsQueryDto, CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/calendar.dto';
import { hasPermission } from '../auth/permissions';
import type { AuthenticatedUser } from '../auth/permissions';

export type CalendarCategory = 'EVENT' | 'LEAD' | 'REMINDER' | 'MEETING' | 'HOLIDAY' | 'SERVICE';
export type CalendarSource = 'CALENDAR_EVENT' | 'LEAD_FOLLOWUP' | 'REMINDER' | 'MEETING';
export type CalendarItem = {
  key: string; sourceId: string; source: CalendarSource; category: CalendarCategory; title: string;
  description: string | null; startAt: string; endAt: string | null; allDay: boolean; leadId: string | null;
  status: string | null; version: number | null; editable: boolean;
};

const categories: CalendarCategory[] = ['EVENT', 'LEAD', 'REMINDER', 'MEETING', 'HOLIDAY', 'SERVICE'];
const manualCategories: CalendarCategory[] = ['EVENT', 'HOLIDAY', 'SERVICE'];

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService, private core: CrmCoreService) {}

  private parseCategories(value?: string): CalendarCategory[] {
    if (value === undefined) return [...categories];
    if (!value.trim()) return [];
    const selected = Array.from(new Set(value.split(',').map(item => item.trim().toUpperCase()).filter(Boolean)));
    if (selected.some(item => !categories.includes(item as CalendarCategory))) throw new BadRequestException('Invalid calendar category.');
    return categories.filter(item => selected.includes(item));
  }

  private range(query: CalendarItemsQueryDto) {
    const from = new Date(query.from), to = new Date(query.to);
    if (!(from.getTime() < to.getTime())) throw new BadRequestException('Calendar date range is invalid.');
    if (to.getTime() - from.getTime() > 62 * 24 * 60 * 60 * 1000) throw new BadRequestException('Calendar range cannot exceed 62 days.');
    return { from, to };
  }

  private manualItem(row: any): CalendarItem {
    return { key: `CALENDAR_EVENT:${row.id}`, sourceId: row.id, source: 'CALENDAR_EVENT', category: row.category as CalendarCategory, title: row.title, description: row.description ?? null, startAt: row.startAt.toISOString(), endAt: row.endAt.toISOString(), allDay: row.allDay, leadId: null, status: null, version: row.version, editable: true };
  }

  async items(query: CalendarItemsQueryDto, actor: AuthenticatedUser) {
    const { from, to } = this.range(query);
    const selected = this.parseCategories(query.categories).filter(category => {
      if (category === 'LEAD') return hasPermission(actor, 'lead');
      if (category === 'REMINDER') return hasPermission(actor, 'reminder');
      if (category === 'MEETING') return hasPermission(actor, 'meeting');
      return true;
    });
    if (!selected.length) return { items: [] as CalendarItem[] };
    const include = new Set(selected);
    const results: CalendarItem[] = [];
    if (include.has('EVENT') || include.has('HOLIDAY') || include.has('SERVICE')) {
      const manual = await this.prisma.calendarEvent.findMany({ where: { createdById: actor.id, deletedAt: null, category: { in: manualCategories.filter(item => include.has(item)).map(item => item as CalendarEventCategory) }, startAt: { lt: to }, endAt: { gt: from } }, orderBy: [{ startAt: 'asc' }, { id: 'asc' }] });
      results.push(...manual.map(row => this.manualItem(row)));
    }
    if (include.has('LEAD')) {
      const followups = await this.prisma.leadFollowUp.findMany({ where: { deletedAt: null, status: { not: 'CANCELLED' }, scheduledAt: { gte: from, lt: to }, lead: { deletedAt: null } }, include: { lead: { select: { id: true, name: true } } }, orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }] });
      results.push(...followups.map(row => ({ key: `LEAD_FOLLOWUP:${row.id}`, sourceId: row.id, source: 'LEAD_FOLLOWUP' as const, category: 'LEAD' as const, title: `${row.lead.name} · ${row.title}`, description: row.description ?? null, startAt: row.scheduledAt.toISOString(), endAt: null, allDay: false, leadId: row.leadId, status: row.status, version: row.version, editable: false })));
    }
    if (include.has('REMINDER')) {
      const reminders = await this.prisma.leadReminder.findMany({ where: { deletedAt: null, status: { not: 'CANCELLED' }, remindAt: { gte: from, lt: to }, OR: [{ leadId: null }, { lead: { deletedAt: null } }] }, orderBy: [{ remindAt: 'asc' }, { id: 'asc' }] });
      results.push(...reminders.map(row => ({ key: `REMINDER:${row.id}`, sourceId: row.id, source: 'REMINDER' as const, category: 'REMINDER' as const, title: row.title, description: row.message ?? null, startAt: row.remindAt.toISOString(), endAt: null, allDay: false, leadId: row.leadId, status: row.status, version: row.version, editable: false })));
    }
    if (include.has('MEETING')) {
      const meetings = await this.prisma.leadMeeting.findMany({ where: { deletedAt: null, status: { not: 'CANCELLED' }, startAt: { lt: to }, endAt: { gt: from }, OR: [{ leadId: null }, { lead: { deletedAt: null } }] }, orderBy: [{ startAt: 'asc' }, { id: 'asc' }] });
      results.push(...meetings.map(row => ({ key: `MEETING:${row.id}`, sourceId: row.id, source: 'MEETING' as const, category: 'MEETING' as const, title: row.title, description: row.agenda ?? null, startAt: row.startAt.toISOString(), endAt: row.endAt.toISOString(), allDay: false, leadId: row.leadId, status: row.status, version: row.version, editable: false })));
    }
    results.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime() || a.key.localeCompare(b.key));
    return { items: results };
  }

  private fields(input: CreateCalendarEventDto | UpdateCalendarEventDto) {
    return {
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.startAt !== undefined ? { startAt: new Date(input.startAt) } : {}),
      ...(input.endAt !== undefined ? { endAt: new Date(input.endAt) } : {}),
      ...(input.allDay !== undefined ? { allDay: input.allDay } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    };
  }

  private validateManual(input: Record<string, any>) {
    if (input.title !== undefined && !String(input.title).trim()) throw new BadRequestException('Title is required.');
    if (input.category !== undefined && !manualCategories.includes(input.category)) throw new BadRequestException('Invalid calendar event category.');
    if (input.startAt !== undefined && Number.isNaN(new Date(input.startAt).getTime())) throw new BadRequestException('Start date is invalid.');
    if (input.endAt !== undefined && Number.isNaN(new Date(input.endAt).getTime())) throw new BadRequestException('End date is invalid.');
    if (input.startAt !== undefined && input.endAt !== undefined && new Date(input.endAt) <= new Date(input.startAt)) throw new BadRequestException('End date must be after start date.');
  }

  async create(input: CreateCalendarEventDto, actor: Actor) {
    const hash = this.core.hash({ category: input.category, title: input.title, description: input.description ?? null, startAt: input.startAt, endAt: input.endAt, allDay: input.allDay, timezone: input.timezone ?? 'Asia/Kolkata' });
    const existing = await this.prisma.calendarEvent.findFirst({ where: { createdById: actor.id, requestKey: input.requestKey } });
    if (existing) { this.core.replay(existing, hash); return this.manualItem(existing); }
    const data = {
      category: input.category ?? CalendarEventCategory.EVENT,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      allDay: input.allDay,
      timezone: input.timezone ?? 'Asia/Kolkata',
      createdById: actor.id,
      createdByName: actor.name,
      requestKey: input.requestKey,
      requestHash: hash,
    };
    this.validateManual(data);
    const row = await this.prisma.calendarEvent.create({ data });
    return this.manualItem(row);
  }

  async one(id: string, actor: Actor) {
    const row = await this.prisma.calendarEvent.findFirst({ where: { id, createdById: actor.id, deletedAt: null } });
    if (!row) throw new NotFoundException('Calendar event not found.');
    return this.manualItem(row);
  }

  async update(id: string, input: UpdateCalendarEventDto, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const row = await tx.calendarEvent.findFirst({ where: { id, createdById: actor.id, deletedAt: null } });
      if (!row) throw new NotFoundException('Calendar event not found.');
      this.core.version(row, (input as any).version);
      const data = this.fields(input); this.validateManual({ ...row, ...data });
      const updated = await tx.calendarEvent.update({ where: { id }, data: { ...data, updatedById: actor.id, updatedByName: actor.name, version: { increment: 1 } } });
      return this.manualItem(updated);
    });
  }

  async remove(id: string, version: number, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const row = await tx.calendarEvent.findFirst({ where: { id, createdById: actor.id, deletedAt: null } });
      if (!row) throw new NotFoundException('Calendar event not found.');
      this.core.version(row, version);
      const updated = await tx.calendarEvent.update({ where: { id }, data: { deletedAt: new Date(), updatedById: actor.id, updatedByName: actor.name, version: { increment: 1 } } });
      return { success: true, id: updated.id, version: updated.version };
    });
  }
}
