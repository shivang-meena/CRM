import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { SuperAdminLoginDto } from './dto/super-admin.dto';
import { LoginAttempts } from '../auth/login-attempts';

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

@Injectable()
export class SuperAdminAuthService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminAuthService.name);
  private readonly attempts = new LoginAttempts();

  constructor(private readonly config: ConfigService, private readonly jwt: JwtService) {}

  private creds() {
    const id = this.config.get<string>('SUPER_ADMIN_ID')?.trim();
    const password = this.config.get<string>('SUPER_ADMIN_PASSWORD');
    const configured = !!id && !!password && id !== 'CHANGE_ME' && password !== 'CHANGE_ME';
    return { id, password, configured };
  }

  onModuleInit() {
    if (!this.creds().configured) {
      this.logger.warn('SUPER_ADMIN_ID / SUPER_ADMIN_PASSWORD are not set in .env. Super admin login is DISABLED.');
    }
  }

  async login(dto: SuperAdminLoginDto, ip: string) {
    this.attempts.assertAllowed(ip);

    const c = this.creds();
    const ok = c.configured && safeEqual(dto.id.trim(), c.id as string) && safeEqual(dto.password, c.password as string);
    if (!ok) {
      this.attempts.recordFailure(ip);
      throw new UnauthorizedException('Wrong ID or password');
    }
    this.attempts.reset(ip);

    const name = this.config.get<string>('SUPER_ADMIN_NAME') ?? 'Super Admin';
    const accessToken = await this.jwt.signAsync({ sub: 'super-admin', name, role: 'super_admin' }, { expiresIn: '12h' });
    return { accessToken, user: { id: 'super-admin', name, role: 'super_admin' as const } };
  }
}
