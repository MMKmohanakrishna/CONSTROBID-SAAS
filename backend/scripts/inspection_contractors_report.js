const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = global.fetch || require('node-fetch');
const { ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-constrobid-key-change-in-prod';
const API_BASE = process.env.API_BASE || 'http://localhost:5000/api/inspection';

async function main() {
  if (!MONGO) {
    console.error('MONGODB_URI not set; aborting');
    process.exit(2);
  }
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;
  const contractorsCol = db.collection('contractors');
  const auditCol = db.collection('auditlogs');

  // Insert uniquely identifiable test contractors
  const now = new Date();
  const c1 = { _id: new ObjectId(), userId: new ObjectId(), name: 'Report Test A', companyName: 'Report Builders A', experience: 2, serviceCategories: ['Test'], serviceCities: ['TestCity'], aadhaar: 'AA111', pan: 'PA111', gst: '', status: 'PENDING_VERIFICATION', createdAt: now, updatedAt: now };
  await contractorsCol.insertOne(c1);

  const token = jwt.sign({ id: new ObjectId().toHexString(), email: 'inspector@report.local', role: 'INSPECTION_TEAM' }, JWT_SECRET, { expiresIn: '1h' });

  console.log('Running API calls and collecting responses...');

  const results = {};

  // List pending
  const listRes = await fetch(`${API_BASE}/contractors?status=PENDING_VERIFICATION`, { headers: { Authorization: `Bearer ${token}` } });
  results.list = { status: listRes.status, body: await listRes.json() };

  // Detail
  const detailRes = await fetch(`${API_BASE}/contractors/${c1._id.toHexString()}`, { headers: { Authorization: `Bearer ${token}` } });
  results.detail = { status: detailRes.status, body: await detailRes.json() };

  // Approve
  const approveRes = await fetch(`${API_BASE}/contractors/${c1._id.toHexString()}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  results.approve = { status: approveRes.status, body: await approveRes.json() };

  // DB state after approve
  const afterApprove = await contractorsCol.findOne({ _id: c1._id });
  results.dbAfterApprove = afterApprove;

  const auditAfterApprove = await auditCol.find({ action: 'CONTRACTOR_APPROVED' }).sort({ createdAt: -1 }).limit(5).toArray();
  results.auditAfterApprove = auditAfterApprove;

  // Reject (re-create a new test contractor)
  const c2 = { _id: new ObjectId(), userId: new ObjectId(), name: 'Report Test B', companyName: 'Report Builders B', experience: 1, serviceCategories: ['TestB'], serviceCities: ['TestCityB'], aadhaar: 'BB111', pan: 'PB111', gst: '', status: 'PENDING_VERIFICATION', createdAt: now, updatedAt: now };
  await contractorsCol.insertOne(c2);

  const rejectRes = await fetch(`${API_BASE}/contractors/${c2._id.toHexString()}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason: 'Test reject' }) });
  results.reject = { status: rejectRes.status, body: await rejectRes.json() };

  const afterReject = await contractorsCol.findOne({ _id: c2._id });
  results.dbAfterReject = afterReject;
  const auditAfterReject = await auditCol.find({ action: 'CONTRACTOR_REJECTED' }).sort({ createdAt: -1 }).limit(5).toArray();
  results.auditAfterReject = auditAfterReject;

  // Request documents
  const c3 = { _id: new ObjectId(), userId: new ObjectId(), name: 'Report Test C', companyName: 'Report Builders C', experience: 4, serviceCategories: ['TestC'], serviceCities: ['TCity'], aadhaar: '', pan: '', gst: '', status: 'PENDING_VERIFICATION', createdAt: now, updatedAt: now };
  await contractorsCol.insertOne(c3);
  const requestRes = await fetch(`${API_BASE}/contractors/${c3._id.toHexString()}/request-documents`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: 'Please provide PAN/GST' }) });
  results.requestDocs = { status: requestRes.status, body: await requestRes.json() };

  const auditAfterRequest = await auditCol.find({ action: 'CONTRACTOR_DOCUMENTS_REQUESTED' }).sort({ createdAt: -1 }).limit(5).toArray();
  results.auditAfterRequest = auditAfterRequest;

  console.log('\n--- API & DB Report ---');
  console.log(JSON.stringify(results, null, 2));

  // Cleanup test contractors and audit entries
  await contractorsCol.deleteMany({ companyName: { $regex: '^Report Builders' } });
  await auditCol.deleteMany({ action: { $in: ['CONTRACTOR_APPROVED', 'CONTRACTOR_REJECTED', 'CONTRACTOR_DOCUMENTS_REQUESTED'] } });

  await mongoose.disconnect();
  console.log('\nReport complete.');
}

main().catch(e => { console.error(e); process.exit(2); });
