import { Module } from '@nestjs/common';
import { StandaloneMeetingsController } from './standalone-meetings.controller';
import { StandaloneRemindersController } from './standalone-reminders.controller';
import { StandaloneActivitiesService } from './standalone-activities.service';

@Module({ controllers: [StandaloneMeetingsController, StandaloneRemindersController], providers: [StandaloneActivitiesService], exports: [StandaloneActivitiesService] })
export class StandaloneActivitiesModule {}
