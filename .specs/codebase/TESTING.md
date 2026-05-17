# Testing Strategy

## Coverage Target

**Minimum 80%** - Unit tests focus on scoring engine; converter/identifier tested manually.

Current: `extractor.test.ts` - 28 tests, 100% scoring module coverage.

## Framework

**Vitest** (not Jest)
- Faster execution, built-in mocking, Vite integration
- No JSDOM (custom DOM mocks in Node environment)
- Coverage via c8

## Running Tests

```bash
pnpm test              # Run once
pnpm test:watch       # Watch mode
pnpm test:ui          # Vitest UI dashboard
pnpm test:coverage    # Coverage report (target 80%+)
```

## Test Patterns

### AAA Pattern (Arrange-Act-Assert)

```typescript
test('calculates semantic score with role attribute', () => {
  // Arrange
  const element = createMockElement('div', { role: 'article' })
  
  // Act
  const score = scoreSemantic(element)
  
  // Assert
  expect(score).toBeGreaterThan(0.3)
})
```

### Behavior-Focused, Not Code-Path-Focused

**Wrong**: "Does this code path execute?"
**Right**: "Does this behavior work as expected?"

```typescript
// WRONG: Tests code existence, not behavior
test('scoreStructural processes children', () => {
  const div = createMockElement('div')
  div.appendChild(createMockElement('p'))
  expect(scoreStructural(div)).toBeDefined() // Weak
})

// CORRECT: Tests actual behavior
test('rewards well-structured content higher than empty divs', () => {
  const good = createMockElement('div')
  for (let i = 0; i < 20; i++) {
    const p = createMockElement('p', { text: 'Content' })
    good.appendChild(p)
  }

  const poor = createMockElement('div')
  for (let i = 0; i < 20; i++) {
    poor.appendChild(createMockElement('div'))
  }

  const goodScore = scoreStructural(good)
  const poorScore = scoreStructural(poor)

  expect(goodScore).toBeGreaterThan(poorScore) // Validates behavior
})
```

### Comparative Tests

Compare quality differences:

```typescript
test('scores quality text higher than boilerplate', () => {
  const quality = createMockElement('div', {
    text: 'The quick brown fox jumps over the lazy dog. '.repeat(15),
  })
  const boilerplate = createMockElement('div', {
    text: 'Please subscribe to our newsletter. '.repeat(15),
  })

  const qualityScore = scoreTextDensity(quality)
  const boilerplateScore = scoreTextDensity(boilerplate)

  expect(qualityScore).toBeGreaterThan(boilerplateScore)
})
```

## DOM Mocking (No JSDOM)

Custom `createMockElement()` helper:

```typescript
function createMockElement(tag = 'div', props: Record<string, string> = {}): HTMLElement {
  const mockElement: any = {
    tagName: tag.toUpperCase(),
    className: props.class || '',
    id: props.id || '',
    children: [] as HTMLElement[],
    textContent: props.text || '',
    getAttribute: (name: string) => props[name] || null,
    setAttribute: (name: string, value: string) => { props[name] = value },
    appendChild: function (child: HTMLElement) {
      this.children.push(child)
      ;(child as any)._parent = this
      return child
    },
  }

  Object.defineProperty(mockElement, 'parentElement', {
    get: function () {
      return this._parent
    },
  })

  return mockElement as HTMLElement
}
```

Benefits:
- No JSDOM dependency overhead
- Fast execution
- Predictable behavior
- Isolated from real DOM quirks

## Test Suite: extractor.test.ts

**28 tests** covering all scoring modules.

### scoreSemantic (9 tests)
- Rewards role="main" / role="article"
- Rewards class/id patterns
- Combines multiple signals
- Ignores unrelated attributes
- Inspects ancestor roles (up to 3 levels)
- Multiple signals score higher than single

### scoreStructural (9 tests)
- Rewards child count 10-100
- Penalizes too few children
- Rewards heading hierarchy
- Penalizes excessive empty children
- Rewards content elements (p, article, section)
- Quality structure > empty divs
- Handles heading degradation

### scoreTextDensity (5 tests)
- Returns 0 for <100 chars
- Rewards >100 word count
- Rewards character diversity
- Penalizes boilerplate
- Quality > repetitive text

### calculateConfidenceScore (5 tests)
- Combines all three modules
- Normalized (0-1)
- Article structure > poor
- All three dimensions > single
- Consistent scoring

## Coverage Map

```
extractor.ts
  ✓ calculateConfidenceScore - 100% (5 tests)
  ✓ scoreSemantic + helpers - 100% (9 tests)
  ✓ scoreStructural + helpers - 100% (9 tests)
  ✓ scoreTextDensity + helpers - 100% (5 tests)
  ✓ findBestContentElement - 100% (tested indirectly)
  - extractArticleContent - Partial (Readability fallback untested)
  - extractVideoContent - Not tested (V2)
  - extractGenericContent - Not tested (V2)

converter.ts
  - All functions - Manual testing (Turndown hard to mock)

identifier.ts
  - All functions - Manual testing (DOM-heavy)
```

## Manual Testing Checklist

### Content Extraction
- [ ] Article page (semantic markup: article, role="article", og:type=article)
- [ ] Article page (hint-only: post-content, article-body classes)
- [ ] Article page (minimal structure: nested divs)
- [ ] Video page (YouTube, Vimeo)
- [ ] Generic page (no semantic hints)
- [ ] Dynamic content (loads after initial render)

### Markdown Conversion
- [ ] Heading hierarchy normalization (no H1→H4 jumps)
- [ ] Link deduplication (repeated URLs → single [N])
- [ ] Code blocks preserved (fenced, language specified)
- [ ] Tables converted (GFM)
- [ ] Images converted (![alt][url])
- [ ] Frontmatter valid YAML (title, url, type, metadata)

### Edge Cases
- [ ] Very long article (1000+ words)
- [ ] Very short article (<100 words)
- [ ] Embedded video in article
- [ ] Code snippets preserved
- [ ] Multiple images
- [ ] Paywalled content (JS-rendered)

## Complexity Standards

Target: Max complexity 5 per function (ESLint `max-complexity`)

All scoring helpers intentionally simple:
```typescript
function scoreNodeRole(node: HTMLElement): number {
  const role = node.getAttribute('role')
  if (role === 'main' || role === 'article') return 40
  if (role === 'region') return 20
  return 0
  // Complexity: 3 (linear, no nested conditionals)
}
```

## TDD Workflow

1. Write test (RED)
2. Confirm failure
3. Implement minimal code (GREEN)
4. Confirm pass
5. Refactor
6. Verify coverage ≥80%
7. Commit

Example:

```typescript
// Step 1: Test
test('rewards paragraphs in structural score', () => {
  const div = createMockElement('div')
  for (let i = 0; i < 10; i++) {
    div.appendChild(createMockElement('p', { text: 'Content' }))
  }
  expect(scoreStructural(div)).toBeGreaterThan(0.1)
})

// Step 2-3: Implement
function scoreContentElements(children: HTMLElement[]): number {
  const contentElements = children.filter(
    (el) => el.tagName === 'P' || el.tagName === 'ARTICLE'
  )
  return contentElements.length > 0 ? 15 : 0
}

// Step 4-7: Test, refactor, coverage, commit
```

## CI/CD Integration

Planned (.github/workflows/):
- Run `pnpm test` on every PR
- Run `pnpm lint` on every PR
- Enforce 80%+ coverage
- Node 18+ (Chrome extension)

---

*Last updated: 2026-05-16. Status: active*
