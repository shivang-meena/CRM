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
import { LoginAttempts } from './login-attempts';
import { passwordFingerprint } from './token-fingerprint';

@Injectable()
export class AuthService {
  private readonly attempts = new LoginAttempts();

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  /** ADMIN login (the customer business). Credentials are in the `admins` table, set by the Super Admin. */
  async login(dto: LoginDto, ip = 'unknown') {
    const attemptKey = `admin:${ip}`;
    this.attempts.assertAllowed(attemptKey);
    const loginId = dto.id.trim().toLowerCase();
    const admin = await this.prisma.admin.findFirst({ where: { loginId, deletedAt: null } });
    const valid = admin ? await bcrypt.compare(dto.password, admin.passwordHash) : false;
    if (!admin || !valid) this.rejectLogin(attemptKey, 'Wrong ID or password');
    if (admin.status !== 'ACTIVE') this.rejectLogin(attemptKey, BLOCKED_MESSAGE);
    this.attempts.assertAllowed(attemptKey);
    this.attempts.reset(attemptKey);

    const accessToken = await this.jwt.signAsync({
      sub: admin.id,
      name: admin.name,
      role: 'admin',
      pwv: passwordFingerprint(admin.passwordHash),
    });
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

  async staffLogin(dto: StaffLoginDto, ip = 'unknown') {
    const attemptKey = `staff:${ip}`;
    this.attempts.assertAllowed(attemptKey);
    // runAsSystem is allowed here (G9): we do not know the tenant yet, we look the staff up by email.
    const staff = await runAsSystem(async () =>
      await this.prisma.staffMember.findFirst({
        where: { email: dto.email.trim().toLowerCase(), deletedAt: null, canLoginApp: true },
      }),
    );
    if (!staff || !staff.passwordHash) {
      this.rejectLogin(attemptKey, 'Invalid email or password');
    }
    const valid = await bcrypt.compare(dto.password, staff.passwordHash);
    if (!valid) this.rejectLogin(attemptKey, 'Invalid email or password');
    if (staff.status !== 'ACTIVE') this.rejectLogin(attemptKey, 'Your account is inactive. Contact admin.');

    const admin = await this.prisma.admin.findFirst({ where: { id: staff.adminId, deletedAt: null } });
    if (!admin) this.rejectLogin(attemptKey, 'Invalid email or password');
    if (admin.status !== 'ACTIVE') this.rejectLogin(attemptKey, BLOCKED_MESSAGE);
    this.attempts.assertAllowed(attemptKey);
    this.attempts.reset(attemptKey);

    const permissions = staffEffectivePermissions(staff, adminFeatures(admin));
    const name = `${staff.firstName} ${staff.lastName}`;
    const accessToken = await this.jwt.signAsync({
      sub: staff.id,
      name,
      role: 'staff',
      pwv: passwordFingerprint(staff.passwordHash),
    });
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

  private rejectLogin(attemptKey: string, message: string): never {
    this.attempts.recordFailure(attemptKey);
    throw new UnauthorizedException(message);
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
