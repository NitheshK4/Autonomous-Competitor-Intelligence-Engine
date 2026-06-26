document.addEventListener('DOMContentLoaded', async () => {
  const backendUrlInput = document.getElementById('backendUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusBox = document.getElementById('statusBox');

  // Load existing values
  const config = await chrome.storage.sync.get(['backendUrl', 'apiKey']);
  backendUrlInput.value = config.backendUrl || 'http://localhost:3000';
  apiKeyInput.value = config.apiKey || '';

  saveBtn.addEventListener('click', async () => {
    let backendUrl = backendUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    // Strip trailing slashes
    if (backendUrl.endsWith('/')) {
      backendUrl = backendUrl.slice(0, -1);
    }

    if (!backendUrl || !apiKey) {
      showStatus('All fields are required.', 'danger');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Verifying connection...';
    hideStatus();

    try {
      // Perform handshake verification
      const verifyRes = await fetch(`${backendUrl}/api/extension/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!verifyRes.ok) {
        throw new Error('Connection failed or API Key is invalid.');
      }

      // Save to chrome storage
      await chrome.storage.sync.set({ backendUrl, apiKey });
      showStatus('Configurations saved and connection verified successfully!', 'success');
      
      // Notify background service worker to fetch badge count immediately
      chrome.runtime.sendMessage({ action: 'updateBadge' });

    } catch (err) {
      showStatus(`Error: ${err.message}`, 'danger');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Verify and Save Settings';
    }
  });

  function showStatus(msg, type) {
    statusBox.textContent = msg;
    statusBox.className = `alert alert-${type}`;
    statusBox.style.display = 'block';
  }

  function hideStatus() {
    statusBox.style.display = 'none';
  }
});
