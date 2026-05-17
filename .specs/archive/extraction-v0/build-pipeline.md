# Design: Build Pipeline

## Tech Stack
- **Language**: TypeScript (strict mode)
- **Bundler**: Vite
- **Template**: `vanilla-ts`
- **Key Libraries**: Readability.js, Turndown
- **Target**: Chrome Extension Manifest V3

## Project Structure
```
src/
├── content/
│   ├── content.ts        # Content script entry
│   ├── extractor.ts      # Readability wrapper + site-specific
│   └── identifier.ts    # Page type detection
├── background/
│   ├── background.ts     # Service worker entry
│   ├── converter.ts      # Turndown HTML→MD
│   └── storage.ts        # chrome.storage wrapper
├── popup/
│   ├── popup.ts          # Popup entry
│   ├── popup.css         # Styles
│   └── components/       # UI components
├── shared/
│   ├── types.ts          # Shared type definitions
│   ├── constants.ts      # Shared constants
│   └── utils.ts          # Utility functions
└── manifest.ts           # Manifest generation
```

## manifest.json
- Manifest V3
- Permissions: activeTab, storage, scripting
- Content script: matches all URLs
- Action: popup.html
- Background: service_worker type

## Dependencies
```json
{
  "@mozilla/readability": "^0.5.0",
  "turndown": "^7.1.0",
  "turndown-plugin-gfm": "^1.0.0"
}
```

## Build Output
```
dist/
├── manifest.json
├── background.js
├── content.js
├── popup.html + popup.js + popup.css
└── icons/
```

## TypeScript Config
- strict: true
- target: ES2020
- module: ESNext
- lib: DOM, ESNext
- noEmit: true (Vite handles emission)

## Vite Config
- Input: src entries
- Output: dist
- Chrome extension validation plugin (if available)
- Asset handling for HTML/CSS/JSON