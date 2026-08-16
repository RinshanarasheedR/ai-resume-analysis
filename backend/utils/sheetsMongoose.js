const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Environment variables with fallback
const sheetId = process.env.GOOGLE_SHEET_ID || '1R0hmm1Dc1ew6Pf5pO_DN6dU6ByAaAKPSdk3eT724jBI';
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || 'sheets-db-accessor@resume-ats-portal.iam.gserviceaccount.com';
const defaultKey = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC22VFpSiywVuj3\nJqo6SYUE/guP+mq82Qfws/wIXB3KBoVQ82KuadH5kGVCvFjO7D8Su5GB51ww5ad9\nZtQ+zWJGwID6sH+gTQP3LYtx55VRtil2Bvah1Oz/V+qMvzU7t4XYokl7nlFFG5ae\njHH27cywxBU7tqDi1+Pmkww05E7rZ3vrQ2LRyS01ZMWStQ1iGweudj5eGMIKsMUH\nfg5IfWalNhflRgSg9uFDAb61amgi/OMmeeiX075cO1bcHIofMoazlwHXN8wVvtrH\nMikIabtd4Pn49qjyuoW+FBhO5xGOTAN4KZErnOcClNO1b9c4xPBNPTCBWI6NGV+a\np2wt53xvAgMBAAECggEAA+hL+ZSItPH+g32TiLBWg99L7vU6f7OhnE60VZdmWZFf\nGvZAhxqizpL73vu4aB+bT3Krrtt7WF4oAKGIapkn/vwRJYpNB+dtbMRP5Qy+X6Ml\naqzGa3np4KEH1Z8ma5LF7PW23UnqUbA/vT6iFtVJGQPvsjl6Ya6cY6qDycORPi2M\nJMv+5YZC5gQ+r5/LBXi/ZE/oCJqf4nZJV9U7JyVgB/b3wN8YrJbXVUvKwFGFTn52\nl/9ze8SdlU0XuAIOHIUN1K8CsjWAJ+EzamZzPhferdDHNKnJ3/jWMEit7fh37T11\nKN4n56WFcw5LT8Cjep27fKtUzhiDOCcY5+IR1FzplQKBgQDy4xmhfWz0nHiTZdFt\nnGLzwSJ7NbAJtAzalz8M7q3ULu76ejr61cDBuo1og5p5yMxyGkMmLNUkmARqsscc\nwHWK6jEzNJVODifjwA4Ms5cIJV4N5CAQGPWBgP7yIXSfxNaCVyn1dwKh9hj6TXaz\n14Tw80W5eL18ky7LbqLp7IgwNQKBgQDAuHC8Bl7iucyJNU0o6MQTXiWLUCMre0I/\nx8o0MH6ngyoxpWGU9LPOh/l97n6/pXM8aSfGIAgiDZLFku/0trjl5k7MIKI+KnAR\nVNolMFXlFstNy1tjbYSk+2Sf47WMQO9DGlw73gS6enrePdlKRJq8Gh03WA/oc8fW\ncAVK4bpWkwKBgCi9wUHeWRVa3brTvGJndg2vGsqSAdpO0k0kS5Yuvwe1a66mLBiB\nHFkioq+iS5ob/XcyQos3v/Tobu062b1P5yeLCv+s1VKHe1dvkqu8wBvEsNchqeMp\nXJ0Bd0JELFzUVqr8VfRvpwhl0GDD96JJB2qnU829nAM2aQYEo90bKOj1AoGBAIql\nJhVez+x0ln0vZ29C5ay5UnFDGcoyRprz9LhPGw8QAc7tl6I92Q2ALTE33t+o+5o+\nXGrgqHk3IpwY9aArxCFA6vdXkuD+TtlpHfcbKvBA0coJvpltNLwsT1vnybg5DuhL\nkodPVj+B1dsEy8nuSROCBfrG08r7YI0Y0fXpJtEZAoGBAObEEixUzsYb5ZBHlXpc\nfa7APiFv/ErQsUXx6veUijSgjY64Gu7UK2gBOOW1Vjs8QOROgW12DyevhaIcs+Na\nrH9pX3GZH+gzPZaY4EQmV1XFIxtZqgwMhytsAMtDYLHhRKyELVaB2H4ReANm5JJ7\nY2Mt7+NyeP326SaTjCbDxhwH\n-----END PRIVATE KEY-----\n`;
const rawKey = process.env.GOOGLE_PRIVATE_KEY || defaultKey;
const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

// In-Memory Database Cache: { [collectionName]: [ doc1, doc2, ... ] }
const cache = {};

// Local fallback file path
const LOCAL_DB_DIR = path.resolve(__dirname, '../data');
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, 'db.json');

// Helper to generate 24-character hexadecimal MongoDB-like ObjectID
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

// Ensure local backup directory exists
function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DB_DIR)) {
    fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
  }
}

// Load local database backup
function loadLocalDB() {
  ensureLocalDir();
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
      Object.assign(cache, data);
    } catch (e) {
      console.warn('Could not parse local db.json:', e.message);
    }
  }
}

// Save local database backup
function saveLocalDB() {
  try {
    ensureLocalDir();
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving local db backup:', e.message);
  }
}

// Google OAuth2 Token Management
let accessToken = null;
let tokenExpiresAt = 0;
let sheetsEnabled = false;

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken() {
  if (!clientEmail || !privateKey) return null;
  const now = Math.floor(Date.now() / 1000);
  if (accessToken && now < tokenExpiresAt - 60) {
    return accessToken;
  }

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

  accessToken = response.data.access_token;
  tokenExpiresAt = now + (response.data.expires_in || 3600);
  return accessToken;
}

// Google Sheets API Helpers
async function sheetsApi(endpoint, method = 'GET', data = null) {
  if (!sheetsEnabled && endpoint !== '') {
    // Only attempt if enabled or testing spreadsheet info
    return null;
  }
  const token = await getAccessToken();
  if (!token) return null;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}${endpoint}`;
  const config = {
    method,
    url,
    headers: { Authorization: `Bearer ${token}` }
  };
  if (data) config.data = data;

  const response = await axios(config);
  return response.data;
}

