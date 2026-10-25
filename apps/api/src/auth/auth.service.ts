import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { runAsSystem } from '../tenant/tenant-context';
import { adminFeatures, staffEffectivePermissions } from './features';
import { BLOCKED_MESSAGE } from './jwt.strategy';
import type { AuthenticatedUser } from './permissions';
import { LoginDto } from './dto/login.dto';
import { StaffLoginDto } from './dto/staff-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  /** ADMIN login (the customer business). Credentials are in the `admins` table, set by the Super Admin. */
  async login(dto: LoginDto) {
    const loginId = dto.id.trim().toLowerCase();
    const admin = await this.prisma.admin.findFirst({ where: { loginId, deletedAt: null } });
    const valid = admin ? await bcrypt.compare(dto.password, admin.passwordHash) : false;
    if (!admin || !valid) throw new UnauthorizedException('Wrong ID or password');
    if (admin.status !== 'ACTIVE') throw new UnauthorizedException(BLOCKED_MESSAGE);

    const accessToken = await this.jwt.signAsync({ sub: admin.id, name: admin.name, role: 'admin' });
    return {
      accessToken,
      user: {
        id: admin.id,
        name: admin.name,
        role: 'admin' as const,
        permissions: adminFeatures(admin),
        businessName: admin.businessName,
      },
    };
  }

  async staffLogin(dto: StaffLoginDto) {
    // runAsSystem is allowed here (G9): we do not know the tenant yet, we look the staff up by email.
    const staff = await runAsSystem(async () =>
      await this.prisma.staffMember.findFirst({
        where: { email: dto.email.trim().toLowerCase(), deletedAt: null, canLoginApp: true },
      }),
    );
    if (!staff || !staff.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(dto.password, staff.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');
    if (staff.status !== 'ACTIVE') throw new UnauthorizedException('Your account is inactive. Contact admin.');

    const admin = await this.prisma.admin.findFirst({ where: { id: staff.adminId, deletedAt: null } });
    if (!admin) throw new UnauthorizedException('Invalid email or password');
    if (admin.status !== 'ACTIVE') throw new UnauthorizedException(BLOCKED_MESSAGE);

    const permissions = staffEffectivePermissions(staff, adminFeatures(admin));
    const name = `${staff.firstName} ${staff.lastName}`;
    const accessToken = await this.jwt.signAsync({ sub: staff.id, name, role: 'staff' });
    return {
      accessToken,
      user: {
        id: staff.id,
        name,
        email: staff.email,
        role: 'staff' as const,
        permissions,
        businessName: admin.businessName,
      },
    };
  }

  /** /auth/me. `user` was already fully validated and built by JwtStrategy, so just return it. */
  getMe(user: AuthenticatedUser) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      businessName: user.businessName,
    };
  }
}
