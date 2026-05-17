# Tasks: Intelligent Content Sanitizer

**Status**: Ready | **Created**: 2026-05-17

## Task Breakdown

### [1] Extract utilities and helpers
- [ ] Move `getMetaContent()` from extractor.ts → shared/utils.ts
- [ ] Create `extractAuthorFromText()` for byline pattern matching
- [ ] Create `parsePublishedDate()` (ISO 8601 + common patterns)
- **Verify**: Functions exported, callable from tests

### [2] Create sanitizer.ts module
- [ ] Export interface: `SanitizedContent` (title, author, publishedAt, content)
- [ ] Export function: `extractAuthor(doc: Document): string | null`
- [ ] Export function: `extractPublishedDate(doc: Document): string | null`
- [ ] Export main function: `sanitizeContent(doc: Document): SanitizedContent`
- **Verify**: All exports typed correctly

### [3] Implement sanitizeContent()
- [ ] Extract title (og:title → twitter:title → document.title → h1 → hostname)
- [ ] Call extractAuthor()
- [ ] Call extractPublishedDate()
- [ ] Call extractArticleContent() (reuse from extractor)
- [ ] Return SanitizedContent object
- **Verify**: Structure matches spec, handles missing fields as null

### [4] Test suite
- [ ] Unit tests: 80%+ coverage
- [ ] Test title extraction (all priority orders)
- [ ] Test author extraction (meta tags + fallback)
- [ ] Test date extraction (ISO + patterns + null)
- [ ] Test content extraction (Readability + fallback)
- [ ] Test graceful degradation (no throws on bad input)
- **Verify**: All tests passing, coverage 80%+, AAA pattern

### [5] Integration
- [ ] Update extractor.ts to use sanitizeContent() if needed
- [ ] No breaking changes to existing ExtractionResult
- [ ] Run full test suite
- **Verify**: All tests pass, no regressions

## Verification Checklist

- [ ] All requirements from spec.md met
- [ ] 80%+ test coverage
- [ ] No console.log statements
- [ ] TypeScript strict mode passes
- [ ] Biome lint passes
- [ ] Manual testing: extract from 3 different page types
