import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
      return items.map((item) => ({
        ...item,
        hsnMasterId: undefined,
        hsnDescription: '',
        hsnSac: '',
        igstRate: 0,
        sgstRate: 0,
        cgstRate: 0,
      }));
    }

    const requestedIds = [
      ...new Set(
        items
          .map((item) => item.hsnMasterId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [services, masters] = await Promise.all([
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
    ]);

    return items.map((item) => {
      const saved = previous.find((row) => row.id === item.id);
      if (
        saved &&
        mode === previousMode &&
        !item.applyHsnMaster &&
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
      if (service) {
        return {
          ...item,
          productName: item.productName || service.name,
          hsnSac: service.hsnSac || item.hsnSac || '',
          hsnDescription: service.description || service.name,
          igstRate: Number(service.igstRate),
          sgstRate: Number(service.sgstRate),
          cgstRate: Number(service.cgstRate),
        };
      }

      const master = masters.find((row) => row.id === item.hsnMasterId);
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
        `Select an active HSN from HSN Master for ${item.productName || 'each item'}. Add master entries in Invoice Settings first.`,
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

  async save(data: SaveHsnMasterDto, id?: string) {
    if (
      Math.round(data.igstRate * 100) !==
      Math.round((data.sgstRate + data.cgstRate) * 100)
    ) {
      throw new BadRequestException('IGST must equal SGST + CGST.');
    }
    try {
      const values = {
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
