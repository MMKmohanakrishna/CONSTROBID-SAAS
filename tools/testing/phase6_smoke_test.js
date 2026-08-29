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

async function login(creds) {
  let r = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) });
  if (r.ok && r.body?.token) return r.body.token;
  r = await request('/inspection/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) });
  if (r.ok && r.body?.token) return r.body.token;
  return null;
}

(async () => {
  const report = { steps: {} };
  let smoke = null;
  let exitCode = 0;

  try {
    smoke = await setupSmokeAuth({ inspector: true, contractor: true, client: true, project: true });
    const TEST_PROJECT_ID = smoke.project?.projectId || process.env.TEST_PROJECT_ID || '';
    const contractor = smoke.accounts.contractor;
    const inspector = smoke.accounts.inspector;
    const client = smoke.accounts.client;

    const ctoken = await login(contractor);
    report.steps.contractorLogin = !!ctoken;
    if (!ctoken) {
      console.error('Contractor login failed');
      console.log(JSON.stringify(report, null, 2));
      exitCode = 2;
      return;
    }

    const creq = await request('/completion/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctoken}` }, body: JSON.stringify({ projectId: TEST_PROJECT_ID, notes: 'Requesting completion' }) });
    report.steps.createRequest = creq;
    if (!creq.ok) {
      console.error('Create request failed', creq);
      console.log(JSON.stringify(report, null, 2));
      exitCode = 3;
      return;
    }

    const itoken = await login(inspector);
    report.steps.inspectorLogin = !!itoken;
    if (!itoken) {
      console.error('Inspector login failed');
      console.log(JSON.stringify(report, null, 2));
      exitCode = 4;
      return;
    }

    const pl = await request('/completion/punchlists', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${itoken}` }, body: JSON.stringify({ projectId: TEST_PROJECT_ID, items: [{ description: 'Fix paint' }] }) });
    report.steps.createPunchlist = pl;
    if (!pl.ok) {
      console.error('Create punchlist failed', pl);
      console.log(JSON.stringify(report, null, 2));
      exitCode = 5;
      return;
    }

    const punchId = pl.body._id;
    const itemId = pl.body.items && pl.body.items[0] && pl.body.items[0]._id;
    report.steps.updateItem = await request(`/completion/punchlists/${punchId}/items/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctoken}` }, body: JSON.stringify({ status: 'FIXED' }) });
    report.steps.verifyItem = await request(`/completion/punchlists/${punchId}/items/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${itoken}` }, body: JSON.stringify({ status: 'VERIFIED' }) });
    report.steps.createVerification = await request('/completion/verifications', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${itoken}` }, body: JSON.stringify({ projectId: TEST_PROJECT_ID, relatedPunchListId: punchId, outcome: 'PASS', summary: 'All good', metrics: { qualityScore: 90 } }) });
    report.steps.createHandover = await request('/completion/handovers', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${itoken}` }, body: JSON.stringify({ projectId: TEST_PROJECT_ID, certificateUrl: '', metadata: {} }) });

    const handoverId = report.steps.createHandover.body && report.steps.createHandover.body._id;
    const cltoken = await login(client);
    report.steps.clientLogin = !!cltoken;
    if (!cltoken) {
      console.error('Client login failed');
      console.log(JSON.stringify(report, null, 2));
      exitCode = 6;
      return;
    }

    report.steps.sign = await request(`/completion/handovers/${handoverId}/sign`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cltoken}` }, body: JSON.stringify({ role: 'CLIENT', name: 'Client User' }) });

    console.log('PHASE 6 SMOKE REPORT:\n', JSON.stringify(report, null, 2));
    const pass = creq.ok && pl.ok && report.steps.createVerification.ok && report.steps.createHandover.ok && report.steps.sign.ok;
    exitCode = pass ? 0 : 1;
  } finally {
    if (smoke) await smoke.cleanup();
    await closeSmokeAuth();
    process.exit(exitCode);
  }
})();
