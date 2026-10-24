import { Prisma } from '@prisma/client';
import { currentAdminId } from './tenant-context';

const DEFAULT_LEAD_STATUSES = [
  { name: 'New', normalizedName: 'new', code: 'NEW', color: '#0284C7', order: 1 },
  { name: 'Processing', normalizedName: 'processing', code: 'PROCESSING', color: '#7C3AED', order: 2 },
  { name: 'Close-by', normalizedName: 'close-by', code: 'CLOSE_BY', color: '#65A30D', order: 3 },
  { name: 'Confirm', normalizedName: 'confirm', code: 'CONFIRM', color: '#16A34A', order: 4 },
  { name: 'Cancel', normalizedName: 'cancel', code: 'CANCEL', color: '#DC2626', order: 5 },
];

const DEFAULT_PAYMENT_METHODS = [
  { method: 'Internet Banking (NEFT/RTGS/IMPS)', isDefault: true },
  { method: 'Cash', isDefault: false },
  { method: 'Credit Card', isDefault: false },
  { method: 'UPI', isDefault: false },
];

/** Call inside runWithTenant(newAdminId, ...) with the transaction client. */
export async function seedTenantDefaults(tx: Prisma.TransactionClient) {
  const adminId = currentAdminId();
  await tx.leadStatusMaster.createMany({
    data: DEFAULT_LEAD_STATUSES.map((s) => ({ ...s, isActive: true, adminId })),
  });
  await tx.paymentMethodMaster.createMany({
    data: DEFAULT_PAYMENT_METHODS.map((m) => ({ ...m, adminId })),
  });
}
