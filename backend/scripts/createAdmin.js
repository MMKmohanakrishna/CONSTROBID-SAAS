#!/usr/bin/env node
const path = require('path');
// Load backend .env so this script can be run standalone and will use Atlas URI
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constrobid';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@constrobid.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword123';

async function main() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const users = mongoose.connection.collection('users');

    const existing = await users.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const now = new Date();

    const res = await users.insertOne({
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      createdAt: now,
      updatedAt: now,
    });

    if (res.insertedId) {
      console.log(`Created admin user: ${ADMIN_EMAIL}`);
      console.log(`Temporary password: ${ADMIN_PASSWORD}`);
      process.exit(0);
    }

    console.error('Failed to insert admin user');
    process.exit(2);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
}

main();
