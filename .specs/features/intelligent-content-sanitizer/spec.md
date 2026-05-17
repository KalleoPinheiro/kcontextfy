# Intelligent Content Sanitizer

**Scope**: Medium | **Status**: Planning | **Created**: 2026-05-17

## Vision

Reusable, testable content extraction module. Takes raw HTML or DOM, returns clean structured JSON with article metadata + body text. Integrates existing Readability + sanitization logic.

## Requirements

**REQ-1: Input Handling**
- Accept HTML string or DOM Document
- Auto-detect content encoding

**REQ-2: Content Detection**
- Use Mozilla Readability to identify article content
- Fallback to heuristics if Readability fails (h1 + largest text block)

**REQ-3: Metadata Extraction**
- Title: `<h1>`, `<title>`, `og:title` (in order)
- Author: `article:author`, `author` meta tag, byline patterns
- Published date: `article:published_time`, `datePublished`, date patterns in text
- Return null if not found (not error)

**REQ-4: Noise Removal**
- Strip: nav, footer, sidebars, ads, comments, cookies, CTAs
- Keep: main article body, necessary formatting (headings, lists)
- No summarization—preserve full text

**REQ-5: Output Format**
```json
{
  "title": "Article Title or null",
  "author": "Author Name or null",
  "publishedAt": "2026-05-17T10:00:00Z or null",
  "content": "Full body text\nwith linebreaks\npreserved"
}
```

**REQ-6: Error Handling**
- Return empty content fields if no article detected
- Log warnings for unparseable dates
- Never throw on bad input (degrade gracefully)

## Verification

- [ ] Extract from blog (title, author, date, body)
- [ ] Extract from news article (metadata complete)
- [ ] Extract from documentation site (minimal metadata, full body)
- [ ] Handle missing author/date (return null, not error)
- [ ] Remove sidebars, ads, comments (compare before/after)
- [ ] Unit tests: 80%+ coverage, AAA pattern
