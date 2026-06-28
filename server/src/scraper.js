const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'public', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Clean HTML to remove noise like headers, footers, scripts, styles, cookie banners
function cleanHtml($, scope = 'full', customSelector = null) {
  // Remove scripts, styles, forms, inputs, headers, footers, navs
  $('script').remove();
  $('style').remove();
  $('iframe').remove();
  $('noscript').remove();
  $('header').remove();
  $('footer').remove();
  $('nav').remove();
  
  // Remove common cookie consent, popup, and banner selectors
  const noiseSelectors = [
    '[class*="cookie"]', '[id*="cookie"]', 
    '[class*="consent"]', '[id*="consent"]',
    '[class*="banner"]', '[id*="banner"]',
    '[class*="popup"]', '[id*="popup"]',
    '[class*="modal"]', '[id*="modal"]',
    '[class*="ad-"]', '[class*="advertisement"]',
    '#onetrust-consent-sdk', '.optanon-consent-sdk',
    '[role="dialog"]', '[aria-modal="true"]'
  ];
  
  noiseSelectors.forEach(selector => {
    try {
      $(selector).remove();
    } catch (e) {
      // Ignore invalid selectors
    }
  });

  let targetElement = $('body');

  if (customSelector) {
    const selected = $(customSelector);
    if (selected.length > 0) {
      targetElement = selected;
    }
  } else if (scope === 'pricing') {
    // Look for common pricing containers
    const pricingSelectors = [
      '#pricing', '.pricing', 'section[id*="pricing"]', 'div[class*="pricing"]',
      '#price', '.price', 'div[class*="plan"]', 'div[class*="tier"]'
    ];
    for (const selector of pricingSelectors) {
      const found = $(selector);
      if (found.length > 0) {
        targetElement = found;
        break;
      }
    }
  } else if (scope === 'careers') {
    // Look for common careers/jobs containers
    const careersSelectors = [
      '#careers', '.careers', 'section[id*="careers"]', 'div[class*="careers"]',
      '#jobs', '.jobs', 'div[class*="job-"]', 'div[class*="opening"]'
    ];
    for (const selector of careersSelectors) {
      const found = $(selector);
      if (found.length > 0) {
        targetElement = found;
        break;
      }
    }
  }

  // Extract clean text lines
  const lines = [];
  targetElement.find('*').each(function() {
    const text = $(this).clone().children().remove().end().text().trim();
    if (text) {
      // Filter out typical UI noise (e.g. single-word actions, social link texts)
      if (text.length > 1 && !text.match(/^(click|login|signup|share|follow|scroll|cookie|close|accept|decline|ok|yes|no)$/i)) {
        lines.push(text);
      }
    }
  });

  // Deduplicate consecutive identical lines (e.g. from tables or list items)
  const cleanLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === 0 || lines[i] !== lines[i - 1]) {
      cleanLines.push(lines[i]);
    }
  }

  return cleanLines.join('\n');
}

// Scrape using static HTML fetch
async function scrapeStatic(url, scope = 'full', customSelector = null) {
  const ua = getRandomUserAgent();
  const response = await axios.get(url, {
    headers: {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);
  const textContent = cleanHtml($, scope, customSelector);
  return {
    textContent,
    htmlContent: response.data
  };
}

// Scrape using Puppeteer for JS-rendered pages and screenshot archiving
async function scrapeDynamic(url, scope = 'full', customSelector = null, competitorId = 'temp') {
  const ua = getRandomUserAgent();
  
  // Puppeteer launch arguments optimized for Railway memory limit (512MB RAM)
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, // Railway Chrome path
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process', // Important for memory saving
      '--no-zygote',
      '--no-first-run',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(ua);
    await page.setViewport({ width: 1280, height: 800 });

    // Enable request interception to block images, media, and web fonts to save memory
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media', 'font', 'websocket'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Navigate with a timeout of 30s
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait an extra 2 seconds for JS execution/SPA rendering
    await new Promise(resolve => setTimeout(resolve, 2000));

    const htmlContent = await page.content();
    const $ = cheerio.load(htmlContent);
    const textContent = cleanHtml($, scope, customSelector);

    // Capture screenshot for visual diff
    let screenshotPath = '';
    try {
      const filename = `${competitorId}_${Date.now()}.png`;
      const fullPath = path.join(SCREENSHOTS_DIR, filename);
      await page.screenshot({ path: fullPath, type: 'png' });
      screenshotPath = `/screenshots/${filename}`;
    } catch (err) {
      console.error('Failed to take screenshot:', err.message);
    }

    return {
      textContent,
      htmlContent,
      screenshotPath
    };
  } finally {
    await browser.close();
  }
}

// Unified scrape runner
async function runScrape(competitor) {
  const { url, scope, js_enabled, id } = competitor;
  const isCloudEnv = !!(process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_SERVICE_ID || process.env.RENDER_EXTERNAL_URL);

  if (js_enabled) {
    return await scrapeDynamic(url, scope, null, id);
  } else {
    // For static scraping, we can also generate a basic screenshot by loading it in puppeteer once.
    // However, to save memory, we try Axios first. If Axios fails, we can fallback.
    try {
      const result = await scrapeStatic(url, scope, null);
      
      // If we want screenshots even for static pages, we can fetch them via a quick Puppeteer launch.
      // We do this inside a try-catch so that if Puppeteer fails, we still have the text content!
      // In cloud environments, we skip this to prevent Out-Of-Memory crashes!
      let screenshotPath = '';
      if (!isCloudEnv) {
        try {
          const pResult = await scrapeDynamic(url, scope, null, id);
          screenshotPath = pResult.screenshotPath;
        } catch (e) {
          console.error('Screenshot capture failed for static page:', e.message);
        }
      }
      
      return {
        textContent: result.textContent,
        htmlContent: result.htmlContent,
        screenshotPath
      };
    } catch (err) {
      console.log(`Static scrape failed for ${url}, trying dynamic fallback...`);
      if (isCloudEnv) {
        throw new Error(`Static scrape failed: ${err.message}. Dynamic fallback is disabled in cloud environments to prevent Out-Of-Memory crashes.`);
      }
      return await scrapeDynamic(url, scope, null, id);
    }
  }
}

module.exports = {
  scrapeStatic,
  scrapeDynamic,
  runScrape
};
