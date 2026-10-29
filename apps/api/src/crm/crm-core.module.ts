import { Global, Module } from '@nestjs/common';
import { CrmCoreService } from './crm-core.service';
import { AssigneesController } from './assignees.controller';
import { AssigneesService } from './assignees.service';
import { LeadSelectionsService } from './lead-selections.service';
@Global()
@Module({ controllers: [AssigneesController], providers: [CrmCoreService, AssigneesService, LeadSelectionsService], exports: [CrmCoreService, AssigneesService, LeadSelectionsService] })
export class CrmCoreModule {}
