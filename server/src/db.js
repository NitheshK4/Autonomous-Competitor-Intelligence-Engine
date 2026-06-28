const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'database.sqlite');

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await dbInstance.run('PRAGMA foreign_keys = ON');

  // Initialize tables
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT,
      product_desc TEXT,
      customers TEXT,
      price_point TEXT
    );

    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      url TEXT UNIQUE,
      interval_hours INTEGER DEFAULT 6,
      scope TEXT DEFAULT 'full', -- 'full', 'pricing', 'careers'
      status TEXT DEFAULT 'active', -- 'active', 'paused', 'error'
      last_checked TEXT,
      js_enabled INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS scrapes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER,
      timestamp TEXT,
      text_content TEXT,
      screenshot_path TEXT,
      FOREIGN KEY(competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS intelligence_cards (
      id TEXT PRIMARY KEY,
      competitor_id INTEGER,
      category TEXT,
      summary TEXT,
      impact_score INTEGER,
      justification TEXT,
      recommendation TEXT,
      screenshot_path TEXT,
      crm_sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
      crm_error TEXT,
      is_read INTEGER DEFAULT 0,
      timestamp TEXT,
      FOREIGN KEY(competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS crm_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT UNIQUE,
      retries INTEGER DEFAULT 0,
      last_attempt TEXT,
      FOREIGN KEY(card_id) REFERENCES intelligence_cards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Try adding enrichment_data column to competitors table dynamically
  try {
    await dbInstance.exec('ALTER TABLE competitors ADD COLUMN enrichment_data TEXT');
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Insert default settings if they don't exist
  const defaultSettings = [
    { key: 'api_key', value: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) },
    { key: 'digest_schedule', value: 'daily' }, // 'daily', 'weekly'
    { key: 'last_digest_sent', value: '' },
    { key: 'slack_webhook_url', value: '' },
    { key: 'email_config', value: JSON.stringify({ provider: 'smtp', smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', recipient_email: '' }) },
    { key: 'crm_config', value: JSON.stringify({ active_crm: 'none', notion_token: '', notion_db_id: '', airtable_key: '', airtable_base_id: '', airtable_table_name: 'Competitor Intel' }) }
  ];

  for (const setting of defaultSettings) {
    const exists = await dbInstance.get('SELECT 1 FROM settings WHERE key = ?', [setting.key]);
    if (!exists) {
      await dbInstance.run('INSERT INTO settings (key, value) VALUES (?, ?)', [setting.key, setting.value]);
    }
  }

  return dbInstance;
}

// Profile operations
async function getProfile() {
  const db = await getDb();
  return await db.get('SELECT * FROM profile ORDER BY id DESC LIMIT 1');
}

async function saveProfile(profileData) {
  const db = await getDb();
  const existing = await getProfile();
  if (existing) {
    await db.run(
      'UPDATE profile SET business_name = ?, product_desc = ?, customers = ?, price_point = ? WHERE id = ?',
      [profileData.business_name, profileData.product_desc, profileData.customers, profileData.price_point, existing.id]
    );
  } else {
    await db.run(
      'INSERT INTO profile (business_name, product_desc, customers, price_point) VALUES (?, ?, ?, ?)',
      [profileData.business_name, profileData.product_desc, profileData.customers, profileData.price_point]
    );
  }
  return await getProfile();
}

// Competitor operations
async function addCompetitor(competitor) {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.run(
    'INSERT INTO competitors (name, url, interval_hours, scope, status, js_enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      competitor.name,
      competitor.url,
      competitor.interval_hours || 6,
      competitor.scope || 'full',
      competitor.status || 'active',
      competitor.js_enabled || 0,
      now
    ]
  );
  return { id: result.lastID, ...competitor, created_at: now };
}

async function getCompetitors() {
  const db = await getDb();
  return await db.all('SELECT * FROM competitors ORDER BY id DESC');
}

async function getCompetitorById(id) {
  const db = await getDb();
  return await db.get('SELECT * FROM competitors WHERE id = ?', [id]);
}

async function getCompetitorByUrl(url) {
  const db = await getDb();
  return await db.get('SELECT * FROM competitors WHERE url = ?', [url]);
}

async function updateCompetitor(id, updates) {
  const db = await getDb();
  const fields = [];
  const params = [];
  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    params.push(val);
  }
  params.push(id);
  await db.run(`UPDATE competitors SET ${fields.join(', ')} WHERE id = ?`, params);
  return await getCompetitorById(id);
}

async function deleteCompetitor(id) {
  const db = await getDb();
  await db.run('DELETE FROM competitors WHERE id = ?', [id]);
  return true;
}

// Scrape operations
async function saveScrape(scrape) {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO scrapes (competitor_id, timestamp, text_content, screenshot_path) VALUES (?, ?, ?, ?)',
    [scrape.competitor_id, scrape.timestamp, scrape.text_content, scrape.screenshot_path || '']
  );
  return { id: result.lastID, ...scrape };
}

async function getLatestScrape(competitorId) {
  const db = await getDb();
  return await db.get(
    'SELECT * FROM scrapes WHERE competitor_id = ? ORDER BY id DESC LIMIT 1',
    [competitorId]
  );
}

async function getScrapeHistory(competitorId) {
  const db = await getDb();
  return await db.all(
    'SELECT * FROM scrapes WHERE competitor_id = ? ORDER BY id DESC',
    [competitorId]
  );
}

// Intelligence Card operations
async function saveIntelligenceCard(card) {
  const db = await getDb();
  await db.run(
    'INSERT INTO intelligence_cards (id, competitor_id, category, summary, impact_score, justification, recommendation, screenshot_path, crm_sync_status, crm_error, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      card.id,
      card.competitor_id,
      card.category,
      card.summary,
      card.impact_score,
      card.justification,
      card.recommendation,
      card.screenshot_path || '',
      card.crm_sync_status || 'pending',
      card.crm_error || '',
      card.timestamp
    ]
  );
  return card;
}

async function getIntelligenceCards(filters = {}) {
  const db = await getDb();
  let query = `
    SELECT ic.*, c.name as competitor_name, c.url as competitor_url 
    FROM intelligence_cards ic
    JOIN competitors c ON ic.competitor_id = c.id
  `;
  const conditions = [];
  const params = [];

  if (filters.competitor_id) {
    conditions.push('ic.competitor_id = ?');
    params.push(filters.competitor_id);
  }
  if (filters.category) {
    conditions.push('ic.category = ?');
    params.push(filters.category);
  }
  if (filters.unreadOnly) {
    conditions.push('ic.is_read = 0');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY ic.timestamp DESC';

  return await db.all(query, params);
}

async function getIntelligenceCardById(id) {
  const db = await getDb();
  return await db.get(
    `SELECT ic.*, c.name as competitor_name, c.url as competitor_url 
     FROM intelligence_cards ic
     JOIN competitors c ON ic.competitor_id = c.id
     WHERE ic.id = ?`,
    [id]
  );
}

async function updateIntelligenceCard(id, updates) {
  const db = await getDb();
  const fields = [];
  const params = [];
  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    params.push(val);
  }
  params.push(id);
  await db.run(`UPDATE intelligence_cards SET ${fields.join(', ')} WHERE id = ?`, params);
  return await getIntelligenceCardById(id);
}

async function markAllAsRead() {
  const db = await getDb();
  await db.run('UPDATE intelligence_cards SET is_read = 1');
  return true;
}

// CRM Queue operations
async function enqueueCrmRetry(cardId) {
  const db = await getDb();
  const now = new Date().toISOString();
  const existing = await db.get('SELECT * FROM crm_queue WHERE card_id = ?', [cardId]);
  if (existing) {
    await db.run(
      'UPDATE crm_queue SET retries = retries + 1, last_attempt = ? WHERE card_id = ?',
      [now, cardId]
    );
  } else {
    await db.run(
      'INSERT INTO crm_queue (card_id, retries, last_attempt) VALUES (?, 0, ?)',
      [cardId, now]
    );
  }
}

async function getCrmQueue() {
  const db = await getDb();
  return await db.all(`
    SELECT cq.*, ic.id as card_id, ic.competitor_id, ic.category, ic.summary, ic.impact_score, ic.justification, ic.recommendation, ic.screenshot_path, ic.timestamp, c.name as competitor_name, c.url as competitor_url
    FROM crm_queue cq
    JOIN intelligence_cards ic ON cq.card_id = ic.id
    JOIN competitors c ON ic.competitor_id = c.id
    ORDER BY cq.id ASC
  `);
}

async function removeFromCrmQueue(cardId) {
  const db = await getDb();
  await db.run('DELETE FROM crm_queue WHERE card_id = ?', [cardId]);
}

// Settings operations
async function getSetting(key) {
  const db = await getDb();
  const row = await db.get('SELECT value FROM settings WHERE key = ?', [key]);
  let val = row ? row.value : null;

  if (key === 'crm_config') {
    try {
      const config = val ? JSON.parse(val) : { active_crm: 'none', notion_token: '', notion_db_id: '', airtable_key: '', airtable_base_id: '', airtable_table_name: 'Competitor Intel' };
      let changed = false;
      if (process.env.NOTION_TOKEN && (!config.notion_token || config.active_crm === 'none')) {
        config.active_crm = 'notion';
        config.notion_token = process.env.NOTION_TOKEN;
        changed = true;
      }
      const envDbId = process.env.NOTION_DB_ID || process.env.NOTION_DATABASE_ID;
      if (envDbId && !config.notion_db_id) {
        config.notion_db_id = envDbId;
        changed = true;
      }
      if (changed) {
        val = JSON.stringify(config);
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  } else if (key === 'slack_webhook_url') {
    if ((!val || val === '') && process.env.SLACK_WEBHOOK_URL) {
      val = process.env.SLACK_WEBHOOK_URL;
    }
  } else if (key === 'api_key') {
    if ((!val || val === '') && process.env.API_KEY) {
      val = process.env.API_KEY;
    }
  }

  return val;
}

async function setSetting(key, value) {
  const db = await getDb();
  await db.run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    [key, value, value]
  );
  return value;
}

module.exports = {
  getDb,
  getProfile,
  saveProfile,
  addCompetitor,
  getCompetitors,
  getCompetitorById,
  getCompetitorByUrl,
  updateCompetitor,
  deleteCompetitor,
  saveScrape,
  getLatestScrape,
  getScrapeHistory,
  saveIntelligenceCard,
  getIntelligenceCards,
  getIntelligenceCardById,
  updateIntelligenceCard,
  markAllAsRead,
  enqueueCrmRetry,
  getCrmQueue,
  removeFromCrmQueue,
  getSetting,
  setSetting
};
