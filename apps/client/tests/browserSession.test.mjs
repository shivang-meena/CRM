import assert from 'node:assert/strict';
import { beforeEach, afterEach, test } from 'node:test';
import {
  TOKEN_KEY, ROLE_KEY, PERMISSIONS_KEY, createBrowserSession, readBrowserSession,
  writeBrowserSession, clearBrowserSession, subscribeBrowserSession,
} from '../src/utils/browserSession.ts';

const originalGlobals = new Map();
function replaceGlobal(name, value) {
  if (!originalGlobals.has(name)) originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { configurable: true, value });
}

function session(role) {
  return { token: `${role}-token`, userName: role, role, permissions: role === 'super_admin' ? null : { lead: true } };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  const entries = new Map();
  replaceGlobal('localStorage', {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  });
  const held = new Set();
  replaceGlobal('navigator', { locks: {
    async request(name, _options, callback) {
      if (held.has(name)) return callback(null);
      held.add(name);
      try { return await callback({ name }); } finally { held.delete(name); }
    },
  } });
  replaceGlobal('window', new EventTarget());
});

afterEach(() => {
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
  originalGlobals.clear();
});

for (const activeRole of ['super_admin', 'admin', 'staff']) {
  for (const requestedRole of ['super_admin', 'admin', 'staff']) {
    test(`${activeRole} session blocks another ${requestedRole} login before credentials are sent`, async () => {
      const active = session(activeRole);
      writeBrowserSession(active);
      let calls = 0;
      await assert.rejects(createBrowserSession(async () => { calls++; return session(requestedRole); }), /Sign out/);
      assert.equal(calls, 0);
      assert.deepEqual(readBrowserSession(), active);
    });
  }
}

test('simultaneous tabs cannot overwrite the winning login', async () => {
  const response = deferred();
  const first = createBrowserSession(() => response.promise);
  let secondRequests = 0;
  await assert.rejects(createBrowserSession(async () => { secondRequests++; return session('staff'); }), /in progress/);
  response.resolve(session('admin'));
  await first;
  assert.equal(secondRequests, 0);
  assert.deepEqual(readBrowserSession(), session('admin'));
});

test('a failed login releases the lock for a different role', async () => {
  await assert.rejects(createBrowserSession(async () => { throw new Error('Wrong password'); }), /Wrong password/);
  assert.equal(readBrowserSession(), null);
  await createBrowserSession(async () => session('staff'));
  assert.deepEqual(readBrowserSession(), session('staff'));
});

test('logout permits another role and an old request cannot clear or restore the old session', async () => {
  await createBrowserSession(async () => session('admin'));
  assert.equal(clearBrowserSession('admin-token'), true);
  await createBrowserSession(async () => session('super_admin'));
  assert.equal(clearBrowserSession('admin-token'), false);
  assert.equal(writeBrowserSession(session('admin'), 'admin-token'), false);
  assert.deepEqual(readBrowserSession(), session('super_admin'));
});

test('a session arriving while credentials are being checked is preserved', async () => {
  const response = deferred();
  const pending = createBrowserSession(() => response.promise);
  writeBrowserSession(session('staff'));
  response.resolve(session('admin'));
  await assert.rejects(pending, /Sign out/);
  assert.deepEqual(readBrowserSession(), session('staff'));
});

test('fallback lock rejects simultaneous attempts without Web Locks', async () => {
  replaceGlobal('navigator', {});
  const response = deferred();
  const first = createBrowserSession(() => response.promise);
  await assert.rejects(createBrowserSession(async () => session('staff')), /in progress/);
  response.resolve(session('admin'));
  await first;
  assert.deepEqual(readBrowserSession(), session('admin'));
  assert.equal(localStorage.getItem('crm_login_lock'), null);
});

test('fallback recovers an abandoned lock and rejects an attempt that lost its lease', async () => {
  replaceGlobal('navigator', {});
  localStorage.setItem('crm_login_lock', JSON.stringify({ id: 'closed-tab', expiresAt: Date.now() - 1 }));
  await createBrowserSession(async () => session('staff'));
  clearBrowserSession();
  await assert.rejects(createBrowserSession(async () => {
    localStorage.setItem('crm_login_lock', JSON.stringify({ id: 'new-owner', expiresAt: Date.now() + 60000 }));
    return session('admin');
  }), /in progress/);
  assert.equal(readBrowserSession(), null);
  assert.equal(JSON.parse(localStorage.getItem('crm_login_lock')).id, 'new-owner');
});

test('other tabs follow login, permission updates, logout and focus; cleanup removes listeners', () => {
  const changes = [];
  const unsubscribe = subscribeBrowserSession(value => changes.push(value));
  const dispatchStorage = key => {
    const event = new Event('storage');
    Object.defineProperties(event, { key: { value: key }, storageArea: { value: localStorage } });
    window.dispatchEvent(event);
  };
  writeBrowserSession(session('staff'));
  dispatchStorage(TOKEN_KEY);
  assert.deepEqual(changes.at(-1), session('staff'));
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify({ lead: false }));
  dispatchStorage(PERMISSIONS_KEY);
  assert.deepEqual(changes.at(-1).permissions, { lead: false });
  clearBrowserSession();
  dispatchStorage(TOKEN_KEY);
  assert.equal(changes.at(-1), null);
  writeBrowserSession(session('super_admin'));
  window.dispatchEvent(new Event('focus'));
  assert.equal(changes.at(-1).role, 'super_admin');
  localStorage.clear();
  dispatchStorage(null);
  assert.equal(changes.at(-1), null);
  const count = changes.length;
  unsubscribe();
  dispatchStorage(ROLE_KEY);
  window.dispatchEvent(new Event('focus'));
  assert.equal(changes.length, count);
});
