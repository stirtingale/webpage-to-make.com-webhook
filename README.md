# Save to Webhook - Chrome Extension

A powerful Chrome extension that instantly saves webpage content via multiple named webhooks. Save entire pages, selected text, or links with a simple right-click or toolbar button to any configured webhook endpoint.

## ✨ Features

- **🖱️ Smart right-click menus** - Save content instantly with webhook selection
- **🎯 Multiple webhook support** - Configure multiple named webhooks for different purposes
- **📝 Multiple save modes** - Full page, selected text, or links
- **⚙️ Management interface** - Easy webhook configuration via extension options page
- **🔄 Cross-device sync** - Settings sync across all your Chrome browsers
- **💾 Persistent storage** - Remembers your settings between sessions
- **✅ Visual feedback** - Clean notifications show save status with webhook names
- **🛡️ Secure** - All data goes directly to your webhook endpoints

## 🚀 Quick Start

### 1. Install Chrome Extension (1 minute)

1. Download/clone this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** → select the extension folder
5. Pin the extension to your toolbar (optional)

### 2. Configure Webhooks (2 minutes)

1. Right-click on any webpage → "Configure webhooks..."
2. OR click extension icon → "Setup Webhooks"
3. OR go to `chrome://extensions/` → Click "Details" on the extension → "Extension options"

**Add your first webhook:**

- **Name**: "My Webhook" (or any descriptive name)
- **URL**: Your webhook endpoint URL
- Click "Add Webhook"

### 3. Start Saving! (instant)

**Right-click method** (recommended):

- Right-click any webpage → Choose from your configured webhooks
- Select text first → Right-click → Choose webhook for selected text
- Right-click any link → Choose webhook to save the link

**Popup method**:

- Click extension icon → Select webhook → Choose save type

## 📖 How to Use

### Right-Click Context Menus (Recommended)

The extension creates smart context menus based on your configured webhooks:

#### Single Webhook

- Simple menu options: "Save page to [Webhook Name]"
- "Save selected text to [Webhook Name]" (when text is selected)
- "Save link to [Webhook Name]" (when right-clicking links)

#### Multiple Webhooks

- **Save page to...** → Submenu with all your webhooks
- **Save selected text to...** → Submenu with all your webhooks (when text selected)
- **Save link to...** → Submenu with all your webhooks (when right-clicking links)

#### No Webhooks Configured

- **Configure webhooks...** → Opens the management page

### Toolbar Popup (Alternative Method)

1. **Click the extension icon** in your toolbar
2. **Select a webhook** from the dropdown (auto-selected if only one)
3. **Choose your action**:
   - **Save Page** - Saves entire page content
   - **Save Selected** - Saves currently selected text (if any)

## 📊 Data Format

The extension sends this JSON data structure to your webhook:

```json
{
  "timestamp": "2025-09-24T10:30:00.000Z",
  "url": "https://example.com/article",
  "title": "Article Title",
  "text": "The saved content text...",
  "type": "selected_text|full_page|link",
  "method": "context_menu|popup",
  "webhook_name": "My Webhook"
}
```

## 🔧 Installation

### File Structure

Create a folder with these files:

```
save-to-webhook/
├── manifest.json      # Extension configuration
├── background.js      # Context menu handler and webhook management
├── popup.html         # Extension popup interface
├── popup.js          # Popup functionality
├── options.html      # Webhook management page
├── options.js        # Webhook management logic
├── content.js        # Content script (minimal)
├── icon16.png        # 16x16 icon (optional)
├── icon48.png        # 48x48 icon (optional)
└── icon128.png       # 128x128 icon (optional)
```

### Required Files

1. **manifest.json** - Extension configuration and permissions
2. **background.js** - Handles context menus, webhook storage, and script execution
3. **popup.html** - User interface for the toolbar popup
4. **popup.js** - Logic for the popup interface
5. **options.html** - Webhook management page interface
6. **options.js** - Logic for webhook CRUD operations
7. **content.js** - Minimal content script (required by manifest)

### Optional Files

- **Icons** (16px, 48px, 128px PNG files) - For a professional appearance
- Without icons, Chrome shows a default puzzle piece icon

### Creating Icons

