#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constrobid';

async function main() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection;

    const users = db.collection('users');
    const clients = db.collection('clients');
    const projects = db.collection('projects');
    const designpackages = db.collection('designpackages');
    const designfiles = db.collection('designfiles');
    const materialestimates = db.collection('materialestimates');
    const scopeofworks = db.collection('scopeofworks');
    const inspections = db.collection('inspectionreports');

    const report = {};

    // Remove inspector test account
    const inspectorEmail = 'inspector@constrobid.com';
    const resUser = await users.findOneAndDelete({ email: inspectorEmail });
    const inspectorId = resUser && resUser.value ? resUser.value._id : null;
    report.removedInspectorUser = inspectorId ? inspectorId.toString() : null;

    // Remove smoke-client
    const smokeEmail = 'smoke-client@constrobid.com';
    const resSmoke = await users.findOneAndDelete({ email: smokeEmail });
    const smokeUserId = resSmoke && resSmoke.value ? resSmoke.value._id : null;
    report.removedSmokeUser = smokeUserId ? smokeUserId.toString() : null;

    // Remove test client profiles referencing removed users
    if (smokeUserId) {
      const cRes = await clients.deleteMany({ userId: smokeUserId });
      report.removedClientProfiles = cRes.deletedCount;
    } else {
      report.removedClientProfiles = 0;
    }

    // Remove test projects by title (if any)
    const pRes = await projects.findOneAndDelete({ title: 'Smoke Test Project' });
    report.removedProject = pRes && pRes.value ? pRes.value._id.toString() : null;

    const projectId = process.env.TEST_PROJECT_ID || (pRes && pRes.value ? pRes.value._id : null);

    // If we have a projectId (from env or deleted project), remove related artifacts
    if (projectId) {
      const oid = new mongoose.Types.ObjectId(projectId.toString());
      const designPackageRes = await designpackages.deleteMany({ projectId: oid });
      const inspRes = await inspections.deleteMany({ projectId: oid });
      // remove design-related test artifacts where url matches example.com or projectId matches
      const dfRes = await designfiles.deleteMany({ $or: [{ fileUrl: { $regex: 'example.com' } }, { projectId: oid }] });
      const meRes = await materialestimates.deleteMany({ $or: [{ url: { $regex: 'example.com' } }, { projectId: oid }] });
      const soRes = await scopeofworks.deleteMany({ $or: [{ url: { $regex: 'example.com' } }, { projectId: oid }] });
      report.removedDesignPackages = designPackageRes.deletedCount;
      report.removedInspections = inspRes.deletedCount;
      report.removedDesignFiles = dfRes.deletedCount;
      report.removedMaterialEstimates = meRes.deletedCount;
      report.removedScopeOfWorks = soRes.deletedCount;
    } else {
      report.removedDesignPackages = 0;
      report.removedInspections = 0;
      report.removedDesignFiles = 0;
      report.removedMaterialEstimates = 0;
      report.removedScopeOfWorks = 0;
    }

    console.log('Cleanup report:\n', JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Cleanup error', err);
    process.exit(1);
  }
}

main();
