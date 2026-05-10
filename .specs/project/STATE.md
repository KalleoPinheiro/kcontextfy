# State

## Decisions

- Language: TypeScript
- Target: Google Chrome Extension (Manifest V3)
- Framework: TLC Spec-Driven Development
- Package Manager: pnpm
- Linter/Formatter: Biome
- Build: Vite with multi-entry output (popup, background, content)
- Markdown: Turndown + turndown-plugin-gfm (moved to content script; service worker can't use it)
- Content extraction: Mozilla Readability + custom fallbacks for noise filtering
- Architecture: Content script does extraction+conversion; background handles message routing & storage

## Blockers

- Content extraction noisy (sidebars, headers, footers included) - Readability integration in progress
- Service worker can't use Turndown (no document API) - fixed by moving to content script

## Lessons

- Biome is simpler than ESLint + Prettier (single tool for lint + format)
- `turndown-plugin-gfm` exports `gfm` as named export, not `turndownPluginGfm.gfm`
- Vite entry points for MV3 extension: point directly to `.ts` files, not `.html` stubs
- chrome.* APIs must be externalized in Vite rollup config
- Turndown `headingStyle` option uses `'setext'` not `'setex'`
- Service workers can't access DOM APIs - move DOM-dependent code to content scripts
- Content script auto-loads from manifest; don't re-inject to avoid double-declaration errors
- Vite needs `base: './'` for relative paths in extensions (not `/absolute/`)
- Icon references must be `.svg` (can be single file) not multiple `.png` sizes
- Module-level code in bundled scripts runs at load time - wrap DOM access in functions

## Progress

**Phase 2: MVP** ✅ WORKING
- Content extraction: ✓
- Markdown conversion: ✓  
- Frontmatter generation: ✓
- Popup display: ✓
- Status: Validated but needs refinement

**Current Session Work**
- Fixed manifest icon references (SVG)
- Fixed Vite output structure (flattened dist/)
- Fixed popup script loading (added defer, relative paths)
- Removed Turndown from service worker (moved to content script)
- Integrated Mozilla Readability for noise filtering (in progress - needs testing)

## Todos

- [ ] Test Readability filtering on varied content types (NEXT PRIORITY)
- [ ] Refine extractor heuristics if Readability insufficient
- [ ] Remove sidebar/nav/footer from extraction (blocked on test results)
- [ ] Plan Phase 3: Advanced Extraction features (video transcripts, complex layouts)

## Session Paused: 2026-05-10 13:15

**Status**: Sanitization refactoring COMPLETE. Build passing. Ready for manual validation in Chrome.

**Refactoring: Noise Filtering & Sanitization** ✓
- Added `sanitizeHtml()` helper (strips script, style, noscript, iframe, form)
- Fixed Readability: no document clone, validates >100 char content
- Improved fallback chain: all paths sanitized
- Applied sanitization to all extraction types (article, video, generic)
- Build: `pnpm build` ✓ (no errors)

**What's Done**:
- Content script extraction ✓
- Turndown HTML→MD conversion ✓
- Frontmatter generation ✓
- Popup UI ✓
- Manifest V3 setup ✓
- Vite build pipeline ✓
- Sanitization refactoring ✓

**Next Session (Task 6 - Manual Validation)**:
1. Load dist/ unpacked in Chrome (chrome://extensions → Load unpacked → select `dist/`)
2. Re-extract test pages (test1.md, new pages)
3. Verify: no `<script>`, `<style>`, `<form>` tags in output
4. Verify: main content still preserved and readable
5. If clean: commit changes
6. If noise remains: debug and refine sanitizeHtml() patterns