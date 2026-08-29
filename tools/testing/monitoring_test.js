const BASE = process.env.BASE || 'http://localhost:5002/api';
const { setupSmokeAuth, closeSmokeAuth } = require('./smokeAuth');

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, opts);
    const ct = res.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await res.json() : await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

(async () => {
  let smoke = null;
  let exitCode = 0;
  try {
    smoke = await setupSmokeAuth({ inspector: true });
    const login = await request('/inspection/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(smoke.accounts.inspector) });
    console.log('login', login);
    if (!login.ok) {
      exitCode = 2;
      return;
    }
    const token = login.body.token;
    const headers = { Authorization: `Bearer ${token}` };
    const summary = await request('/monitoring/summary', { headers });
    console.log('monitoring/summary', summary);
    const updates = await request('/monitoring/updates', { headers });
    console.log('monitoring/updates', updates);
  } finally {
    if (smoke) await smoke.cleanup();
    await closeSmokeAuth();
    process.exit(exitCode);
  }
})();
