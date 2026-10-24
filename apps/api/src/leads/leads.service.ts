import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Lead, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { currentAdminId } from '../tenant/tenant-context';
import { Actor, CrmCoreService } from '../crm/crm-core.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService, private core: CrmCoreService) {}
  private format(l: Lead) { return { ...l, estimatedAmount: Number(l.estimatedAmount) }; }

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

  private async validateService(tx: Prisma.TransactionClient, serviceId?: string | null, previousId?: string | null) {
    // Keep an existing selection editable even if its master is later deactivated.
    if (!serviceId || serviceId === previousId) return;
    const service = await tx.serviceMaster.findFirst({ where: { id: serviceId, isActive: true } });
    if (!service) throw new BadRequestException('Select an active service from General Settings.');
  }

  async findAll(search?: string) {
    const q = search?.trim();
    const where: Prisma.LeadWhereInput = { deletedAt: null, ...(q ? { OR: [
      { name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }, { companyName: { contains: q, mode: 'insensitive' } },
    ] } : {}) };
    return (await this.prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, include: { service: true } })).map(r => this.format(r));
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, deletedAt: null }, include: { service: true } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.format(lead);
  }

  async create(dto: CreateLeadDto, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      await this.validateService(tx, dto.serviceId);
      const lead = await tx.lead.create({ data: { ...dto, adminId: currentAdminId(), nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null, createdBy: actor.name, assignedTo: dto.assignedTo || actor.name }, include: { service: true } });
      await this.core.history(tx, lead.id, actor, 'LEAD', lead.id, 'CREATED', 'Lead created');
      if (dto.nextFollowUpAt) {
        const followup = await tx.leadFollowUp.create({ data: { adminId: currentAdminId(), leadId: lead.id, title: 'Initial follow-up', scheduledAt: new Date(dto.nextFollowUpAt), assignedTo: lead.assignedTo, createdById: actor.id, createdByName: actor.name } });
        await this.core.history(tx, lead.id, actor, 'FOLLOWUP', followup.id, 'CREATED', 'Initial follow-up scheduled');
      }
      return this.format(lead);
    });
  }

  async update(id: string, dto: UpdateLeadDto, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const before = await this.core.lockLead(tx, id);
      this.core.version(before, dto.version);
      await this.validateService(tx, dto.serviceId, before.serviceId);
      const { nextFollowUpAt, version: _version, ...rest } = dto;
      if (nextFollowUpAt !== undefined) throw new BadRequestException('Manage follow-up dates in the FollowUp section.');
      const after = await tx.lead.update({ where: { id }, data: { ...rest, version: { increment: 1 } } });
      await this.core.history(tx, id, actor, 'LEAD', id, 'UPDATED', before.status !== after.status ? 'Lead status changed' : 'Lead details updated', before, after);
      return this.format(await tx.lead.findUniqueOrThrow({ where: { id }, include: { service: true } }));
    });
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
