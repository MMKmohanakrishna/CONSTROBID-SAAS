const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = global.fetch || require('node-fetch');
const { ObjectId } = require('mongodb');

const path = require('path');
// load backend .env explicitly to ensure same Atlas URI is used
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const MONGO = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-constrobid-key-change-in-prod';
const API_BASE = process.env.API_BASE || 'http://localhost:5000/api/inspection';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('Connecting to MongoDB (from env):', MONGO ? '[REDACTED]' : 'MONGODB_URI not set');
  if (!MONGO) {
    console.error('MONGODB_URI not set in environment; aborting tests.');
    process.exit(2);
  }
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;

  // Collections
  const contractorsCol = db.collection('contractors');
  const auditCol = db.collection('auditlogs');

  // Insert test contractors
  console.log('Inserting test contractors...');
  const now = new Date();
  const c1 = { _id: new ObjectId(), userId: new ObjectId(), name: 'Ravi Kumar', companyName: 'Ravi Builders', experience: 5, serviceCategories: ['Plumbing'], serviceCities: ['Bengaluru'], aadhaar: '1111-2222-3333', pan: 'ABCDE1234F', gst: '29AAAAA0000A1Z5', status: 'PENDING_VERIFICATION', createdAt: now, updatedAt: now };
  const c2 = { _id: new ObjectId(), userId: new ObjectId(), name: 'Meera Constructions', companyName: 'Meera Constructions', experience: 10, serviceCategories: ['Carpentry'], serviceCities: ['Mumbai'], aadhaar: '4444-5555-6666', pan: 'PQRST1234L', gst: '', status: 'VERIFIED', createdAt: now, updatedAt: now };
  const c3 = { _id: new ObjectId(), userId: new ObjectId(), name: 'Asha Build', companyName: 'Asha Build', experience: 3, serviceCategories: ['Masonry'], serviceCities: ['Pune'], aadhaar: '', pan: '', gst: '', status: 'REJECTED', createdAt: now, updatedAt: now };

  await contractorsCol.insertMany([c1, c2, c3]);
  console.log('Inserted contractors:', c1._id.toHexString(), c2._id.toHexString(), c3._id.toHexString());

  // Create JWT with role INSPECTION_TEAM
  const token = jwt.sign({ id: new ObjectId().toHexString(), email: 'inspector@test.local', role: 'INSPECTION_TEAM' }, JWT_SECRET, { expiresIn: '1h' });
  console.log('Generated test JWT for INSPECTION_TEAM');

  // Allow a moment for server to be ready
  await sleep(1000);

  const results = [];

  // 1. List contractors (pending)
  try {
    const res = await fetch(`${API_BASE}/contractors?status=PENDING_VERIFICATION`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    const pass = res.ok && Array.isArray(json) && json.some(x => x.companyName === 'Ravi Builders');
    results.push({ test: 'List Pending Contractors', pass, details: json.length });
  } catch (e) { results.push({ test: 'List Pending Contractors', pass: false, error: String(e) }); }

  // 2. View contractor details (c1)
  try {
    const res = await fetch(`${API_BASE}/contractors/${c1._id.toHexString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    const pass = res.ok && json.companyName === 'Ravi Builders' && json.aadhaar === '1111-2222-3333';
    results.push({ test: 'View Contractor Details', pass, details: json });
  } catch (e) { results.push({ test: 'View Contractor Details', pass: false, error: String(e) }); }

  // 3. Approve contractor c1
  try {
    const res = await fetch(`${API_BASE}/contractors/${c1._id.toHexString()}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    const dbDoc = await contractorsCol.findOne({ _id: c1._id });
    const audit = await auditCol.findOne({ action: 'CONTRACTOR_APPROVED', 'details': { $regex: c1._id.toHexString() } }) || await auditCol.findOne({ action: 'CONTRACTOR_APPROVED' });
    const pass = res.ok && json.status === 'VERIFIED' && dbDoc.status === 'VERIFIED' && audit;
    results.push({ test: 'Approve Contractor', pass, details: { api: json, db: dbDoc, audit: !!audit } });
  } catch (e) { results.push({ test: 'Approve Contractor', pass: false, error: String(e) }); }

  // 4. Reject contractor c3
  try {
    const res = await fetch(`${API_BASE}/contractors/${c3._id.toHexString()}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason: 'Insufficient docs' }) });
    const json = await res.json();
    const dbDoc = await contractorsCol.findOne({ _id: c3._id });
    const audit = await auditCol.findOne({ action: 'CONTRACTOR_REJECTED' });
    const pass = res.ok && json.status === 'REJECTED' && dbDoc.status === 'REJECTED' && audit;
    results.push({ test: 'Reject Contractor', pass, details: { api: json, db: dbDoc, audit: !!audit } });
  } catch (e) { results.push({ test: 'Reject Contractor', pass: false, error: String(e) }); }

  // 5. Request Documents for c2
  try {
    const res = await fetch(`${API_BASE}/contractors/${c2._id.toHexString()}/request-documents`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: 'Please upload PAN and GST' }) });
    const json = await res.json();
    const audit = await auditCol.findOne({ action: 'CONTRACTOR_DOCUMENTS_REQUESTED' });
    const pass = res.ok && json.ok && audit;
    results.push({ test: 'Request Documents', pass, details: { api: json, audit: !!audit } });
  } catch (e) { results.push({ test: 'Request Documents', pass: false, error: String(e) }); }

  // Authorization test: call without token
  try {
    const res = await fetch(`${API_BASE}/contractors?status=PENDING_VERIFICATION`);
    const pass = res.status === 401 || res.status === 403;
    results.push({ test: 'Authorization (no token)', pass, status: res.status });
  } catch (e) { results.push({ test: 'Authorization (no token)', pass: false, error: String(e) }); }

  // Summarize results and cleanup
  console.log('\nTEST RESULTS:');
  let allPass = true;
  for (const r of results) {
    console.log(`${r.test}: ${r.pass ? 'PASS' : 'FAIL'}`);
    if (!r.pass) allPass = false;
  }

  // Cleanup: remove inserted contractors and related auditlogs
  await contractorsCol.deleteMany({ _id: { $in: [c1._id, c2._id, c3._id] } });
  await auditCol.deleteMany({ action: { $in: ['CONTRACTOR_APPROVED', 'CONTRACTOR_REJECTED', 'CONTRACTOR_DOCUMENTS_REQUESTED'] } });

  await mongoose.disconnect();
  console.log('\nOverall:', allPass ? 'PASS' : 'FAIL');
  process.exit(allPass ? 0 : 2);
}

main().catch(e => { console.error(e); process.exit(2); });
