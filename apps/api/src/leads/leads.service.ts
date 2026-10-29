import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { currentAdminId } from '../tenant/tenant-context';
import { Actor, CrmCoreService } from '../crm/crm-core.service';
import { AssigneesService } from '../crm/assignees.service';
import { LEAD_SELECTION_INCLUDE, LeadSelectionsService } from '../crm/lead-selections.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

// Allow bounded headroom for the remote database while keeping lead and history writes atomic.
const LEAD_WRITE_TRANSACTION = { maxWait: 5_000, timeout: 15_000 };

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService, private core: CrmCoreService, private assignees: AssigneesService, private selections: LeadSelectionsService) {}
  private format(l: any) { return { ...this.selections.format(l), estimatedAmount: Number(l.estimatedAmount) }; }

  async listServices() {
    const rows = await this.prisma.serviceMaster.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        hsnSac: true,
        description: true,
        igstRate: true,
        sgstRate: true,
        cgstRate: true,
        isActive: true,
      },
    });
    return (rows || []).map((r) => ({
      ...r,
      igstRate: Number(r?.igstRate ?? 0),
      sgstRate: Number(r?.sgstRate ?? 0),
      cgstRate: Number(r?.cgstRate ?? 0),
    }));
  }

  listProducts() { return this.selections.listProducts(); }

  async findAll(search?: string) {
    const q = search?.trim();
    const where: Prisma.LeadWhereInput = { deletedAt: null, ...(q ? { OR: [
      { name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }, { companyName: { contains: q, mode: 'insensitive' } },
    ] } : {}) };
    return (await this.prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, include: LEAD_SELECTION_INCLUDE })).map(r => this.format(r));
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, deletedAt: null }, include: LEAD_SELECTION_INCLUDE });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.format(lead);
  }

  async create(dto: CreateLeadDto, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const serviceIds = dto.serviceIds ?? (dto.serviceId !== undefined ? (dto.serviceId ? [dto.serviceId] : []) : []);
      const productIds = dto.productIds ?? [];
      await this.selections.validate(tx, serviceIds, productIds);
      const assignment = await this.assignees.resolve(tx, dto, actor);
      const { serviceIds: _serviceIds, productIds: _productIds, serviceId: _serviceId, ...leadData } = dto;
      const lead = await tx.lead.create({ data: { ...leadData, serviceId: serviceIds[0] ?? null, ...assignment, adminId: currentAdminId(), nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null, createdBy: actor.name } });
      await this.selections.replace(tx, lead.id, serviceIds, productIds);
      await this.core.history(tx, lead.id, actor, 'LEAD', lead.id, 'CREATED', `Lead created; assigned to ${lead.assignedTo}`, { assignedTo: null, assignedToId: null }, assignment);
      if (dto.nextFollowUpAt) {
        const followup = await tx.leadFollowUp.create({ data: { adminId: currentAdminId(), leadId: lead.id, title: 'Initial follow-up', scheduledAt: new Date(dto.nextFollowUpAt), ...assignment, createdById: actor.id, createdByName: actor.name } });
        await this.core.history(tx, lead.id, actor, 'FOLLOWUP', followup.id, 'CREATED', `Initial follow-up scheduled; assigned to ${assignment.assignedTo}`);
      }
      return this.format(await tx.lead.findUniqueOrThrow({ where: { id: lead.id }, include: LEAD_SELECTION_INCLUDE }));
    }, LEAD_WRITE_TRANSACTION);
  }

  async update(id: string, dto: UpdateLeadDto, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const before = await this.core.lockLead(tx, id);
      this.core.version(before, dto.version);
      const previous = await this.selections.readIds(tx, id);
      const serviceIds = dto.serviceIds !== undefined ? dto.serviceIds : dto.serviceId !== undefined ? (dto.serviceId ? [dto.serviceId] : []) : undefined;
      const productIds = dto.productIds;
      await this.selections.validate(tx, serviceIds, productIds, previous.serviceIds, previous.productIds);
      const { nextFollowUpAt, version: _version, serviceIds: _serviceIds, productIds: _productIds, serviceId: _serviceId, ...rest } = dto;
      if (nextFollowUpAt !== undefined) throw new BadRequestException('Manage follow-up dates in the FollowUp section.');
      const assignment = await this.assignees.resolve(tx, dto, actor, before);
      const after = await tx.lead.update({ where: { id }, data: { ...rest, ...assignment, version: { increment: 1 } } });
      await this.selections.replace(tx, id, serviceIds, productIds);
      const assignmentSummary = this.assignees.summary(before, after);
      const summary = before.status !== after.status ? 'Lead status changed' : 'Lead details updated';
      const result = await tx.lead.findUniqueOrThrow({ where: { id }, include: LEAD_SELECTION_INCLUDE });
      await this.core.history(tx, id, actor, 'LEAD', id, 'UPDATED', assignmentSummary ? `${summary}; ${assignmentSummary}` : summary, before, result);
      return this.format(result);
    }, LEAD_WRITE_TRANSACTION);
  }

  async remove(id: string, version: number, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const before = await this.core.lockLead(tx, id);
      this.core.version(before, version);
      await this.core.cancelReminders(tx, id, {}, actor);
      await tx.lead.update({ where: { id }, data: { deletedAt: new Date(), version: { increment: 1 } } });
      await this.core.history(tx, id, actor, 'LEAD', id, 'ARCHIVED', 'Lead archived; linked records retained');
      return { success: true };
    });
  }
}
