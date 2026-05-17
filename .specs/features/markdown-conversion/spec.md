---
title: Markdown Conversion Pipeline
type: feature
tags: [conversion, markdown, turndown, css-stripping]
sources: 2
updated: 2026-05-17
---

# Feature Spec: HTML to Markdown Conversion Pipeline

## Overview

Convert extracted HTML content to clean, valid Markdown with frontmatter. Robust against CSS leaks, nested lists, code blocks, and boilerplate UI noise.

## Requirements

### REQ-1: Safe HTML Sanitization [BLOCKING]

- [ ] Remove all `<style>` tags and content
- [ ] Remove all `<script>` tags and content
- [ ] Remove `<noscript>`, `<template>`, `<link>`, `<meta>` elements
- [ ] Support service worker context (no DOMParser available)
- [ ] Use regex fallback for DOM-unavailable environments

**Rationale**: Service workers can't access DOM APIs. Must work in both browser (DOMParser) and worker (regex) contexts.

**Tests**: 
- Style block with CSS variables stripped
- Script with embedded HTML/JSON stripped
- Service worker context gracefully degrades to regex

### REQ-2: Proper Heading Hierarchy [HIGH]

- [ ] Normalize heading levels (no jumps: h1→h3 invalid)
- [ ] Preserve semantic heading text
- [ ] Strip empty anchor/span children from headings
- [ ] Handle inline code in headings

**Rationale**: Invalid heading structure breaks Markdown readers and TOC generation.

**Tests**:
- H1→H2→H3 preserved
- H1→H3 normalized to H1→H2
- Empty `<a>` in `<h2>` removed, text preserved

### REQ-3: GFM Table Support [HIGH]

- [ ] Convert `<table>` to GFM Markdown tables
- [ ] Preserve `<thead>`, `<tbody>`, `<th>`, `<td>` structure
- [ ] Handle row spans and merged cells gracefully
- [ ] Escape pipes in cell content

**Rationale**: Turndown + GFM handles this; verify no regression.

**Tests**:
- Simple table converts
- Pipes in cells escaped
- Multi-line table preserved

### REQ-4: Code Block Detection & Fencing [HIGH]

- [ ] Detect loose code patterns (no fence markers)
- [ ] Wrap in triple backticks with language hint
- [ ] Preserve shebang lines (#!)
- [ ] Handle Ruby, Python, JavaScript, TypeScript, Rust, Go

**Rationale**: Articles with code samples need proper fencing for readability.

**Tests**:
- `def foo():` wrapped in ```python
- `#!/usr/bin/env ruby` preserved
- Loose imports/requires wrapped

### REQ-5: Link Preservation [HIGH]

- [ ] Convert inline `<a>` to `[text](url)` format
- [ ] Preserve link target URLs
- [ ] Skip empty links (permalink anchors)
- [ ] Handle relative URLs

**Rationale**: Links are critical for content utility.

**Tests**:
- Inline links preserved
- Empty anchor removed
- Relative URLs kept as-is

### REQ-6: UI Noise Removal [MEDIUM]

- [ ] Remove CSS blocks (`:root{...}`, `@media{...}`)
- [ ] Remove empty link references (`[][]`)
- [ ] Remove UI counters ("123 likes", "4 shares")
- [ ] Remove navigation text ("Skip to content", "Back to top")
- [ ] Remove language toggles ("PT | EN")

**Rationale**: Post-processing cleanup catches leaks from sanitization.

**Tests**:
- CSS variable blocks removed
- Empty links removed
- UI noise stripped

### REQ-7: Frontmatter Generation [MEDIUM]

- [ ] Generate YAML frontmatter block
- [ ] Include: title, url, type, author, date
- [ ] Escape special characters in YAML
- [ ] Place before content

**Rationale**: Markdown tools use frontmatter for metadata.

**Tests**:
- Frontmatter valid YAML
- Title with quotes escaped
- All fields present

## Traceability

| Req ID | Component | Status |
|--------|-----------|--------|
| REQ-1  | stripDangerousTags + sanitizeHtml | ✅ Active |
| REQ-2  | promoteOrphanHeadings | ✅ Active |
| REQ-3  | Turndown + gfm plugin | ✅ Active |
| REQ-4  | fenceLooseCodeBlocks | ✅ Active |
| REQ-5  | Turndown link rule | ✅ Active |
| REQ-6  | removeNoise post-process | ✅ Active |
| REQ-7  | generateFrontmatter | ✅ Active |

## Architecture Notes

**Pipeline Order** (critical):
1. stripDangerousTags (regex)
2. sanitizeHtml (DOM + fallback)
3. createTurndownService + convertToMarkdown
4. cleanEmptyElements
5. removeNoise
6. promoteOrphanHeadings
7. fenceLooseCodeBlocks
8. cleanEmptyElements (again)
9. generateFrontmatter (prepend)

**Ordering Rationale**:
- Strip before convert (avoid Turndown processing CSS)
- Clean empty → remove noise (order matters for blank line dedup)
- Promote headings before fencing (avoids false orphans in code)
- Frontmatter last (no interference from noise removal)

---

*Last updated: 2026-05-17. Status: active. Full 3-layer CSS defense implemented.*
