import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { SuperAdminAuthController, SuperAdminController } from './super-admin.controller';
import { SuperAdminGuard } from './super-admin.guard';
import { SuperAdminService } from './super-admin.service';

@Module({
  imports: [AuthModule],
  controllers: [SuperAdminAuthController, SuperAdminController],
  providers: [SuperAdminAuthService, SuperAdminService, SuperAdminGuard],
})
export class SuperAdminModule {}
