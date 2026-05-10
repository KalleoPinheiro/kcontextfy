# Chrome Extension Architecture

KContextify uses Manifest V3 architecture.

## Components

### Content Script (`content.js`)
- Runs in context of web page
- Extracts DOM content using Readability-style heuristics
- Identifies page type (article/video/generic)
- Communicates with background service worker

### Background Service Worker (`background.js`)
- Orchestrates popup ↔ content script communication
- Converts HTML to Markdown using Turndown
- Manages chrome.storage for settings
- Handles extension lifecycle events

### Popup (`popup.html/js/css`)
- User interface
- Triggers extraction via background script
- Displays results, copy to clipboard, download

## Message Flow

```
Popup → Background → Content Script (extract HTML)
Content Script → Background (raw HTML)
Background → Popup (Markdown result)
```

## Permissions

| Permission | Purpose |
|------------|---------|
| activeTab | Access current tab content |
| storage | Persist settings |
| scripting | Execute content script |

## Data Flow

1. User clicks "Extract" in popup
2. Background script injects content script
3. Content script extracts page type + HTML
4. Background converts HTML to Markdown
5. Result displayed in popup