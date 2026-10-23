import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { FollowUpsController } from './followups.controller';
import { MeetingsController } from './meetings.controller';
import { RemindersController } from './reminders.controller';
import { ActivitySummaryController } from './activity-summary.controller';
import { DashboardActivitiesController } from './dashboard-activities.controller';
import { StandaloneActivitiesModule } from '../standalone-activities/standalone-activities.module';
@Module({ imports: [StandaloneActivitiesModule], controllers: [FollowUpsController, MeetingsController, RemindersController, ActivitySummaryController, DashboardActivitiesController], providers: [ActivitiesService] })
export class LeadActivitiesModule {}
