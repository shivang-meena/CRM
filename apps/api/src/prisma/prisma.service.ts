import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantExtension } from '../tenant/tenant.extension';

/**
 * PrismaClient with automatic tenant isolation.
 * The constructor returns the EXTENDED client; the type stays PrismaClient so the rest of the code
 * (including `Prisma.TransactionClient` in transactions) keeps compiling unchanged.
 * The old onModuleInit/onModuleDestroy are intentionally removed: Prisma connects lazily and disconnects on process exit.
 */
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super();
    return this.$extends(tenantExtension) as unknown as this;
  }
}
