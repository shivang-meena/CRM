import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './permissions';

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
    // Keep existing admin tokens without a role valid only for the configured admin ID.
    if (payload.sub === this.config.get<string>('LOGIN_ID') &&
        (payload.role === 'admin' || payload.role === undefined)) {
      return { id: payload.sub, name: this.config.get<string>('LOGIN_NAME') ?? 'Admin', role: 'admin', permissions: null };
    }
    if (payload.role !== 'staff') throw new UnauthorizedException('Invalid account');

    // Never trust permissions embedded in an older JWT. Revocations apply on the next request.
    const staff = await this.prisma.staffMember.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'ACTIVE', canLoginApp: true },
      select: {
        id: true, firstName: true, lastName: true,
        permLead: true, permTask: true, permReminder: true, permMeeting: true,
        permNote: true, permCalendar: true, permCustomer: true, permInvoice: true, permStaff: true, permLeave: true,
      },
    });
    if (!staff) throw new UnauthorizedException('Staff account is inactive or access has been revoked');
    return {
      id: staff.id, name: `${staff.firstName} ${staff.lastName}`, role: 'staff',
      permissions: {
        lead: staff.permLead, task: staff.permTask, reminder: staff.permReminder,
        meeting: staff.permMeeting, note: staff.permNote, calendar: staff.permCalendar,
        customer: staff.permCustomer, invoice: staff.permInvoice, staff: staff.permStaff, leave: staff.permLeave,
      },
    };
  }
}

