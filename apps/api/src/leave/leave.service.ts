import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveRequest, LeaveStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyLeaveDto, ListLeaveQueryDto, ReviewLeaveDto, UpdateLeaveDto } from './dto/leave.dto';
import type { AuthenticatedUser } from '../auth/permissions';

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(record: LeaveRequest) {
    return {
      id: record.id,
      staffId: record.staffId,
      staffName: record.staffName,
      type: record.type,
      status: record.status,
      startDate: record.startDate.toISOString(),
      endDate: record.endDate.toISOString(),
      reason: record.reason,
      leaveDetail: record.leaveDetail,
      appliedAt: record.appliedAt.toISOString(),
      reviewedAt: record.reviewedAt?.toISOString() ?? null,
      reviewedById: record.reviewedById,
      reviewedByName: record.reviewedByName,
      rejectionNote: record.rejectionNote,
      version: record.version,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private parseIsoDate(value: string, field: string): Date {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date string`);
    }
    return date;
  }

  async findAll(query: ListLeaveQueryDto, user: AuthenticatedUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();

    const searchConditions: Prisma.LeaveRequestWhereInput[] = [];
    if (search) {
      searchConditions.push(
        { staffName: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
      );
    }

    const where: Prisma.LeaveRequestWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(searchConditions.length ? { OR: searchConditions } : {}),
    };

    // Staff can only see their own leaves; admin can filter by staffId or see all
    if (user.role === 'staff') {
      where.staffId = user.id;
    } else if (query.staffId) {
      where.staffId = query.staffId;
    }

    const baseWhere: Prisma.LeaveRequestWhereInput = {
      deletedAt: null,
      ...(user.role === 'staff' ? { staffId: user.id } : {}),
    };

    const [rows, total, pendingCount, approvedCount, rejectedCount, cancelledCount] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ appliedAt: 'desc' }, { id: 'asc' }],
      }),
      this.prisma.leaveRequest.count({ where }),
      this.prisma.leaveRequest.count({ where: { ...baseWhere, status: LeaveStatus.PENDING } }),
      this.prisma.leaveRequest.count({ where: { ...baseWhere, status: LeaveStatus.APPROVED } }),
      this.prisma.leaveRequest.count({ where: { ...baseWhere, status: LeaveStatus.REJECTED } }),
      this.prisma.leaveRequest.count({ where: { ...baseWhere, status: LeaveStatus.CANCELLED } }),
    ]);

    return {
      items: rows.map(row => this.serialize(row)),
      total,
      page,
      pageSize,
      summary: {
        totalCount: pendingCount + approvedCount + rejectedCount + cancelledCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        cancelledCount,
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const record = await this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null, ...(user.role === 'staff' ? { staffId: user.id } : {}) },
    });
    if (!record) throw new NotFoundException('Leave request not found');
    return this.serialize(record);
  }

  async apply(dto: ApplyLeaveDto, user: AuthenticatedUser) {
    if (user.role !== 'staff') {
      throw new ForbiddenException('Only staff members can apply for leave.');
    }

    const startDate = this.parseIsoDate(dto.startDate, 'startDate');
    const endDate = this.parseIsoDate(dto.endDate, 'endDate');
    if (startDate >= endDate) {
      throw new BadRequestException('startDate must be earlier than endDate');
    }

    const record = await this.prisma.leaveRequest.create({
      data: {
        staffId: user.id,
        staffName: user.name,
        type: dto.type,
        startDate,
        endDate,
        reason: dto.reason.trim(),
        leaveDetail: dto.leaveDetail ?? null,
      },
    });
    return this.serialize(record);
  }

  async update(id: string, dto: UpdateLeaveDto, user: AuthenticatedUser) {
    const existing = await this.prisma.leaveRequest.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Leave request not found');
    if (user.role === 'staff' && existing.staffId !== user.id) throw new ForbiddenException('You can only update your own leave requests');
    if (existing.status !== LeaveStatus.PENDING) throw new BadRequestException('Only PENDING leave requests can be updated');
    if (existing.version !== dto.version) throw new ConflictException('This leave record changed. Reload it before saving.');

    const startDate = this.parseIsoDate(dto.startDate, 'startDate');
    const endDate = this.parseIsoDate(dto.endDate, 'endDate');
    if (startDate >= endDate) {
      throw new BadRequestException('startDate must be earlier than endDate');
    }

    const result = await this.prisma.leaveRequest.updateMany({
      where: { id, deletedAt: null, version: dto.version },
      data: {
        type: dto.type,
        startDate,
        endDate,
        reason: dto.reason.trim(),
        leaveDetail: dto.leaveDetail ?? null,
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) throw new ConflictException('This leave record changed. Reload it before saving.');
    return this.findOne(id, user);
  }

  async review(id: string, dto: ReviewLeaveDto, user: AuthenticatedUser) {
    const existing = await this.prisma.leaveRequest.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Leave request not found');
    if (existing.status !== LeaveStatus.PENDING) throw new BadRequestException('Only PENDING leave requests can be reviewed');
    if (existing.version !== dto.version) throw new ConflictException('This leave record changed. Reload it before saving.');

    const result = await this.prisma.leaveRequest.updateMany({
      where: { id, deletedAt: null, version: dto.version },
      data: {
        status: dto.status,
        reviewedAt: new Date(),
        reviewedById: user.id,
        reviewedByName: user.name,
        rejectionNote: dto.status === LeaveStatus.REJECTED ? (dto.rejectionNote ?? null) : null,
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) throw new ConflictException('This leave record changed. Reload it before saving.');
    return this.findOne(id, user);
  }

  async cancel(id: string, version: number, user: AuthenticatedUser) {
    const existing = await this.prisma.leaveRequest.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Leave request not found');
    if (user.role === 'staff' && existing.staffId !== user.id) throw new ForbiddenException('You can only cancel your own leave requests');
    if (existing.status !== LeaveStatus.PENDING) throw new BadRequestException('Only PENDING leave requests can be cancelled');
    if (existing.version !== version) throw new ConflictException('This leave record changed. Reload it before saving.');

    const result = await this.prisma.leaveRequest.updateMany({
      where: { id, deletedAt: null, version },
      data: {
        status: LeaveStatus.CANCELLED,
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) throw new ConflictException('This leave record changed. Reload it before saving.');
    return this.findOne(id, user);
  }
}
