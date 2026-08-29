// Phase 5 smoke test: exercises monitoring flows end-to-end
const BASE = process.env.BASE || 'http://localhost:5002/api';
const { setupSmokeAuth, closeSmokeAuth } = require('./smokeAuth');

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, opts);
    const ct = res.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await res.json() : await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) { return { ok: false, error: String(err) }; }
}

async function health() {
  const ROOT = BASE.replace(/\/api$/, '');
  try {
    const res = await fetch(`${ROOT}/health`);
    const ct = res.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await res.json() : await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) { return { ok: false, error: String(err) }; }
}

(async () => {
  const report = { steps: {} };
  let smoke = null;
  let exitCode = 0;

  try {
    smoke = await setupSmokeAuth({ inspector: true, project: true });
    const creds = smoke.accounts.inspector;
    const TEST_PROJECT_ID = smoke.project?.projectId || process.env.TEST_PROJECT_ID || '';

    const h = await health();
    report.steps.health = h;
    if (!h.ok) {
      console.error('Backend not healthy', h);
      console.log(JSON.stringify(report, null, 2));
      exitCode = 2;
      return;
    }

    const login = await request('/inspection/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) });
    report.steps.login = login;
    if (!login.ok || !login.body?.token) {
      console.error('Login failed', login);
      console.log(JSON.stringify(report, null, 2));
      exitCode = 3;
      return;
    }

    const token = login.body.token;
    const headers = { Authorization: `Bearer ${token}` };

    report.steps.summary = await request('/monitoring/summary', { headers });
    report.steps.createUpdate = await request('/monitoring/updates', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: TEST_PROJECT_ID, percentComplete: 10, notes: 'Smoke test update' }) });
    report.steps.createVisit = await request('/monitoring/visits', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: TEST_PROJECT_ID, visitDate: new Date().toISOString(), notes: 'Smoke test visit' }) });
    report.steps.flagDelay = await request(`/monitoring/projects/${TEST_PROJECT_ID}/delay`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Smoke test delay' }) });
    report.steps.quality = await request(`/monitoring/projects/${TEST_PROJECT_ID}/quality`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ score: 80, notes: 'Smoke test quality' }) });
    report.steps.listUpdates = await request('/monitoring/updates', { headers });
    report.steps.listVisits = await request('/monitoring/visits', { headers });

    console.log('PHASE 5 SMOKE REPORT:\n', JSON.stringify(report, null, 2));
    const pass = report.steps.createUpdate.ok && report.steps.createVisit.ok && report.steps.flagDelay.ok && report.steps.quality.ok;
    exitCode = pass ? 0 : 4;
  } finally {
    if (smoke) await smoke.cleanup();
    await closeSmokeAuth();
    process.exit(exitCode);
  }
})();
