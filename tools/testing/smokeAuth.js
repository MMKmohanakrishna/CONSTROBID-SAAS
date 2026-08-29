const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const backendRoot = path.resolve(__dirname, '../../backend');
const mongoose = require(path.join(backendRoot, 'node_modules/mongoose'));
const bcrypt = require(path.join(backendRoot, 'node_modules/bcryptjs'));

function loadBackendEnv() {
  const envPath = path.join(backendRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function randomPassword() {
  return `Test@${crypto.randomBytes(12).toString('hex')}1`;
}

function makeEmail(role) {
  const suffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  return `smoke-${role.toLowerCase().replace(/_/g, '-')}-${suffix}@example.test`;
}

async function connect() {
  loadBackendEnv();
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to create temporary smoke-test users');
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

async function createUser(role, label) {
  const email = makeEmail(role);
  const password = randomPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await mongoose.connection.collection('users').insertOne({
    email,
    passwordHash,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const userId = user.insertedId;
  let profileId = null;

  if (role === 'INSPECTION_TEAM') {
    const profile = await mongoose.connection.collection('inspectionteams').insertOne({
      userId,
      employeeId: `SMOKE-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      fullName: label || 'Smoke Inspector',
      email,
      phone: '',
      designation: 'Smoke Test',
      city: 'TestCity',
      profilePhoto: '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    profileId = profile.insertedId;
  }

  if (role === 'CONTRACTOR') {
    const profile = await mongoose.connection.collection('contractors').insertOne({
      userId,
      name: label || 'Smoke Contractor',
      companyName: 'Smoke Contractor Co',
      experience: 1,
      serviceCategories: [],
      serviceCities: [],
      aadhaar: '',
      pan: '',
      gst: '',
      status: 'PENDING_VERIFICATION',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    profileId = profile.insertedId;
  }

  if (role === 'CLIENT') {
    const profile = await mongoose.connection.collection('clients').insertOne({
      userId,
      name: label || 'Smoke Client',
      phone: '',
      address: 'Smoke Test Address',
      city: 'TestCity',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    profileId = profile.insertedId;
  }

  return { email, password, userId, profileId, temporary: true, role };
}

async function findProfileId(email, collectionName) {
  const user = await mongoose.connection.collection('users').findOne({ email });
  if (!user) return null;
  const profile = await mongoose.connection.collection(collectionName).findOne({ userId: user._id });
  return profile?._id || null;
}

async function ensureAccount(role, envPrefix, label) {
  const email = process.env[`${envPrefix}_EMAIL`];
  const password = process.env[`${envPrefix}_PASSWORD`];
  if (email && password) return { email, password, temporary: false, role };
  return createUser(role, label);
}

async function ensureProject(accounts) {
  if (process.env.TEST_PROJECT_ID) return { projectId: process.env.TEST_PROJECT_ID, temporary: false };

  const clientProfileId = accounts.client?.profileId || await findProfileId(accounts.client?.email, 'clients');
  if (!clientProfileId) throw new Error('Client profile is required to create temporary smoke-test project');

  const contractorProfileId = accounts.contractor?.profileId || await findProfileId(accounts.contractor?.email, 'contractors');
  const inspectorProfileId = accounts.inspector?.profileId || await findProfileId(accounts.inspector?.email, 'inspectionteams');

  const project = await mongoose.connection.collection('projects').insertOne({
    clientId: clientProfileId,
    contractorId: contractorProfileId || undefined,
    assignedInspectorId: inspectorProfileId || undefined,
    title: 'Smoke Test Project',
    description: 'Temporary project for smoke tests',
    propertyType: 'House',
    squareFeet: 1000,
    budget: 100000,
    address: '123 Smoke Test Road',
    status: 'PROJECT_PUBLISHED',
    files: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { projectId: String(project.insertedId), temporary: true };
}

async function cleanupSmokeData(context) {
  if (!context) return;
  await connect();

  const tempUserIds = Object.values(context.accounts || {})
    .filter(account => account?.temporary)
    .map(account => account.userId);

  if (context.project?.temporary && context.project.projectId) {
    const projectObjectId = new mongoose.Types.ObjectId(context.project.projectId);
    await mongoose.connection.collection('inspectionreports').deleteMany({ projectId: projectObjectId });
    await mongoose.connection.collection('designpackages').deleteMany({ projectId: projectObjectId });
    await mongoose.connection.collection('projectupdates').deleteMany({ projectId: projectObjectId });
    await mongoose.connection.collection('sitevisitreports').deleteMany({ projectId: projectObjectId });
    await mongoose.connection.collection('completionrequests').deleteMany({ projectId: projectObjectId });
    await mongoose.connection.collection('punchlists').deleteMany({ projectId: projectObjectId });
    await mongoose.connection.collection('completionverifications').deleteMany({ projectId: projectObjectId });
    await mongoose.connection.collection('handovercertificates').deleteMany({ projectId: projectObjectId });
    await mongoose.connection.collection('projects').deleteOne({ _id: projectObjectId });
  }

  if (tempUserIds.length) {
    await mongoose.connection.collection('messages').deleteMany({ $or: [{ from: { $in: tempUserIds } }, { to: { $in: tempUserIds } }] });
    await mongoose.connection.collection('notifications').deleteMany({ recipient: { $in: tempUserIds } });
    await mongoose.connection.collection('designfiles').deleteMany({ uploadedBy: { $in: tempUserIds } });
    await mongoose.connection.collection('materialestimates').deleteMany({ uploadedBy: { $in: tempUserIds } });
    await mongoose.connection.collection('scopeofworks').deleteMany({ uploadedBy: { $in: tempUserIds } });
  }

  for (const account of Object.values(context.accounts || {})) {
    if (!account?.temporary) continue;
    if (account.role === 'INSPECTION_TEAM') await mongoose.connection.collection('inspectionteams').deleteOne({ userId: account.userId });
    if (account.role === 'CONTRACTOR') await mongoose.connection.collection('contractors').deleteOne({ userId: account.userId });
    if (account.role === 'CLIENT') await mongoose.connection.collection('clients').deleteOne({ userId: account.userId });
    await mongoose.connection.collection('users').deleteOne({ _id: account.userId });
  }
}

async function setupSmokeAuth(options = {}) {
  await connect();
  const accounts = {};

  if (options.inspector) {
    accounts.inspector = await ensureAccount('INSPECTION_TEAM', 'TEST_INSPECTOR', 'Smoke Inspector');
  }
  if (options.contractor) {
    accounts.contractor = await ensureAccount('CONTRACTOR', 'TEST_CONTRACTOR', 'Smoke Contractor');
  }
  if (options.client || options.project) {
    accounts.client = await ensureAccount('CLIENT', 'TEST_CLIENT', 'Smoke Client');
  }

  const project = options.project ? await ensureProject(accounts) : null;
  return { accounts, project, cleanup: () => cleanupSmokeData({ accounts, project }) };
}

async function closeSmokeAuth() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

module.exports = { setupSmokeAuth, cleanupSmokeData, closeSmokeAuth };
