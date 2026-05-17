# Feature Spec: Content Extraction

## Overview

Identify page type, safely extract article/video/generic content from live DOM, and return clean HTML ready for conversion to Markdown. Uses content cloning to avoid mutating the live page.

## Requirements

### REQ-1: Page Type Identification [HIGH]

- [ ] Detect article (news, blog, doc, medium, dev.to, etc.)
- [ ] Detect video (YouTube, Vimeo, etc.)
- [ ] Detect generic web page
- [ ] Use heuristics: meta tags, URL patterns, DOM structure
- [ ] Return confidence score (0-1)

**Rationale**: Different extraction strategies for different types.

### REQ-2: DOM Safety [BLOCKING]

- [ ] Clone document before any modification
- [ ] Never mutate live page DOM
- [ ] Operate exclusively on cloned document
- [ ] Return clean HTML from clone, not live DOM

**Rationale**: Live DOM mutations break host page scripts. Recent blocker: dev.to followButtons.js crashed when we removed nodes.

**Tests**:
- Live DOM unchanged after extraction
- Cloned DOM has UI noise stripped
- Host scripts continue running

### REQ-3: Article Extraction [HIGH]

- [ ] Strip UI chrome: nav, footer, header, aside, ads, comments
- [ ] Find main content via scoring (semantic + structural + density)
- [ ] Fallback to Mozilla Readability on clean clone
- [ ] Extract title, author, date from metadata
- [ ] Return clean HTML

**Rationale**: Articles have stable structure; scoring finds best match.

**Tests**:
- High-confidence extraction on well-structured sites
- Readability fallback on unstructured sites
- UI elements stripped

### REQ-4: Video Extraction [MEDIUM]

- [ ] Extract title, channel name
- [ ] Placeholder for transcript (V2 feature)
- [ ] Return JSON metadata block

**Rationale**: Videos lack semantic HTML; metadata-only for now.

### REQ-5: Generic Extraction [MEDIUM]

- [ ] Find `<main>` or `[role="main"]`
- [ ] Fallback to body content
- [ ] Return clean HTML

**Rationale**: Generic pages vary widely; heuristic approach.

### REQ-6: Stability Detection [HIGH]

- [ ] Wait for DOM mutations to settle (1s debounce, 10s max)
- [ ] Use MutationObserver on cloned doc
- [ ] Handle async content load
- [ ] Timeout gracefully

**Rationale**: Single-page apps load content dynamically; need to wait.

**Tests**:
- Content stable before extraction (1s no mutations)
- Timeout respected (10s max)
- Async images handled

### REQ-7: Performance & Constraints [MEDIUM]

- [ ] Extraction completes in <2s on typical articles
- [ ] Handle large pages (10MB+) without crashing
- [ ] Content script messages don't block popup
- [ ] Support MV3 async message passing

## Traceability & Implementation

| Req ID | Component | Status | Notes |
|--------|-----------|--------|-------|
| REQ-1  | identifier.ts | ✅ Active | Page type + confidence score |
| REQ-2  | extractor.ts (cloneNode + stripUIElements) | ✅ Fixed (2026-05-17) | No live DOM mutation |
| REQ-3  | extractor.ts (scoring + Readability) | ✅ Active | Best-fit algorithm + fallback |
| REQ-4  | extractor.ts (video metadata) | ✅ Active | Title + channel only |
| REQ-5  | extractor.ts (generic fallback) | ✅ Active | Main/body selection |
| REQ-6  | extractor.ts (waitForContent) | ✅ Active | MutationObserver 1s/10s |
| REQ-7  | content script + async messaging | ✅ Active | <2s typical |

## Architecture Notes

**Extraction Pipeline** (order matters):
1. Clone live document
2. Strip UI elements (nav, ads, comments, CSS, scripts, modals)
3. Wait for stability (MutationObserver)
4. Score candidates (semantic + structural + density)
5. Extract best match or Readability fallback
6. Return clean HTML to background

**Key Design Decisions**:
- **Clone first** → never touch live page
- **Score + fallback** → handles both structured and unstructured sites
- **MutationObserver** → waits for real content, not fixed timeout
- **Metadata from live DOM** → author/date extracted before conversion

---

*Last updated: 2026-05-17. Status: active. DOM cloning safety fully implemented.*