async function initializeSheet(sheetName) {
  if (!sheetsEnabled) return;
  try {
    await sheetsApi(':batchUpdate', 'POST', {
      requests: [{ addSheet: { properties: { title: sheetName } } }]
    });
    await sheetsApi(`/values/${encodeURIComponent(sheetName)}!A1:D1?valueInputOption=RAW`, 'PUT', {
      values: [['id', 'json_data', 'createdAt', 'updatedAt']]
    });
  } catch (err) {
    // Tab likely already exists
  }
}

async function loadSheetData(sheetName) {
  if (!sheetsEnabled) return [];
  try {
    const res = await sheetsApi(`/values/${encodeURIComponent(sheetName)}!A2:D`);
    const rows = res?.values || [];
    const data = [];
    for (let row of rows) {
      if (row[1]) {
        try {
          const doc = JSON.parse(row[1]);
          doc._id = row[0];
          doc.createdAt = row[2] ? new Date(row[2]) : new Date();
          doc.updatedAt = row[3] ? new Date(row[3]) : new Date();
          data.push(doc);
        } catch (e) {}
      }
    }
    return data;
  } catch (err) {
    return [];
  }
}

async function syncRowToSheet(sheetName, doc) {
  saveLocalDB();
  if (!sheetsEnabled) return;
  try {
    const rowsRes = await sheetsApi(`/values/${encodeURIComponent(sheetName)}!A2:A`);
    const ids = (rowsRes?.values || []).map(r => r[0]);
    const index = ids.indexOf(doc._id);

    const rowData = [
      doc._id,
      JSON.stringify(doc),
      doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      new Date().toISOString()
    ];

    if (index === -1) {
      await sheetsApi(`/values/${encodeURIComponent(sheetName)}!A:D:append?valueInputOption=RAW`, 'POST', {
        values: [rowData]
      });
    } else {
      const rowIndex = index + 2;
      await sheetsApi(`/values/${encodeURIComponent(sheetName)}!A${rowIndex}:D${rowIndex}?valueInputOption=RAW`, 'PUT', {
        values: [rowData]
      });
    }
  } catch (err) {
    console.warn(`[Google Sheets] Warning: Sync failed for ${sheetName}:`, err.message);
  }
}

