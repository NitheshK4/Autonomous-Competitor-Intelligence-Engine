const dns = require('dns').promises;
const { URL } = require('url');
const axios = require('axios');

async function getEnrichmentData(urlStr) {
  try {
    const parsedUrl = new URL(urlStr);
    const hostname = parsedUrl.hostname;
    
    console.log(`Running data enrichment for: ${hostname}...`);

    // Enrichment Source 2a: DNS / IP / MX Records Lookup
    let ipAddresses = [];
    let mxRecords = [];
    try {
      ipAddresses = await dns.resolve4(hostname);
    } catch (e) {
      console.log(`IP lookup failed for ${hostname}:`, e.message);
    }
    
    try {
      const mx = await dns.resolveMx(hostname);
      mxRecords = mx.map(m => `${m.exchange} (priority: ${m.priority})`);
    } catch (e) {
      console.log(`MX lookup failed for ${hostname}:`, e.message);
    }

    // Enrichment Source 2b: Tech Stack Headers Analysis
    let serverHeader = 'Unknown';
    let powerHeader = '';
    try {
      const res = await axios.head(urlStr, { timeout: 6000, validateStatus: () => true });
      if (res.headers['server']) serverHeader = res.headers['server'];
      if (res.headers['x-powered-by']) powerHeader = res.headers['x-powered-by'];
    } catch (e) {
      try {
        const res = await axios.get(urlStr, { timeout: 6000, validateStatus: () => true });
        if (res.headers['server']) serverHeader = res.headers['server'];
        if (res.headers['x-powered-by']) powerHeader = res.headers['x-powered-by'];
      } catch (e2) {}
    }

    return {
      ipAddresses,
      mxRecords,
      serverHeader,
      xPoweredBy: powerHeader,
      checkedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Enrichment failed:', err.message);
    return null;
  }
}

module.exports = { getEnrichmentData };
