import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Lead, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Actor, CrmCoreService } from '../crm/crm-core.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService, private core: CrmCoreService) {}
  private format(l: Lead) { return { ...l, estimatedAmount: Number(l.estimatedAmount) }; }

  async findAll(search?: string) {
    const q = search?.trim();
    const where: Prisma.LeadWhereInput = { deletedAt: null, ...(q ? { OR: [
      { name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }, { companyName: { contains: q, mode: 'insensitive' } },
    ] } : {}) };
    return (await this.prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } })).map(r => this.format(r));
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, deletedAt: null } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.format(lead);
  }

  async create(dto: CreateLeadDto, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const lead = await tx.lead.create({ data: { ...dto, nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null, createdBy: actor.name, assignedTo: dto.assignedTo || actor.name } });
      await this.core.history(tx, lead.id, actor, 'LEAD', lead.id, 'CREATED', 'Lead created');
      if (dto.nextFollowUpAt) {
        const followup = await tx.leadFollowUp.create({ data: { leadId: lead.id, title: 'Initial follow-up', scheduledAt: new Date(dto.nextFollowUpAt), assignedTo: lead.assignedTo, createdById: actor.id, createdByName: actor.name } });
        await this.core.history(tx, lead.id, actor, 'FOLLOWUP', followup.id, 'CREATED', 'Initial follow-up scheduled');
      }
      return this.format(lead);
    });
  }

  async update(id: string, dto: UpdateLeadDto, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const before = await this.core.lockLead(tx, id);
      this.core.version(before, dto.version);
      const { nextFollowUpAt, version: _version, ...rest } = dto;
      if (nextFollowUpAt !== undefined) throw new BadRequestException('Manage follow-up dates in the FollowUp section.');
      const after = await tx.lead.update({ where: { id }, data: { ...rest, version: { increment: 1 } } });
      await this.core.history(tx, id, actor, 'LEAD', id, 'UPDATED', before.status !== after.status ? 'Lead status changed' : 'Lead details updated', before, after);
      return this.format(after);
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