**Quick method**: Use [favicon.io](https://favicon.io/emoji-favicons/) with the 🔗 emoji to generate all required sizes.

## ⚙️ Configuration

### Webhook URL Storage

- **Location**: Chrome's built-in `chrome.storage.sync`
- **Persistence**: Survives browser restarts and extension updates
- **Sync**: Automatically syncs across devices signed into the same Chrome account
- **Security**: Only accessible by this extension, encrypted by Chrome
- **Privacy**: Stored locally, never sent to third parties

### Settings Management

- **Auto-save**: Webhook URL is saved automatically when entered
- **Auto-load**: Previously saved URL loads when extension opens
- **Validation**: Extension checks for webhook URL before attempting saves

## 🛠️ Advanced Usage

### Webhook Integration Ideas

Your webhook endpoint can process the data in various ways:

#### Data Storage

- **Database storage** - Save to MySQL, PostgreSQL, MongoDB
- **File systems** - Write to text files, JSON, CSV
- **Cloud storage** - AWS S3, Google Cloud Storage
- **Document systems** - Save to Notion, Airtable, spreadsheets

#### Data Processing

- **Text analysis** - Sentiment analysis, keyword extraction
- **Content summarization** - Generate abstracts or summaries
- **Language detection** - Identify and translate content
- **Duplicate detection** - Check for previously saved content

#### Notifications & Actions

- **Email alerts** - Send notifications about saved content
- **Chat integrations** - Post to Slack, Discord, Teams
- **RSS feeds** - Generate feeds from saved content
- **API forwarding** - Send data to other services

#### Smart Routing

- **Domain-based routing** - Different handling for different websites
- **Content-based filtering** - Route based on keywords or content type
- **Time-based processing** - Handle work vs personal saves differently

### Error Handling

The extension includes robust error handling:

- **Network errors** - Shows retry-friendly error messages
- **Invalid webhook** - Prompts user to check URL
- **Server downtime** - Graceful failure with clear messaging
- **Missing permissions** - Guides user to grant required permissions

### Browser Permissions

The extension requests minimal permissions:

- **activeTab** - Access current tab content for saving
- **storage** - Save webhook URL persistently
- **contextMenus** - Add right-click menu options

No browsing history, personal data, or cross-site access required.

## 🔍 Troubleshooting

### Common Issues

#### Nothing happens when clicking context menu

- **Check webhook URL** - Ensure it's correctly entered in the popup
- **Verify webhook endpoint** - Confirm it's accepting POST requests
- **Test webhook** - Send a test request to verify it's working

#### "Error saving" notification

- **Invalid webhook URL** - Double-check the URL format
- **Server errors** - Check your webhook server logs
- **Network connectivity** - Ensure internet connection is stable

#### Context menus don't appear

- **Extension not loaded** - Check chrome://extensions/ for errors
- **Permissions denied** - Try disabling and re-enabling the extension
- **Page compatibility** - Some pages block extension scripts

#### Webhook URL not saving

- **Storage permissions** - Ensure extension has storage permission
- **Chrome sync issues** - Try signing out and back into Chrome
- **Extension updates** - Reload the extension after code changes

### Debug Mode

To debug issues:

1. **Open extension popup** → Right-click → Inspect
2. **Check console** for JavaScript errors
3. **Test webhook** directly with tools like Postman or curl
4. **Monitor webhook server logs** for incoming requests

### Performance Tips

- **Limit text length** - Extension automatically limits to 10,000 characters
- **Use selected text** for large pages to save only what you need
- **Optimize webhook response time** for better user experience

## 🔒 Security & Privacy

### Data Handling

- **Direct transmission** - Content goes directly from browser to your webhook
- **No intermediary storage** - Extension doesn't store content locally
- **Encrypted transport** - All requests use HTTPS (if your webhook uses HTTPS)
- **User control** - You choose what content to save

### Permissions Explained

- **activeTab** - Only accesses the current tab when you trigger a save
- **storage** - Only stores the webhook URL, no content or personal data
- **contextMenus** - Only adds menu items, doesn't access menu data from other extensions

### Webhook Integration

- **Your endpoint** - All data goes to your designated webhook URL
- **Your processing** - You control how the data is handled and stored
- **Your security** - Implement authentication/validation as needed

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- **UI enhancements** - Better popup design, dark mode support
- **Content detection** - Smarter main content extraction algorithms
- **Export formats** - Support for Markdown, PDF, or other formats
- **Batch operations** - Save multiple tabs at once
- **Keyboard shortcuts** - Hotkeys for common actions
- **Advanced filtering** - Regex patterns for content processing

### Development Setup

1. Clone repository
2. Make changes to source files
3. Go to `chrome://extensions/` → Click refresh button on extension
4. Test changes on various websites

### Code Style

- **ES6+ JavaScript** - Modern syntax and features
- **Minimal dependencies** - Uses only Chrome APIs and vanilla JS
- **Clean separation** - Background, content, and popup scripts clearly separated
- **Error handling** - Comprehensive try/catch and user feedback

## 📋 Changelog

### v1.0.0 (Current)

- Initial release
- Right-click context menus for text, pages, and links
- Toolbar popup interface
- Webhook integration
- Chrome storage sync for settings
- Visual feedback notifications
- Smart content detection

### Planned Features

- **Keyboard shortcuts** (Ctrl/Cmd + S for quick save)
- **Batch save** multiple tabs
- **Content categories** with dropdown selection
- **Export/import** settings
- **Usage statistics** and save history

## 📄 License

MIT License - Feel free to modify and distribute

## 🆘 Support

- **Issues**: Create an issue in this repository
- **Webhook setup**: Consult your webhook service documentation
- **Chrome extensions**: See [Chrome Developer Documentation](https://developer.chrome.com/docs/extensions/)

---

**Made with ❤️ for productivity enthusiasts who want to quickly capture web content via webhooks**
