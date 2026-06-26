document.addEventListener('DOMContentLoaded', async () => {
  const urlInput = document.getElementById('url');
  const nameInput = document.getElementById('name');
  const scopeInput = document.getElementById('scope');
  const addBtn = document.getElementById('addBtn');
  const alertBox = document.getElementById('alertBox');
  const optionsLink = document.getElementById('optionsLink');

  // Load config settings
  const config = await chrome.storage.sync.get(['backendUrl', 'apiKey']);
  const backendUrl = config.backendUrl || 'http://localhost:3000';
  const apiKey = config.apiKey || '';

  optionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  if (!apiKey) {
    showAlert('Please configure your extension API Key in options first.', 'danger');
    addBtn.disabled = true;
    return;
  }

  // Pre-fill active tab URL and guess competitor name
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const activeTab = tabs[0];
      urlInput.value = activeTab.url;

      try {
        const domain = new URL(activeTab.url).hostname;
        const parts = domain.replace('www.', '').split('.');
        const guessName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        nameInput.value = guessName;
      } catch (e) {
        nameInput.value = '';
      }
    }
  });

  addBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    const name = nameInput.value.trim();
    const scope = scopeInput.value;

    if (!url || !name) {
      showAlert('All fields are required.', 'danger');
      return;
    }

    // Set loading state
    addBtn.disabled = true;
    addBtn.innerHTML = '<span class="spinner"></span>Registering...';
    hideAlert();

    try {
      const response = await fetch(`${backendUrl}/api/extension/add-competitor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, url, scope })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Server rejected registration.');
      }

      showAlert('Competitor added and initial check enqueued!', 'success');
      // Trigger background page to update badge count
      chrome.runtime.sendMessage({ action: 'updateBadge' });

      setTimeout(() => {
        window.close();
      }, 2500);

    } catch (err) {
      showAlert(err.message, 'danger');
      addBtn.disabled = false;
      addBtn.textContent = 'Add Competitor';
    }
  });

  function showAlert(msg, type) {
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
  }

  function hideAlert() {
    alertBox.style.display = 'none';
  }
});
