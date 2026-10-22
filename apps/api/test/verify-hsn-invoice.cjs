// Real database verification with an outer rollback: no invoices, HSN entries,
// invoice numbers or customer changes are retained after this test.
const assert = require('node:assert/strict');
const { randomUUID, randomInt } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { SalesDocumentsService } = require('../dist/sales-documents/sales-documents.service');
const { HsnMasterService } = require('../dist/settings/hsn-master.service');

async function main() {
  const prisma = new PrismaClient();
  const rollback = new Error('Verification complete; roll back fixtures');
  try {
    await prisma.$transaction(async (tx) => {
      const settings = await tx.gstInvoiceSettings.findFirst();
      const lead = await tx.lead.create({ data: { name: 'Temporary HSN verification customer', phone: '0000000000', createdBy: 'HSN verification', assignedTo: 'HSN verification' } });
      const customer = await tx.customer.create({ data: { leadId: lead.id, convertedById: 'hsn-verification', convertedByName: 'HSN verification' } });
      assert(settings, 'Save GST invoice settings before running this local test.');
      const run = randomUUID();
      const master = await tx.hsnMaster.create({ data: { code: `99${randomInt(100000, 999999)}`, description: 'Temporary invoice verification', igstRate: 18, sgstRate: 9, cgstRate: 9 } });
      // Reuse the outer transaction for the service's transactional writes.
      const scoped = {
        salesDocument: tx.salesDocument,
        salesDocumentItem: tx.salesDocumentItem,
        customer: tx.customer,
        companyProfile: tx.companyProfile,
        paymentMethodMaster: tx.paymentMethodMaster,
        hsnMaster: tx.hsnMaster,
        $transaction: (callback) => callback(tx),
      };
      const masterService = new HsnMasterService(scoped);
      const gstSettings = { createInvoice: (create) => create(tx, settings, `HSN-QA-${run}`) };
      const documents = new SalesDocumentsService(scoped, gstSettings, {}, masterService);
      const item = { productName: 'Verification item', hsnMasterId: master.id, hsnSac: 'untrusted-code', hsnDescription: 'untrusted-description', unitPrice: 1000, quantity: 1, discountValue: 0, discountType: 'OVERALL', igstRate: 99, sgstRate: 99, cgstRate: 99 };
      const payload = { requestKey: `hsn-verify-${run}`, type: 'INVOICE', customerId: customer.id, issueDate: '2026-10-21', gstMode: 'IGST', paymentStatus: 'UNPAID', items: [item] };
      const created = await documents.createDocument(payload, { userName: 'HSN verification' });
      assert.equal(created.grandTotal, 1180);
      assert.equal(created.items[0].hsnSac, master.code);
      assert.equal(created.items[0].hsnDescription, master.description);
      const stored = await tx.salesDocumentItem.findFirst({ where: { salesDocumentId: created.id } });
      assert.equal(stored.hsnMasterId, master.id);
      assert.equal(stored.hsnDescription, master.description);
      assert.equal(Number(stored.igstRate), 18);

      await tx.hsnMaster.update({ where: { id: master.id }, data: { description: 'Changed master description', igstRate: 12, sgstRate: 6, cgstRate: 6, isActive: false } });
      const savedItem = { ...item, id: created.items[0].id, hsnSac: master.code, quantity: 2 };
      const edited = await documents.updateDocument(created.id, { ...payload, version: created.version, items: [savedItem] }, {});
      assert.equal(edited.grandTotal, 2360, 'Issued invoice keeps its original 18% snapshot');
      assert.equal(edited.items[0].hsnDescription, master.description);
      await tx.hsnMaster.update({ where: { id: master.id }, data: { isActive: true } });
      const switched = await documents.updateDocument(created.id, { ...payload, version: edited.version, gstMode: 'SGST_CGST', items: [{ ...savedItem, id: edited.items[0].id }] }, {});
      assert.equal(switched.igstTotal, 0);
      assert.equal(switched.sgstTotal, 120);
      assert.equal(switched.cgstTotal, 120);
      assert.equal(switched.grandTotal, 2240);
      assert.equal(switched.items[0].hsnDescription, 'Changed master description');
      const replay = await documents.createDocument(payload, {});
      assert.equal(replay.id, created.id, 'Existing request keys do not duplicate invoices');
      throw rollback;
    }, { maxWait: 10000, timeout: 60000 });
  } catch (error) {
    if (error !== rollback) throw error;
    console.log('PASS: real invoice persistence, authoritative HSN rates, saved snapshots after master edits/deactivation, GST mode changes and request replay. All test writes rolled back.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
