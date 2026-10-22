// Local API smoke test. Uses configured admin credentials without logging them.
// Only the temporary HSN row created by this run is removed in cleanup.
const assert = require('node:assert/strict');
const { randomInt } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const base = `http://localhost:${process.env.PORT || 3001}`;
  let temporaryId;
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
    assert.equal(login.status, 200, 'Local admin sign-in');
    token = login.body.accessToken;
    assert.equal((await request('/settings/hsn-master', 'GET', undefined, false)).status, 401);
    const data = { code: `99${randomInt(100000, 999999)}`, description: 'Temporary HSN verification entry', igstRate: 18, sgstRate: 9, cgstRate: 9, isActive: true };
    const created = await request('/settings/hsn-master', 'POST', data);
    assert.equal(created.status, 201);
    temporaryId = created.body.id;
    assert.equal(typeof created.body.igstRate, 'number');
    assert.equal((await request('/settings/hsn-master', 'POST', data)).status, 409, 'Duplicate code validation');
    assert.equal((await request('/settings/hsn-master', 'POST', { ...data, code: 'ABC', description: ' ' })).status, 400);
    assert.equal((await request('/settings/hsn-master', 'POST', { ...data, igstRate: 12 })).status, 400);
    const active = await request('/sales-documents/hsn-master');
    assert.equal(active.status, 200);
    assert(active.body.some((row) => row.id === temporaryId), 'Invoice endpoint exposes active master');
    const edited = await request(`/settings/hsn-master/${temporaryId}`, 'PATCH', { ...data, description: 'Updated temporary description', igstRate: 0, sgstRate: 0, cgstRate: 0, isActive: false });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.igstRate, 0, 'Zero GST rate retained');
    const hidden = await request('/sales-documents/hsn-master');
    assert(!hidden.body.some((row) => row.id === temporaryId), 'Inactive masters hidden from invoice selector');
    const adminList = await request('/settings/hsn-master');
    assert(adminList.body.some((row) => row.id === temporaryId && row.isActive === false), 'Inactive masters remain editable');
    console.log('PASS: authenticated master create/list/edit, duplicate and input validation, numeric rates, zero GST and inactive invoice filtering.');
  } finally {
    if (temporaryId) await prisma.hsnMaster.delete({ where: { id: temporaryId } });
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
