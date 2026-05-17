# Architecture

## System Overview

KContextify is a Chrome extension that extracts and converts web content to structured Markdown with YAML frontmatter. Three-component architecture:

1. **Content Script** (`src/content/`) - Runs on webpage, identifies and scores content, detects page type
2. **Background Service** (`src/background/`) - Converts HTML to Markdown, manages storage
3. **Popup UI** (`src/popup/`) - User interface for triggering extraction and viewing results

## Data Flow

```
Webpage (live DOM)
  ↓
Content Script (identifier.ts)
  → Detect page type (article/video/generic)
  ↓
Content Script (extractor.ts)
  → Clone document (isolate from live DOM)
  → Strip UI noise: <style>, <script>, nav, footer, sidebar, ads, etc.
  → Wait for content stability on clone (MutationObserver)
  → Find best content element (scoring engine)
  → Extract HTML from cloned element
  ↓
Content Script → Background Service (via chrome.runtime.sendMessage)
  ↓
Background Service (converter.ts)
  → Strip dangerous tags (regex: <style>, <script>, <noscript>, <link>, <meta>)
  → Normalize heading hierarchy (no jumps)
  → Convert HTML → Markdown (Turndown + GFM)
  → Remove noise: leftover empty links, UI counters, CSS blocks
  → Promote orphan headings
  → Fence loose code blocks
  → Generate frontmatter (YAML)
  ↓
Popup / Storage
  → Display in popup / Save to file
```

**Safety Notes**:
- Content extraction happens on **cloned** DOM, never touches live page
- CSS stripping uses **3-layer defense**: extractor selectors + converter regex + post-process noise removal
- Service worker (background) has no DOM API → all sanitization has regex fallback

## Component Details

### Content Script (`src/content/`)

**identifier.ts** - Page type classification
- Checks video domains, meta tags (`og:type`, `twitter:card`), HTML elements
- Returns: `{ type: 'article'|'video'|'generic', confidence: 0-1, metadata: {...} }`
- Extracts metadata: author, date, image, site-specific selectors

**extractor.ts** - Content extraction and dynamic scoring
- `extractContent()` - Main orchestrator, dispatches by page type
  - Article: `extractArticleContent()` (best-effort scoring + Readability fallback)
  - Video: `extractVideoContent()` (metadata only; transcript is V2)
  - Generic: `extractGenericContent()` (main or body element)
- `extractArticleContent()` - Clone document → sanitize → score → extract
  - **Safety**: Clones live DOM first via `cloneNode(true)`; never mutates page
  - `stripUIElements(clonedDoc)` - Removes nav, footer, aside, ads, comments, dev.to UI
  - `findBestContentElement(clonedDoc)` - Scores article/main/etc candidates
  - Fallback: Mozilla Readability on clean clone
- `waitForContent()` - MutationObserver-based stability detection (1s debounce, 10s max)
- `findBestContentElement(root)` - Scores candidate elements (article, main, [role="main"], common classes/IDs)
  - Takes optional root parameter (default: document) → supports cloned docs
- `stripUIElements(root)` - Removes ~40 UI selectors
  - Tags: style, script, noscript, template, link, meta, svg, iframe
  - Semantic: nav, footer, header, aside, [role="navigation"], [role="contentinfo"]
  - Common UI: ads, sidebar, newsletter, comments, related-posts
  - Site-specific: dev.to modals, billboards, report-abuse
- `calculateConfidenceScore(node)` - Weighted combination of three scoring modules:
  - **Semantic** (40% weight): role, class, ID attributes; ancestor role inspection
  - **Structural** (30% weight): child count, heading hierarchy, content elements
  - **Text Density** (30% weight): word count, character diversity, boilerplate detection

### Background Service (`src/background/`)

**converter.ts** - HTML to Markdown conversion and processing
- `stripDangerousTags(html)` - Regex pass (pre-parse, service-worker safe)
  - Strips: `<style>`, `<script>`, `<noscript>`, `<template>`, `<link>`, `<meta>`
  - Handles multi-line tags via `[\s\S]*?` (non-greedy)
- `sanitizeHtml(html)` - DOM-based cleanup (if DOMParser available)
  - Applies `stripDangerousTags()` first (for service worker context)
  - Falls back to regex-only if DOMParser undefined
  - Uses selectors from NOISE_SELECTORS const
- `createTurndownService()` - Factory with rules for unwanted tags:
  - Drop: script, style, noscript, form, iframe, svg, button, input, select, textarea
  - Drop empty anchors (subheading permalinks that wreck headings)
  - Clean headings: preserve text, strip anchor/span children
- `convertToMarkdown(html)` - Two-stage pipeline:
  1. Sanitize HTML (triple defense: regex + DOMParser + Turndown rules)
  2. Apply Turndown with GFM plugin
