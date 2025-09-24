// Load webhooks and setup UI on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadWebhooks();
  setupEventListeners();
});

// Event listeners
function setupEventListeners() {
  // Webhook selection change
  document.getElementById('webhook-select').addEventListener('change', (e) => {
    const hasSelection = e.target.value !== '';
    document.getElementById('save-page').disabled = !hasSelection;
    document.getElementById('save-selected').disabled = !hasSelection;
  });

  // Save entire page
  document.getElementById('save-page').addEventListener('click', async () => {
    const webhookInfo = getSelectedWebhook();
    if (!webhookInfo) return;

    await executeContentScript('savePage', webhookInfo.url, webhookInfo.name);
  });

  // Save selected text
  document.getElementById('save-selected').addEventListener('click', async () => {
    const webhookInfo = getSelectedWebhook();
    if (!webhookInfo) return;

    await executeContentScript('saveSelected', webhookInfo.url, webhookInfo.name);
  });

  // Manage webhooks link
  document.getElementById('manage-webhooks').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
    window.close();
  });

  // Setup webhooks button
  document.getElementById('setup-webhooks').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
}

async function loadWebhooks() {
  try {
    const result = await chrome.storage.sync.get(['webhooks']);
    const webhooks = result.webhooks || [];

    if (webhooks.length === 0) {
      showNoWebhooks();
      return;
    }

    showWebhookInterface();
    populateWebhookSelect(webhooks);

  } catch (error) {
    console.error('Error loading webhooks:', error);
    showStatus('Error loading webhooks', 'error');
  }
}

function showNoWebhooks() {
  document.getElementById('webhook-interface').style.display = 'none';
  document.getElementById('no-webhooks').style.display = 'block';
}

function showWebhookInterface() {
  document.getElementById('webhook-interface').style.display = 'block';
  document.getElementById('no-webhooks').style.display = 'none';
}

function populateWebhookSelect(webhooks) {
  const select = document.getElementById('webhook-select');

  // Clear existing options except first
  select.innerHTML = '<option value="">Select a webhook...</option>';

  // Add webhook options
  webhooks.forEach(webhook => {
    const option = document.createElement('option');
    option.value = JSON.stringify({ id: webhook.id, name: webhook.name, url: webhook.url });
    option.textContent = webhook.name;
    select.appendChild(option);
  });

  // Auto-select if only one webhook
  if (webhooks.length === 1) {
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
  }
}

function getSelectedWebhook() {
  const select = document.getElementById('webhook-select');
  const selectedValue = select.value;

  if (!selectedValue) {
    showStatus('Please select a webhook first', 'error');
    return null;
  }

  try {
    return JSON.parse(selectedValue);
  } catch (error) {
    console.error('Error parsing webhook data:', error);
    showStatus('Error with webhook selection', 'error');
    return null;
  }
}

async function executeContentScript(action, webhookUrl, webhookName) {
  showStatus('Saving...', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('No active tab found');
    }

    // Send message to background script to handle the execution
    const response = await chrome.runtime.sendMessage({
      action: 'executeScript',
      tabId: tab.id,
      scriptAction: action,
      webhookUrl: webhookUrl,
      webhookName: webhookName
    });

    if (response && response.success) {
      showStatus('Request sent!', 'success');
    } else {
      throw new Error(response?.error || 'Unknown error');
    }

    setTimeout(() => {
      window.close();
    }, 2000);

  } catch (error) {
    console.error('Error in executeContentScript:', error);
    showStatus('Error: ' + error.message, 'error');
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
}