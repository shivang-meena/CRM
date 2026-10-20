import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { StaffLoginDto } from './dto/staff-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequirePermissions } from './permissions';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('staff/login')
  @HttpCode(200)
  staffLogin(@Body() dto: StaffLoginDto) {
    return this.auth.staffLogin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions()
  @Get('me')
  getMe(@Req() req: any) {
    return this.auth.getMe(req.user);
  }
}

