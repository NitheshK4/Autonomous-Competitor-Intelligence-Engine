const { Client } = require('@notionhq/client');
const axios = require('axios');
const db = require('./db');

// Sync a single card to the configured CRM
async function syncCard(card, config, hostUrl = 'http://localhost:3000') {
  if (!config || config.active_crm === 'none') {
    return { success: true, status: 'skipped', message: 'No CRM integration configured.' };
  }

  const screenshotUrl = card.screenshot_path
    ? (card.screenshot_path.startsWith('http') ? card.screenshot_path : `${hostUrl}${card.screenshot_path}`)
    : '';

  try {
    if (config.active_crm === 'notion') {
      if (!config.notion_token || !config.notion_db_id) {
        throw new Error('Notion token or Database ID is missing in settings.');
      }
      await syncToNotion(card, config, screenshotUrl);
    } else if (config.active_crm === 'airtable') {
      if (!config.airtable_key || !config.airtable_base_id) {
        throw new Error('Airtable API key or Base ID is missing in settings.');
      }
      await syncToAirtable(card, config, screenshotUrl);
    }

    // Success: Update database status
    await db.updateIntelligenceCard(card.id, {
      crm_sync_status: 'synced',
      crm_error: ''
    });
    
    // Remove from queue if it was queued
    await db.removeFromCrmQueue(card.id);

    return { success: true, status: 'synced' };
  } catch (err) {
    const errMsg = err.message || 'Unknown CRM sync error';
    console.error(`CRM sync failed for card ${card.id}:`, errMsg);

    // Save failure status and error in DB
    await db.updateIntelligenceCard(card.id, {
      crm_sync_status: 'failed',
      crm_error: errMsg
    });

    // Enqueue for future retry
    await db.enqueueCrmRetry(card.id);

    return { success: false, status: 'failed', error: errMsg };
  }
}

// Notion Sync Helper
async function syncToNotion(card, config, screenshotUrl) {
  const notion = new Client({ auth: config.notion_token });

  const properties = {
    'Title': {
      title: [
        {
          text: {
            content: `[${card.category.toUpperCase()}] ${card.competitor_name}`
          }
        }
      ]
    },
    'Competitor Name': {
      select: {
        name: card.competitor_name.replace(/,/g, '') // Notion selects don't allow commas
      }
    },
    'URL': {
      url: card.competitor_url
    },
    'Category': {
      select: {
        name: card.category
      }
    },
    'Impact Score': {
      number: card.impact_score
    },
    'Recommended Action': {
      rich_text: [
        {
          text: {
            content: card.recommendation || ''
          }
        }
      ]
    },
    'Summary': {
      rich_text: [
        {
          text: {
            content: (card.summary || '').substring(0, 2000) // Notion text block limit is 2000 chars
          }
        }
      ]
    },
    'Justification': {
      rich_text: [
        {
          text: {
            content: (card.justification || '').substring(0, 2000)
          }
        }
      ]
    }
  };

  if (screenshotUrl) {
    properties['Screenshot URL'] = {
      url: screenshotUrl
    };
  }

  await notion.pages.create({
    parent: { database_id: config.notion_db_id },
    properties: properties
  });
}

// Airtable Sync Helper
async function syncToAirtable(card, config, screenshotUrl) {
  const tableName = config.airtable_table_name || 'Competitor Intel';
  const url = `https://api.airtable.com/v0/${config.airtable_base_id}/${encodeURIComponent(tableName)}`;

  const fields = {
    'Title': `[${card.category.toUpperCase()}] ${card.competitor_name}`,
    'Competitor Name': card.competitor_name,
    'URL': card.competitor_url,
    'Category': card.category,
    'Summary': card.summary,
    'Justification': card.justification,
    'Impact Score': card.impact_score,
    'Recommended Action': card.recommendation,
    'Timestamp': card.timestamp
  };

  if (screenshotUrl) {
    fields['Screenshot URL'] = screenshotUrl;
  }

  await axios.post(
    url,
    { fields },
    {
      headers: {
        'Authorization': `Bearer ${config.airtable_key}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );
}

// Run the retry queue for all pending failed syncs
async function runRetryQueue(hostUrl = 'http://localhost:3000') {
  const queue = await db.getCrmQueue();
  if (queue.length === 0) {
    return { processed: 0, successes: 0 };
  }

  console.log(`Processing CRM retry queue: ${queue.length} items pending...`);
  const crmConfigJson = await db.getSetting('crm_config');
  const crmConfig = crmConfigJson ? JSON.parse(crmConfigJson) : null;

  if (!crmConfig || crmConfig.active_crm === 'none') {
    console.log('Skipping retry queue: No CRM active configuration.');
    return { processed: queue.length, successes: 0 };
  }

  let successes = 0;
  for (const item of queue) {
    const card = {
      id: item.card_id,
      competitor_id: item.competitor_id,
      competitor_name: item.competitor_name,
      competitor_url: item.competitor_url,
      category: item.category,
      summary: item.summary,
      impact_score: item.impact_score,
      justification: item.justification,
      recommendation: item.recommendation,
      screenshot_path: item.screenshot_path,
      timestamp: item.timestamp
    };

    const res = await syncCard(card, crmConfig, hostUrl);
    if (res.success) {
      successes++;
    }
  }

  console.log(`CRM retry queue processing complete. Successes: ${successes}/${queue.length}`);
  return { processed: queue.length, successes };
}

module.exports = {
  syncCard,
  runRetryQueue
};