async function deleteRowFromSheet(sheetName, docId) {
  saveLocalDB();
  if (!sheetsEnabled) return;
  try {
    const rowsRes = await sheetsApi(`/values/${encodeURIComponent(sheetName)}!A2:A`);
    const ids = (rowsRes?.values || []).map(r => r[0]);
    const index = ids.indexOf(docId);
    if (index !== -1) {
      const rowIndex = index + 2;
      await sheetsApi(`/values/${encodeURIComponent(sheetName)}!A${rowIndex}:D${rowIndex}?valueInputOption=RAW`, 'PUT', {
        values: [['', '', '', '']]
      });
    }
  } catch (err) {
    console.warn(`[Google Sheets] Warning: Deletion failed for ${sheetName}:`, err.message);
  }
}

// Query Filter Matching
function matchQuery(doc, query) {
  if (!query || Object.keys(query).length === 0) return true;
  for (let key in query) {
    const queryVal = query[key];
    const docVal = doc[key];

    if (key === '_id') {
      if (String(docVal) !== String(queryVal)) return false;
      continue;
    }

    if (queryVal instanceof RegExp) {
      if (!queryVal.test(String(docVal || ''))) return false;
      continue;
    }

    if (queryVal && typeof queryVal === 'object' && !Array.isArray(queryVal) && !(queryVal instanceof Date)) {
      for (let op in queryVal) {
        const val = queryVal[op];
        const docDate = docVal ? new Date(docVal).getTime() : 0;
        const valDate = val instanceof Date ? val.getTime() : (typeof val === 'number' ? val : new Date(val).getTime());

        if (op === '$gt') {
          if (!isNaN(docDate) && !isNaN(valDate)) {
            if (!(docDate > valDate)) return false;
          } else if (!(docVal > val)) return false;
        } else if (op === '$gte') {
          if (!isNaN(docDate) && !isNaN(valDate)) {
            if (!(docDate >= valDate)) return false;
          } else if (!(docVal >= val)) return false;
        } else if (op === '$lt') {
          if (!isNaN(docDate) && !isNaN(valDate)) {
            if (!(docDate < valDate)) return false;
          } else if (!(docVal < val)) return false;
        } else if (op === '$lte') {
          if (!isNaN(docDate) && !isNaN(valDate)) {
            if (!(docDate <= valDate)) return false;
          } else if (!(docVal <= val)) return false;
        } else if (op === '$ne') {
          if (docVal === val) return false;
        } else if (op === '$in') {
          if (!Array.isArray(val) || !val.map(String).includes(String(docVal))) return false;
        } else if (op === '$nin') {
          if (Array.isArray(val) && val.map(String).includes(String(docVal))) return false;
        }
      }
    } else {
      if (docVal !== queryVal) {
        if (String(docVal) !== String(queryVal)) return false;
      }
    }
  }
  return true;
}

// Chainable Mongoose Query Class
class Query {
  constructor(data, modelClass, isSingle = false) {
    this._data = [...(data || [])];
    this._modelClass = modelClass;
    this._isSingle = isSingle;
    this._selectFields = null;
  }

