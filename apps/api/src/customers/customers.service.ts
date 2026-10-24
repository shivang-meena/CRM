import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { currentAdminId } from '../tenant/tenant-context';
import { Actor, CrmCoreService } from '../crm/crm-core.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerListQueryDto } from './customers.dto';

type CustomerWithLead = Prisma.CustomerGetPayload<{ include: { lead: true } }>;

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly core: CrmCoreService,
  ) {}

  private format(row: CustomerWithLead) {
    return {
      ...row,
      lead: {
        ...row.lead,
        estimatedAmount: Number(row.lead.estimatedAmount),
      },
    };
  }

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
        include: { lead: true },
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
      include: { lead: true },
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
      include: { lead: true },
    });
    return row ? this.format(row) : null;
  }

  async convert(leadId: string, expectedVersion: number, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const lead = await this.core.lockLead(tx, leadId);

      const existing = await tx.customer.findUnique({
        where: { leadId },
        include: { lead: true },
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
        include: { lead: true },
      });
      return this.format(result);
    });
  }
}
