#!/usr/bin/env node
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constrobid';

async function main() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const db = mongoose.connection;
    const users = db.collection('users');
    const clients = db.collection('clients');
    const cities = db.collection('cities');
    const projects = db.collection('projects');

    // Create user for client
    const email = process.env.TEST_CLIENT_EMAIL || `smoke-client-${Date.now()}@example.test`;
    const password = process.env.TEST_CLIENT_PASSWORD || `Test@${crypto.randomBytes(12).toString('hex')}1`;

    let user = await users.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date();
      const res = await users.insertOne({ email, passwordHash, role: 'CLIENT', createdAt: now, updatedAt: now });
      user = await users.findOne({ _id: res.insertedId });
      console.log('Created test user:', email, 'id:', res.insertedId.toString());
    } else {
      console.log('Test user exists:', email, 'id:', user._id.toString());
    }

    // Create client profile
    let client = await clients.findOne({ userId: user._id });
    if (!client) {
      const now = new Date();
      const cres = await clients.insertOne({ userId: user._id, name: 'Smoke Test Client', phone: '9999999999', address: '123 Smoke St', city: 'Test City', createdAt: now, updatedAt: now });
      client = await clients.findOne({ _id: cres.insertedId });
      console.log('Created client profile id:', cres.insertedId.toString());
    } else {
      console.log('Client profile exists id:', client._id.toString());
    }

    // Create city
    const cityName = process.env.TEST_CITY_NAME || 'Test City';
    let city = await cities.findOne({ name: cityName });
    if (!city) {
      const cres = await cities.insertOne({ name: cityName, country: 'India', createdAt: new Date(), updatedAt: new Date() });
      city = await cities.findOne({ _id: cres.insertedId });
      console.log('Created city id:', cres.insertedId.toString());
    } else {
      console.log('City exists id:', city._id.toString());
    }

    // Create project
    const projectTitle = process.env.TEST_PROJECT_TITLE || 'Smoke Test Project';
    let project = await projects.findOne({ title: projectTitle });
    if (!project) {
      const now = new Date();
      const pres = await projects.insertOne({ clientId: client._id, title: projectTitle, category: null, description: 'Project created for smoke tests', propertyType: process.env.TEST_PROJECT_TYPE || 'Residential', squareFeet: 1000, budget: 100000, address: process.env.TEST_PROJECT_ADDRESS || '123 Smoke St', city: city._id, status: process.env.TEST_PROJECT_STATUS || 'PENDING_INSPECTION', createdAt: now, updatedAt: now });
      project = await projects.findOne({ _id: pres.insertedId });
      console.log('Created project id:', pres.insertedId.toString());
    } else {
      console.log('Project exists id:', project._id.toString());
    }

    console.log('\nTest artifacts:');
    console.log('userId:', user._id.toString());
    console.log('clientId:', client._id.toString());
    console.log('cityId:', city._id.toString());
    console.log('projectId:', project._id.toString());

    process.exit(0);
  } catch (err) {
    console.error('Error creating test project:', err);
    process.exit(1);
  }
}

main();
