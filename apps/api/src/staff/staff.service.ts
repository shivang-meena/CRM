import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, StaffMember, StaffStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, isValidCalendarDateString, ListStaffQueryDto, UpdateStaffDto, UpdateStaffStatusDto } from './dto/staff.dto';

function dateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(record: StaffMember) {
    return {
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      birthDate: dateOnly(record.birthDate),
      joiningDate: dateOnly(record.joiningDate)!,
      status: record.status,
      department: record.department,
      designation: record.designation,
      employeeCode: record.employeeCode,
      canLoginApp: record.canLoginApp,
      hasPassword: !!record.passwordHash,
      permissions: {
        lead: record.permLead,
        reminder: record.permReminder,
        meeting: record.permMeeting,
        note: record.permNote,
        calendar: record.permCalendar,
        customer: record.permCustomer,
        invoice: record.permInvoice,
        staff: record.permStaff,
        leave: record.permLeave,
      },
      version: record.version,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private toDate(value: string, field: string): Date {
    if (!isValidCalendarDateString(value)) {
      throw new BadRequestException(`${field} must be a valid date in YYYY-MM-DD format`);
    }
    return new Date(`${value}T00:00:00.000Z`);
  }

  private validateDates(birthDate: Date | null, joiningDate: Date) {
    if (birthDate && birthDate.getTime() >= joiningDate.getTime()) {
      throw new BadRequestException('Birth date must be earlier than joining date');
    }
  }

  private rethrowUniqueConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : String(error.meta?.target ?? '');
      if (target.includes('email')) throw new ConflictException('A staff member with this email already exists.');
      if (target.includes('employeeCode')) throw new ConflictException('A staff member with this employee code already exists.');
      throw new ConflictException('A staff member with these unique details already exists.');
    }
    throw error;
  }

  async findAll(query: ListStaffQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const searchTokens = search?.split(/\s+/).filter(Boolean) ?? [];
    const searchConditions: Prisma.StaffMemberWhereInput[] = [];
    if (search) {
      searchConditions.push(
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      );
      if (searchTokens.length >= 2) {
        searchConditions.push({
          AND: [
            { firstName: { contains: searchTokens[0], mode: 'insensitive' } },
            { lastName: { contains: searchTokens.slice(1).join(' '), mode: 'insensitive' } },
          ],
        });
      }
    }
    const where: Prisma.StaffMemberWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(searchConditions.length ? { OR: searchConditions } : {}),
    };

    const [rows, total, activeCount, inactiveCount] = await this.prisma.$transaction([
      this.prisma.staffMember.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.staffMember.count({ where }),
      this.prisma.staffMember.count({ where: { deletedAt: null, status: StaffStatus.ACTIVE } }),
      this.prisma.staffMember.count({ where: { deletedAt: null, status: StaffStatus.INACTIVE } }),
    ]);

    return {
      items: rows.map(row => this.serialize(row)),
      total,
      page,
      pageSize,
      summary: { totalCount: activeCount + inactiveCount, activeCount, inactiveCount },
    };
  }

  async findOne(id: string) {
    const record = await this.prisma.staffMember.findFirst({ where: { id, deletedAt: null } });
    if (!record) throw new NotFoundException('Staff member not found');
    return this.serialize(record);
  }

  async create(dto: CreateStaffDto) {
    const birthDate = dto.birthDate ? this.toDate(dto.birthDate, 'birthDate') : null;
    const joiningDate = this.toDate(dto.joiningDate, 'joiningDate');
    this.validateDates(birthDate, joiningDate);
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;
    try {
      const record = await this.prisma.staffMember.create({
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email.trim().toLowerCase(),
          phone: dto.phone ?? null,
          birthDate,
          joiningDate,
          status: dto.status ?? StaffStatus.ACTIVE,
          department: dto.department ?? null,
          designation: dto.designation ?? null,
          employeeCode: dto.employeeCode ?? null,
          passwordHash,
          canLoginApp: dto.canLoginApp ?? false,
          permLead: dto.permissions?.lead ?? true,
          permReminder: dto.permissions?.reminder ?? true,
          permMeeting: dto.permissions?.meeting ?? true,
          permNote: dto.permissions?.note ?? true,
          permCalendar: dto.permissions?.calendar ?? true,
          permCustomer: dto.permissions?.customer ?? true,
          permInvoice: dto.permissions?.invoice ?? false,
          permStaff: dto.permissions?.staff ?? false,
          permLeave: dto.permissions?.leave ?? true,
        },
      });
      return this.serialize(record);
    } catch (error) {
      return this.rethrowUniqueConflict(error);
    }
  }

  async update(id: string, dto: UpdateStaffDto) {
    const existing = await this.prisma.staffMember.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Staff member not found');
    if (existing.version !== dto.version) throw new ConflictException('This staff record changed. Reload it before saving.');

    const birthDate = dto.birthDate ? this.toDate(dto.birthDate, 'birthDate') : null;
    const joiningDate = this.toDate(dto.joiningDate, 'joiningDate');
    this.validateDates(birthDate, joiningDate);

    // Only re-hash password if a new one was provided
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : existing.passwordHash;

    try {
      const result = await this.prisma.staffMember.updateMany({
        where: { id, deletedAt: null, version: dto.version },
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email.trim().toLowerCase(),
          phone: dto.phone ?? null,
          birthDate,
          joiningDate,
          status: dto.status ?? existing.status,
          department: dto.department ?? null,
          designation: dto.designation ?? null,
          employeeCode: dto.employeeCode ?? null,
          passwordHash,
          canLoginApp: dto.canLoginApp ?? existing.canLoginApp,
          permLead: dto.permissions?.lead ?? existing.permLead,
          permReminder: dto.permissions?.reminder ?? existing.permReminder,
          permMeeting: dto.permissions?.meeting ?? existing.permMeeting,
          permNote: dto.permissions?.note ?? existing.permNote,
          permCalendar: dto.permissions?.calendar ?? existing.permCalendar,
          permCustomer: dto.permissions?.customer ?? existing.permCustomer,
          permInvoice: dto.permissions?.invoice ?? existing.permInvoice,
          permStaff: dto.permissions?.staff ?? existing.permStaff,
          permLeave: dto.permissions?.leave ?? existing.permLeave,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1) throw new ConflictException('This staff record changed. Reload it before saving.');
      return this.findOne(id);
    } catch (error) {
      return this.rethrowUniqueConflict(error);
    }
  }

  async updateStatus(id: string, dto: UpdateStaffStatusDto) {
    const result = await this.prisma.staffMember.updateMany({
      where: { id, deletedAt: null, version: dto.version },
      data: { status: dto.status, version: { increment: 1 } },
    });
    if (result.count !== 1) {
      const exists = await this.prisma.staffMember.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
      if (!exists) throw new NotFoundException('Staff member not found');
      throw new ConflictException('This staff record changed. Reload it before saving.');
    }
    return this.findOne(id);
  }
}

