import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { SuperAdminLoginDto } from './dto/super-admin.dto';

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class SuperAdminAuthService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminAuthService.name);
  private fails = new Map<string, { count: number; first: number }>();

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
    const now = Date.now();
    const entry = this.fails.get(ip);
    if (entry && now - entry.first > WINDOW_MS) this.fails.delete(ip);
    const current = this.fails.get(ip);
    if (current && current.count >= MAX_FAILS) {
      throw new HttpException('Too many failed attempts. Try again after 15 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const c = this.creds();
    const ok = c.configured && safeEqual(dto.id.trim(), c.id as string) && safeEqual(dto.password, c.password as string);
    if (!ok) {
      const prev = this.fails.get(ip);
      this.fails.set(ip, { count: (prev?.count ?? 0) + 1, first: prev?.first ?? now });
      throw new UnauthorizedException('Wrong ID or password');
    }
    this.fails.delete(ip);

    const name = this.config.get<string>('SUPER_ADMIN_NAME') ?? 'Super Admin';
    const accessToken = await this.jwt.signAsync({ sub: 'super-admin', name, role: 'super_admin' }, { expiresIn: '12h' });
    return { accessToken, user: { id: 'super-admin', name, role: 'super_admin' as const } };
  }
}
