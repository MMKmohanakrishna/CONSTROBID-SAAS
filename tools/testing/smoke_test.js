// Simple smoke test script for backend inspection APIs
// Run with: node tools/testing/smoke_test.js

const BASE = process.env.BASE || 'http://localhost:5000/api';
const HEALTH_BASE = process.env.HEALTH_BASE || (BASE.endsWith('/api') ? BASE.slice(0, -4) : BASE);
const { setupSmokeAuth, closeSmokeAuth } = require('./smokeAuth');

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, opts);
    let body = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await res.json(); else body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: null, error: String(err) };
  }
}

async function waitForHealth() {
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(`${HEALTH_BASE}/health`);
      if (res.ok) return true;
    } catch (e) {
      // Keep polling until timeout.
    }
    console.log('Waiting for backend...');
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

(async () => {
  console.log('BASE:', BASE);
  const report = { steps: [] };
  let smoke = null;
  let exitCode = 0;

  try {
    smoke = await setupSmokeAuth({ inspector: true, project: true });
    const inspectCreds = smoke.accounts.inspector;
    const testProjectId = smoke.project?.projectId || process.env.TEST_PROJECT_ID;

    const healthy = await waitForHealth();
    report.backendHealthy = healthy;
    if (!healthy) {
      console.error('Backend not healthy, aborting tests');
      console.log(JSON.stringify(report, null, 2));
      exitCode = 2;
      return;
    }

    const login = await request('/inspection/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inspectCreds) });
    report.steps.push({ name: 'login', ...login });
    if (!login.ok || !login.body?.token) {
      console.error('Login failed', login);
      console.log(JSON.stringify(report, null, 2));
      exitCode = 3;
      return;
    }

    const token = login.body.token;
    console.log('Got token, len=', token.length);
    const authHeader = { Authorization: `Bearer ${token}` };

    const dash = await request('/inspection/dashboard', { headers: authHeader });
    report.steps.push({ name: 'dashboard', ...dash });

    const contractors = await request('/inspection/contractors?status=PENDING_VERIFICATION', { headers: authHeader });
    report.steps.push({ name: 'contractors_list', ...contractors });

    let contractorId = null;
    if (contractors.ok && Array.isArray(contractors.body) && contractors.body.length) contractorId = contractors.body[0]._id;

    if (contractorId) {
      const cdetail = await request(`/inspection/contractors/${contractorId}`, { headers: authHeader });
      report.steps.push({ name: 'contractor_detail', ...cdetail });

      const approve = await request(`/inspection/contractors/${contractorId}/approve`, { method: 'POST', headers: { ...authHeader } });
      report.steps.push({ name: 'contractor_approve', ...approve });
    } else {
      report.steps.push({ name: 'contractor_detail', note: 'no contractors to test' });
    }

    const sites = await request('/inspection/site-inspections', { headers: authHeader });
    report.steps.push({ name: 'site_inspections_list', ...sites });

    const createBody = { city: 'TestCity', address: '123 Test Road', propertyType: 'House' };
    if (testProjectId) createBody.projectId = testProjectId;
    const create = await request('/inspection/site-inspections', { method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify(createBody) });
    report.steps.push({ name: 'create_inspection', ...create });

    const inspectionId = create.ok && create.body?._id ? create.body._id : null;
    if (inspectionId) {
      const getIns = await request(`/inspection/site-inspections/${inspectionId}`, { headers: authHeader });
      report.steps.push({ name: 'get_inspection', ...getIns });

      const reportPost = await request(`/inspection/site-inspections/${inspectionId}/report`, { method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify({ report: { notes: 'Smoke test report' } }) });
      report.steps.push({ name: 'submit_report', ...reportPost });
    }

    const designList = await request('/inspection/design', { headers: authHeader });
    report.steps.push({ name: 'design_list', ...designList });

    const createDesign = await request('/inspection/design', { method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify({ comments: 'Smoke test design', projectId: testProjectId || undefined }) });
    report.steps.push({ name: 'create_design', ...createDesign });

    const designId = createDesign.ok && createDesign.body?._id ? createDesign.body._id : null;
    if (designId) {
      const getDesign = await request(`/inspection/design/${designId}`, { headers: authHeader });
      report.steps.push({ name: 'get_design', ...getDesign });

      const upload = await request(`/inspection/design/${designId}/files`, { method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'designFiles', files: [{ url: 'http://example.com/f.pdf', filename: 'f.pdf', fileType: 'application/pdf' }] }) });
      report.steps.push({ name: 'upload_design_files', ...upload });
    }

    console.log('SMOKE REPORT:\n', JSON.stringify(report, null, 2));
  } finally {
    if (smoke) await smoke.cleanup();
    await closeSmokeAuth();
    process.exit(exitCode);
  }
})();
