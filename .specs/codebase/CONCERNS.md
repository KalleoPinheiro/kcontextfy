# Concerns & Technical Debt

## Current Risks

### Fallback Chain Fragility

**Risk**: Scoring fails to identify content; Readability fallback may extract non-content.

**Current state**:
- Score candidates with `findBestContentElement()`
- Fallback: Mozilla Readability
- Last resort: body.innerHTML

**Mitigation**: Readability mature; scoring heavily favors semantic signals.

**V2 consideration**: Lighter extraction library for performance.

### Scoring Weight Opacity

**Risk**: Why semantic (40%), structural (30%), density (30%)?

**Current state**: Empirically chosen; no tuning against corpus.

**Evidence**: Tests validate relative ordering (quality > poor); no regression testing.

**Mitigation**: Document weight rationale; add site-specific adjustments V2.

**Action item**: Update ARCHITECTURE.md with rationale.

### Heading Normalization Over-Simplification

**Risk**: `normalizeHeadingHierarchy()` demotes jumps but may lose semantic meaning.

Example: H1→H4 becomes H1→H2→H3 (extra level introduced).

**Status**: Acceptable V1 (Markdown still readable).

**V2 consideration**: More sophisticated hierarchy detection.

### Text Density Boilerplate Heuristics

**Risk**: Hardcoded patterns may miss new boilerplate.

**Current patterns**: cookie, subscribe, newsletter, copyright, etc.

**Coverage**: ~85% of common boilerplate.

**Mitigation**: Reasonable defaults; low penalty (recoverable with good text).

**V2 consideration**: ML-based detection.

### Link Deduplication URL Variations

**Risk**: URL variations (http vs https, www vs non-www, trailing slash) treated as distinct.

Example:
```
http://example.com → [1]
https://example.com → [2]  # Different!
```

**V2 mitigation**: Normalize URLs before deduplication.

## Technical Debt

### Video Extraction Unimplemented

**Status**: Returns JSON placeholder instead of Markdown.

```typescript
transcript: 'Available in V2'
```

**Debt**: Format mismatch with article extraction.

**Resolution**: V2 transcript extraction.

### Chrome Extension Auto-Manifest

**Status**: Comment says "auto-generated" but actual generation is manual.

**Risk**: Manifest can drift from code (permissions, entry points).

**Resolution**: Add Vite plugin to generate manifest.json from config.

### JSDOM Not Installed

**Status**: Tests use custom DOM mocks instead of JSDOM.

**Benefit**: Lightweight (~1KB mocks vs 30+MB JSDOM).

**Trade-off**: `converter.ts` untested (Turndown needs real DOM).

**Resolution**: Add JSDOM for converter integration tests V2.

### Turndown GFM Fork Abandoned

**Status**: turndown-plugin-gfm not actively maintained.

**Risk**: Security vulnerability or API change; no updates.

**Mitigation**: Library mature; low churn expected. Monitor for updates.

**V2 migration**: markdown-it or marked.

## Fragile Areas

### `extractArticleContent()` - Readability Integration

**Fragility level**: Medium

**Issue**: Depends on Readability parsing behavior changes.

**Stability**: High (library mature; minimal API churn).

**Testing**: Partially tested (scoring well-tested; Readability fallback manual).

### Heading Hierarchy Normalization

**Fragility level**: Medium

**Issue**: DOM mutation during Markdown conversion.

```typescript
const newHeading = doc.createElement(newTag)
newHeading.innerHTML = heading.innerHTML  // innerHTML parsing quirks
heading.replaceWith(newHeading)           // mutation context
```

**Mitigation**: Defensive cloning, error logging. Consider try-catch wrapper V2.

### MutationObserver Debounce Tuning

**Fragility level**: Low

**Issue**: 1s debounce + 10s max may miss slow loaders or interrupt too early.

**Evidence**: Empirically tuned; no corpus validation.

**Trade-off**:
- 1s too short: Extract mid-load
- 1s too long: Slow extraction
- 10s max: Cut off very slow sites

**Mitigation**: Add debug logs to track DOM stabilization V2.

## Missing Test Coverage

| Module | Status | Gap | Priority |
|--------|--------|-----|----------|
| extractor.ts | 95% | Video/generic extraction, Readability fallback | V2 |
| converter.ts | 0% | All functions (manual test only) | HIGH |
| identifier.ts | 0% | All functions (manual test only) | HIGH |
| listener.ts | 0% | Message passing, handlers | HIGH |
| popup.ts | 0% | UI logic, message sending | MEDIUM |

**Action**: Integration tests for converter.ts, identifier.ts V2.

## Performance Concerns

| Component | Time | Impact | Mitigation |
|-----------|------|--------|-----------|
| MutationObserver wait | 1000ms | Extraction latency | Configurable timeout V2 |
| Mozilla Readability | ~100ms | Fallback extraction | Lighter library V2 |
| Turndown conversion | ~50ms | Output generation | Acceptable |
| Link dedup | ~10ms | Negligible | OK |

**Total typical**: ~150ms (scoring + conversion). **Worst case**: ~150ms (Readability + conversion).

## Scalability

### Large Article Memory

**Scenario**: 10,000+ word article.

**Current**: Entire document in memory; string processing in Turndown.

**Risk**: No streaming; whole content buffered.

**Mitigation**: Acceptable V1 (rare). Consider streaming V2.

### Local Storage Quota

**Scenario**: 1000 extracted articles.

**Current**: `chrome.storage.local` 10MB limit.

**Estimate**: ~50KB per article = 50MB total; exceeds quota.

**Mitigation**: IndexedDB V2 with quota management.

## Dependency Maintenance

### Turndown GFM
- **Action**: Monitor for security patches.
- **Risk**: Low; library mature.

### Mozilla Readability
- **Action**: Monitor for major version bumps.
- **Risk**: Low; stable API.

### TypeScript, Vite, Vitest
- **Action**: Keep synchronized; test after major bumps.
- **Risk**: Medium (build system updates).

## Security Baseline

**Current (V1)**:
- ✓ No input validation (attacker already controls page)
- ✓ No rate limiting (user-triggered)
- ✓ No external APIs
- ✓ No auth/credentials

**V2 risks**:
- Cloud sync: Validate extracted content before upload
- Video transcripts: Secure backend; don't expose API keys in extension
- User accounts: Implement OAuth2 securely

## Documentation Debt

**Missing rationale for**:
- MutationObserver vs setTimeout
- Scoring weights (40/30/30)
- Readability as fallback
- Reference-style Markdown links

**Action**: Document in ARCHITECTURE.md.

---

*Last updated: 2026-05-16. Status: active*