  populate(path) {
    const refs = {
      userId: 'User',
      resumeId: 'Resume'
    };
    const targetModelName = refs[path];
    if (targetModelName && models[targetModelName]) {
      const targetModel = models[targetModelName];
      this._data.forEach(item => {
        if (item[path] && typeof item[path] === 'string') {
          const match = targetModel._cache.find(doc => String(doc._id) === String(item[path]));
          if (match) {
            item[path] = JSON.parse(JSON.stringify(match));
          }
        }
      });
    }
    return this;
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  sort(sortObj) {
    if (typeof sortObj === 'object' && sortObj !== null) {
      const keys = Object.keys(sortObj);
      this._data.sort((a, b) => {
        for (let key of keys) {
          const order = sortObj[key] === -1 ? -1 : 1;
          const aVal = a[key] instanceof Date ? a[key].getTime() : a[key];
          const bVal = b[key] instanceof Date ? b[key].getTime() : b[key];
          if (aVal < bVal) return -1 * order;
          if (aVal > bVal) return 1 * order;
        }
        return 0;
      });
    } else if (typeof sortObj === 'string') {
      const parts = sortObj.split(' ').filter(Boolean);
      this._data.sort((a, b) => {
        for (let part of parts) {
          const isDesc = part.startsWith('-');
          const key = isDesc ? part.substring(1) : part;
          const order = isDesc ? -1 : 1;
          const aVal = a[key] instanceof Date ? a[key].getTime() : a[key];
          const bVal = b[key] instanceof Date ? b[key].getTime() : b[key];
          if (aVal < bVal) return -1 * order;
          if (aVal > bVal) return 1 * order;
        }
        return 0;
      });
    }
    return this;
  }

  limit(limitNum) {
    this._data = this._data.slice(0, limitNum);
    return this;
  }

  skip(skipNum) {
    this._data = this._data.slice(skipNum);
    return this;
  }

  async exec() {
    await ensureConnected();
    if (this._isSingle) {
      const single = this._data[0];
      return single ? new this._modelClass(single) : null;
    }
    return this._data.map(item => new this._modelClass(item));
  }

  then(onResolve, onReject) {
    return this.exec().then(onResolve, onReject);
  }

  catch(onReject) {
    return this.exec().catch(onReject);
  }

  lean() {
    return {
      then: (onResolve, onReject) => {
        const res = this._isSingle ? (this._data[0] || null) : this._data;
        return Promise.resolve(res).then(onResolve, onReject);
      }
    };
  }
}

// Schema Implementation
const Types = {
  ObjectId: String,
  Mixed: Object
};

class Schema {
  constructor(definition, options) {
    this.definition = definition || {};
    this.options = options || {};
    this.methods = {};
    this.statics = {};
    this.hooks = { pre: {}, post: {} };
  }

  pre(hookName, fn) {
    if (!this.hooks.pre[hookName]) {
      this.hooks.pre[hookName] = [];
    }
    this.hooks.pre[hookName].push(fn);
  }

  post(hookName, fn) {
    if (!this.hooks.post[hookName]) {
      this.hooks.post[hookName] = [];
    }
    this.hooks.post[hookName].push(fn);
  }

  method(name, fn) {
    this.methods[name] = fn;
  }

  index(fields, options) {
    return this;
  }

  plugin(pluginFn, options) {
    if (typeof pluginFn === 'function') pluginFn(this, options);
    return this;
  }

  virtual(name) {
    return {
      get: () => this,
      set: () => this
    };
  }

