import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantInterceptor } from './tenant/tenant.interceptor';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { PrismaModule } from './prisma/prisma.module';
import { CrmCoreModule } from './crm/crm-core.module';
import { LeadActivitiesModule } from './lead-activities/lead-activities.module';
import { SalesDocumentsModule } from './sales-documents/sales-documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotesModule } from './notes/notes.module';
import { StandaloneActivitiesModule } from './standalone-activities/standalone-activities.module';
import { CalendarModule } from './calendar/calendar.module';
import { CustomersModule } from './customers/customers.module';
import { StaffModule } from './staff/staff.module';
import { LeaveModule } from './leave/leave.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, CrmCoreModule, AuthModule, LeadsModule, LeadActivitiesModule, SalesDocumentsModule, NotificationsModule, NotesModule, StandaloneActivitiesModule, CalendarModule, CustomersModule, StaffModule, LeaveModule, SettingsModule],
  providers: [{ provide: APP_INTERCEPTOR, useClass: TenantInterceptor }],
})
export class AppModule {}
