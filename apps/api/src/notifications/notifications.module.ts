import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { ReminderWorkerService } from './reminder-worker.service';
@Module({ controllers: [NotificationsController], providers: [ReminderWorkerService] })
export class NotificationsModule {}
