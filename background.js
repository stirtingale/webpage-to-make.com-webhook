// Create context menu items when extension installs
chrome.runtime.onInstalled.addListener(() => {
  updateContextMenus();
});

// Handle messages from popup and options page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeScript') {
    executeScriptOnTab(request.tabId, request.scriptAction, request.webhookUrl, request.webhookName)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  } else if (request.action === 'updateContextMenus') {
    updateContextMenus();
    sendResponse({ success: true });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuItemId = info.menuItemId;

  // Handle special menu items
  if (menuItemId === 'configure-webhooks' || menuItemId === 'configure-webhooks-bottom') {
    chrome.runtime.openOptionsPage();
    return;
  }

  // Parse the menu item ID to get action and webhook info
  const parts = menuItemId.split('_');
  if (parts.length < 2) return;

  const action = parts[0]; // 'page', 'selected', or 'link'
  const webhookId = parts.slice(1).join('_'); // Rejoin in case webhook ID has underscores

  // Get webhook by ID
  const result = await chrome.storage.sync.get(['webhooks']);
  const webhooks = result.webhooks || [];
  const webhook = webhooks.find(w => w.id === webhookId);

  if (!webhook) {
    console.error('Webhook not found:', webhookId);
    return;
  }

  // Execute the appropriate action
  try {
    switch (action) {
      case 'selected':
        await executeScriptOnTab(tab.id, 'saveSelected', webhook.url, webhook.name, info.selectionText);
        break;

      case 'page':
        await executeScriptOnTab(tab.id, 'savePage', webhook.url, webhook.name);
        break;

      case 'link':
        await executeScriptOnTab(tab.id, 'saveLink', webhook.url, webhook.name, info.linkUrl);
        break;
    }
  } catch (error) {
    console.error('Context menu execution error:', error);
  }
});

// Update context menus based on current webhooks
async function updateContextMenus() {
  // Clear existing menus
  await chrome.contextMenus.removeAll();

  // Get webhooks
  const result = await chrome.storage.sync.get(['webhooks']);
  const webhooks = result.webhooks || [];

  if (webhooks.length === 0) {
    // Show single "Configure Webhooks" option if none exist
    chrome.contextMenus.create({
      id: "configure-webhooks",
      title: "Configure webhooks...",
      contexts: ["page", "selection", "link"]
    });
    return;
  }

  if (webhooks.length === 1) {
    // Single webhook - show simple menu items
    const webhook = webhooks[0];
    chrome.contextMenus.create({
      id: `selected_${webhook.id}`,
      title: `Save selected text to ${webhook.name}`,
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: `page_${webhook.id}`,
      title: `Save page to ${webhook.name}`,
      contexts: ["page"]
    });

    chrome.contextMenus.create({
      id: `link_${webhook.id}`,
      title: `Save link to ${webhook.name}`,
      contexts: ["link"]
    });
  } else {
    // Multiple webhooks - show submenu for each context

    // Selected text submenu
    chrome.contextMenus.create({
      id: "save-selected-parent",
      title: "Save selected text to...",
      contexts: ["selection"]
    });

    webhooks.forEach(webhook => {
      chrome.contextMenus.create({
        id: `selected_${webhook.id}`,
        parentId: "save-selected-parent",
        title: webhook.name,
        contexts: ["selection"]
      });
    });

    // Page submenu
    chrome.contextMenus.create({
      id: "save-page-parent",
      title: "Save page to...",
      contexts: ["page"]
    });

    webhooks.forEach(webhook => {
      chrome.contextMenus.create({
        id: `page_${webhook.id}`,
        parentId: "save-page-parent",
        title: webhook.name,
        contexts: ["page"]
      });
    });

    // Link submenu
    chrome.contextMenus.create({
      id: "save-link-parent",
      title: "Save link to...",
      contexts: ["link"]
    });

    webhooks.forEach(webhook => {
      chrome.contextMenus.create({
        id: `link_${webhook.id}`,
        parentId: "save-link-parent",
        title: webhook.name,
        contexts: ["link"]
      });
    });
  }

  // Always add separator and configure option
  chrome.contextMenus.create({
    id: "separator",
    type: "separator",
    contexts: ["page", "selection", "link"]
  });

  chrome.contextMenus.create({
    id: "configure-webhooks-bottom",
    title: "Configure webhooks...",
    contexts: ["page", "selection", "link"]
  });
}

