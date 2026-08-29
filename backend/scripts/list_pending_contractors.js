#!/usr/bin/env node
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/constrobid';

async function main() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;
  const contractors = await db.collection('contractors').find({}).sort({ createdAt: -1 }).toArray();
  console.log('Total contractors:', contractors.length);
  console.log('\nPending verification:');
  const pending = contractors.filter(c => c.status === 'PENDING_VERIFICATION');
  pending.forEach(c => {
    console.log('-', c.companyName || c.name, '| email:', (c.userId && c.userId.email) || c.email || 'N/A', '| status:', c.status, '| _id:', c._id);
  });

  console.log('\nAll contractors (recent 20):');
  contractors.slice(0,20).forEach(c => {
    console.log('-', c.companyName || c.name, '| email:', (c.userId && c.userId.email) || c.email || 'N/A', '| status:', c.status, '| _id:', c._id);
  });

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(2); });
