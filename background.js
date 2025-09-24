// Create context menu items when extension installs
chrome.runtime.onInstalled.addListener(() => {
  // Save selected text option (only shows when text is selected)
  chrome.contextMenus.create({
    id: "save-selected-text",
    title: "Save selected text to Google Sheets",
    contexts: ["selection"]
  });
  
  // Save entire page option (shows on any page)
  chrome.contextMenus.create({
    id: "save-full-page",
    title: "Save page to Google Sheets",
    contexts: ["page"]
  });
  
  // Save link option (shows when right-clicking links)
  chrome.contextMenus.create({
    id: "save-link",
    title: "Save link to Google Sheets",
    contexts: ["link"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Get stored webhook URL
  const result = await chrome.storage.sync.get(['webhookUrl']);
  const webhookUrl = result.webhookUrl;
  
  if (!webhookUrl) {
    // Show extension popup to configure webhook
    chrome.action.openPopup();
    return;
  }
  
  // Execute the appropriate action based on menu item clicked
  switch (info.menuItemId) {
    case 'save-selected-text':
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: saveSelectedText,
        args: [webhookUrl, info.selectionText]
      });
      break;
      
    case 'save-full-page':
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: saveFullPage,
        args: [webhookUrl]
      });
      break;
      
    case 'save-link':
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: saveLink,
        args: [webhookUrl, info.linkUrl]
      });
      break;
  }
});

// Functions to inject into the page
function saveSelectedText(webhookUrl, selectedText) {
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    title: document.title,
    text: selectedText,
    type: 'selected_text',
    method: 'context_menu'
  };
  
  sendToWebhook(webhookUrl, data, '📝 Selected text');
}

function saveFullPage(webhookUrl) {
  // Try to get main content first, fallback to body
  const mainContent = 
    document.querySelector('main')?.innerText ||
    document.querySelector('article')?.innerText ||
    document.querySelector('.content')?.innerText ||
    document.body.innerText;
    
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    title: document.title,
    text: mainContent.trim().substring(0, 10000),
    type: 'full_page',
    method: 'context_menu'
  };
  
  sendToWebhook(webhookUrl, data, '📄 Page');
}

function saveLink(webhookUrl, linkUrl) {
  const data = {
    timestamp: new Date().toISOString(),
    url: linkUrl,
    title: `Link from: ${document.title}`,
    text: `Link saved from: ${window.location.href}`,
    type: 'link',
    method: 'context_menu'
  };
  
  sendToWebhook(webhookUrl, data, '🔗 Link');
}

function sendToWebhook(webhookUrl, data, itemType) {
  // Show notification
  const notification = showNotification(`⏳ Saving ${itemType}...`, '#6366f1');
  
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (response.ok) {
      notification.innerHTML = `✅ ${itemType} saved!`;
      notification.style.background = '#10b981';
    } else {
      throw new Error('HTTP ' + response.status);
    }
  })
  .catch(error => {
    notification.innerHTML = `❌ Error saving ${itemType}`;
    notification.style.background = '#ef4444';
    console.error('Save error:', error);
  })
  .finally(() => {
    setTimeout(() => notification.remove(), 3000);
  });
}

function showNotification(message, color) {
  // Remove any existing notifications
  const existing = document.querySelector('.sheets-save-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'sheets-save-notification';
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
    transition: all 0.3s ease;
  `;
  notification.innerHTML = message;
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }, 10);
  
  return notification;
}