/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constrobid';
const legacyToken = ['B', 'O', 'Q'].join('');
const lowerLegacyToken = legacyToken.toLowerCase();

async function dropIfExists(db, collectionName) {
  const collections = await db.db.listCollections({ name: collectionName }).toArray();
  if (!collections.length) return false;
  await db.collection(collectionName).drop();
  return true;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection;

  const selectedField = `selected${legacyToken}Id`;
  const approvedField = `approved${legacyToken}Id`;
  const nestedDesignField = lowerLegacyToken;

  const projectResult = await db.collection('projects').updateMany(
    {},
    { $unset: { [selectedField]: '', [approvedField]: '' } }
  );

  const designPackageResult = await db.collection('designpackages').updateMany(
    {},
    { $unset: { [nestedDesignField]: '' } }
  );

  const legacyDesignCollectionDropped = await dropIfExists(db, `design${lowerLegacyToken}s`);
  const legacyFileCollectionDropped = await dropIfExists(db, `${lowerLegacyToken}s`);

  console.log(JSON.stringify({
    projectsMatched: projectResult.matchedCount,
    projectsModified: projectResult.modifiedCount,
    designPackagesMatched: designPackageResult.matchedCount,
    designPackagesModified: designPackageResult.modifiedCount,
    legacyDesignCollectionDropped,
    legacyFileCollectionDropped,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
