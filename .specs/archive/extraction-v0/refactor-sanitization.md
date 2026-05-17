# Spec: Refactor Extractor for Noise Filtering & Sanitization

## Overview

Improve `src/content/extractor.ts` to reduce extracted HTML noise (scripts, styles, tracking code) and improve Readability integration. Current extraction includes unwanted elements; fallbacks return raw HTML without filtering.

## Requirements

### REQ-1: Remove Unwanted Elements
Strip `<script>`, `<style>`, `<noscript>`, `<iframe>`, `<form>` from all extracted HTML.

### REQ-2: Improve Readability Usage
- Do NOT clone entire document (expensive)
- Use Readability directly on document
- Validate extracted content has actual text (>100 chars) before returning
- If Readability fails/empty, fallback to selector-based extraction

### REQ-3: Consistent Sanitization
All extraction paths (article, video, generic) apply sanitization before returning.

### REQ-4: Fallback Chain
Article → Readability attempt. If fails/empty → selector extraction. If not found → body. Each step sanitized.

## Changes to Make

| Item | Current | Proposed |
|------|---------|----------|
| Document cloning | `document.cloneNode(true)` | Pass document directly to Readability |
| Sanitization | None | `sanitizeHtml()` helper function |
| Content validation | Checks if content exists | Checks if content has text length >100 |
| Extraction paths | Raw innerHTML | All paths sanitized |
| Video/generic | No cleanup | Apply sanitization |

## Success Criteria

- ✓ test1.md re-extracted has no `<script>`, `<style>`, `<form>` tags
- ✓ No "Readability error" console spam (errors logged once)
- ✓ Extraction still clean (main content preserved)
- ✓ All unit tests pass

## Traceability

| Req ID | Implementation | Verification |
|--------|----------------|--------------|
| REQ-1  | `sanitizeHtml()` helper | test1.md clean |
| REQ-2  | Direct Readability + validation | test1.md correct length |
| REQ-3  | All paths use `sanitizeHtml()` | All paths sanitized |
| REQ-4  | Improved fallback in `extractArticleContent()` | Tests pass |
