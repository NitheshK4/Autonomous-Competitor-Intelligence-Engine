const axios = require('axios');

async function sendSlackNotification(card, competitorName, webhookUrl) {
  if (!webhookUrl) return;

  try {
    const payload = {
      text: `🔥 *High-Impact Competitor Intel Detected! (Score: ${card.impact_score}/10)*`,
      attachments: [
        {
          color: card.impact_score >= 8 ? '#ef4444' : '#f97316',
          title: `[${card.category.toUpperCase()}] ${competitorName}`,
          title_link: card.competitor_url || undefined,
          text: `*Summary:* ${card.summary}\n\n*Recommended Action:* ${card.recommendation}`,
          fields: [
            {
              title: "Category",
              value: card.category,
              short: true
            },
            {
              title: "Impact Score",
              value: `${card.impact_score}/10`,
              short: true
            }
          ],
          ts: Math.floor(new Date(card.timestamp || Date.now()).getTime() / 1000)
        }
      ]
    };

    await axios.post(webhookUrl, payload, { timeout: 8000 });
    console.log(`Slack real-time notification sent for card ${card.id}`);
  } catch (err) {
    console.error('Failed to send Slack notification:', err.message);
  }
}

module.exports = { sendSlackNotification };
