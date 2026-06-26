// Alarm polling for unread intelligence count
chrome.runtime.onInstalled.addListener(() => {
  // Set up 1-minute alarm to fetch unread badge updates
  chrome.alarms.create('fetchUnreadCount', { periodInMinutes: 1 });
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Alarm trigger listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'fetchUnreadCount') {
    updateBadge();
  }
});

// Direct message listener to update badge immediately when settings change or additions occur
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'updateBadge') {
    updateBadge();
  }
});

async function updateBadge() {
  try {
    const config = await chrome.storage.sync.get(['backendUrl', 'apiKey']);
    const backendUrl = config.backendUrl;
    const apiKey = config.apiKey;

    if (!backendUrl || !apiKey) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' }); // Amber warning
      return;
    }

    const response = await fetch(`${backendUrl}/api/extension/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Connection failed');
    }

    const data = await response.json();
    const count = data.unreadCount || 0;

    if (count > 0) {
      chrome.action.setBadgeText({ text: String(count) });
      chrome.action.setBadgeBackgroundColor({ color: '#38bdf8' }); // Bright cyan badge
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    console.error('Badge update failed:', err.message);
    chrome.action.setBadgeText({ text: '?' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' }); // Red error indicator
  }
}
