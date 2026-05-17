# Integrations & Dependencies

## Direct Dependencies

### Content Extraction

**@mozilla/readability** (v0.4.x)
- Purpose: Fallback HTML → text extraction
- Used in: `src/content/extractor.ts` (extractArticleContent)
- Trade-off: Slow (~100ms), only after scoring fails
- Risk: Large minified size (~50KB)

### HTML to Markdown

**turndown** (v7.x)
- Purpose: HTML → Markdown
- Config: `linkStyle: 'referenced'` (reference-style links)

**turndown-plugin-gfm** (v1.0.x)
- Purpose: GitHub Flavored Markdown (tables, strikethrough)
- Risk: Fork not actively maintained; consider alternatives V2

### Build & Development

**Vite** (v5.x)
- Build tool, dev server
- Config: Separate entry points per component

**TypeScript** (v5.x)
- Strict mode enabled
- Target: ES2020

**Biome** (latest)
- Linter + formatter (replaces ESLint + Prettier)

### Testing

**Vitest** (v1.x)
- Unit/integration tests
- Coverage: c8

**@vitest/ui** (v1.x)
- Test dashboard

**@vitest/coverage-v8** (v1.x)
- Coverage reports

## Browser APIs (Chrome Extension)

### Content Script
- `document`, `MutationObserver`, `window.location`
- `querySelector()`, `getAttribute()`, `textContent`, `innerHTML`
- Message passing to service worker

### Service Worker (Background)
- Message listeners
- `chrome.storage.local` (persistent key-value store)
- No DOM access

### Popup UI
- Standard HTML/CSS/JS
- `chrome.runtime.sendMessage()` to service worker

### Manifest V3
- Host permissions: `<all_urls>`
- Service worker entry point
- Content script injection
- Action (popup)

## Web APIs (in Background Service)

**DOMParser**
- Parse HTML strings
- Used in: converter.ts - normalizeHeadingHierarchy()

## External Services

None in V1.

V2 planned:
- YouTube API (transcript extraction)
- Vimeo API (captions)
- Note: Use secure backend; don't expose API keys in extension

## Storage

**chrome.storage.local**
- Persistent key-value store
- Limit: 10MB (sufficient V1)
- Caches extraction results, user preferences

Planned (V2): IndexedDB for larger history

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| MutationObserver (1s debounce) | 1000ms | Waits for dynamic content |
| Scoring algorithm | <10ms | All scoring modules combined |
| Mozilla Readability | ~100ms | Fallback only |
| Turndown conversion | ~50ms | HTML → Markdown |
| Link deduplication | ~10ms | Regex parsing of references |

## Dependency Versions

| Dependency | Current | Constraint | Reason |
|-----------|---------|-----------|--------|
| Node | 20+ | ≥18 | Chrome extension compat |
| TypeScript | 5.x | ≥5.0 | Strict mode required |
| Vite | 5.x | ≥5.0 | Build tool |
| Vitest | 1.x | ≥1.0 | Testing |
| turndown | 7.x | ≥7.0 | HTML→MD |
| readability | 0.4.x | 0.4.x | Content fallback |

## Data Models

See `src/shared/types.ts`:

```typescript
interface PageTypeResult {
  type: 'article' | 'video' | 'generic'
  confidence: number
  metadata: Record<string, string>
}

interface ExtractionResult {
  pageType: PageTypeResult
  title: string
  content: string
  url: string
  timestamp: string
}

interface ConversionOptions {
  headingStyle?: 'atx' | 'setext'
  codeBlockStyle?: 'fenced' | 'indented'
  bulletListMarker?: '-' | '*' | '+'
  emDelimiter?: '*' | '_'
  strongDelimiter?: '**' | '__'
  linkStyle?: 'inlined' | 'referenced'
}
```

## Security Baseline (V1)

- ✓ No sensitive data handling (all content public)
- ✓ No authentication/credentials
- ✓ No API keys
- ✓ No external API calls
- ✓ No user accounts

## V2 Integrations (Planned)

### Video Transcripts
- YouTube: `youtube.googleapis.com/youtube/v3/captions`
- Vimeo: `api.vimeo.com/videos/{id}/transcript`
- Constraint: Use secure backend; don't expose API keys in extension JS

### Cloud Storage
- Planned: Save extractions to cloud
- Constraint: User auth required; consider OAuth2

### Browser Storage
- Planned: IndexedDB for extraction history
- Limitation: No cross-device sync in V1

## Updating Dependencies

```bash
pnpm outdated              # Check
pnpm update               # Update all
pnpm update --interactive # Selective
```

After major bumps, test:
- Scoring consistency (Readability output changes?)
- Markdown output (Turndown behavior changes?)
- Build output (Vite plugin changes?)

## Known Constraints

**Turndown GFM plugin**
- Fork not actively maintained
- Works for V1; covered most markdown features
- Alternatives for V2: markdown-it, marked

**Mozilla Readability**
- Slow fallback (~100ms)
- Consider lighter extraction library V2

**Manifest V2 → V3**
- ✓ Code already V3-compatible
- TODO: Auto-generate manifest from source

**Message Passing**
- Content Script ↔ Service Worker: Direct
- Popup ↔ Service Worker: Direct
- Popup ↔ Content Script: Via Service Worker relay

---

*Last updated: 2026-05-16. Status: active*
