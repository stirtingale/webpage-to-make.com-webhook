// Load webhooks on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadWebhooks();
});

// Add webhook button
document.getElementById('add-webhook').addEventListener('click', async () => {
    const name = document.getElementById('webhook-name').value.trim();
    const url = document.getElementById('webhook-url').value.trim();

    if (!name || !url) {
        showStatus('Please enter both a name and URL', 'error');
        return;
    }

    if (!isValidUrl(url)) {
        showStatus('Please enter a valid URL', 'error');
        return;
    }

    await addWebhook(name, url);
});

// Enter key support
document.getElementById('webhook-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('add-webhook').click();
    }
});

document.getElementById('webhook-url').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('add-webhook').click();
    }
});

async function loadWebhooks() {
    try {
        const result = await chrome.storage.sync.get(['webhooks']);
        const webhooks = result.webhooks || [];

        renderWebhookList(webhooks);
    } catch (error) {
        console.error('Error loading webhooks:', error);
        showStatus('Error loading webhooks', 'error');
    }
}

async function addWebhook(name, url) {
    try {
        const result = await chrome.storage.sync.get(['webhooks']);
        const webhooks = result.webhooks || [];

        // Check if name already exists
        if (webhooks.some(w => w.name === name)) {
            showStatus('A webhook with this name already exists', 'error');
            return;
        }

        // Add new webhook
        const newWebhook = {
            id: Date.now().toString(),
            name: name,
            url: url,
            created: new Date().toISOString()
        };

        webhooks.push(newWebhook);

        await chrome.storage.sync.set({ webhooks });

        // Clear form
        document.getElementById('webhook-name').value = '';
        document.getElementById('webhook-url').value = '';

        // Reload list
        await loadWebhooks();

        showStatus(`Webhook "${name}" added successfully`, 'success');

        // Notify background script to update context menus
        chrome.runtime.sendMessage({ action: 'updateContextMenus' });

    } catch (error) {
        console.error('Error adding webhook:', error);
        showStatus('Error adding webhook', 'error');
    }
}

async function deleteWebhook(id) {
    if (!confirm('Are you sure you want to delete this webhook?')) {
        return;
    }

    try {
        const result = await chrome.storage.sync.get(['webhooks']);
        const webhooks = result.webhooks || [];

        const updatedWebhooks = webhooks.filter(w => w.id !== id);

        await chrome.storage.sync.set({ webhooks: updatedWebhooks });

        await loadWebhooks();

        showStatus('Webhook deleted successfully', 'success');

        // Notify background script to update context menus
        chrome.runtime.sendMessage({ action: 'updateContextMenus' });

    } catch (error) {
        console.error('Error deleting webhook:', error);
        showStatus('Error deleting webhook', 'error');
    }
}

async function editWebhook(id) {
    try {
        const result = await chrome.storage.sync.get(['webhooks']);
        const webhooks = result.webhooks || [];

        const webhook = webhooks.find(w => w.id === id);
        if (!webhook) return;

        const newName = prompt('Enter new name:', webhook.name);
        if (newName === null) return; // User cancelled

        if (!newName.trim()) {
            showStatus('Name cannot be empty', 'error');
            return;
        }

        const newUrl = prompt('Enter new URL:', webhook.url);
        if (newUrl === null) return; // User cancelled

        if (!newUrl.trim() || !isValidUrl(newUrl.trim())) {
            showStatus('Please enter a valid URL', 'error');
            return;
        }

        // Check if new name conflicts with existing webhooks (except current one)
        if (webhooks.some(w => w.name === newName.trim() && w.id !== id)) {
            showStatus('A webhook with this name already exists', 'error');
            return;
        }

        // Update webhook
        webhook.name = newName.trim();
        webhook.url = newUrl.trim();
        webhook.updated = new Date().toISOString();

        await chrome.storage.sync.set({ webhooks });

        await loadWebhooks();

        showStatus('Webhook updated successfully', 'success');

        // Notify background script to update context menus
        chrome.runtime.sendMessage({ action: 'updateContextMenus' });

    } catch (error) {
        console.error('Error editing webhook:', error);
        showStatus('Error editing webhook', 'error');
    }
}

function renderWebhookList(webhooks) {
    const listContainer = document.getElementById('webhook-list');

    if (webhooks.length === 0) {
        listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔗</div>
        <div>No webhooks configured yet</div>
        <div style="font-size: 12px; margin-top: 8px;">Add your first webhook above to get started</div>
      </div>
    `;
        return;
    }

    listContainer.innerHTML = webhooks.map(webhook => `
    <div class="webhook-item">
      <div class="webhook-name">${escapeHtml(webhook.name)}</div>
      <div class="webhook-url" title="${escapeHtml(webhook.url)}">${escapeHtml(webhook.url)}</div>
      <div class="webhook-actions">
        <button class="btn btn-primary" onclick="editWebhook('${webhook.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteWebhook('${webhook.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';

    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}