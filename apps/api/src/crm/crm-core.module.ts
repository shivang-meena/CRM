import { Global, Module } from '@nestjs/common';
import { CrmCoreService } from './crm-core.service';
import { AssigneesController } from './assignees.controller';
import { AssigneesService } from './assignees.service';
@Global()
@Module({ controllers: [AssigneesController], providers: [CrmCoreService, AssigneesService], exports: [CrmCoreService, AssigneesService] })
export class CrmCoreModule {}
