# Coding Conventions

## TypeScript & Language

### Types & Interfaces

**Public API types** - Explicit types on all exported functions:
```typescript
export function calculateConfidenceScore(node: HTMLElement): number
export function processExtractedContent(result: ExtractionResult): string
```

**Shared types** - Define in `src/shared/types.ts`:
```typescript
interface PageTypeResult {
  type: 'article' | 'video' | 'generic'
  confidence: number
  metadata: Record<string, string>
}

interface ExtractionResult {
  pageType: PageTypeResult
  title: string
  content: string
  url: string
  timestamp: string
}
```

**Avoid `any`** - Use `unknown` for untrusted input, then narrow:
```typescript
// WRONG
function getMetaContent(name: string): any

// CORRECT
function getMetaContent(name: string): string | null
```

### Immutability

Always create new objects; never mutate:
```typescript
// WRONG
function updateMetadata(obj: Record<string, string>) {
  obj.author = 'new name'
  return obj
}

// CORRECT
function updateMetadata(obj: Record<string, string>) {
  return {
    ...obj,
    author: 'new name'
  }
}
```

## Naming Conventions

- **Functions & variables**: `camelCase`
- **Types & interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE` (for magic numbers, thresholds)
- **Private functions**: keep at module scope (no export)
- **Booleans**: prefix with `is`, `has`, `should`, `can`

```typescript
// Constants (magic numbers)
const STABILITY_THRESHOLD = 1000
const MAX_WAIT_TIME = 10000
const CONFIDENCE_THRESHOLD = 0.5

// Booleans
const hasArticleElement = !!document.querySelector('article')
const shouldExtract = confidence > CONFIDENCE_THRESHOLD

// Type names
interface PageTypeResult { }
type PageType = 'article' | 'video' | 'generic'
```

## Function Design

### Small, focused functions

Max 50 lines; extract complex logic:
```typescript
// GOOD: Extracted helper
function scoreChildCount(count: number): number {
  if (count >= 10 && count <= 100) return 30
  if (count >= 5 && count < 200) return 15
  return 0
}

// GOOD: Main function stays concise
function scoreStructural(node: HTMLElement): number {
  const children = Array.from(node.children) as HTMLElement[]
  let score = 0
  score += scoreChildCount(children.length)
  score += scoreHeadingHierarchy(children)
  return Math.max(Math.min(score / 100, 1), 0)
}
```

### Avoid deep nesting

Use early returns:
```typescript
// CORRECT: Early returns, flat structure
function process(items) {
  for (const item of items) {
    if (!item.valid) continue
    if (item.type !== 'article') continue
    if (item.score <= 0.5) continue
    // do work
  }
}
```

## DOM Iteration

Always use `for...of` with `Array.from()` for NodeList compatibility:
```typescript
// CORRECT
for (const el of Array.from(document.querySelectorAll('p'))) {
  el.remove()
}

// WRONG: forEach in NodeList
document.querySelectorAll('p').forEach(el => el.remove()) // biome lint error
```

## Error Handling

Explicit error handling; no silent failures:
```typescript
// CORRECT: Log and fallback
function extractContent() {
  try {
    const reader = new Readability(document)
    const article = reader.parse()
    if (!article?.content?.trim().length) {
      throw new Error('No content extracted')
    }
    return article.content
  } catch (e) {
    console.error('[KContextify] Extraction error:', e)
    return fallbackExtraction()
  }
}
```

## Constants & Configuration

Define in `src/shared/constants.ts`:
```typescript
export const STABILITY_THRESHOLD = 1000 // ms
export const MAX_WAIT_TIME = 10000 // ms
export const CONFIDENCE_THRESHOLD = 0.5
export const MIN_TEXT_LENGTH = 100 // chars for text density scoring
```

## Comments

No comments explaining WHAT (code is self-documenting). Only WHY:
```typescript
// CORRECT: Explains why (hidden constraint)
// Paragraphs are strong signals for content areas
for (const child of children) {
  if (child.tagName === 'P') count++
}
```

## Scoring Functions

Three-module design with normalized output (0-1):

**Module structure:**
```typescript
export function scoreSemantic(node: HTMLElement): number {
  let score = 0
  score += scoreNodeRole(node)      // 40 points max
  score += scoreNodeClasses(node)   // 30 points max
  score += scoreNodeId(node)        // 25 points max
  score += scoreAncestorRole(node)  // 15 points max
  return Math.min(score / 100, 1)   // Normalize to 0-1
}
```

**Weighting in confidence:**
```typescript
const weights = {
  semantic: 0.4,   // HTML structure signals
  structural: 0.3, // Content density signals
  density: 0.3,    // Text quality signals
}
```

## Testing Conventions

See [TESTING.md](TESTING.md).

---

*Last updated: 2026-05-16. Status: active*
