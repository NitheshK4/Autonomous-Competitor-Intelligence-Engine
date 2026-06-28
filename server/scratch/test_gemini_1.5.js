require('dotenv').config({ path: '/Users/nitheshkumar/Documents/acie/.env' });
const axios = require('axios');

async function testGemini(apiKey) {
  const systemPrompt = `You are a text change detector.`;
  const userPrompt = `Test`;
  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    console.log('Success:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Error Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err);
    }
  }
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  await testGemini(apiKey);
}

run().then(() => process.exit(0));
