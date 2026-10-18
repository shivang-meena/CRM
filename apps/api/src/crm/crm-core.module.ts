import { Global, Module } from '@nestjs/common';
import { CrmCoreService } from './crm-core.service';
@Global()
@Module({ providers: [CrmCoreService], exports: [CrmCoreService] })
export class CrmCoreModule {}
