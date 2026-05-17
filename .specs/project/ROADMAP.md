# Roadmap

## Phase 1: Specification & Design ✅ COMPLETE

- [x] Define extraction logic for different content types
- [x] Design extension architecture (Manifest V3)
- [x] Map out UI/UX flow

## Phase 2: MVP Implementation ✅ COMPLETE

Core extraction + conversion pipeline:
- [x] Setup TypeScript build pipeline (Vite)
- [x] Content script: page type identification + extraction
- [x] Popup UI with trigger and display
- [x] Background service: HTML → Markdown conversion (Turndown + GFM)
- [x] Frontmatter generation (YAML)
- [x] Vitest test suite
- [x] Manifest V3 setup (content script + service worker)

## Phase 2.5: Safety & Polish ✅ COMPLETE (2026-05-17)

DOM safety + CSS stripping:
- [x] Fix DOM mutation bug (clone document, never mutate live page)
- [x] Implement 3-layer CSS defense (extractor selectors + converter regex + removeNoise)
- [x] Fix IIFE bundling for content script (esbuild post-build)
- [x] Add service-worker safe sanitization (regex fallback)
- [x] Add aggressive UI noise stripping (nav, footer, ads, dev.to modals)
- [x] Enhance post-processing (removeNoise, promoteOrphanHeadings, fenceLooseCodeBlocks)
- [x] 101/101 tests passing

## Phase 3: Content Refinement (NEXT)

User-facing improvements:
- [ ] LLM-powered content refinement (Gemini 3 Flash)
- [ ] Settings modal (API key, daily quota)
- [ ] Async polish (non-blocking LLM enrichment)
- [ ] Manual test on 10+ real sites (dev.to, medium, news sites, technical blogs)

## Phase 4: Advanced Features

V2 scope:
- [ ] Video transcript extraction (YouTube API)
- [ ] Link deduplication & URL normalization
- [ ] IndexedDB storage (history, drafts)
- [ ] Export formats (PDF, HTML, JSON)
- [ ] Site-specific extractors (Medium, Substack, etc.)

## Phase 5: Distribution

Release:
- [ ] Polish UI/UX based on user feedback
- [ ] Performance optimization (profiling)
- [ ] Chrome Web Store submission