- `processExtractedContent()` - Full processing pipeline:
  1. Sanitize + convert HTML → Markdown
  2. Clean empty elements (trim whitespace, deduplicate blank lines)
  3. Remove noise (empty refs, UI counters, CSS blocks, lang toggles)
  4. Promote orphan headings (short lines between content → ## Title)
  5. Fence loose code blocks (detect code patterns, wrap in ``` ```)
  6. Final cleanup (empty elements again)
  7. Generate frontmatter (YAML)
- `removeNoise(markdown)` - Post-process filters:
  - Empty link refs: `[][]`, `[]()`
  - UI noise: "123 likes", "Skip to content", "PT | EN"
  - CSS blocks: `:root{...}`, `@media{...}`
- `generateFrontmatter()` - YAML header: title, url, type, author, date (frontmatter object)

### Popup UI (`src/popup/`)

User interface (minimal V1):
- Trigger extraction button
- Display extracted content
- Show extraction confidence score
- Save/copy to clipboard

## Architectural Decisions

| Decision | Rationale | Alternative |
|----------|-----------|-------------|
| MutationObserver for stability | Detects actual DOM readiness, not fixed timeout | Fixed setTimeout - misses async content |
| Dynamic scoring over fixed selectors | Adapts to site structure variations | Hard-coded selectors - brittle on redesign |
| Readability fallback | Handles sites without semantic structure | Pure scoring - fails on unstructured sites |
| Reference-style Markdown links | Deduplicates & reduces link clutter | Inline links - repetitive for high-link content |
| Frontmatter metadata | Preserves key context for downstream tools | Inline comments - harder to parse |
| Strict TypeScript + strict mode | Early error detection | Loose types - more runtime bugs |
| Vitest for unit tests | Fast, built-in mocking, Vite integration | Jest - slower, more configuration |

## Key Dependencies & Trade-offs

### Mozilla Readability
- **Benefit**: Battle-tested fallback for generic content extraction
- **Trade-off**: Slower than pure DOM scoring; used only as fallback
- **Risk**: Bundled library size (~50KB minified)

### Turndown + turndown-plugin-gfm
- **Benefit**: Comprehensive HTML → Markdown, GFM tables/strikethrough
- **Trade-off**: Slower conversion; but acceptable for V1 async pipeline
- **Risk**: Dependency maintenance; GFM fork not actively maintained

### Chrome Extension APIs
- **Benefit**: Content script, background service, popup are standard extension patterns
- **Trade-off**: Manifest V3 migration required when Manifest V2 EOL (Nov 2024; already past)
- **Risk**: Current codebase uses Manifest V3 patterns; future update to auto-generated manifest needed

## Scaling Points

**Content extraction performance:**
- Current: Blocking wait for 1s stability, then score candidates
- V2: Parallel candidate scoring; timeout-based interruption for very slow sites

**Link deduplication:**
- Current: O(n) regex parsing of deduplicated links
- V2: Track URLs during conversion instead of post-processing

**Metadata extraction:**
- Current: Fixed meta tag whitelist (author, date, image)
- V2: Pluggable metadata extractors per site type

## File Organization

```
src/
├── content/           # Content script (runs on webpage)
│   ├── identifier.ts  # Page type detection
│   ├── extractor.ts   # Content extraction + scoring
│   └── listener.ts    # MutationObserver + event listeners
├── background/        # Background service worker
│   └── converter.ts   # HTML → Markdown pipeline
├── popup/             # Popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.ts
├── shared/            # Shared types & constants
│   ├── types.ts
│   └── constants.ts
└── __tests__/         # Unit tests
    └── extractor.test.ts
```

## Type Safety

All modules use strict TypeScript:
- Explicit return types on exported functions
- Interface definitions for public APIs
- No `any` type usage
- DOM access wrapped with null checks

See [CONVENTIONS.md](CONVENTIONS.md) for detailed patterns.

## Testing Strategy

Unit tests focus on scoring engine:
- Mock DOM in Node environment (no JSDOM)
- Behavior-driven assertions (quality > quantity)
- Comparative tests (well-structured > poorly-structured)

See [TESTING.md](TESTING.md) for coverage and test patterns.

## Build & Bundling

**Content Script Bundling (content.js)**:
- Vite builds as ES module entry (src/content/content.ts)
- Post-build: esbuild wraps in IIFE (single-file, no imports)
- Hook: vite.config.ts `closeBundle()` → esbuild format: 'iife'
- Result: Chrome MV3 can load content.js as classic script (no `import` statement)

**Background Service (background.js)**:
- Built as ES module (manifest.json: `"type": "module"`)
- Chrome 100+ supports ES modules in service workers
- Vite bundles with esbuild, outputs proper imports

---

*Last updated: 2026-05-17. Status: active. DOM cloning + 3-layer CSS defense fully implemented.*
