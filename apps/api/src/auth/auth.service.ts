import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { StaffLoginDto } from './dto/staff-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(dto: LoginDto) {
    const id = this.config.get<string>('LOGIN_ID');
    const pass = this.config.get<string>('LOGIN_PASS');
    const name = this.config.get<string>('LOGIN_NAME') ?? 'Admin';
    if (dto.id !== id || dto.password !== pass) {
      throw new UnauthorizedException('Wrong ID or password');
    }
    const accessToken = await this.jwt.signAsync({ sub: id, name, role: 'admin' });
    return { accessToken, user: { name, role: 'admin' } };
  }

  async staffLogin(dto: StaffLoginDto) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { email: dto.email.trim().toLowerCase(), deletedAt: null, canLoginApp: true },
    });
    if (!staff || !staff.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(dto.password, staff.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');
    if (staff.status !== 'ACTIVE') throw new UnauthorizedException('Your account is inactive. Contact admin.');

    const permissions = {
      lead: staff.permLead,
      task: staff.permTask,
      reminder: staff.permReminder,
      meeting: staff.permMeeting,
      note: staff.permNote,
      calendar: staff.permCalendar,
      customer: staff.permCustomer,
      invoice: staff.permInvoice,
      staff: staff.permStaff,
      leave: staff.permLeave,
    };

    const accessToken = await this.jwt.signAsync({
      sub: staff.id,
      name: `${staff.firstName} ${staff.lastName}`,
      role: 'staff',
      permissions,
    });
    return {
      accessToken,
      user: {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        role: 'staff' as const,
        permissions,
      },
    };
  }

  async getMe(user: { id: string; name: string; role?: string }) {
    const adminId = this.config.get<string>('LOGIN_ID');
    const adminName = this.config.get<string>('LOGIN_NAME') ?? 'Admin';
    if (user.role === 'admin' || user.id === adminId) {
      return {
        id: user.id,
        name: adminName,
        role: 'admin' as const,
        permissions: null,
      };
    }

    const staff = await this.prisma.staffMember.findFirst({
      where: { id: user.id, deletedAt: null },
    });
    if (!staff || staff.status !== 'ACTIVE' || !staff.canLoginApp) {
      throw new UnauthorizedException('Staff account is inactive or access has been revoked');
    }

    const permissions = {
      lead: staff.permLead,
      task: staff.permTask,
      reminder: staff.permReminder,
      meeting: staff.permMeeting,
      note: staff.permNote,
      calendar: staff.permCalendar,
      customer: staff.permCustomer,
      invoice: staff.permInvoice,
      staff: staff.permStaff,
      leave: staff.permLeave,
    };

    return {
      id: staff.id,
      name: `${staff.firstName} ${staff.lastName}`,
      email: staff.email,
      role: 'staff' as const,
      permissions,
    };
  }
}

