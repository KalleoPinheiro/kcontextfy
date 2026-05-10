# KContextify

Convert any webpage, video, or article into clean Markdown.

## Features

- **Content Identification**: Detect page type (article, video, generic)
- **Smart Extraction**: Extract title, author, date, main content
- **Markdown Conversion**: Clean HTML → Markdown with GFM support
- **Browser Extension**: Chrome Extension (Manifest V3)

## Tech Stack

- TypeScript (strict mode)
- Vite (bundler)
- Biome (linting + formatting)
- pnpm (package manager)
- Vitest (unit tests)
- Readability.js (content extraction)
- Turndown (HTML → Markdown)

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev        # Start Vite dev server
pnpm build      # Build for production
pnpm preview    # Preview production build
```

## Code Quality

```bash
pnpm lint         # Run Biome
pnpm lint:fix     # Fix Biome errors
pnpm format       # Format with Biome
pnpm format:check # Check formatting
```

## Testing

```bash
pnpm test        # Run tests
pnpm test:ui     # Run tests with UI
pnpm test:coverage # Coverage report
```

## Chrome Extension Development

### Build

```bash
pnpm build
```

Outputs to `dist/` with `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js`, `popup.css`.

### Load in Chrome (Developer Mode)

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Extension appears in toolbar

### Hot Reload

After `pnpm build`, go to `chrome://extensions/` and click **Update** on the extension card. Or use an extension like [Extensity](https://chrome.google.com/webstore/detail/extensity) for quick reload.

### Test Extraction

1. Navigate to any webpage (article, YouTube, generic)
2. Click KContextify icon in toolbar
3. Click "Extract Page"
4. View Markdown output, copy or download

## Architecture

```text
src/
├── content/        # Content script (runs in page context)
│   ├── identifier.ts  # Page type detection
│   └── extractor.ts  # Readability-style extraction
├── background/     # Service worker
│   ├── background.ts # Messaging orchestration
│   ├── converter.ts  # HTML → Markdown
│   └── storage.ts    # chrome.storage wrapper
├── popup/          # Extension popup UI
└── shared/         # Types, constants, utils
```

## Permissions

- `activeTab`: Extract content from current tab
- `storage`: Persist settings and recent extractions
- `scripting`: Execute content script in tab

## License

MIT
