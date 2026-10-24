import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { currentAdminId } from '../tenant/tenant-context';
import { SaveLeadStatusMasterDto } from './lead-status-master.dto';

const MAX_LEAD_STATUSES = 30;

@Injectable()
export class LeadStatusMasterService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.leadStatusMaster.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.leadStatusMaster.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('Lead status not found.');
    }
    return record;
  }

  async save(dto: SaveLeadStatusMasterDto, id?: string) {
    const name = dto.name.trim().replace(/\s+/g, ' ');
    if (!name) {
      throw new BadRequestException('Status name is required.');
    }

    const normalizedName = name.toLowerCase();

    // Check conflict by normalized name
    const existing = await this.prisma.leadStatusMaster.findFirst({
      where: {
        normalizedName,
        ...(id ? { id: { not: id } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException('A status with this name already exists.');
    }

    const code =
      dto.code?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_') ||
      name.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

    // Check code conflict if provided
    if (code) {
      const codeExisting = await this.prisma.leadStatusMaster.findFirst({
        where: {
          code,
          ...(id ? { id: { not: id } } : {}),
        },
      });
      if (codeExisting) {
        // If code conflicts, we can append a random or unique suffix if creating
        if (!id) {
          // Keep existing code if updating without code change
        }
      }
    }

    const order = dto.order;

    const color = dto.color?.trim() || '#0284c7';

    if (id) {
      await this.findOne(id);
      return this.prisma.leadStatusMaster.update({
        where: { id },
        data: {
          name,
          normalizedName,
          ...(dto.code ? { code } : {}),
          color,
          ...(order !== undefined ? { order } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // Serialize creates so simultaneous requests cannot exceed the limit.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(36502027)::text AS locked`;
      const count = await tx.leadStatusMaster.count();
      if (count >= MAX_LEAD_STATUSES) {
        throw new BadRequestException('You can add a maximum of 30 lead statuses.');
      }

      let nextOrder = order;
      if (nextOrder === undefined) {
        const maxOrder = await tx.leadStatusMaster.aggregate({
          _max: { order: true },
        });
        nextOrder = (maxOrder._max.order ?? 0) + 1;
      }

      return tx.leadStatusMaster.create({
        data: {
          adminId: currentAdminId(),
          name,
          normalizedName,
          code,
          color,
          order: nextOrder,
          isActive: dto.isActive ?? true,
        },
      });
    });
  }

  async reorder(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Invalid IDs for reordering.');
    }

    return this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.leadStatusMaster.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );
  }

  async delete(id: string) {
    const status = await this.findOne(id);

    // Check if status is used in any lead
    const usedCount = await this.prisma.lead.count({
      where: {
        OR: [
          ...(status.code ? [{ status: status.code }] : []),
          { status: status.name },
          { status: status.normalizedName },
        ],
        deletedAt: null,
      },
    });

    if (usedCount > 0) {
      throw new BadRequestException(
        `Cannot delete this status because ${usedCount} lead(s) currently use it. You can deactivate it instead.`,
      );
    }

    await this.prisma.leadStatusMaster.delete({
      where: { id },
    });

    return { success: true };
  }
}