// Unified script execution function
async function executeScriptOnTab(tabId, scriptAction, webhookUrl, webhookName, extraData = null) {
  try {
    // First inject helper functions
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: injectHelperFunctions
    });

    // Then execute the specific action
    switch (scriptAction) {
      case 'savePage':
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: executePageSave,
          args: [webhookUrl, webhookName]
        });
        break;

      case 'saveSelected':
        if (extraData) {
          // From context menu with selected text
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: executeSelectedSaveWithText,
            args: [webhookUrl, webhookName, extraData]
          });
        } else {
          // From popup, get selection dynamically
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: executeSelectedSave,
            args: [webhookUrl, webhookName]
          });
        }
        break;

      case 'saveLink':
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: executeLinkSave,
          args: [webhookUrl, webhookName, extraData]
        });
        break;
    }
  } catch (error) {
    console.error('Script execution error:', error);
    throw error;
  }
}

// Helper functions injection (shared between popup and background)
function injectHelperFunctions() {
  // Only inject if not already present
  if (window.webhookExtensionHelpers) return;

  window.webhookExtensionHelpers = {
    showNotification: function (message, color) {
      // Remove any existing notifications
      const existing = document.querySelector('.webhook-save-notification');
      if (existing) existing.remove();

      const notification = document.createElement('div');
      notification.className = 'webhook-save-notification';
      notification.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: ${color} !important;
        color: white !important;
        padding: 12px 20px !important;
        border-radius: 8px !important;
        z-index: 10000 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        max-width: 300px !important;
        pointer-events: auto !important;
      `;
      notification.innerHTML = message;
      document.body.appendChild(notification);
      return notification;
    },

    sendToWebhook: function (webhookUrl, webhookName, data, itemType = 'content') {
      const notification = this.showNotification(`⏳ Saving ${itemType} to ${webhookName}...`, '#6366f1');

      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
        .then(response => {
          if (response.ok) {
            notification.innerHTML = `✅ ${itemType} saved to ${webhookName}!`;
            notification.style.background = '#10b981';
          } else {
            throw new Error('HTTP ' + response.status);
          }
        })
        .catch(error => {
          notification.innerHTML = `❌ Error saving ${itemType} to ${webhookName}`;
          notification.style.background = '#ef4444';
          console.error('Save error:', error);
        })
        .finally(() => {
          setTimeout(() => {
            if (notification && notification.parentNode) {
              notification.remove();
            }
          }, 3000);
        });
    }
  };
}

// Functions to inject into the page
function executePageSave(webhookUrl, webhookName) {
  const helpers = window.webhookExtensionHelpers;
  if (!helpers) {
    console.error('Helper functions not found');
    return;
  }

  // Try to get main content first
  const mainContent =
    document.querySelector('main')?.innerText ||
    document.querySelector('article')?.innerText ||
    document.querySelector('.content')?.innerText ||
    document.querySelector('#content')?.innerText ||
    document.body.innerText;

  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    title: document.title,
    text: mainContent.trim().substring(0, 10000),
    type: 'full_page',
    method: 'extension',
    webhook_name: webhookName
  };

  helpers.sendToWebhook(webhookUrl, webhookName, data, 'page');
}

function executeSelectedSave(webhookUrl, webhookName) {
  const helpers = window.webhookExtensionHelpers;
  if (!helpers) {
    console.error('Helper functions not found');
    return;
  }

  const selectedText = window.getSelection().toString().trim();

  if (!selectedText) {
    helpers.showNotification('❌ No text selected', '#ef4444');
    setTimeout(() => {
      const notification = document.querySelector('.webhook-save-notification');
      if (notification) notification.remove();
    }, 2000);
    return;
  }

  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    title: document.title,
    text: selectedText,
    type: 'selected_text',
    method: 'popup',
    webhook_name: webhookName
  };

  helpers.sendToWebhook(webhookUrl, webhookName, data, 'selected text');
}

function executeSelectedSaveWithText(webhookUrl, webhookName, selectedText) {
  const helpers = window.webhookExtensionHelpers;
  if (!helpers) {
    console.error('Helper functions not found');
    return;
  }

  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    title: document.title,
    text: selectedText,
    type: 'selected_text',
    method: 'context_menu',
    webhook_name: webhookName
  };

  helpers.sendToWebhook(webhookUrl, webhookName, data, 'selected text');
}

function executeLinkSave(webhookUrl, webhookName, linkUrl) {
  const helpers = window.webhookExtensionHelpers;
  if (!helpers) {
    console.error('Helper functions not found');
    return;
  }

  const data = {
    timestamp: new Date().toISOString(),
    url: linkUrl,
    title: `Link from: ${document.title}`,
    text: `Link saved from: ${window.location.href}`,
    type: 'link',
    method: 'context_menu',
    webhook_name: webhookName
  };

  helpers.sendToWebhook(webhookUrl, webhookName, data, 'link');
}