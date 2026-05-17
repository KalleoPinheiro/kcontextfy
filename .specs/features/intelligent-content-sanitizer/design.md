# Design: Intelligent Content Sanitizer

**Status**: Approved | **Date**: 2026-05-17

## Architecture

### Module: `src/content/sanitizer.ts`

**Input**:
- `document`: DOM Document (from content script)
- `html`: Optional HTML string fallback

**Output**:
```typescript
interface SanitizedContent {
  title: string | null
  author: string | null
  publishedAt: string | null
  content: string
}
```

**Core Flow**:
1. Extract title (og:title → twitter:title → document.title → h1 → hostname)
2. Extract author (article:author → author meta → byline patterns)
3. Extract date (article:published_time → datePublished → date patterns)
4. Extract content (Readability + strip UI + fallback chain)

### Reuse Existing Code

- **stripUIElements()** from extractor.ts (nav, footer, ads, sidebars)
- **Readability + fallback chain** from extractArticleContent()
- **Meta tag parsing** from getMetaContent() in extractor.ts

### Date Parsing

- Parse ISO 8601 dates from meta tags
- Fallback: common patterns (Jan 1, 2026 / 1/17/26 / etc)
- Return ISO string or null

### Error Handling

- No throws (graceful degradation)
- Empty/null returns for missing metadata
- Log warnings for parse failures
- Always return valid object shape

## Implementation Path

1. Extract `getMetaContent()` helper to shared utils
2. Create `extractAuthor()` function (meta tags + patterns)
3. Create `extractDate()` function (parse ISO + patterns)
4. Create main `sanitizeContent()` export
5. Test: verify all 6 requirements + edge cases
