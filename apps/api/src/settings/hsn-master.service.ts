import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { currentAdminId } from '../tenant/tenant-context';
import { SaveHsnMasterDto } from './hsn-master.dto';
import type { HsnMaster, SalesDocumentItem, ServiceMaster } from '@prisma/client';
import {
  GstModeDto,
  SalesDocumentItemInputDto,
} from '../sales-documents/dto/sales-document.dto';

@Injectable()
export class HsnMasterService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveItems(
    items: SalesDocumentItemInputDto[],
    mode: GstModeDto,
    previous: SalesDocumentItem[] = [],
    previousMode?: string,
  ): Promise<SalesDocumentItemInputDto[]> {
    if (mode === GstModeDto.NON_GST) {
      return Promise.all(items.map(async (item) => {
        const saved = previous.find((row) => row.id === item.id);
        const unchangedSource = saved
          && previousMode === mode
          && (saved.hsnMasterId || undefined) === item.hsnMasterId
          && (saved.itemType || undefined) === item.itemType;
        if (item.hsnMasterId && item.itemType && !unchangedSource) {
          const source = item.itemType === 'SERVICE'
            ? await this.prisma.serviceMaster.findFirst({ where: { id: item.hsnMasterId, isActive: true } })
            : await this.prisma.productMaster.findFirst({ where: { id: item.hsnMasterId, isActive: true } });
          if (!source) {
            const legacy = await this.prisma.hsnMaster.findFirst({ where: { id: item.hsnMasterId, isActive: true } });
            if (!legacy) throw new BadRequestException(`Select an active ${item.itemType.toLowerCase()} for ${item.productName}.`);
          }
        }
        return {
          ...item,
          hsnMasterId: item.itemType ? item.hsnMasterId : undefined,
          hsnDescription: '',
          hsnSac: '',
          igstRate: 0,
          sgstRate: 0,
          cgstRate: 0,
        };
      }));
    }

    const requestedIds = [
      ...new Set(
        items
          .map((item) => item.hsnMasterId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [services, masters, products] = await Promise.all([
      this.prisma.serviceMaster
        ? this.prisma.serviceMaster.findMany({
            where: { id: { in: requestedIds }, isActive: true },
          })
        : Promise.resolve([] as ServiceMaster[]),
      this.prisma.hsnMaster
        ? this.prisma.hsnMaster.findMany({
            where: { id: { in: requestedIds }, isActive: true },
          })
        : Promise.resolve([] as HsnMaster[]),
      this.prisma.productMaster.findMany({ where: { id: { in: requestedIds }, isActive: true } }),
    ]);

    return items.map((item) => {
      const saved = previous.find((row) => row.id === item.id);
      if (
        saved &&
        mode === previousMode &&
        !item.applyHsnMaster &&
        (saved.itemType || undefined) === item.itemType &&
        (saved.hsnMasterId || undefined) === item.hsnMasterId &&
        saved.hsnSac === item.hsnSac?.trim()
      ) {
        return {
          ...item,
          hsnDescription: saved.hsnDescription || '',
          igstRate: Number(saved.igstRate),
          sgstRate: Number(saved.sgstRate),
          cgstRate: Number(saved.cgstRate),
        };
      }

      const service = services.find((row) => row.id === item.hsnMasterId);
      const product = products.find((row) => row.id === item.hsnMasterId);
      const master = masters.find((row) => row.id === item.hsnMasterId);
      if ((item.itemType === 'SERVICE' && !service && !master) || (item.itemType === 'PRODUCT' && !product && !master)) {
        throw new BadRequestException(`Select an active ${item.itemType.toLowerCase()} for ${item.productName}.`);
      }
      if (item.itemType === 'PRODUCT' && product) {
        if (!product.hsnSac.trim()) {
          throw new BadRequestException(`HSN/SAC code is required for ${product.name}.`);
        }
        return {
          ...item, productName: item.productName || product.name,
          hsnSac: product.hsnSac || item.hsnSac || '',
          hsnDescription: product.description || product.name,
          igstRate: Number(product.igstRate), sgstRate: Number(product.sgstRate), cgstRate: Number(product.cgstRate),
        };
      }
      if ((item.itemType === 'SERVICE' || !item.itemType) && service) {
        if (!service.hsnSac.trim()) {
          throw new BadRequestException(`HSN/SAC code is required for ${service.name}.`);
        }
        return {
          ...item, productName: item.productName || service.name,
          hsnSac: service.hsnSac || item.hsnSac || '',
          hsnDescription: service.description || service.name,
          igstRate: Number(service.igstRate), sgstRate: Number(service.sgstRate), cgstRate: Number(service.cgstRate),
        };
      }

      if (master) {
        return {
          ...item,
          hsnSac: master.code,
          hsnDescription: master.description,
          igstRate: Number(master.igstRate),
          sgstRate: Number(master.sgstRate),
          cgstRate: Number(master.cgstRate),
        };
      }

      throw new BadRequestException(
        `Select an active HSN from HSN Master for ${item.productName || 'each item'}. Add master entries in Master Data → Service HSN.`,
      );
    });
  }

  async list(activeOnly = false) {
    const [services, hsnRows] = await Promise.all([
      this.prisma.serviceMaster
        ? this.prisma.serviceMaster.findMany({
            where: activeOnly ? { isActive: true } : {},
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([] as ServiceMaster[]),
      this.prisma.hsnMaster
        ? this.prisma.hsnMaster.findMany({
            where: activeOnly ? { isActive: true } : {},
            orderBy: { code: 'asc' },
          })
        : Promise.resolve([] as HsnMaster[]),
    ]);

    const serviceList = services.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.hsnSac || '',
      description: s.description || s.name,
      igstRate: Number(s.igstRate ?? 0),
      sgstRate: Number(s.sgstRate ?? 0),
      cgstRate: Number(s.cgstRate ?? 0),
      isActive: s.isActive,
    }));

    const existingCodes = new Set(serviceList.map((s) => s.code).filter(Boolean));
    const standaloneHsns = hsnRows
      .filter((h) => !existingCodes.has(h.code))
      .map((h) => ({
        id: h.id,
        name: h.description,
        code: h.code,
        description: h.description,
        igstRate: Number(h.igstRate),
        sgstRate: Number(h.sgstRate),
        cgstRate: Number(h.cgstRate),
        isActive: h.isActive,
      }));

    return [...serviceList, ...standaloneHsns];
  }

  async listInvoiceCatalog() {
    const [services, products, hsns] = await Promise.all([
      this.prisma.serviceMaster.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      this.prisma.productMaster.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      this.prisma.hsnMaster.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
    ]);
    return [
      ...services.map((entry) => ({
        id: entry.id,
        name: entry.name,
        code: entry.hsnSac || '',
        description: entry.description || entry.name,
        igstRate: Number(entry.igstRate),
        sgstRate: Number(entry.sgstRate),
        cgstRate: Number(entry.cgstRate),
        isActive: entry.isActive,
        itemType: 'SERVICE' as const,
      })),
      ...products.map((entry) => ({
        id: entry.id,
        name: entry.name,
        code: entry.hsnSac || '',
        description: entry.description || entry.name,
        igstRate: Number(entry.igstRate),
        sgstRate: Number(entry.sgstRate),
        cgstRate: Number(entry.cgstRate),
        isActive: entry.isActive,
        itemType: 'PRODUCT' as const,
      })),
      ...hsns.map((entry) => ({
        id: entry.id,
        name: entry.description,
        code: entry.code,
        description: entry.description,
        igstRate: Number(entry.igstRate),
        sgstRate: Number(entry.sgstRate),
        cgstRate: Number(entry.cgstRate),
        isActive: entry.isActive,
        itemType: 'LEGACY_HSN' as const,
      })),
    ];
  }

  async save(data: SaveHsnMasterDto, id?: string) {
    if (
      Math.round(data.igstRate * 100) !==
      Math.round((data.sgstRate + data.cgstRate) * 100)
    ) {
      throw new BadRequestException('IGST must equal SGST + CGST.');
    }
    try {
      const values = {
        adminId: currentAdminId(),
        ...data,
        code: data.code.trim(),
        description: data.description.trim(),
      };
      const row = id
        ? await this.prisma.hsnMaster.update({ where: { id }, data: values })
        : await this.prisma.hsnMaster.create({ data: values });
      return {
        ...row,
        igstRate: Number(row.igstRate),
        sgstRate: Number(row.sgstRate),
        cgstRate: Number(row.cgstRate),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException(
            'This HSN/SAC number already exists. Edit its master entry instead.',
          );
        if (error.code === 'P2025')
          throw new NotFoundException('HSN master entry not found.');
      }
      throw error;
    }
  }
}
