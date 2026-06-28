require('dotenv').config({ path: '/Users/nitheshkumar/Documents/acie/.env' });
process.env.RAILWAY_STATIC_URL = "test"; // Force cloud env behavior

const { detectChanges } = require('/Users/nitheshkumar/Documents/acie/server/src/detector');

async function run() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  console.log('Gemini API Key present:', !!geminiApiKey);
  
  const oldText = "";
  const newText = "Hacker News\nSome article 1\nSome article 2";
  
  console.log('Running detectChanges...');
  const res = await detectChanges(oldText, newText, 0.85);
  console.log('Result:', res);
}

run().then(() => process.exit(0));
