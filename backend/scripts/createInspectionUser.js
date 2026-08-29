#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const http = require('http');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constrobid';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const EMAIL = process.env.TEST_INSPECTOR_EMAIL || process.env.INSPECTOR_EMAIL || 'inspector@constrobid.com';
const PASSWORD = process.env.TEST_INSPECTOR_PASSWORD || process.env.INSPECTOR_PASSWORD || 'Inspector@123';
const ROLE = 'INSPECTION_TEAM';

async function main() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const usersCol = mongoose.connection.collection('users');
    const inspCol = mongoose.connection.collection('inspectionteams');

    const now = new Date();
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    let existing = await usersCol.findOne({ email: EMAIL });
    let userId;

    if (existing) {
      userId = existing._id;
      await usersCol.updateOne(
        { _id: userId },
        { $set: { passwordHash, role: ROLE, updatedAt: now } }
      );
      console.log('Repaired existing inspection user:', EMAIL);
      console.log('User id:', userId.toString());
    } else {
      const insertRes = await usersCol.insertOne({
        email: EMAIL,
        passwordHash,
        role: ROLE,
        createdAt: now,
        updatedAt: now,
      });

      if (!insertRes.insertedId) throw new Error('Failed to create user');
      userId = insertRes.insertedId;
      console.log('Created user:', EMAIL, 'id:', userId.toString());
    }

    const existingProfile = await inspCol.findOne({ userId });
    if (existingProfile) {
      await inspCol.updateOne(
        { _id: existingProfile._id },
        { $set: { fullName: existingProfile.fullName || 'Inspector Dev', email: EMAIL, isActive: true, updatedAt: now } }
      );
      console.log('Repaired inspection profile id:', existingProfile._id.toString());
    } else {
      const inspRes = await inspCol.insertOne({
        userId,
        employeeId: `IT-${Date.now()}`,
        fullName: 'Inspector Dev',
        email: EMAIL,
        phone: '',
        designation: 'Inspection Team',
        city: '',
        profilePhoto: '',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log('Created inspection profile id:', inspRes.insertedId ? inspRes.insertedId.toString() : 'N/A');
    }

    // verify user exists and password matches
    const created = await usersCol.findOne({ _id: userId });
    if (!created) throw new Error('Inserted user not found');
    const match = await bcrypt.compare(PASSWORD, created.passwordHash || '');
    console.log('Password hashing verification (bcrypt.compare):', match);

    // try login via backend endpoint
    await verifyLogin();

    console.log('\nCredentials created:');
    console.log('Email:', EMAIL);
    console.log('Password:', PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

function verifyLogin() {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ email: EMAIL, password: PASSWORD });
    const url = new URL('/api/inspection/login', BACKEND_URL);
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          if (res.statusCode === 200 && json.token) {
            console.log('Login verification succeeded — backend returned token.');
          } else {
            console.warn('Login verification response:', res.statusCode, json);
          }
        } catch (e) {
          console.warn('Login verification non-JSON response:', data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.warn('Login verification request failed — is backend running at', BACKEND_URL, '?', e.message);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

main();
