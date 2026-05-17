# Technology Stack

## Language & Runtime
- **TypeScript 5.x** - Primary language, strict mode enabled
- **Node.js** - Runtime environment

## Build & Development
- **Vite 5.x** - Build tool & dev server
- **Biome** - Formatter & linter (replaces ESLint/Prettier)

## Testing
- **Vitest** - Unit & integration testing framework
- **@vitest/ui** - Test UI dashboard
- **@vitest/coverage-v8** - Code coverage reports

## Core Dependencies
- **Mozilla Readability** - Content extraction & parsing (core extraction engine)
- **Turndown** - HTML-to-Markdown conversion
- **turndown-plugin-gfm** - GitHub-flavored Markdown support

## Browser API
- **Chrome Extension APIs** - content script, background script, popup UI
- **DOM APIs** - MutationObserver, querySelector, textContent, etc.
- **DOMParser** - HTML parsing in background context

## Project Configuration
- **pnpm** - Package manager
- **package.json** - Scripts: build, lint, test, dev
- **.chrome-manifest.json** - Extension manifest (auto-generated from source)

## Architecture Pattern
- **Content Script** - Runs on webpage, extracts content via MutationObserver
- **Background Script** - Converts HTML to Markdown, manages storage
- **Popup UI** - User interface for extension controls

## Key Features
- **MutationObserver** - Dynamic content stability detection (1s debounce)
- **Scoring Engine** - Semantic + Structural + Text Density analysis
- **Reference-style Markdown** - Links deduplicated with `[text][N]` format
- **Frontmatter** - YAML metadata (title, url, type, author, date, image)
