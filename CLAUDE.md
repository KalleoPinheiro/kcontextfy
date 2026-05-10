# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KContextify is a Chrome Extension (Manifest V3) that converts webpages, videos, and articles into clean Markdown for LLM consumption.

## Commands

```bash
pnpm dev          # Vite dev server
pnpm build        # Production build (tsc && vite build)
pnpm preview      # Preview production build
pnpm lint         # Biome check
pnpm lint:fix     # Biome auto-fix
pnpm format       # Biome format
pnpm format:check # Check formatting
pnpm test         # Vitest unit tests
pnpm test:coverage # Coverage report
```

To run a single test file:

```bash
npx vitest run src/__tests__/utils.test.ts
```

## Architecture

Chrome Extension Manifest V3 with 3-tier message flow:

```text
Popup → Background Service Worker → Content Script
```

**Content Script** (`src/content/`): Runs in page context, extracts DOM via Readability-style heuristics, detects page type (article/video/generic), sends raw HTML to background.

**Background Service Worker** (`src/background/`): Orchestrates messaging, converts HTML→Markdown via Turndown, manages chrome.storage for settings.

**Popup** (`src/popup/`): UI for triggering extraction, displaying results, copy-to-clipboard, download.

**Shared** (`src/shared/`): Types, constants, utilities. No cross-tier dependencies.

## Key Types

- `ExtractionResult`: `{ pageType: PageTypeResult, title, content, url, timestamp }`
- `PageTypeResult`: `{ type: 'article'|'video'|'generic', confidence: number, metadata }`
- `ChromeMessage`: `{ action: string, payload? }`

## Security

- XSS prevention: Use `textContent` instead of `innerHTML` for user-controlled data
- `popup.ts` uses `sanitizeText()` helper to strip HTML before rendering
- Content script operates on page's own DOM (trusted context)

## Chrome Permissions

- `activeTab`: Extract current tab content
- `storage`: Persist settings/recent extractions
- `scripting`: Inject content script

## Build Output

`dist/` contains: `manifest.json`, `background.js`, `content.js`, `popup.html/js/css`, `icons/`

Load as unpacked extension in Chrome: `chrome://extensions/` → Developer mode → Load unpacked → select `dist/`
