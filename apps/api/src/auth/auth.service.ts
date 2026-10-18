import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private config: ConfigService, private jwt: JwtService) {}

  async login(dto: LoginDto) {
    const id = this.config.get<string>('LOGIN_ID');
    const pass = this.config.get<string>('LOGIN_PASS');
    const name = this.config.get<string>('LOGIN_NAME') ?? 'Admin';
    if (dto.id !== id || dto.password !== pass) {
      throw new UnauthorizedException('Wrong ID or password');
    }
    const accessToken = await this.jwt.signAsync({ sub: id, name });
    return { accessToken, user: { name } };
  }
}
