# Design: Content Identification (REQ-1)

## Goal
Detect page type: Article, Video, or Generic Web Page.

## Identification Heuristics

### Article Detection
Check in order:
1. Meta tags: `og:type` = `article`, `twitter:card` = `summary_large_image`
2. DOM patterns:
   - `<article>` tag present
   - `role="article"` attribute
   - `.post-content`, `.article-body`, `.entry-content` class names
3. URL patterns: ends with `.html`, contains `/blog/`, `/news/`, `/article/`
4. Word count: >300 words in main content suggests article

### Video Detection
Check in order:
1. URL: youtube.com, youtu.be, vimeo.com, dailymotion.com
2. Meta tags: `og:type` = `video`, `twitter:card` = `player`
3. DOM: `<video>` tag, `.video-player`, `.youtube-player` class
4. Embed meta: `og:video`, `twitter:player` present

### Generic Detection
Fallback when neither article nor video detected.

## Confidence Scoring
Return confidence 0.0–1.0 per type. Highest confidence wins.

## Implementation
```typescript
interface PageType {
  type: 'article' | 'video' | 'generic';
  confidence: number;
  metadata: Record<string, string>;
}
```

## Site-Specific Overrides (V2)
Hardcoded selectors for known sites where Readability fails:
- Wikipedia: `.mw-parser-output`
- Reddit: `.content` > `.usertext`
- Twitter/X: `<article>` tags with `data-testid="tweet"`