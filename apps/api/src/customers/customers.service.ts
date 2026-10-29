import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { currentAdminId } from '../tenant/tenant-context';
import { Actor, CrmCoreService } from '../crm/crm-core.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerListQueryDto } from './customers.dto';
import { LEAD_SELECTION_INCLUDE, LeadSelectionsService } from '../crm/lead-selections.service';
import { UpdateCustomerSelectionsDto } from './customer-selections.dto';

type CustomerWithLead = Prisma.CustomerGetPayload<{ include: { lead: { include: typeof LEAD_SELECTION_INCLUDE } } }>;

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly core: CrmCoreService,
    private readonly selections: LeadSelectionsService,
  ) {}

  private format(row: CustomerWithLead) {
    return {
      ...row,
      lead: {
        ...this.selections.format(row.lead),
        estimatedAmount: Number(row.lead.estimatedAmount),
      },
    };
  }

  listServices() { return this.selections.listServices(); }
  listProducts() { return this.selections.listProducts(); }

  async findAll(query: CustomerListQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.CustomerWhereInput = search
      ? {
          lead: {
            is: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        include: { lead: { include: LEAD_SELECTION_INCLUDE } },
        orderBy: [{ convertedAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.customer.count({ where }),
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });

    return {
      items: rows.map(row => this.format(row)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(id: string) {
    const row = await this.prisma.customer.findUnique({
      where: { id },
      include: { lead: { include: LEAD_SELECTION_INCLUDE } },
    });
    if (!row) throw new NotFoundException('Customer not found');
    return this.format(row);
  }

  async findByLead(leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const row = await this.prisma.customer.findUnique({
      where: { leadId },
      include: { lead: { include: LEAD_SELECTION_INCLUDE } },
    });
    return row ? this.format(row) : null;
  }

  async convert(leadId: string, expectedVersion: number, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const lead = await this.core.lockLead(tx, leadId);

      const existing = await tx.customer.findUnique({
        where: { leadId },
        include: { lead: { include: LEAD_SELECTION_INCLUDE } },
      });
      if (existing) return this.format(existing);

      this.core.version(lead, expectedVersion);

      const customer = await tx.customer.create({
        data: {
          adminId: currentAdminId(),
          leadId,
          convertedById: actor.id,
          convertedByName: actor.name,
        },
      });

      await tx.lead.update({
        where: { id: leadId },
        data: { version: { increment: 1 } },
      });

      await this.core.history(
        tx,
        leadId,
        actor,
        'LEAD',
        leadId,
        'CONVERTED',
        'Lead converted to customer',
      );

      const result = await tx.customer.findUniqueOrThrow({
        where: { id: customer.id },
        include: { lead: { include: LEAD_SELECTION_INCLUDE } },
      });
      return this.format(result);
    });
  }

  async updateSelections(customerId: string, dto: UpdateCustomerSelectionsDto, actor: Actor) {
    if (dto.serviceIds === undefined && dto.productIds === undefined) {
      throw new BadRequestException('Provide serviceIds or productIds.');
    }
    return this.prisma.$transaction(async tx => {
      const customer = await tx.customer.findUnique({ where: { id: customerId }, select: { id: true, leadId: true } });
      if (!customer) throw new NotFoundException('Customer not found');
      const before = await this.core.lockLead(tx, customer.leadId);
      this.core.version(before, dto.version);
      const previous = await this.selections.readIds(tx, before.id);
      await this.selections.validate(tx, dto.serviceIds, dto.productIds, previous.serviceIds, previous.productIds);
      await tx.lead.update({ where: { id: before.id }, data: { version: { increment: 1 } } });
      await this.selections.replace(tx, before.id, dto.serviceIds, dto.productIds);
      const result = await tx.customer.findUniqueOrThrow({ where: { id: customer.id }, include: { lead: { include: LEAD_SELECTION_INCLUDE } } });
      const beforeNames = {
        services: (await tx.serviceMaster.findMany({ where: { id: { in: previous.serviceIds } } })).map(row => row.name).join(', '),
        products: (await tx.productMaster.findMany({ where: { id: { in: previous.productIds } } })).map(row => row.name).join(', '),
      };
      const afterLead = this.selections.format(result.lead);
      await this.core.history(tx, before.id, actor, 'LEAD', before.id, 'UPDATED', 'Services/products updated from customer', beforeNames, {
        services: afterLead.services.map(row => row.name).join(', '),
        products: afterLead.products.map(row => row.name).join(', '),
      });
      return this.format(result);
    }, { maxWait: 5_000, timeout: 15_000 });
  }
}
