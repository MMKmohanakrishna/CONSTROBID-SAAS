#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constrobid';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection;
    const users = db.collection('users');
    const projects = db.collection('projects');
    const designpackages = db.collection('designpackages');
    const inspections = db.collection('inspectionreports');

    const usersFound = await users.find({ email: { $regex: 'inspector|smoke-client', $options: 'i' } }).toArray();
    const projectsFound = await projects.find({ title: { $regex: 'Smoke Test Project', $options: 'i' } }).toArray();
    const designPackagesFound = await designpackages.find({}).limit(20).toArray();
    const inspFound = await inspections.find({}).limit(20).toArray();

    console.log('Users matching inspector/smoke-client:', usersFound.map(u=>({ _id: u._id, email: u.email })));
    console.log('Projects matching Smoke Test Project:', projectsFound.map(p=>({ _id: p._id, title: p.title })));
    console.log('Sample DesignPackages (count <=20):', designPackagesFound.map(d=>({ _id: d._id, projectId: d.projectId, createdAt: d.createdAt })));
    console.log('Sample Inspections (count <=20):', inspFound.map(i=>({ _id: i._id, projectId: i.projectId, createdAt: i.createdAt })));

    process.exit(0);
  } catch (err) {
    console.error('List error', err);
    process.exit(1);
  }
}

main();
