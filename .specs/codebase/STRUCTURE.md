# Project Structure

## Directory Layout

```
kcontextfy/
├── src/
│   ├── content/
│   │   ├── identifier.ts      # Page type detection
│   │   ├── extractor.ts       # Content extraction + scoring
│   │   └── listener.ts        # DOM listeners
│   ├── background/
│   │   └── converter.ts       # HTML → Markdown pipeline
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.ts
│   ├── shared/
│   │   ├── types.ts           # Shared TypeScript interfaces
│   │   └── constants.ts       # Shared constants & selectors
│   └── __tests__/
│       └── extractor.test.ts
├── .specs/
│   ├── project/
│   │   ├── PROJECT.md         # Vision, goals
│   │   ├── ROADMAP.md         # Features, milestones
│   │   └── STATE.md           # Decisions, blockers
│   ├── codebase/
│   │   ├── STACK.md           # Technology stack
│   │   ├── ARCHITECTURE.md    # System design, data flow
│   │   ├── CONVENTIONS.md     # Coding patterns
│   │   ├── STRUCTURE.md       # File organization (this file)
│   │   ├── TESTING.md         # Test strategy
│   │   ├── INTEGRATIONS.md    # External APIs, dependencies
│   │   └── CONCERNS.md        # Tech debt, risks
│   └── features/
│       └── improve-content-extraction-scoring/
│           ├── spec.md
│           ├── design.md
│           └── tasks.md
├── vite.config.ts
├── vitest.config.ts
├── biome.json
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml
```

## Core Modules

### `src/content/` - Content Script

Runs on webpages.

**identifier.ts** (~170 lines)
- `identifyPageType()` - Detects article/video/generic, confidence 0-1
- `getMetaTags()` - Extracts og:*, twitter:*, author, date, image
- Checks: domains, meta tags, HTML elements, URL patterns

**extractor.ts** (~450 lines)
- `extractContent()` - Main orchestrator
- Scoring helpers (12 functions):
  - `calculateConfidenceScore()` - Weighted combination (semantic 40%, structural 30%, density 30%)
  - `scoreSemantic()` - Role, class, ID, ancestor signals
  - `scoreStructural()` - Child count, headings, content elements
  - `scoreTextDensity()` - Word count, diversity, boilerplate
- `findBestContentElement()` - Scores candidates, returns best
- `waitForContent()`, `observeForContentStability()` - MutationObserver (1s debounce, 10s max)
- Fallbacks: Best-scored → Mozilla Readability → manual extraction

**listener.ts** (~80 lines)
- Message passing with background service
- Button click handlers
- State management

### `src/background/` - Service Worker

Runs continuously.

**converter.ts** (~190 lines)
- `processExtractedContent()` - Full pipeline
- `createTurndownService()` - Factory with rules (no script/style/form/iframe, strip data-*/on*)
- `convertToMarkdown()` - HTML → Markdown wrapper
- `normalizeHeadingHierarchy()` - Fix H1→H4 jumps
- `deduplicateLinks()` - Reference-style link consolidation
- `cleanEmptyElements()` - Whitespace normalization
- `generateFrontmatter()` - YAML header (title, url, type, metadata)

### `src/popup/` - UI

**popup.html** (~30 lines)
- Button, display area, actions

**popup.ts** (~50 lines)
- Send extraction trigger, render results

### `src/shared/`

**types.ts** (~50 lines)
- `PageTypeResult`, `ExtractionResult`, `ConversionOptions`

**constants.ts** (~40 lines)
- Thresholds, domains, selectors, meta field whitelist

### `src/__tests__/`

**extractor.test.ts** (~400 lines)
- 28 tests: scoreSemantic (9), scoreStructural (9), scoreTextDensity (5), calculateConfidenceScore (5)
- Custom DOM mocks (no JSDOM)
- Behavior-focused assertions

## Cohesion & Size

Target: 200-400 lines per module, max 800

| Module | Lines | Status |
|--------|-------|--------|
| extractor.ts | ~450 | Good (multiple helpers extracted) |
| converter.ts | ~190 | Good |
| identifier.ts | ~170 | Good |
| popup.ts | ~50 | Good |
| extractor.test.ts | ~400 | Good |

## Separation of Concerns

| Layer | Module | Responsibility |
|-------|--------|-----------------|
| **Content** | identifier.ts | Page type detection only |
| | extractor.ts | Content extraction + scoring |
| **Background** | converter.ts | HTML → Markdown pipeline |
| **Shared** | types.ts | Public API contracts |
| | constants.ts | Configuration, magic numbers |
| **Test** | extractor.test.ts | Scoring engine validation |

## Build Outputs

**Vite produces:**
```
dist/
├── content.js       # Content script bundle
├── background.js    # Service worker bundle
└── popup.js         # Popup UI bundle
```

Each component loads independently in its execution context.

## Configuration Files

**vite.config.ts**
- Entry points per component
- Output: dist/ with separate bundles

**vitest.config.ts**
- No JSDOM (custom mocks)
- Coverage target 80%+

**biome.json**
- Strict linting (for...of, no console.log)
- 2-space indent, single quotes

**tsconfig.json**
- ES2020 target
- Strict mode enabled
- ESNext modules (Vite transpiles)

## Spec Files Organization

Following `/tlc-spec-driven` pattern:

**Project level** (`.specs/project/`)
- PROJECT.md - Vision & goals
- ROADMAP.md - Features & milestones
- STATE.md - Decisions, blockers, todos

**Codebase level** (`.specs/codebase/`)
- STACK.md - Tech stack
- ARCHITECTURE.md - System design
- CONVENTIONS.md - Coding patterns
- STRUCTURE.md - File organization (this file)
- TESTING.md - Test strategy
- INTEGRATIONS.md - Dependencies, external APIs
- CONCERNS.md - Tech debt, risks, fragile areas

**Feature level** (`.specs/features/improve-content-extraction-scoring/`)
- spec.md - Requirements with traceable IDs
- design.md - Architecture, scoring weights, refinements
- tasks.md - Atomic implementation tasks

---

*Last updated: 2026-05-16. Status: active*
