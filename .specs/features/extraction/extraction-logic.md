# Design: Extraction Logic (REQ-2)

## Extraction by Page Type

### Article Extraction
**Target elements**: Title, Author, Date, Main Body, Images

| Field | Source | Fallback |
|-------|--------|----------|
| Title | `og:title` meta | `<h1>` in article | `document.title` |
| Author | `author` meta | `.author`, `.byline` class | None |
| Date | `article:published_time` meta | `.date`, `.published` class | None |
| Body | Readability.js parse result | CSS selector fallback | None |
| Images | `img` tags in body | `og:image` meta | None |

**Strip noise**: nav, footer, aside, comments, ads, share buttons.

### Video Extraction
**Target elements**: Title, Channel, Transcript

| Field | Source | Fallback |
|-------|--------|----------|
| Title | `og:title` meta | `<title>` tag | None |
| Channel | `og:site_name` meta | `.channel-name` class | None |
| Transcript | YouTube transcript API (V2) | None | None |

### Generic Extraction
**Target**: main content area, key headings.

Use Readability.js to find largest text block. Extract all `<h1>`-`<h6>` headings.

## Dynamic Content Handling
- Content script waits for `document.readyState === 'complete'`
- Optional: MutationObserver watches for lazy-loaded content
- Configurable wait time (default: 2000ms)

## Site-Specific Fallbacks
When Readability confidence < 0.5:
1. Wikipedia → `.mw-parser-output`
2. Reddit → `.usertext`
3. Twitter/X → `article[data-testid="tweet"]`
4. GitHub → `.markdown-body`