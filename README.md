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

After `pnpm build`, go to `chrome://extensions/` and click the **Reload** button (circular arrow) on the KContextify card. This clears Chrome's cache and loads the new code.

**Important**: Always reload the extension in `chrome://extensions/` after rebuilding. Chrome caches content scripts aggressively; without reload, you'll run old code.

### Test Extraction

1. Navigate to any webpage (article, YouTube, generic)
2. Click KContextify icon in toolbar
3. Click "Extract Page"
4. View Markdown output, copy or download

## Architecture

High-level flow:

```
Webpage DOM (live)
    ↓
Content Script (extractor.ts)
    • Clone document (isolate from live page)
    • Strip UI noise (nav, ads, CSS, scripts)
    • Score content and extract best match
    ↓
Background Service (converter.ts)
    • 3-layer CSS defense: regex + DOM + post-process
    • Convert HTML → Markdown (Turndown + GFM)
    • Generate YAML frontmatter
    ↓
Popup / User
    • Display Markdown result
    • Copy or download
```

### Key Design Decisions

- **DOM cloning**: Content extraction happens on a cloned document. Never mutates live page.
- **CSS safety**: Uses 3 layers (extractor selectors, converter regex, post-process filters) to ensure CSS never leaks into output.
- **Service worker compatible**: All sanitization has regex fallback; works without DOMParser.

### File Structure

```text
src/
├── content/           # Content script (runs in page context)
│   ├── identifier.ts  # Page type detection
│   ├── extractor.ts   # Clone + extract + score
│   ├── content.ts     # Message listener & orchestrator
│   └── [other]
├── background/        # Service worker
│   ├── background.ts  # Message handler
│   ├── converter.ts   # HTML → Markdown pipeline
│   ├── llm-refiner.ts # Gemini content enrichment
│   └── [other]
├── popup/             # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.ts
├── shared/            # Shared types & constants
└── __tests__/         # Unit tests (Vitest)
```

### Detailed Specs

See `.specs/` directory for detailed specifications:
- `.specs/project/` — PROJECT.md (vision), ROADMAP.md (phases), STATE.md (decisions, blockers, lessons)
- `.specs/codebase/` — ARCHITECTURE.md, STACK.md, CONVENTIONS.md, TESTING.md, CONCERNS.md
- `.specs/features/` — Feature specs (extraction/, markdown-conversion/, etc.)

## Permissions

- `activeTab`: Extract content from current tab
- `storage`: Persist settings and recent extractions
- `scripting`: Execute content script in tab

## License

MIT
