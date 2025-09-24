// Load saved webhook URL
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get(['webhookUrl']);
  if (result.webhookUrl) {
    document.getElementById('webhook-url').value = result.webhookUrl;
  }
});

// Save webhook URL when changed
document.getElementById('webhook-url').addEventListener('change', async (e) => {
  await chrome.storage.sync.set({ webhookUrl: e.target.value });
});

// Save entire page
document.getElementById('save-page').addEventListener('click', async () => {
  const webhookUrl = document.getElementById('webhook-url').value;
  
  if (!webhookUrl) {
    showStatus('Please enter your Make.com webhook URL first', 'error');
    return;
  }

  await saveWebhookUrl();
  await executeContentScript('savePage', webhookUrl);
});

// Save selected text
document.getElementById('save-selected').addEventListener('click', async () => {
  const webhookUrl = document.getElementById('webhook-url').value;
  
  if (!webhookUrl) {
    showStatus('Please enter your Make.com webhook URL first', 'error');
    return;
  }

  await saveWebhookUrl();
  await executeContentScript('saveSelected', webhookUrl);
});

async function saveWebhookUrl() {
  const webhookUrl = document.getElementById('webhook-url').value;
  await chrome.storage.sync.set({ webhookUrl });
}

async function executeContentScript(action, webhookUrl) {
  showStatus('Saving...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: action === 'savePage' ? savePageContent : saveSelectedContent,
      args: [webhookUrl]
    });
    
    // The content script will handle showing success/error messages
    setTimeout(() => {
      window.close();
    }, 1000);
    
  } catch (error) {
    console.error('Error:', error);
    showStatus('Error: ' + error.message, 'error');
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
}

// These functions will be injected into the page
function savePageContent(webhookUrl) {
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    title: document.title,
    text: document.body.innerText.trim().substring(0, 10000), // Limit to 10k chars
    type: 'full_page'
  };
  
  sendToWebhook(webhookUrl, data);
}

function saveSelectedContent(webhookUrl) {
  const selectedText = window.getSelection().toString().trim();
  
  if (!selectedText) {
    showNotification('❌ No text selected', '#ef4444');
    return;
  }
  
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    title: document.title,
    text: selectedText,
    type: 'selected_text'
  };
  
  sendToWebhook(webhookUrl, data);
}

function sendToWebhook(webhookUrl, data) {
  // Show loading notification
  const loader = showNotification('⏳ Saving to Google Sheets...', '#6366f1');
  
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (response.ok) {
      loader.innerHTML = '✅ Saved to Google Sheets!';
      loader.style.background = '#10b981';
    } else {
      throw new Error('HTTP ' + response.status);
    }
  })
  .catch(error => {
    loader.innerHTML = '❌ Error saving';
    loader.style.background = '#ef4444';
    console.error('Save error:', error);
  })
  .finally(() => {
    setTimeout(() => loader.remove(), 3000);
  });
}

function showNotification(message, color) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
  `;
  notification.innerHTML = message;
  document.body.appendChild(notification);
  return notification;
}