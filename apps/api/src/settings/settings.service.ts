import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveCompanyProfileDto } from './company-profile.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyProfile() {
    return this.prisma.companyProfile.findUnique({ where: { id: 'company' } });
  }

  saveCompanyProfile(data: SaveCompanyProfileDto) {
    if (Boolean(data.openingTime) !== Boolean(data.closingTime)) {
      throw new BadRequestException(
        'Set both opening and closing times, or leave both empty.',
      );
    }
    return this.prisma.companyProfile.upsert({
      where: { id: 'company' },
      create: { ...data, id: 'company' },
      update: data,
    });
  }
}
