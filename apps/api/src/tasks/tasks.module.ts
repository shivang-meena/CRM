import { Module } from '@nestjs/common';
import { TasksController, TaskLabelsController, TaskRecurrenceSeriesController } from './tasks.controller';
import { TaskRecurrenceWorkerService } from './task-recurrence-worker.service';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController, TaskLabelsController, TaskRecurrenceSeriesController],
  providers: [TasksService, TaskRecurrenceWorkerService],
  exports: [TasksService],
})
export class TasksModule {}
