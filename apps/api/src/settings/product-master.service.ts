import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SaveProductMasterDto } from './product-master.dto';

@Injectable()
export class ProductMasterService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.productMaster.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => ({
      ...row,
      igstRate: Number(row.igstRate ?? 0),
      sgstRate: Number(row.sgstRate ?? 0),
      cgstRate: Number(row.cgstRate ?? 0),
    }));
  }

  async save(data: SaveProductMasterDto, id?: string) {
    const name = data.name.trim().replace(/\s+/g, ' ');
    const igstRate = data.igstRate ?? 0;
    const sgstRate = data.sgstRate ?? 0;
    const cgstRate = data.cgstRate ?? 0;

    if (
      (igstRate > 0 || sgstRate > 0 || cgstRate > 0) &&
      Math.round(igstRate * 100) !== Math.round((sgstRate + cgstRate) * 100)
    ) {
      throw new BadRequestException('IGST must equal SGST + CGST.');
    }

    const values: Prisma.ProductMasterCreateInput = {
      name,
      normalizedName: name.toLowerCase(),
      isActive: data.isActive,
      ...(data.hsnSac !== undefined ? { hsnSac: data.hsnSac.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description.trim() }
        : {}),
      ...(data.igstRate !== undefined ? { igstRate: data.igstRate } : {}),
      ...(data.sgstRate !== undefined ? { sgstRate: data.sgstRate } : {}),
      ...(data.cgstRate !== undefined ? { cgstRate: data.cgstRate } : {}),
    };

    try {
      const row = id
        ? await this.prisma.productMaster.update({
            where: { id },
            data: values,
          })
        : await this.prisma.productMaster.create({ data: values });
      return {
        ...row,
        igstRate: Number(row.igstRate ?? 0),
        sgstRate: Number(row.sgstRate ?? 0),
        cgstRate: Number(row.cgstRate ?? 0),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'This product already exists. Edit its entry instead.',
          );
        }
        if (error.code === 'P2025')
          throw new NotFoundException('Product not found.');
      }
      throw error;
    }
  }
}
