import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Admin, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { adminFeatures } from '../auth/features';
import { MODULES } from '../auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { runWithTenant } from '../tenant/tenant-context';
import { seedTenantDefaults } from '../tenant/tenant-defaults';
import {
  CreateAdminDto, FeaturesDto, ListAdminsQueryDto, ResetAdminPasswordDto,
  UpdateAdminDto, UpdateAdminFeaturesDto, UpdateAdminStatusDto,
} from './dto/super-admin.dto';

type FeaturePatch = Partial<Pick<Admin,
  'featLead' | 'featReminder' | 'featMeeting' | 'featNote' | 'featCalendar' | 'featCustomer' | 'featInvoice' | 'featStaff' | 'featLeave'>>;

function featurePatch(f?: FeaturesDto): FeaturePatch {
  const d: FeaturePatch = {};
  if (!f) return d;
  if (typeof f.lead === 'boolean') d.featLead = f.lead;
  if (typeof f.reminder === 'boolean') d.featReminder = f.reminder;
  if (typeof f.meeting === 'boolean') d.featMeeting = f.meeting;
  if (typeof f.note === 'boolean') d.featNote = f.note;
  if (typeof f.calendar === 'boolean') d.featCalendar = f.calendar;
  if (typeof f.customer === 'boolean') d.featCustomer = f.customer;
  if (typeof f.invoice === 'boolean') d.featInvoice = f.invoice;
  if (typeof f.staff === 'boolean') d.featStaff = f.staff;
  if (typeof f.leave === 'boolean') d.featLeave = f.leave;
  return d;
}

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** NEVER include passwordHash here. */
  private serialize(a: Admin) {
    const features = adminFeatures(a);
    return {
      id: a.id,
      loginId: a.loginId,
      name: a.name,
      businessName: a.businessName,
      phone: a.phone,
      email: a.email,
      status: a.status,
      blockedAt: a.blockedAt ? a.blockedAt.toISOString() : null,
      features,
      enabledFeatureCount: Object.values(features).filter(Boolean).length,
      totalFeatureCount: MODULES.length,
      version: a.version,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  async list(query: ListAdminsQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.AdminWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { loginId: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { businessName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, active, blocked] = await Promise.all([
      this.prisma.admin.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] }),
      this.prisma.admin.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.admin.count({ where: { deletedAt: null, status: 'BLOCKED' } }),
    ]);
    return {
      items: rows.map((r) => this.serialize(r)),
      total: rows.length,
      summary: { totalCount: active + blocked, activeCount: active, blockedCount: blocked },
    };
  }

  private async getOrThrow(id: string) {
    const admin = await this.prisma.admin.findFirst({ where: { id, deletedAt: null } });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  async findOne(id: string) {
    return this.serialize(await this.getOrThrow(id));
  }

  async create(dto: CreateAdminDto) {
    const loginId = dto.loginId.trim().toLowerCase();
    const exists = await this.prisma.admin.findFirst({ where: { loginId } });
    if (exists) throw new ConflictException('This Login ID is already used. Choose another.');
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const admin = await this.prisma.$transaction(async (tx) => {
        const created = await tx.admin.create({
          data: {
            loginId,
            passwordHash,
            name: dto.name.trim(),
            businessName: dto.businessName?.trim() ?? '',
            phone: dto.phone?.trim() || null,
            email: dto.email?.trim().toLowerCase() || null,
            ...featurePatch(dto.features),
          },
        });
        // Give the new business its default lead statuses and payment methods.
        await runWithTenant(created.id, () => seedTenantDefaults(tx));
        return created;
      });
      return this.serialize(admin);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('This Login ID is already used. Choose another.');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateAdminDto) {
    await this.getOrThrow(id);
    const updated = await this.prisma.admin.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.businessName !== undefined ? { businessName: dto.businessName.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() || null } : {}),
        version: { increment: 1 },
      },
    });
    return this.serialize(updated);
  }

  async updateFeatures(id: string, dto: UpdateAdminFeaturesDto) {
    await this.getOrThrow(id);
    const updated = await this.prisma.admin.update({
      where: { id },
      data: { ...featurePatch(dto.features), version: { increment: 1 } },
    });
    return this.serialize(updated);
  }

  async updateStatus(id: string, dto: UpdateAdminStatusDto) {
    await this.getOrThrow(id);
    const updated = await this.prisma.admin.update({
      where: { id },
      data: {
        status: dto.status,
        blockedAt: dto.status === 'BLOCKED' ? new Date() : null,
        version: { increment: 1 },
      },
    });
    return this.serialize(updated);
  }

  async resetPassword(id: string, dto: ResetAdminPasswordDto) {
    await this.getOrThrow(id);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.admin.update({ where: { id }, data: { passwordHash, version: { increment: 1 } } });
    return { success: true };
  }
}
