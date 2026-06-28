require('dotenv').config({ path: '/Users/nitheshkumar/Documents/acie/.env' });
const axios = require('axios');

async function listModels(apiKey) {
  try {
    const res = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    console.log('Available Models:', res.data.models.map(m => m.name));
  } catch (err) {
    if (err.response) {
      console.log('Error:', err.response.data);
    } else {
      console.error(err);
    }
  }
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  await listModels(apiKey);
}

run().then(() => process.exit(0));
