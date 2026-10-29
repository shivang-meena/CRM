// Comprehensive E2E Multivendor & Security Test Suite
const assert = require('node:assert/strict');
const { PrismaClient } = require('../node_modules/@prisma/client');

const API_BASE = 'http://localhost:3001';

async function req(path, method = 'GET', body = undefined, token = undefined) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE CRM E2E & SECURITY TESTS');
  console.log('====================================================\n');

  const prisma = new PrismaClient();
  const testRunId = Date.now().toString().slice(-6);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: [],
  };

  async function testAsync(name, fn) {
    results.total++;
    try {
      await fn();
      results.passed++;
      results.details.push({ name, status: 'PASS' });
      console.log(`✅ [PASS] ${name}`);
    } catch (err) {
      results.failed++;
      results.details.push({ name, status: 'FAIL', error: err.message });
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  let superToken = null;
  const createdAdminIds = [];
  const createdAdminTokens = {};

  try {
    // ----------------------------------------------------
    // SECTION 1: SUPER ADMIN AUTH & PERMISSIONS
    // ----------------------------------------------------
    console.log('\n--- SECTION 1: SUPER ADMIN AUTHENTICATION ---');

    await testAsync('Super Admin login fails with invalid credentials', async () => {
      const res = await req('/super-admin/login', 'POST', { id: 'wrong_id', password: 'wrong_password' });
      assert.equal(res.status, 401, 'Expected 401 for bad credentials');
    });

    await testAsync('Super Admin login succeeds with configured credentials', async () => {
      const res = await req('/super-admin/login', 'POST', { id: 'Shivang', password: 'crm@123' });
      assert.equal(res.status, 200, 'Expected 200 for valid Super Admin login');
      assert(res.data.accessToken, 'Access token must be returned');
      superToken = res.data.accessToken;
    });

    await testAsync('GET /super-admin/me returns role super_admin', async () => {
      const res = await req('/super-admin/me', 'GET', undefined, superToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.role, 'super_admin');
    });

    await testAsync('Unauthenticated access to /super-admin/admins is blocked', async () => {
      const res = await req('/super-admin/admins', 'GET', undefined, undefined);
      assert.equal(res.status, 401);
    });

    // ----------------------------------------------------
    // SECTION 2: CREATE 5 ADMINS (MULTI-TENANCY SETUP)
    // ----------------------------------------------------
    console.log('\n--- SECTION 2: CREATING 5 ADMINS WITH DIFFERENT PERMISSIONS ---');

    const adminConfigs = [
      {
        loginId: `adm1_${testRunId}`,
        name: 'Admin One (Full Features)',
        businessName: 'Business One Corp',
        features: { lead: true, reminder: true, meeting: true, note: true, calendar: true, customer: true, invoice: true, staff: true, leave: true },
      },
      {
        loginId: `adm2_${testRunId}`,
        name: 'Admin Two (Sales + Staff)',
        businessName: 'Business Two Sales Ltd',
        features: { lead: true, customer: true, invoice: true, staff: true, reminder: false, meeting: false, note: false, calendar: false, leave: false },
      },
      {
        loginId: `adm3_${testRunId}`,
        name: 'Admin Three (HR Only)',
        businessName: 'Business Three HR Inc',
        features: { staff: true, leave: true, lead: false, customer: false, invoice: false, reminder: false, meeting: false, note: false, calendar: false },
      },
      {
        loginId: `adm4_${testRunId}`,
        name: 'Admin Four (Operations CRM)',
        businessName: 'Business Four Ops LLC',
        features: { lead: true, reminder: true, meeting: true, note: true, calendar: true, staff: true, customer: false, invoice: false, leave: false },
      },
      {
        loginId: `adm5_${testRunId}`,
        name: 'Admin Five (To Be Suspended)',
        businessName: 'Business Five Test Co',
        features: { lead: true, reminder: true, meeting: true, note: true, calendar: true, customer: true, invoice: true, staff: true, leave: true },
      },
    ];

    for (let i = 0; i < adminConfigs.length; i++) {
      const cfg = adminConfigs[i];
      await testAsync(`Super Admin creates Admin ${i + 1}: ${cfg.loginId}`, async () => {
        const res = await req('/super-admin/admins', 'POST', {
          loginId: cfg.loginId,
          password: 'Password@1234',
          name: cfg.name,
          businessName: cfg.businessName,
          email: `${cfg.loginId}@testcorp.local`,
          phone: `900000000${i + 1}`,
          features: cfg.features,
        }, superToken);
        assert.equal(res.status, 201, `Failed to create Admin: ${JSON.stringify(res.data)}`);
        assert(res.data.id, 'Admin ID must be returned');
        createdAdminIds.push(res.data.id);
        cfg.id = res.data.id;
      });
    }

    await testAsync('Duplicate Login ID creation is rejected with 409 Conflict', async () => {
      const res = await req('/super-admin/admins', 'POST', {
        loginId: adminConfigs[0].loginId,
        password: 'Password@1234',
        name: 'Duplicate Admin',
      }, superToken);
      assert.equal(res.status, 409, 'Expected 409 for duplicate login ID');
    });

    // ----------------------------------------------------
    // SECTION 3: ADMIN LOGIN & PERMISSION ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n--- SECTION 3: ADMIN LOGIN & PERMISSION PROFILES ---');

    for (let i = 0; i < adminConfigs.length; i++) {
      const cfg = adminConfigs[i];
      await testAsync(`Admin ${i + 1} (${cfg.loginId}) login & profile verification`, async () => {
        const res = await req('/auth/login', 'POST', { id: cfg.loginId, password: 'Password@1234' });
        assert.equal(res.status, 200, `Admin login failed: ${JSON.stringify(res.data)}`);
        assert(res.data.accessToken, 'Token must be provided');
        createdAdminTokens[cfg.loginId] = res.data.accessToken;

        // Verify /auth/me
        const me = await req('/auth/me', 'GET', undefined, res.data.accessToken);
        assert.equal(me.status, 200);
        assert.equal(me.data.role, 'admin');
        assert.equal(me.data.id, cfg.id);
        assert.equal(me.data.businessName, cfg.businessName);

        // Check features match requested permissions
        for (const [feat, val] of Object.entries(cfg.features)) {
          assert.equal(
            me.data.permissions[feat],
            val,
            `Feature ${feat} mismatch for Admin ${i + 1}: expected ${val}, got ${me.data.permissions[feat]}`,
          );
        }
      });
    }

    // ----------------------------------------------------
    // SECTION 4: FEATURE RESTRICTIONS (FORBIDDEN MODULE ACCESS)
    // ----------------------------------------------------
    console.log('\n--- SECTION 4: FEATURE ENFORCEMENT & ACCESS CONTROL ---');

    await testAsync('Admin 2 (No Leave) cannot access Leave module (403 Forbidden)', async () => {
      const token = createdAdminTokens[adminConfigs[1].loginId];
      const res = await req('/leave', 'GET', undefined, token);
      assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
    });

    await testAsync('Admin 3 (HR only) cannot access Sales Documents / Invoice (403 Forbidden)', async () => {
      const token = createdAdminTokens[adminConfigs[2].loginId];
      const res = await req('/sales-documents', 'GET', undefined, token);
      assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
    });

    await testAsync('Admin 3 (HR only) cannot access Leads (403 Forbidden)', async () => {
      const token = createdAdminTokens[adminConfigs[2].loginId];
      const res = await req('/leads', 'GET', undefined, token);
      assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
    });

    await testAsync('Admin 4 (Ops Only) cannot access Invoices (403 Forbidden)', async () => {
      const token = createdAdminTokens[adminConfigs[3].loginId];
      const res = await req('/sales-documents', 'GET', undefined, token);
      assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
    });

    // ----------------------------------------------------
    // SECTION 5: ADMIN SUSPENSION & BLOCKING ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n--- SECTION 5: ADMIN SUSPENSION & BLOCKING ---');

    const admin5Token = createdAdminTokens[adminConfigs[4].loginId];
    const admin5Id = adminConfigs[4].id;

    await testAsync('Super Admin blocks Admin 5', async () => {
      const res = await req(`/super-admin/admins/${admin5Id}/status`, 'PATCH', { status: 'BLOCKED' }, superToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.status, 'BLOCKED');
    });

    await testAsync('Blocked Admin 5 login attempt is rejected', async () => {
      const res = await req('/auth/login', 'POST', { id: adminConfigs[4].loginId, password: 'Password@1234' });
      assert.equal(res.status, 401, 'Blocked admin must not be allowed to log in');
    });

    await testAsync('Active session token of Blocked Admin 5 is immediately rejected on next request', async () => {
      const res = await req('/auth/me', 'GET', undefined, admin5Token);
      assert.equal(res.status, 401, 'Old JWT token of blocked admin must be rejected immediately');
    });

    await testAsync('Super Admin unblocks Admin 5', async () => {
      const res = await req(`/super-admin/admins/${admin5Id}/status`, 'PATCH', { status: 'ACTIVE' }, superToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.status, 'ACTIVE');
    });

    await testAsync('Unblocked Admin 5 can successfully log in again', async () => {
      const res = await req('/auth/login', 'POST', { id: adminConfigs[4].loginId, password: 'Password@1234' });
      assert.equal(res.status, 200);
      createdAdminTokens[adminConfigs[4].loginId] = res.data.accessToken;
    });

    // ----------------------------------------------------
    // SECTION 6: MULTI-TENANT DATA ISOLATION (ZERO DATA LEAKAGE)
    // ----------------------------------------------------
    console.log('\n--- SECTION 6: MULTI-TENANT DATA ISOLATION & IDOR TESTING ---');

    const token1 = createdAdminTokens[adminConfigs[0].loginId]; // Admin 1
    const token2 = createdAdminTokens[adminConfigs[1].loginId]; // Admin 2

    let lead1Id = null;
    let lead2Id = null;
    let customer1Id = null;
    let customer2Id = null;
    let service1Id = null;
    let service2Id = null;

    // Admin 1 creates Lead, converts to Customer, and creates Service
    await testAsync('Admin 1 creates Lead and Service', async () => {
      const leadRes = await req('/leads', 'POST', {
        name: `Admin1 Confidential Lead ${testRunId}`,
        phone: '9876543210',
        companyName: 'Admin1 Client Inc',
      }, token1);
      assert.equal(leadRes.status, 201);
      lead1Id = leadRes.data.id;

      // Convert lead to customer
      const custRes = await req(`/customers/from-lead/${lead1Id}`, 'POST', { version: 1 }, token1);
      assert.equal(custRes.status, 201);
      customer1Id = custRes.data.id;

      const servRes = await req('/settings/services', 'POST', {
        name: `Admin1 Custom Service ${testRunId}`,
        isActive: true,
      }, token1);
      assert.equal(servRes.status, 201);
      service1Id = servRes.data.id;
    });

    // Admin 2 creates Lead, converts to Customer, and creates Service
    await testAsync('Admin 2 creates Lead and Service', async () => {
      const leadRes = await req('/leads', 'POST', {
        name: `Admin2 Secret Lead ${testRunId}`,
        phone: '9123456780',
        companyName: 'Admin2 Client LLC',
      }, token2);
      assert.equal(leadRes.status, 201);
      lead2Id = leadRes.data.id;

      // Convert lead to customer
      const custRes = await req(`/customers/from-lead/${lead2Id}`, 'POST', { version: 1 }, token2);
      assert.equal(custRes.status, 201);
      customer2Id = custRes.data.id;

      const servRes = await req('/settings/services', 'POST', {
        name: `Admin2 Dedicated Service ${testRunId}`,
        isActive: true,
      }, token2);
      assert.equal(servRes.status, 201);
      service2Id = servRes.data.id;
    });

    // Data Leakage Checks in List Endpoints
    await testAsync('Admin 1 list queries NEVER leak Admin 2 data', async () => {
      const leads = await req('/leads', 'GET', undefined, token1);
      assert.equal(leads.status, 200);
      assert(leads.data.some((l) => l.id === lead1Id), 'Admin 1 must see own lead');
      assert(!leads.data.some((l) => l.id === lead2Id), 'SECURITY BREACH: Admin 1 saw Admin 2 lead!');

      const custs = await req('/customers', 'GET', undefined, token1);
      assert.equal(custs.status, 200);
      const custItems = custs.data.items || [];
      assert(custItems.some((c) => c.id === customer1Id), 'Admin 1 must see own customer');
      assert(!custItems.some((c) => c.id === customer2Id), 'SECURITY BREACH: Admin 1 saw Admin 2 customer!');

      const servs = await req('/settings/services', 'GET', undefined, token1);
      assert.equal(servs.status, 200);
      assert(servs.data.some((s) => s.id === service1Id), 'Admin 1 must see own service');
      assert(!servs.data.some((s) => s.id === service2Id), 'SECURITY BREACH: Admin 1 saw Admin 2 service!');
    });

    await testAsync('Admin 2 list queries NEVER leak Admin 1 data', async () => {
      const leads = await req('/leads', 'GET', undefined, token2);
      assert.equal(leads.status, 200);
      assert(leads.data.some((l) => l.id === lead2Id), 'Admin 2 must see own lead');
      assert(!leads.data.some((l) => l.id === lead1Id), 'SECURITY BREACH: Admin 2 saw Admin 1 lead!');

      const custs = await req('/customers', 'GET', undefined, token2);
      assert.equal(custs.status, 200);
      const custItems = custs.data.items || [];
      assert(custItems.some((c) => c.id === customer2Id), 'Admin 2 must see own customer');
      assert(!custItems.some((c) => c.id === customer1Id), 'SECURITY BREACH: Admin 2 saw Admin 1 customer!');
    });

    // Direct IDOR Tests
    await testAsync('IDOR Protection: Admin 1 cannot read Admin 2 lead by direct ID (404)', async () => {
      const res = await req(`/leads/${lead2Id}`, 'GET', undefined, token1);
      assert.equal(res.status, 404, 'Direct object reference to other tenant must return 404');
    });

    await testAsync('IDOR Protection: Admin 1 cannot update Admin 2 lead (404)', async () => {
      const res = await req(`/leads/${lead2Id}`, 'PATCH', { name: 'Hacked Name', version: 1 }, token1);
      assert.equal(res.status, 404, 'Update on other tenant record must fail with 404');
    });

    await testAsync('IDOR Protection: Admin 1 cannot delete Admin 2 lead (404)', async () => {
      const res = await req(`/leads/${lead2Id}`, 'DELETE', { version: 1 }, token1);
      assert.equal(res.status, 404, 'Delete on other tenant record must fail with 404');
    });

    await testAsync('IDOR Protection: Admin 2 cannot read Admin 1 customer by direct ID (404)', async () => {
      const res = await req(`/customers/${customer1Id}`, 'GET', undefined, token2);
      assert.equal(res.status, 404, 'Customer IDOR must return 404');
    });

    // ----------------------------------------------------
    // SECTION 7: STAFF CREATION, PERMISSIONS & BLOCKING
    // ----------------------------------------------------
    console.log('\n--- SECTION 7: STAFF CREATION & GRANULAR PERMISSIONS ---');

    let staff1A = null;
    let staff1B = null;
    let staff2A = null;
    let staff2B = null;
    let staff1AToken = null;
    let staff1BToken = null;
    let staff2AToken = null;

    // Admin 1 creates Staff 1A (Leads only)
    await testAsync('Admin 1 creates Staff 1A (lead: true, invoice: false, staff: false)', async () => {
      const res = await req('/staff', 'POST', {
        employeeCode: `EMP1A_${testRunId}`,
        firstName: 'Staff',
        lastName: 'OneA',
        email: `staff1a_${testRunId}@admin1.com`,
        joiningDate: '2026-01-01',
        password: 'Password@1234',
        canLoginApp: true,
        permissions: {
          lead: true,
          customer: true,
          invoice: false,
          staff: false,
          leave: false,
          reminder: false,
          meeting: false,
          note: false,
          calendar: false,
        },
      }, token1);
      assert.equal(res.status, 201, `Failed to create staff: ${JSON.stringify(res.data)}`);
      staff1A = res.data;
    });

    // Admin 1 creates Staff 1B (Invoices only)
    await testAsync('Admin 1 creates Staff 1B (lead: false, invoice: true, staff: false)', async () => {
      const res = await req('/staff', 'POST', {
        employeeCode: `EMP1B_${testRunId}`,
        firstName: 'Staff',
        lastName: 'OneB',
        email: `staff1b_${testRunId}@admin1.com`,
        joiningDate: '2026-01-01',
        password: 'Password@1234',
        canLoginApp: true,
        permissions: {
          lead: false,
          customer: false,
          invoice: true,
          staff: false,
          leave: false,
        },
      }, token1);
      assert.equal(res.status, 201);
      staff1B = res.data;
    });

    // Admin 2 creates Staff 2A (Lead + Invoice)
    await testAsync('Admin 2 creates Staff 2A (lead: true, invoice: true)', async () => {
      const res = await req('/staff', 'POST', {
        employeeCode: `EMP2A_${testRunId}`,
        firstName: 'Staff',
        lastName: 'TwoA',
        email: `staff2a_${testRunId}@admin2.com`,
        joiningDate: '2026-01-01',
        password: 'Password@1234',
        canLoginApp: true,
        permissions: {
          lead: true,
          customer: true,
          invoice: true,
          staff: false,
        },
      }, token2);
      assert.equal(res.status, 201, `Failed to create staff 2A: ${JSON.stringify(res.data)}`);
      staff2A = res.data;
    });

    // Admin 2 creates Staff 2B (Customer only)
    await testAsync('Admin 2 creates Staff 2B (customer: true, lead: false, invoice: false)', async () => {
      const res = await req('/staff', 'POST', {
        employeeCode: `EMP2B_${testRunId}`,
        firstName: 'Staff',
        lastName: 'TwoB',
        email: `staff2b_${testRunId}@admin2.com`,
        joiningDate: '2026-01-01',
        password: 'Password@1234',
        canLoginApp: true,
        permissions: {
          lead: false,
          customer: true,
          invoice: false,
          staff: false,
        },
      }, token2);
      assert.equal(res.status, 201);
      staff2B = res.data;
    });

    // Staff Login Tests
    await testAsync('Staff 1A logs in successfully', async () => {
      const res = await req('/auth/staff/login', 'POST', {
        email: `staff1a_${testRunId}@admin1.com`,
        password: 'Password@1234',
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.user.role, 'staff');
      assert.equal(res.data.user.permissions.lead, true);
      assert.equal(res.data.user.permissions.invoice, false);
      staff1AToken = res.data.accessToken;
    });

    await testAsync('Staff 1B logs in successfully', async () => {
      const res = await req('/auth/staff/login', 'POST', {
        email: `staff1b_${testRunId}@admin1.com`,
        password: 'Password@1234',
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.user.permissions.lead, false);
      assert.equal(res.data.user.permissions.invoice, true);
      staff1BToken = res.data.accessToken;
    });

    await testAsync('Staff 2A logs in successfully', async () => {
      const res = await req('/auth/staff/login', 'POST', {
        email: `staff2a_${testRunId}@admin2.com`,
        password: 'Password@1234',
      });
      assert.equal(res.status, 200);
      staff2AToken = res.data.accessToken;
    });

    // Granular Staff Permission Enforcement
    await testAsync('Staff 1A can read Leads (permLead: true)', async () => {
      const res = await req('/leads', 'GET', undefined, staff1AToken);
      assert.equal(res.status, 200);
      assert(res.data.some((l) => l.id === lead1Id), 'Staff 1A should see Admin 1 lead');
    });

    await testAsync('Staff 1A is blocked from Invoices (permInvoice: false -> 403 Forbidden)', async () => {
      const res = await req('/sales-documents', 'GET', undefined, staff1AToken);
      assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
    });

    await testAsync('Staff 1A is blocked from Staff Management (permStaff: false -> 403 Forbidden)', async () => {
      const res = await req('/staff', 'GET', undefined, staff1AToken);
      assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
    });

    await testAsync('Staff 1B can read Invoices (permInvoice: true)', async () => {
      const res = await req('/sales-documents', 'GET', undefined, staff1BToken);
      assert.equal(res.status, 200);
    });

    await testAsync('Staff 1B is blocked from Leads (permLead: false -> 403 Forbidden)', async () => {
      const res = await req('/leads', 'GET', undefined, staff1BToken);
      assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
    });

    // ----------------------------------------------------
    // SECTION 8: STAFF REVOCATION & DYNAMIC BLOCKING
    // ----------------------------------------------------
    console.log('\n--- SECTION 8: STAFF REVOCATION & DYNAMIC BLOCKING ---');

    await testAsync('Admin 1 revokes Staff 1A app login access (canLoginApp: false)', async () => {
      const current = await req(`/staff/${staff1A.id}`, 'GET', undefined, token1);
      const res = await req(`/staff/${staff1A.id}`, 'PATCH', {
        firstName: current.data.firstName,
        lastName: current.data.lastName,
        email: current.data.email,
        joiningDate: current.data.joiningDate,
        canLoginApp: false,
        version: current.data.version,
      }, token1);
      assert.equal(res.status, 200);
    });

    await testAsync('Staff 1A login is immediately rejected after access revocation', async () => {
      const res = await req('/auth/staff/login', 'POST', {
        email: `staff1a_${testRunId}@admin1.com`,
        password: 'Password@1234',
      });
      assert.equal(res.status, 401, 'Revoked staff must not be able to log in');
    });

    await testAsync('Staff 1A active token is immediately rejected on next API call (Session Termination)', async () => {
      const res = await req('/auth/me', 'GET', undefined, staff1AToken);
      assert.equal(res.status, 401, 'Revoked staff active token must be rejected immediately');
    });

    await testAsync('Admin 1 restores Staff 1A login access', async () => {
      const current = await req(`/staff/${staff1A.id}`, 'GET', undefined, token1);
      const res = await req(`/staff/${staff1A.id}`, 'PATCH', {
        firstName: current.data.firstName,
        lastName: current.data.lastName,
        email: current.data.email,
        joiningDate: current.data.joiningDate,
        canLoginApp: true,
        version: current.data.version,
      }, token1);
      assert.equal(res.status, 200);
    });

    // ----------------------------------------------------
    // SECTION 9: CROSS-TENANT STAFF ISOLATION
    // ----------------------------------------------------
    console.log('\n--- SECTION 9: CROSS-TENANT STAFF ISOLATION ---');

    // Fresh login for Staff 1A
    const login1A = await req('/auth/staff/login', 'POST', {
      email: `staff1a_${testRunId}@admin1.com`,
      password: 'Password@1234',
    });
    const freshStaff1AToken = login1A.data.accessToken;

    await testAsync('Staff 1A CANNOT access Admin 2 lead by direct ID (404)', async () => {
      const res = await req(`/leads/${lead2Id}`, 'GET', undefined, freshStaff1AToken);
      assert.equal(res.status, 404, 'Staff 1A must receive 404 when requesting Admin 2 lead');
    });

    await testAsync('Staff 2A CANNOT access Admin 1 lead by direct ID (404)', async () => {
      const res = await req(`/leads/${lead1Id}`, 'GET', undefined, staff2AToken);
      assert.equal(res.status, 404, 'Staff 2A must receive 404 when requesting Admin 1 lead');
    });

    await testAsync('Staff 1A NEVER sees Admin 2 leads in list queries', async () => {
      const res = await req('/leads', 'GET', undefined, freshStaff1AToken);
      assert.equal(res.status, 200);
      assert(!res.data.some((l) => l.id === lead2Id), 'SECURITY BREACH: Staff 1A saw Admin 2 lead!');
    });

    await testAsync('Staff 2A NEVER sees Admin 1 leads in list queries', async () => {
      const res = await req('/leads', 'GET', undefined, staff2AToken);
      assert.equal(res.status, 200);
      assert(!res.data.some((l) => l.id === lead1Id), 'SECURITY BREACH: Staff 2A saw Admin 1 lead!');
    });

    // ----------------------------------------------------
    // SECTION 10: CASCADING SUPER ADMIN FEATURE REVOCATION
    // ----------------------------------------------------
    console.log('\n--- SECTION 10: CASCADING SUPER ADMIN FEATURE REVOCATION ---');

    await testAsync('Staff 2A initially has invoice access', async () => {
      const res = await req('/sales-documents', 'GET', undefined, staff2AToken);
      assert.equal(res.status, 200, 'Staff 2A should initially access invoices');
    });

    await testAsync('Super Admin disables invoice feature for Admin 2', async () => {
      const res = await req(`/super-admin/admins/${adminConfigs[1].id}/features`, 'PATCH', {
        features: { invoice: false },
      }, superToken);
      assert.equal(res.status, 200);
    });

    await testAsync('Staff 2A invoice access is IMMEDIATELY blocked without token refresh', async () => {
      const res = await req('/sales-documents', 'GET', undefined, staff2AToken);
      assert.equal(res.status, 403, 'Staff 2A must be forbidden from invoices once Admin 2 feature is disabled');
    });

  } finally {
    console.log('\n--- CLEANING UP TEST DATA ---');
    try {
      for (const id of createdAdminIds) {
        await prisma.admin.delete({ where: { id } }).catch(() => {});
      }
      console.log(`Cleaned up ${createdAdminIds.length} test admin tenants.`);
    } catch (e) {
      console.error('Cleanup warning:', e.message);
    }
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(`📊 FINAL TEST REPORT SUMMARY:`);
  console.log(`   Total Tests Run: ${results.total}`);
  console.log(`   Passed:          ${results.passed} (${Math.round((results.passed / results.total) * 100)}%)`);
  console.log(`   Failed:          ${results.failed}`);
  console.log('====================================================\n');

  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.details.filter((d) => d.status === 'FAIL').forEach((d) => {
      console.log(`  ❌ ${d.name}: ${d.error}`);
    });
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exitCode = 1;
});
