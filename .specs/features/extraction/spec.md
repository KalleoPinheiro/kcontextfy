# Feature Spec: Content Extraction & Markdown Conversion

## Overview

Core engine to identify page type and convert DOM/API data into clean Markdown.

## Requirements

### 1. Content Identification [REQ-1]

- Detect if page is:
  - Article (News, Blog, Doc)
  - Video (YouTube, Vimeo)
  - Generic Web Page
- Use heuristics (meta tags, DOM patterns, URL) to decide.

### 2. Extraction Logic [REQ-2]

- **Articles**: Extract title, author, date, main body, and images. Strip nav, footer, ads.
- **Videos**: Extract title, channel, and transcript (if available).
- **Generic**: Extract main content area and key headings.

### 3. Markdown Conversion [REQ-3]

- Convert HTML elements to MD:
  - `<h1>`-`<h6>` $\to$ `#`-`######`
  - `<strong>`/`<b>` $\to$ `**`
  - `<em>`/`<i>` $\to$ `*`
  - `<ul>`/`<ol>` $\to$ `-` or `1.`
  - `<a>` $\to$ `[text](url)`
  - `<img>` $\to$ `![alt](src)`
- Ensure clean whitespace and logical structure.

### 4. Performance & Constraints [REQ-4]

- Execution must be non-blocking for UI.
- Handle large pages without crashing browser tab.
- Support Manifest V3 background/content script communication.

## Traceability Matrix

| Req ID | Goal |
|--------|------|
| REQ-1  | High-fidelity identification |
| REQ-2  | Accurate content capture |
| REQ-3  | Clean MD output |
| REQ-4  | Fast, stable UX |
