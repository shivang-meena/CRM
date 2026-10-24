import { Prisma } from '@prisma/client';
import { tenantStorage } from './tenant-context';

/** Prisma MODEL names (PascalCase) that have an `adminId` column. Exactly 23. */
export const TENANT_MODELS = new Set<string>([
  'Lead',
  'ServiceMaster',
  'ProductMaster',
  'LeadStatusMaster',
  'Customer',
  'LeadFollowUp',
  'LeadMeeting',
  'LeadReminder',
  'LeadHistory',
  'SalesDocument',
  'HsnMaster',
  'PaymentMethodMaster',
  'BrochureMaster',
  'DocumentSequence',
  'InvoicePayment',
  'CrmNotification',
  'Note',
  'CalendarEvent',
  'StaffMember',
  'GstInvoiceSettings',
  'NonGstInvoiceSettings',
  'CompanyProfile',
  'LeaveRequest',
]);

/** Operations where we force `where.adminId`. */
const WHERE_OPERATIONS = new Set<string>([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'delete',
  'deleteMany',
]);

export const tenantExtension = Prisma.defineExtension({
  name: 'tenant-isolation',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Models without adminId (Admin, SalesDocumentItem) pass through untouched.
        if (!TENANT_MODELS.has(model)) return query(args);

        const store = tenantStorage.getStore();
        if (store?.system) return query(args);

        const adminId = store?.adminId;
        if (!adminId) {
          // FAIL CLOSED: never return data without a tenant.
          throw new Error(
            `[tenant] No tenant context for ${model}.${operation}. Use an authenticated request, runWithTenant() or runAsSystem().`,
          );
        }

        const a: any = { ...(args as any) };

        if (WHERE_OPERATIONS.has(operation)) {
          a.where = { ...(a.where ?? {}), adminId };
        } else if (operation === 'create') {
          a.data = { ...(a.data ?? {}), adminId };
        } else if (operation === 'createMany' || operation === 'createManyAndReturn') {
          a.data = Array.isArray(a.data)
            ? a.data.map((row: any) => ({ ...row, adminId }))
            : { ...(a.data ?? {}), adminId };
        } else if (operation === 'upsert') {
          a.where = { ...(a.where ?? {}), adminId };
          a.create = { ...(a.create ?? {}), adminId };
        } else {
          throw new Error(`[tenant] Operation ${operation} on ${model} is not supported by the tenant extension.`);
        }

        return query(a);
      },
    },
  },
});
