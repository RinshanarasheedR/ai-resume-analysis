const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');

const sheetId = process.env.GOOGLE_SHEET_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${signature}`;

  const response = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }).toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  return response.data.access_token;
}

async function migrate() {
  console.log('Authenticating with Google API...');
  const token = await getAccessToken();
  console.log('Authentication successful.');

  const authHeader = { Authorization: `Bearer ${token}` };

  // Fetch existing sheets/tabs
  const infoRes = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`, {
    headers: authHeader
  });
  const existingTabs = infoRes.data.sheets.map(s => s.properties.title);
  console.log('Existing tabs in Google Sheet:', existingTabs);

  // Load local database data
  const dbPath = path.resolve(__dirname, '../data/db.json');
  let dbData = {};
  if (fs.existsSync(dbPath)) {
    dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }

  const tableNames = [
    'Users',
    'Resumes',
    'ATSReports',
    'MockInterviews',
    'Scores',
    'TechnicalQuestions',
    'AptitudeQuestions',
    'LearningResources'
  ];

  for (const tableName of tableNames) {
    console.log(`\n--------------------------------------------`);
    console.log(`Migrating Table: [${tableName}]`);

    // 1. Create tab if not exists
    if (!existingTabs.includes(tableName)) {
      try {
        await axios.post(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
          {
            requests: [
              {
                addSheet: {
                  properties: { title: tableName }
                }
              }
            ]
          },
          { headers: authHeader }
        );
        console.log(`Created tab: "${tableName}"`);
        existingTabs.push(tableName);
      } catch (err) {
        console.warn(`Tab creation notice for ${tableName}:`, err.response ? err.response.data.error.message : err.message);
      }
    } else {
      console.log(`Tab "${tableName}" already exists.`);
    }

    // 2. Set headers and records
    const records = dbData[tableName] || [];
    const rows = [
      ['id', 'json_data', 'createdAt', 'updatedAt'] // Header row
    ];

    records.forEach(doc => {
      rows.push([
        doc._id || doc.id || '',
        JSON.stringify(doc),
        doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString()
      ]);
    });

    // Clear and upload entire table data
    await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tableName)}!A:D:clear`,
      {},
      { headers: authHeader }
    );

    await axios.put(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tableName)}!A1:D${rows.length}?valueInputOption=RAW`,
      { values: rows },
      { headers: authHeader }
    );

    console.log(`Successfully migrated ${records.length} records into tab [${tableName}].`);
  }

  console.log('\n============================================');
  console.log('🎉 ALL TABLES SUCCESSFULLY MIGRATED TO GSHEET!');
  console.log('============================================\n');
}

migrate().catch(err => {
  console.error('Migration failed:', err.response ? err.response.data : err.message);
  process.exit(1);
});
