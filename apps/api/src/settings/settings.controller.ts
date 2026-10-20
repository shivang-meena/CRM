import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly } from '../auth/permissions';
import { SaveCompanyProfileDto } from './company-profile.dto';
import { SettingsService } from './settings.service';

@Controller('settings/company-profile')
@UseGuards(JwtAuthGuard)
@AdminOnly()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getCompanyProfile() {
    return this.settings.getCompanyProfile();
  }

  @Put()
  saveCompanyProfile(@Body() data: SaveCompanyProfileDto) {
    return this.settings.saveCompanyProfile(data);
  }
}
