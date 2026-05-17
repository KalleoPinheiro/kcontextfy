# Architecture

## System Overview

KContextify is a Chrome extension that extracts and converts web content to structured Markdown with YAML frontmatter. Three-component architecture:

1. **Content Script** (`src/content/`) - Runs on webpage, identifies and scores content, detects page type
2. **Background Service** (`src/background/`) - Converts HTML to Markdown, manages storage
3. **Popup UI** (`src/popup/`) - User interface for triggering extraction and viewing results

## Data Flow

```
Webpage
  ↓
Content Script (identifier.ts)
  → Detect page type (article/video/generic)
  ↓
Content Script (extractor.ts)
  → Wait for content stability (MutationObserver)
  → Find best content element (scoring engine)
  → Extract HTML
  ↓
Background Service (converter.ts)
  → Normalize heading hierarchy
  → Convert HTML → Markdown (Turndown)
  → Deduplicate links
  → Generate frontmatter (YAML)
  ↓
Storage
  → Display in popup / Save to file
```

## Component Details

### Content Script (`src/content/`)

**identifier.ts** - Page type classification
- Checks video domains, meta tags (`og:type`, `twitter:card`), HTML elements
- Returns: `{ type: 'article'|'video'|'generic', confidence: 0-1, metadata: {...} }`
- Extracts metadata: author, date, image, site-specific selectors

**extractor.ts** - Content extraction and dynamic scoring
- `extractContent()` - Main orchestrator, dispatches by page type
- `waitForContent()` - MutationObserver-based stability detection (1s debounce, 10s max)
- `findBestContentElement()` - Scores candidate elements (article, main, [role="main"], common classes/IDs)
- `calculateConfidenceScore(node)` - Weighted combination of three scoring modules:
  - **Semantic** (40% weight): role, class, ID attributes; ancestor role inspection
  - **Structural** (30% weight): child count, heading hierarchy, content elements
  - **Text Density** (30% weight): word count, character diversity, boilerplate detection

### Background Service (`src/background/`)

**converter.ts** - HTML to Markdown conversion and processing
- `createTurndownService()` - Factory with rules for unwanted tags (script, style, form, iframe), attribute stripping
- `convertToMarkdown()` - Wrapper around Turndown
- `processExtractedContent()` - Pipeline:
  1. Normalize heading hierarchy (no level jumps)
  2. Convert to Markdown
  3. Deduplicate reference-style links
  4. Clean empty elements
  5. Generate frontmatter
- `generateFrontmatter()` - YAML header with title, url, type, author, date, image

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

---

*Last updated: 2026-05-16. Status: active*
