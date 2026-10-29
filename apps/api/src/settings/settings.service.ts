import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { currentAdminId } from '../tenant/tenant-context';
import { SaveCompanyProfileDto } from './company-profile.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  getCompanyBranding() {
    return this.prisma.companyProfile.findFirst({
      select: { companyName: true, logo: true },
    });
  }

  async getCompanyProfile() {
    return this.prisma.companyProfile.findFirst();
  }

  saveCompanyProfile(data: SaveCompanyProfileDto) {
    if (Boolean(data.openingTime) !== Boolean(data.closingTime)) {
      throw new BadRequestException('Set both opening and closing times, or leave both empty.');
    }
    return this.prisma.companyProfile.upsert({
      where: { adminId: currentAdminId() },
      create: { ...data, adminId: currentAdminId() },
      update: data,
    });
  }
}
