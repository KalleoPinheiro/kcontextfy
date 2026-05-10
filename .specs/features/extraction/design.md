# Design: Content Extraction Extension

## Goal

Extract clean content from web pages and convert to Markdown for consumption by LLMs.

## Architecture: Manifest V3

Standard Chrome Extension V3 architecture to ensure compatibility and security.

## Components

### 1. Popup (`popup.html` / `popup.js`)

- **Role**: User interface and trigger.
- **Functions**:
  - Trigger extraction process.
  - Display extraction status.
  - Copy result to clipboard.
  - Settings for extraction preferences.
  - Button to download the generated content.

### 2. Content Script (`content.js`)

- **Role**: DOM interaction and data gathering.
- **Functions**:
  - Clone the DOM.
  - Execute `Readability.js` to identify main content area.
  - Extract HTML and metadata (title, URL).
  - Handle specific site-based selectors if Readability fails.
  - Communicate extracted raw HTML to Background Service Worker.

### 3. Background Service Worker (`background.js`)

- **Role**: Orchestration and heavy lifting.
- **Functions**:
  - Manage messaging between Popup and Content Script.
  - API Integration: Fetch video transcripts (e.g., YouTube) when detected. (V2)
  - Markdown Conversion: Use `Turndown` to convert HTML $\to$ Markdown.
  - Storage: Persist user settings and recent extractions via `chrome.storage`.

## Data Flow

`Popup` $\to$ `Background` $\to$ `Content Script` (Extract HTML) $\to$ `Background` (Clean/Convert to MD) $\to$ `Popup` (Show Result).

## Technical Stack

- **Readability.js**: Industry standard for content extraction (used by Firefox Reader).
- **Turndown**: Robust HTML to Markdown converter.
- **Chrome Storage API**: For configuration and state.
- **Typescript**: Strict mode.
- **Vite**: With templete `vanilla-ts`.

## Edge Case Handling

- **Dynamic Content**: Use MutationObservers or wait for specific elements to load.
- **Auth Walls**: Content script runs in page context, bypassing most simple auth walls.
- **IFrames**: Target main frame by default; allow specific iframe extraction if necessary.