  set(key, val) {
    this.options[key] = val;
    return this;
  }
}

Schema.Types = Types;

// Models Registry
const models = {};

function model(modelName, schema) {
  const sheetName = modelName.endsWith('s') ? modelName : modelName + 's';
  cache[sheetName] = cache[sheetName] || [];

  class Model {
    constructor(data = {}) {
      this._original = { ...data };
      Object.assign(this, data);
      if (!this._id) {
        this._id = generateId();
      }
      this.id = String(this._id);
      this.isNew = !cache[sheetName].some(doc => String(doc._id) === String(this._id));

      // Bind methods
      if (schema && schema.methods) {
        for (let methodName in schema.methods) {
          this[methodName] = schema.methods[methodName].bind(this);
        }
      }
    }

    isModified(field) {
      if (this.isNew) return true;
      return this[field] !== this._original[field];
    }

    async save() {
      await ensureConnected();
      // Execute Schema pre-save hooks
      if (schema && schema.hooks && schema.hooks.pre && schema.hooks.pre.save) {
        for (let hook of schema.hooks.pre.save) {
          await new Promise((resolve, reject) => {
            const result = hook.call(this, (err) => {
              if (err) reject(err);
              else resolve();
            });
            // Handle hooks that return a Promise without calling next()
            if (result && typeof result.then === 'function') {
              result.then(resolve).catch(reject);
            } else if (hook.length === 0) {
              resolve();
            }
          });
        }
      }

      this.updatedAt = new Date();
      if (!this.createdAt) {
        this.createdAt = new Date();
      }

      this.id = String(this._id);
      const plainDoc = JSON.parse(JSON.stringify(this));
      delete plainDoc._original;
      delete plainDoc.isNew;
      plainDoc.id = String(this._id);
      plainDoc._id = String(this._id);

      const existingIndex = cache[sheetName].findIndex(doc => String(doc._id) === String(this._id));
      if (existingIndex > -1) {
        cache[sheetName][existingIndex] = plainDoc;
      } else {
        cache[sheetName].push(plainDoc);
      }

      this._original = { ...plainDoc };
      this.isNew = false;

      // Sync asynchronously
      syncRowToSheet(sheetName, plainDoc);
      return this;
    }

    static find(query = {}) {
      const filtered = cache[sheetName].filter(doc => matchQuery(doc, query));
      return new Query(filtered, Model, false);
    }

    static findOne(query = {}) {
      const filtered = cache[sheetName].filter(doc => matchQuery(doc, query));
      return new Query(filtered, Model, true);
    }

    static findById(id) {
      if (!id) return new Query([], Model, true);
      const filtered = cache[sheetName].filter(doc => String(doc._id) === String(id));
      return new Query(filtered, Model, true);
    }

    static async create(data) {
      await ensureConnected();
      if (Array.isArray(data)) {
        const created = [];
        for (let item of data) {
          const doc = new Model(item);
          await doc.save();
          created.push(doc);
        }
        return created;
      }
      const doc = new Model(data);
      await doc.save();
      return doc;
    }

    static async findByIdAndUpdate(id, update, options = {}) {
      const matchIndex = cache[sheetName].findIndex(doc => String(doc._id) === String(id));
      if (matchIndex === -1) return null;

      const current = cache[sheetName][matchIndex];
      const updateData = update.$set || update;
      const updatedDoc = { ...current, ...updateData, updatedAt: new Date() };

      cache[sheetName][matchIndex] = updatedDoc;
      syncRowToSheet(sheetName, updatedDoc);
      return new Model(updatedDoc);
    }

    static async findOneAndUpdate(query, update, options = {}) {
      const match = cache[sheetName].find(doc => matchQuery(doc, query));
      if (!match) return null;
      return this.findByIdAndUpdate(match._id, update, options);
    }

    static async findByIdAndDelete(id) {
      const index = cache[sheetName].findIndex(doc => String(doc._id) === String(id));
      if (index !== -1) {
        const deleted = cache[sheetName][index];
        cache[sheetName].splice(index, 1);
        deleteRowFromSheet(sheetName, deleted._id);
        return new Model(deleted);
      }
      return null;
    }

    static async findOneAndDelete(query) {
      const index = cache[sheetName].findIndex(doc => matchQuery(doc, query));
      if (index !== -1) {
        const deleted = cache[sheetName][index];
        cache[sheetName].splice(index, 1);
        deleteRowFromSheet(sheetName, deleted._id);
        return new Model(deleted);
      }
      return null;
    }

    static async deleteOne(query) {
      const index = cache[sheetName].findIndex(doc => matchQuery(doc, query));
      if (index !== -1) {
        const doc = cache[sheetName][index];
        cache[sheetName].splice(index, 1);
        deleteRowFromSheet(sheetName, doc._id);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    }

    static async deleteMany(query = {}) {
      const toDelete = cache[sheetName].filter(doc => matchQuery(doc, query));
      for (let doc of toDelete) {
        const index = cache[sheetName].findIndex(d => d._id === doc._id);
        if (index !== -1) cache[sheetName].splice(index, 1);
        deleteRowFromSheet(sheetName, doc._id);
      }
      return { deletedCount: toDelete.length };
    }

    static async countDocuments(query = {}) {
      await ensureConnected();
      return cache[sheetName].filter(doc => matchQuery(doc, query)).length;
    }
  }

  // Bind statics
  if (schema && schema.statics) {
    for (let staticName in schema.statics) {
      Model[staticName] = schema.statics[staticName];
    }
  }

  Model._cache = cache[sheetName];
  models[modelName] = Model;
  return Model;
}

// Auto seed default data if database is empty
async function autoSeedDefaults() {
  // 1. Seed Questions from JSON if empty
  if (!cache['AptitudeQuestions'] || cache['AptitudeQuestions'].length === 0) {
    try {
      const aptPath = path.resolve(__dirname, 'seed.aptitude.json');
      if (fs.existsSync(aptPath)) {
        const raw = JSON.parse(fs.readFileSync(aptPath, 'utf8'));
        const questions = [];
        for (let cat in raw) {
          if (Array.isArray(raw[cat])) {
            raw[cat].forEach(q => questions.push({ ...q, _id: generateId(), isActive: true }));
          }
        }
        cache['AptitudeQuestions'] = questions;
        console.log(`Auto-seeded ${questions.length} Aptitude Questions.`);
      }
    } catch (e) {}
  }

  if (!cache['TechnicalQuestions'] || cache['TechnicalQuestions'].length === 0) {
    try {
      const techPath = path.resolve(__dirname, 'seed.technical.json');
      if (fs.existsSync(techPath)) {
        const raw = JSON.parse(fs.readFileSync(techPath, 'utf8'));
        const questions = [];
        for (let topic in raw) {
          if (Array.isArray(raw[topic])) {
            raw[topic].forEach(q => questions.push({ ...q, _id: generateId(), isActive: true }));
          }
        }
        cache['TechnicalQuestions'] = questions;
        console.log(`Auto-seeded ${questions.length} Technical Questions.`);
      }
    } catch (e) {}
  }
}

// Connect Function
async function connect() {
  console.log('Connecting to Google Sheets Database...');
  loadLocalDB();

  const collections = [
    'Users',
    'Resumes',
    'ATSReports',
    'MockInterviews',
    'Scores',
    'TechnicalQuestions',
    'AptitudeQuestions',
    'LearningResources'
  ];

  collections.forEach(name => {
    if (!cache[name]) cache[name] = [];
  });

  try {
    // Check if Google Sheets API is accessible
    const info = await sheetsApi('');
    if (info && info.properties) {
      sheetsEnabled = true;
      console.log(`Connected to Google Spreadsheet: "${info.properties.title}"`);

      // Initialize tabs and load remote data
      for (let name of collections) {
        await initializeSheet(name);
        const remoteData = await loadSheetData(name);
        if (remoteData.length > 0) {
          cache[name] = remoteData;
        }
        console.log(`Loaded ${cache[name].length} items for [${name}]`);
      }
    }
  } catch (err) {
    sheetsEnabled = false;
    console.warn('\n=============================================================');
    console.warn('⚠️  GOOGLE SHEETS PERMISSION NOTICE:');
    console.warn(`Please share your Google Sheet with Editor permission to:`);
    console.warn(`👉 ${clientEmail}`);
    console.warn('Until permissions are granted, operating safely on local storage backup.');
    console.warn('=============================================================\n');
  }

  await autoSeedDefaults();
  saveLocalDB();
}

let connectPromise = null;
async function ensureConnected() {
  if (sheetsEnabled && Object.keys(cache).length > 0 && cache['Users']) return;
  if (!connectPromise) {
    connectPromise = connect().catch(err => {
      console.warn('Lazy connect warning:', err.message);
    });
  }
  await connectPromise;
}

module.exports = {
  Schema,
  model,
  connect,
  ensureConnected,
  Types
};
