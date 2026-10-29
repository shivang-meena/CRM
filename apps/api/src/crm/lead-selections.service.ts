import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { currentAdminId } from '../tenant/tenant-context';

export const LEAD_SELECTION_INCLUDE = {
  service: true,
  serviceSelections: {
    orderBy: { position: 'asc' },
    include: { service: { select: { id: true, name: true, isActive: true } } },
  },
  productSelections: {
    orderBy: { position: 'asc' },
    include: { product: { select: { id: true, name: true, isActive: true } } },
  },
} satisfies Prisma.LeadInclude;

@Injectable()
export class LeadSelectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices() {
    return this.prisma.serviceMaster.findMany({
      where: { isActive: true }, orderBy: { name: 'asc' },
      select: { id: true, name: true, isActive: true },
    });
  }

  async listProducts() {
    return this.prisma.productMaster.findMany({
      where: { isActive: true }, orderBy: { name: 'asc' },
      select: { id: true, name: true, isActive: true },
    });
  }

  format<T extends {
    serviceId: string | null;
    service: { id: string; name: string; isActive: boolean } | null;
    serviceSelections: { service: { id: string; name: string; isActive: boolean } }[];
    productSelections: { product: { id: string; name: string; isActive: boolean } }[];
  }>(lead: T) {
    const { serviceSelections, productSelections, service: _service, serviceId: _serviceId, ...fields } = lead;
    const services = serviceSelections.map(({ service }) => service);
    const products = productSelections.map(({ product }) => product);
    const firstService = services[0] ?? null;
    return {
      ...fields,
      serviceId: firstService?.id ?? null,
      service: firstService,
      serviceIds: services.map(({ id }) => id),
      productIds: products.map(({ id }) => id),
      services,
      products,
    };
  }

  async validate(tx: Prisma.TransactionClient, serviceIds: string[] | undefined, productIds: string[] | undefined, previousServiceIds: string[] = [], previousProductIds: string[] = []) {
    const adminId = currentAdminId();
    if (serviceIds?.length) {
      const rows = await tx.serviceMaster.findMany({ where: { id: { in: serviceIds }, adminId } });
      const previous = new Set(previousServiceIds);
      if (rows.length !== serviceIds.length || rows.some(row => !row.isActive && !previous.has(row.id))) {
        throw new BadRequestException('Select active services from General Settings.');
      }
    }
    if (productIds?.length) {
      const rows = await tx.productMaster.findMany({ where: { id: { in: productIds }, adminId } });
      const previous = new Set(previousProductIds);
      if (rows.length !== productIds.length || rows.some(row => !row.isActive && !previous.has(row.id))) {
        throw new BadRequestException('Select active products from General Settings.');
      }
    }
  }

  async readIds(tx: Prisma.TransactionClient, leadId: string) {
    const adminId = currentAdminId();
    const [services, products] = await Promise.all([
      tx.leadServiceSelection.findMany({ where: { leadId, adminId }, orderBy: { position: 'asc' }, select: { serviceId: true } }),
      tx.leadProductSelection.findMany({ where: { leadId, adminId }, orderBy: { position: 'asc' }, select: { productId: true } }),
    ]);
    return { serviceIds: services.map(row => row.serviceId), productIds: products.map(row => row.productId) };
  }

  async replace(tx: Prisma.TransactionClient, leadId: string, serviceIds?: string[], productIds?: string[]) {
    const adminId = currentAdminId();
    if (serviceIds !== undefined) {
      await tx.leadServiceSelection.deleteMany({ where: { leadId, adminId } });
      if (serviceIds.length) await tx.leadServiceSelection.createMany({
        data: serviceIds.map((serviceId, position) => ({ adminId, leadId, serviceId, position })),
      });
      await tx.lead.update({ where: { id: leadId }, data: { serviceId: serviceIds[0] ?? null } });
    }
    if (productIds !== undefined) {
      await tx.leadProductSelection.deleteMany({ where: { leadId, adminId } });
      if (productIds.length) await tx.leadProductSelection.createMany({
        data: productIds.map((productId, position) => ({ adminId, leadId, productId, position })),
      });
    }
  }
}
