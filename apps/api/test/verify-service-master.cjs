// Local API verification. Only records created by this run are removed.
// Run from apps/api: node --env-file=.env test/verify-service-master.cjs
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const base = `http://localhost:${process.env.PORT || 3001}`;
  const masterIds = [];
  const leadIds = [];
  let token;
  const request = async (path, method = 'GET', body, authenticated = true) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };
  try {
    const login = await request('/auth/login', 'POST', { id: process.env.LOGIN_ID, password: process.env.LOGIN_PASS }, false);
    assert.equal(login.status, 200, 'Admin login');
    token = login.body.accessToken;
    assert.equal((await request('/settings/services', 'GET', undefined, false)).status, 401);
    assert.equal((await request('/leads/services', 'GET', undefined, false)).status, 401);
    const name = `Service verification ${randomUUID()}`;
    const created = await request('/settings/services', 'POST', { name: `  ${name}  `, isActive: true });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    masterIds.push(created.body.id);
    const serviceId = created.body.id;
    assert.equal(created.body.name, name, 'Trimmed service name');
    assert.equal((await request('/settings/services', 'POST', { name: name.toUpperCase().replaceAll(' ', '   ') })).status, 409, 'Case and spacing duplicate validation');
    assert.equal((await request('/settings/services', 'POST', { name: ' ' })).status, 400, 'Blank name validation');
    assert.equal((await request('/settings/services', 'POST', { name: 'a'.repeat(151) })).status, 400, 'Name length validation');
    const options = await request('/leads/services');
    assert.equal(options.status, 200);
    assert(options.body.some((row) => row.id === serviceId));

    const customer = { name: `Temporary lead ${randomUUID()}`, phone: '0000000000', serviceId };
    const addedLead = await request('/leads', 'POST', customer);
    assert.equal(addedLead.status, 201, JSON.stringify(addedLead.body));
    leadIds.push(addedLead.body.id);
    let lead = addedLead.body;
    assert.equal(lead.service.name, name, 'Selected service returned on creation');
    assert.equal((await request(`/leads/${lead.id}`)).body.serviceId, serviceId, 'Selected service persisted');
    assert((await request(`/leads?search=${encodeURIComponent(customer.name)}`)).body.some((row) => row.id === lead.id && row.service.name === name));
    assert.equal((await request('/leads', 'POST', { ...customer, serviceId: randomUUID() })).status, 400, 'Unknown service rejected');

    const renamed = `${name} updated`;
    assert.equal((await request(`/settings/services/${serviceId}`, 'PATCH', { name: renamed, isActive: false })).status, 200);
    assert(!(await request('/leads/services')).body.some((row) => row.id === serviceId), 'Inactive service hidden');
    assert((await request('/settings/services')).body.some((row) => row.id === serviceId && !row.isActive), 'Inactive service remains manageable');
    assert.equal((await request('/leads', 'POST', customer)).status, 400, 'Inactive service rejected for new lead');
    lead = (await request(`/leads/${lead.id}`)).body;
    assert.equal(lead.service.name, renamed, 'Renamed inactive service retained on existing lead');
    const retained = await request(`/leads/${lead.id}`, 'PATCH', { version: lead.version, serviceId, comment: 'Retain existing inactive selection' });
    assert.equal(retained.status, 200, JSON.stringify(retained.body));
    assert.equal(retained.body.service.name, renamed);
    lead = retained.body;
    const cleared = await request(`/leads/${lead.id}`, 'PATCH', { version: lead.version, serviceId: null });
    assert.equal(cleared.status, 200, JSON.stringify(cleared.body));
    assert.equal(cleared.body.serviceId, null);
    assert.equal(cleared.body.service, null);
    assert.equal((await request(`/leads/${lead.id}`, 'PATCH', { version: cleared.body.version, serviceId })).status, 400, 'Inactive service cannot be reselected');

    const withoutService = await request('/leads', 'POST', { name: `Temporary lead ${randomUUID()}`, phone: '0000000000' });
    assert.equal(withoutService.status, 201, 'Existing lead creation still works without service');
    leadIds.push(withoutService.body.id);
    assert.equal(withoutService.body.serviceId, null);
    console.log('PASS: service create/list/edit, duplicate/input/auth validation, lead dropdown, persisted selection, rename, inactive retention, clearing and optional service.');
  } finally {
    if (leadIds.length) {
      await prisma.leadHistory.deleteMany({ where: { leadId: { in: leadIds } } });
      await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
    }
    if (masterIds.length) await prisma.serviceMaster.deleteMany({ where: { id: { in: masterIds } } });
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
