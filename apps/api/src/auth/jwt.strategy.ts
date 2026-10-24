import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { runAsSystem } from '../tenant/tenant-context';
import { adminFeatures } from './features';
import type { AuthenticatedUser } from './permissions';

export const BLOCKED_MESSAGE = 'Your account has been blocked. Please contact support.';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: { sub: string; name: string; role?: string }): Promise<AuthenticatedUser> {
    if (typeof payload.sub !== 'string' || !payload.sub) throw new UnauthorizedException('Invalid account');

    // 1) SUPER ADMIN (credentials only in .env, never in the database)
    if (payload.role === 'super_admin') {
      const superId = this.config.get<string>('SUPER_ADMIN_ID');
      if (!superId || payload.sub !== 'super-admin') throw new UnauthorizedException('Invalid account');
      return {
        id: 'super-admin',
        name: this.config.get<string>('SUPER_ADMIN_NAME') ?? 'Super Admin',
        role: 'super_admin',
        adminId: null,
        permissions: null,
      };
    }

    // 2) ADMIN. Old tokens without a role are treated as admin tokens (sub = old LOGIN_ID = default admin id).
    if (payload.role === 'admin' || payload.role === undefined) {
      const admin = await this.prisma.admin.findFirst({ where: { id: payload.sub, deletedAt: null } });
      if (!admin) throw new UnauthorizedException('Invalid account');
      if (admin.status !== 'ACTIVE') throw new UnauthorizedException(BLOCKED_MESSAGE);
      return {
        id: admin.id,
        name: admin.name,
        role: 'admin',
        adminId: admin.id,
        permissions: adminFeatures(admin),
        businessName: admin.businessName,
      };
    }

    // 3) STAFF
    if (payload.role !== 'staff') throw new UnauthorizedException('Invalid account');

    // Never trust permissions embedded in an older JWT. Revocations apply on the next request.
    // runAsSystem is allowed here (G9): we do not know the tenant yet, we are looking it up.
    const staff = await runAsSystem(() =>
      this.prisma.staffMember.findFirst({
        where: { id: payload.sub, deletedAt: null, status: 'ACTIVE', canLoginApp: true },
        select: {
          id: true, adminId: true, firstName: true, lastName: true, email: true,
          permLead: true, permReminder: true, permMeeting: true, permNote: true, permCalendar: true,
          permCustomer: true, permInvoice: true, permStaff: true, permLeave: true,
        },
      }),
    );
    if (!staff) throw new UnauthorizedException('Staff account is inactive or access has been revoked');

    const admin = await this.prisma.admin.findFirst({ where: { id: staff.adminId, deletedAt: null } });
    if (!admin) throw new UnauthorizedException('Invalid account');
    if (admin.status !== 'ACTIVE') throw new UnauthorizedException(BLOCKED_MESSAGE);

    const f = adminFeatures(admin);
    return {
      id: staff.id,
      name: `${staff.firstName} ${staff.lastName}`,
      role: 'staff',
      adminId: staff.adminId,
      email: staff.email,
      businessName: admin.businessName,
      // effective permission = what the Admin gave the staff AND what the Super Admin enabled for the Admin
      permissions: {
        lead: staff.permLead && f.lead,
        reminder: staff.permReminder && f.reminder,
        meeting: staff.permMeeting && f.meeting,
        note: staff.permNote && f.note,
        calendar: staff.permCalendar && f.calendar,
        customer: staff.permCustomer && f.customer,
        invoice: staff.permInvoice && f.invoice,
        staff: staff.permStaff && f.staff,
        leave: staff.permLeave && f.leave,
      },
    };
  }
}
