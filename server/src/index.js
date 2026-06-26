const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db');
const queue = require('./queue');
const { sendDigestEmail } = require('./mailer');
const { syncCard } = require('./crm');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve screenshots static directory
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use('/screenshots', express.static(path.join(PUBLIC_DIR, 'screenshots')));

// Set up host url in settings if it changed/initialized
async function initHostUrl() {
  const hostUrl = process.env.RAILWAY_STATIC_URL
    ? `https://${process.env.RAILWAY_STATIC_URL}`
    : `http://localhost:${PORT}`;
  await db.setSetting('host_url', hostUrl);
  console.log(`Application Host URL configured: ${hostUrl}`);
}

// ----------------------------------------------------
// EXTENSION AUTH MIDDLEWARE
// ----------------------------------------------------
async function checkExtensionAuth(req, res, next) {
  const apiKeySetting = await db.getSetting('api_key');
  const requestKey = req.headers['authorization']?.replace('Bearer ', '') || req.query.api_key;

  if (!apiKeySetting || requestKey !== apiKeySetting) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key.' });
  }
  next();
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Business Profile (Onboarding)
app.get('/api/profile', async (req, res) => {
  try {
    const profile = await db.getProfile();
    res.json(profile || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const { business_name, product_desc, customers, price_point } = req.body;
    if (!business_name || !product_desc) {
      return res.status(400).json({ error: 'Business name and product description are required.' });
    }
    const profile = await db.saveProfile({ business_name, product_desc, customers, price_point });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Competitors
app.get('/api/competitors', async (req, res) => {
  try {
    const list = await db.getCompetitors();
    
    // Enrich with change metrics for dashboard
    const enriched = await Promise.all(list.map(async comp => {
      const cards = await db.getIntelligenceCards({ competitor_id: comp.id });
      // Filter changes detected this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const changesThisWeek = cards.filter(c => new Date(c.timestamp) > oneWeekAgo).length;

      return {
        ...comp,
        changes_this_week: changesThisWeek
      };
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/competitors', async (req, res) => {
  try {
    const { name, url, interval_hours, scope, js_enabled } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required.' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format. Include http:// or https://' });
    }

    const existing = await db.getCompetitorByUrl(url);
    if (existing) {
      return res.status(400).json({ error: 'A competitor with this URL is already registered.' });
    }

    const comp = await db.addCompetitor({
      name,
      url,
      interval_hours: parseInt(interval_hours, 10) || 6,
      scope: scope || 'full',
      js_enabled: js_enabled ? 1 : 0
    });

    // Run first check automatically
    queue.addJob(comp.id);

    res.status(201).json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/competitors/:id', async (req, res) => {
  try {
    const competitor = await db.getCompetitorById(req.params.id);
    if (!competitor) return res.status(404).json({ error: 'Competitor not found.' });

    const history = await db.getIntelligenceCards({ competitor_id: req.params.id });
    const scrapes = await db.getScrapeHistory(req.params.id);

    res.json({
      competitor,
      history,
      latestScrape: scrapes[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/competitors/:id', async (req, res) => {
  try {
    const { name, interval_hours, scope, status, js_enabled } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (interval_hours) updates.interval_hours = parseInt(interval_hours, 10);
    if (scope) updates.scope = scope;
    if (status) updates.status = status;
    if (typeof js_enabled !== 'undefined') updates.js_enabled = js_enabled ? 1 : 0;

    const comp = await db.updateCompetitor(req.params.id, updates);
    res.json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/competitors/:id', async (req, res) => {
  try {
    await db.deleteCompetitor(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/competitors/:id/check', async (req, res) => {
  try {
    const comp = await db.getCompetitorById(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Competitor not found.' });

    // Mark as active and reset error
    await db.updateCompetitor(comp.id, { status: 'active' });

    queue.addJob(comp.id);
    res.json({ success: true, message: 'Check enqueued successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Intelligence Feed
app.get('/api/intelligence', async (req, res) => {
  try {
    const { competitor_id, category, unreadOnly } = req.query;
    const list = await db.getIntelligenceCards({
      competitor_id: competitor_id ? parseInt(competitor_id, 10) : undefined,
      category,
      unreadOnly: unreadOnly === 'true'
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/intelligence/read-all', async (req, res) => {
  try {
    await db.markAllAsRead();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/intelligence/:id', async (req, res) => {
  try {
    const { is_read } = req.body;
    const updates = {};
    if (typeof is_read !== 'undefined') updates.is_read = is_read ? 1 : 0;
    
    const card = await db.updateIntelligenceCard(req.params.id, updates);
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/intelligence/:id/retry', async (req, res) => {
  try {
    const card = await db.getIntelligenceCardById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Intelligence card not found.' });

    const crmConfigJson = await db.getSetting('crm_config');
    const crmConfig = crmConfigJson ? JSON.parse(crmConfigJson) : null;
    const hostUrlSetting = await db.getSetting('host_url') || 'http://localhost:3000';

    const syncRes = await syncCard(card, crmConfig, hostUrlSetting);
    if (syncRes.success) {
      res.json({ success: true, message: 'CRM sync succeeded.' });
    } else {
      res.status(500).json({ error: syncRes.error });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings Management
app.get('/api/settings', async (req, res) => {
  try {
    const api_key = await db.getSetting('api_key');
    const digest_schedule = await db.getSetting('digest_schedule');
    const last_digest_sent = await db.getSetting('last_digest_sent');
    const emailConfigStr = await db.getSetting('email_config');
    const crmConfigStr = await db.getSetting('crm_config');
    const semantic_threshold = await db.getSetting('semantic_threshold') || '0.85';

    res.json({
      api_key,
      digest_schedule,
      last_digest_sent,
      semantic_threshold: parseFloat(semantic_threshold),
      email_config: emailConfigStr ? JSON.parse(emailConfigStr) : {},
      crm_config: crmConfigStr ? JSON.parse(crmConfigStr) : {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { api_key, digest_schedule, semantic_threshold, email_config, crm_config } = req.body;

    if (api_key) await db.setSetting('api_key', api_key);
    if (digest_schedule) await db.setSetting('digest_schedule', digest_schedule);
    if (semantic_threshold) await db.setSetting('semantic_threshold', semantic_threshold.toString());
    
    if (email_config) {
      await db.setSetting('email_config', JSON.stringify(email_config));
    }
    if (crm_config) {
      await db.setSetting('crm_config', JSON.stringify(crm_config));
    }

    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/test-email', async (req, res) => {
  try {
    const resMail = await sendDigestEmail('test');
    if (resMail.success) {
      res.json({ success: true, message: `Test email sent successfully. Included ${resMail.count || 0} cards.` });
    } else {
      res.status(500).json({ error: resMail.error || resMail.reason || 'Test send failed.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to simulate a competitor's pricing page for local integration testing
app.get('/api/test-page', (req, res) => {
  const price = req.query.price || '99';
  const plan = req.query.plan || 'Standard Starter Plan';
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Competitor Pricing Page</title>
      </head>
      <body>
        <h1>Competitor Outreach Services</h1>
        <div id="pricing-plan" style="padding: 20px; border: 1px solid #ccc; max-width: 300px; border-radius: 8px;">
          <h2>${plan}</h2>
          <p>Get started with our premium cold email outreach platform.</p>
          <p style="font-size: 24px; font-weight: bold; color: green;">$${price}/month</p>
        </div>
        <div id="features" style="margin-top: 15px;">
          <h3>Included Features:</h3>
          <ul>
            <li>10,000 sent emails per month</li>
            <li>5 active target domains</li>
            <li>AI agent writing helper</li>
            <li>Slack notifications integration</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// ----------------------------------------------------
// CHROME EXTENSION ENDPOINTS
// ----------------------------------------------------
app.get('/api/extension/status', checkExtensionAuth, async (req, res) => {
  res.json({ success: true, status: 'connected', version: '1.0.0' });
});

app.get('/api/extension/unread-count', checkExtensionAuth, async (req, res) => {
  try {
    const cards = await db.getIntelligenceCards({ unreadOnly: true });
    res.json({ unreadCount: cards.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/extension/add-competitor', checkExtensionAuth, async (req, res) => {
  try {
    const { name, url, scope } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Competitor name and URL are required.' });
    }

    try {
      new URL(url);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format.' });
    }

    const existing = await db.getCompetitorByUrl(url);
    if (existing) {
      return res.status(400).json({ error: 'URL already exists.' });
    }

    const comp = await db.addCompetitor({
      name,
      url,
      interval_hours: 6, // Default interval
      scope: scope || 'full',
      js_enabled: 0 // Default static
    });

    // Enqueue check job immediately
    queue.addJob(comp.id);

    res.status(201).json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static build files in production environment
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    // Exclude API paths
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/screenshots/')) {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    }
  });
}

// ----------------------------------------------------
// CRON SCHEDULER LOOPS (POLLING)
// ----------------------------------------------------

// Polling interval loop for checking competitors (runs every 5 minutes)
async function startCompetitorScheduler() {
  console.log('Background competitor check scheduler started.');
  setInterval(async () => {
    try {
      const list = await db.getCompetitors();
      const now = new Date();
      
      for (const comp of list) {
        if (comp.status === 'paused') continue;

        const lastCheckedStr = comp.last_checked;
        const intervalHours = comp.interval_hours || 6;
        
        let shouldCheck = false;
        if (!lastCheckedStr) {
          shouldCheck = true; // Never checked before
        } else {
          const lastCheckedDate = new Date(lastCheckedStr);
          const diffMs = now - lastCheckedDate;
          const diffHours = diffMs / (1000 * 60 * 60);
          if (diffHours >= intervalHours) {
            shouldCheck = true;
          }
        }

        if (shouldCheck) {
          console.log(`Scheduler: Competitor ${comp.name} (${comp.url}) check is due. Enqueueing job.`);
          // Check if queue has space or is already checking
          queue.addJob(comp.id);
        }
      }
    } catch (e) {
      console.error('Error in competitor check scheduler loop:', e.message);
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Polling interval loop for sending digests (runs every hour)
async function startDigestScheduler() {
  console.log('Background email digest scheduler started.');
  setInterval(async () => {
    try {
      const schedule = await db.getSetting('digest_schedule') || 'daily';
      const lastSentStr = await db.getSetting('last_digest_sent');
      const now = new Date();

      let isDue = false;
      if (!lastSentStr) {
        // Run on first setup
        isDue = true;
      } else {
        const lastSentDate = new Date(lastSentStr);
        const diffMs = now - lastSentDate;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (schedule === 'daily' && diffHours >= 24) {
          isDue = true;
        } else if (schedule === 'weekly' && diffHours >= 24 * 7) {
          isDue = true;
        }
      }

      if (isDue) {
        console.log(`Scheduler: ${schedule} digest is due. Sending...`);
        const res = await sendDigestEmail(schedule);
        if (res.success) {
          console.log(`Scheduler: ${schedule} digest successfully processed.`);
        }
      }
    } catch (e) {
      console.error('Error in digest scheduler loop:', e.message);
    }
  }, 60 * 60 * 1000); // 1 hour
}

// ----------------------------------------------------
// SERVER LAUNCH
// ----------------------------------------------------
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    // Initialise host settings
    await initHostUrl();
    
    // Start scheduler loops
    startCompetitorScheduler();
    startDigestScheduler();
  } catch (err) {
    console.error('Post startup initialization failed:', err.message);
  }
});
