# Tasks: Refactor Extraction Pipeline (HTML→Markdown Fidelity + Token Efficiency)

**Analysis Date:** 2026-05-10  
**Priority Order:** High → Medium → Low (6 refactorings)  
**Total Effort:** ~8-10 hours + testing

---

## Dependency Graph

```
T1 (Remove Sanitization Dupla) ──┐
                                  ├── T3 (Heading Hierarchy)
T4 (Remove UI Chrome) ────────────┤
                                  └── T6 (Empty Elements)
T2 (Whitelist Frontmatter) ── (standalone)
T5 (Reference-Style Links) ── (standalone)
```

---

## Task 1: Remove Duplicate Sanitization → Turndown Rules [HIGH]

**Files:** `src/background/converter.ts` + `src/content/extractor.ts`

**Scope:** Replace regex-based pre-sanitization with Turndown `addRule()` filters.

**Why:** Current flow: Readability cleans + extractor.ts sanitizes (dupla) + Turndown converts. Consolidate all HTML cleanup in one phase (Turndown) for maintainability & efficiency.

**Steps:**
1. Remove `sanitizeHtml()` function from extractor.ts (lines 12-19)
2. Remove all `sanitizeHtml()` calls from extraction functions (lines 86, 95, 99, 120, 131)
3. Add Turndown rules in `createTurndownService()`:
   - Filter script, style, noscript, form, iframe tags → replacement: ''
   - Strip data-* and on* attributes via regex replacement
   - Remove HTML comments `<!--...-->`
4. Return raw HTML from extractor → let Turndown handle cleanup

**Verification:**
- Unit test: `convertToMarkdown()` removes `<script>` tags, event handlers, data-attributes
- Unit test: output has NO `onclick=`, `data-*=` attributes
- Integration test: article extraction still produces >100 words
- No regression: existing article/video/generic tests pass

**Blockers:** None  
**Blocks:** T3, T6

---

## Task 2: Whitelist Frontmatter Metadata [HIGH]

**Files:** `src/background/converter.ts`, `src/content/identifier.ts`

**Scope:** Reduce frontmatter from ~20 og: tags → 4 essential fields (title, author, date, image).

**Why:** Sites spam og: metadata (og:image:width, og:image:height, og:image:type, etc). ~30-50% frontmatter token savings.

**Steps:**
1. In `identifier.ts`: extract only `title`, `author`, `date`, `image` (single URL)
2. Modify `generateFrontmatter()` to accept allowlist, filter non-essential
3. Pass cleaned metadata object to converter

**Verification:**
- Unit test: `generateFrontmatter()` ignores non-essential og: tags
- Unit test: output YAML ≤6 lines (title, author, date, image, url, type)
- Integration test: Wikipedia article frontmatter ≤5 lines
- Token count reduced by 30-50%

**Blockers:** None  
**Blocks:** None (independent)

---

## Task 3: Heading Hierarchy Normalizer [MEDIUM]

**File:** `src/content/extractor.ts` (new function)

**Scope:** Fix heading jumps (H1→H3 becomes H1→H2). Validate hierarchy = H1, H2, H3... no skips.

**Why:** Readability preserves heading levels but doesn't normalize jumps. Some sites use H1→H3 for styling. Invalid hierarchy breaks outline.

**Steps:**
1. Create `normalizeHeadingHierarchy(html: string): string`
2. Parse DOM, walk heading tree, track currentLevel & parentLevel
3. If currentLevel > parentLevel + 1: demote to parentLevel + 1
4. Run after Readability extraction, before Turndown

**Verification:**
- Unit test: H1→H3 jump demoted to H1→H2
- Unit test: H2→H5→H3 normalized to H2→H3→H4
- Integration test: article output has valid heading outline
- No regression: title extraction unaffected

**Blockers:** T1 (needs consolidated sanitization first)  
**Blocks:** None

---

## Task 4: Remove UI Chrome (nav, footer, aside) [MEDIUM]

**File:** `src/content/extractor.ts`

**Scope:** Strip nav, footer, aside, ads, sidebars BEFORE passing to Readability.

**Why:** Readability removes most noise but fallback paths (`extractGenericContent`) use full body. Pre-stripping improves signal-to-noise.

**Steps:**
1. Create `stripUIElements(): void`
2. Remove elements matching: `nav`, `footer`, `[role="navigation"]`, `[role="complementary"]`, `[role="contentinfo"]`, `.ads`, `.sidebar`, `.advertisement`
3. Call in `extractArticleContent()` BEFORE `new Readability(document)`

**Verification:**
- Unit test: footer element removed before extraction
- Unit test: `[role="navigation"]` stripped from DOM
- Integration test: generic pages output smaller (less nav)
- No regression: article word count unchanged

**Blockers:** None  
**Blocks:** T6

---

## Task 5: Reference-Style Links [LOW]

**File:** `src/background/converter.ts`

**Scope:** Change link format from inlined `[text](url)` to references `[text][1]` with link list. Deduplicates repeated URLs.

**Why:** Articles with multiple links to same domain = repeated URLs. Reference-style + deduplication saves 15-20% on link-heavy content.

**Steps:**
1. Change Turndown config: `linkStyle: 'referenced'`
2. Add post-processing: deduplicate link references
3. Move link definitions to end of document

**Verification:**
- Unit test: link output uses `[text][1]` format
- Unit test: duplicate URLs share same reference
- Integration test: article with 10 links to same domain = 2 definitions
- Token savings: 15-20%

**Blockers:** None  
**Blocks:** None (independent)

---

## Task 6: Remove Empty Elements Post-Turndown [LOW]

**File:** `src/background/converter.ts`

**Scope:** Strip blank lines, empty blocks, whitespace-only paragraphs post-conversion.

**Why:** Turndown preserves `<div>`, `<section>` as separate blocks = `\n\n` overhead. Minor token savings.

**Steps:**
1. Add post-processing in `processExtractedContent()` after `convertToMarkdown()`
2. Remove lines with only whitespace: `replace(/^\s*$/gm, '')`
3. Collapse multiple blank lines: `replace(/\n{3,}/g, '\n\n')`
4. Trim output

**Verification:**
- Unit test: 5 consecutive blank lines → 2
- Unit test: whitespace-only paragraphs removed
- Integration test: output 5-10% smaller
- No regression: readability preserved

**Blockers:** T1 & T4 (need clean HTML first)  
**Blocks:** None

---

## Execution Order

| Phase | Tasks | Day | Notes |
|-------|-------|-----|-------|
| 1 | T2 + T5 (parallel) | Day 1 | Independent, quick wins |
| 2 | T1 | Day 2 | Critical path blocker |
| 3 | T4 (parallel after T1) | Day 2 | Can run once T1 done |
| 4 | T3 + T6 (parallel) | Day 3 | Depend on T1 & T4 |
| 5 | Integration + Testing | Day 4 | Full pipeline validation |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Frontmatter token savings | 30-50% |
| Overall token savings | 15-20% |
| Heading hierarchy correctness | 100% |
| Empty element compression | 5-10% |
| Test coverage | ≥90% |
| Performance regression | <1% |

---

## Test Coverage Requirements

Each task includes:
- Unit tests (isolated logic)
- Integration tests (with real extraction)
- No breaking changes to `ExtractionResult` type
- Backward compatible with existing converter config

Current test files to extend:
- `src/__tests__/converter.test.ts` (T1, T2, T5, T6)
- `src/__tests__/extractor.test.ts` (T3, T4)
- `src/__tests__/utils.test.ts` (shared helpers)
