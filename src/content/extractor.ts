import { Readability } from '@mozilla/readability';
import type { ExtractionResult, PageTypeResult, VideoMetadata } from '../shared/types';
import { getMetaTags, identifyPageType } from './identifier';

export async function extractContent(): Promise<ExtractionResult> {
  // Wait for dynamic content to load
  await waitForContent();

  const pageType = identifyPageType();
  const title = extractTitle(pageType);
  const url = window.location.href;
  const timestamp = new Date().toISOString();

  let content = '';

  if (pageType.type === 'article') {
    content = extractArticleContent();
  } else if (pageType.type === 'video') {
    content = extractVideoContent();
  } else {
    content = extractGenericContent();
  }

  return {
    pageType,
    title,
    content,
    url,
    timestamp,
  };
}

async function waitForContent(): Promise<void> {
  // Wait for document to be ready
  if (document.readyState !== 'complete') {
    await new Promise((resolve) => {
      window.addEventListener('load', resolve, { once: true });
    });
  }

  // Use MutationObserver for dynamic content stability
  await observeForContentStability();
}

function observeForContentStability(): Promise<void> {
  return new Promise((resolve) => {
    const STABILITY_THRESHOLD = 1000; // 1 second
    const MAX_WAIT_TIME = 10000; // 10 second absolute max
    let stabilityTimeout: ReturnType<typeof setTimeout>;
    let maxWaitTimeout: ReturnType<typeof setTimeout>;

    const observer = new MutationObserver(() => {
      // Clear stability timer and restart
      clearTimeout(stabilityTimeout);
      stabilityTimeout = setTimeout(() => {
        cleanup();
        resolve();
      }, STABILITY_THRESHOLD);
    });

    function cleanup(): void {
      clearTimeout(stabilityTimeout);
      clearTimeout(maxWaitTimeout);
      observer.disconnect();
    }

    // Start observing DOM mutations on document body with subtree
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial stability timer
    stabilityTimeout = setTimeout(() => {
      cleanup();
      resolve();
    }, STABILITY_THRESHOLD);

    // Absolute max timeout to prevent indefinite waiting
    maxWaitTimeout = setTimeout(() => {
      cleanup();
      resolve();
    }, MAX_WAIT_TIME);
  });
}

function stripUIElements(root: Document | HTMLElement): void {
  const selectors = [
    'style',
    'script',
    'noscript',
    'template',
    'link',
    'meta',
    'svg',
    'iframe',
    'nav',
    'footer',
    'header',
    'aside',
    '[role="navigation"]',
    '[role="complementary"]',
    '[role="contentinfo"]',
    '[role="banner"]',
    '.ads',
    '.sidebar',
    '.advertisement',
    '.comments',
    '.comment-section',
    '.related-posts',
    '.suggested-posts',
    '.newsletter-signup',
    '.share-buttons',
    '.social-share',
    '.subheading-anchor',
    '.heading-anchor',
    '.anchor-link',
    'a.headerlink',
    '.lang-toggle',
    '.language-switcher',
    '[id*="disqus"]',
    '[class*="comment"]',
    '[class*="ad"]',
    '[class*="widget"]',
    '[class*="sidebar"]',
    '[class*="related"]',
    '[class*="recommended"]',
    '[class*="newsletter"]',
    '[id*="comment"]',
    '[id*="ad"]',
    '[id*="widget"]',
    '.crayons-modal',
    '.crayons-snackbar',
    '.spec__tags',
    '.article-actions-container',
    '#comments',
    '#sidebar-wrapper-right',
    '#sidebar-wrapper-left',
    '[data-testid*="modal"]',
    '[id*="billboard"]',
    '[class*="billboard"]',
    '[data-tracking-id*="billboard"]',
    '.profile-preview-card',
    '.reactions-container',
    '.author-section',
    '.follow-button',
    '.community-block',
    '.crayons-comment',
    '#report-abuse-modal',
    '[href*="report-abuse"]',
  ];

  for (const selector of selectors) {
    try {
      for (const el of Array.from(root.querySelectorAll(selector))) {
        el.remove();
      }
    } catch (e) {
      // Skip invalid selectors
    }
  }

  // Headings often have empty <a>/<span> anchors used only for permalinks.
  // These wreck Turndown's heading output (produce `[][N]` suffixes). Strip them.
  for (const heading of Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6'))) {
    for (const child of Array.from(heading.children)) {
      const text = child.textContent?.trim() ?? '';
      if (text === '') {
        child.remove();
      }
    }
  }
}

function extractTitle(pageType: PageTypeResult): string {
  // Try OpenGraph title first
  const ogTitle = getMetaContent('og:title');
  if (ogTitle) return ogTitle;

  // Try Twitter title
  const twitterTitle = getMetaContent('twitter:title');
  if (twitterTitle) return twitterTitle;

  // Try document title
  if (document.title) return document.title;

  // Try first h1
  const h1 = document.querySelector('h1');
  if (h1?.textContent) return h1.textContent.trim();

  return window.location.hostname;
}

function extractArticleContent(): string {
  try {
    // Clone live doc — NEVER mutate live DOM (breaks host page scripts like dev.to followButtons)
    const clonedDoc = document.cloneNode(true) as Document;
    stripUIElements(clonedDoc);

    const bestElement = findBestContentElement(clonedDoc);
    if (bestElement && bestElement.innerHTML.trim().length > 100) {
      return bestElement.innerHTML;
    }

    const articleEl = findMainArticle(clonedDoc);
    if (articleEl && articleEl.innerHTML.trim().length > 100) {
      return articleEl.innerHTML;
    }

    const reader = new Readability(clonedDoc);
    const article = reader.parse();
    if (article?.content && article.content.trim().length > 100) {
      return article.content;
    }
  } catch (e) {
    console.error('[KContextify] Extraction error:', e);
  }

  // Last resort — read live body innerHTML (no mutation)
  return document.body?.innerHTML || '';
}

function findBestContentElement(root: Document = document): HTMLElement | null {
  const candidates = root.querySelectorAll(
    'article, main, [role="main"], [role="article"], .article, .post, .content, .main-content, #content, #main-content'
  );

  if (candidates.length === 0) {
    return null;
  }

  // Score each candidate
  let bestElement: HTMLElement | null = null;
  let bestScore = -1;

  for (let i = 0; i < candidates.length; i++) {
    const element = candidates[i] as HTMLElement;
    const score = calculateConfidenceScore(element);
    if (score > bestScore) {
      bestScore = score;
      bestElement = element;
    }
  }

  return bestElement;
}

function extractVideoContent(): string {
  const videoMeta: VideoMetadata = {};

  // Extract video metadata
  videoMeta.channel = getMetaContent('og:site_name') || undefined;

  // Get video title
  const title = getMetaContent('og:title') || document.title;

  // Return placeholder for V1 - transcript extraction is V2
  const content = JSON.stringify({
    type: 'video',
    title,
    channel: videoMeta.channel,
    url: window.location.href,
    transcript: 'Available in V2',
  });

  return content;
}

function extractGenericContent(): string {
  // Find main content area
  const main = document.querySelector('main') || document.querySelector('[role="main"]');
  if (main) {
    return main.innerHTML;
  }

  // Fallback to body
  return document.body?.innerHTML || '';
}

function findMainArticle(root: Document = document): HTMLElement | null {
  const article = root.querySelector('article');
  if (article) return article as HTMLElement;

  // Try common article class names
  const articleClasses = [
    'post-content',
    'article-body',
    'entry-content',
    'article-content',
    'content',
    'main-content',
  ];

  for (const cls of articleClasses) {
    const element = root.querySelector(`.${cls}`) as HTMLElement | null;
    if (element) return element;
  }

  const contentDiv = root.querySelector('#content, #main-content') as HTMLElement | null;
  if (contentDiv) return contentDiv;

  return null;
}

function getMetaContent(name: string): string | null {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return meta?.getAttribute('content') ?? null;
}

// Scoring Engine
function calculateConfidenceScore(node: HTMLElement): number {
  const semanticScore = scoreSemantic(node);
  const structuralScore = scoreStructural(node);
  const densityScore = scoreTextDensity(node);

  // Weighted combination (TODO: tune weights)
  const weights = {
    semantic: 0.4,
    structural: 0.3,
    density: 0.3,
  };

  return (
    semanticScore * weights.semantic +
    structuralScore * weights.structural +
    densityScore * weights.density
  );
}

function scoreSemantic(node: HTMLElement): number {
  let score = 0;

  score += scoreNodeRole(node);
  score += scoreNodeClasses(node);
  score += scoreNodeId(node);
  score += scoreAncestorRole(node);

  return Math.min(score / 100, 1);
}

function scoreNodeRole(node: HTMLElement): number {
  const role = node.getAttribute('role');
  if (role === 'main' || role === 'article') return 40;
  if (role === 'region' || role === 'doc-chapter') return 20;
  return 0;
}

function scoreNodeClasses(node: HTMLElement): number {
  const classList = node.className.split(/\s+/);
  const contentClasses = [
    'article',
    'post',
    'content',
    'main-content',
    'article-content',
    'article-body',
    'entry-content',
    'post-content',
  ];

  return contentClasses.some((cls) => classList.includes(cls)) ? 30 : 0;
}

function scoreNodeId(node: HTMLElement): number {
  const id = node.getAttribute('id');
  return id === 'content' || id === 'main-content' || id === 'article' ? 25 : 0;
}

function scoreAncestorRole(node: HTMLElement): number {
  let parent = node.parentElement;
  let levels = 0;

  while (parent && levels < 3) {
    const role = parent.getAttribute('role');
    if (role === 'main' || role === 'article') return 15;
    parent = parent.parentElement;
    levels++;
  }

  return 0;
}

function scoreStructural(node: HTMLElement): number {
  const children = Array.from(node.children) as HTMLElement[];
  let score = 0;

  score += scoreChildCount(children.length);
  score += scoreHeadingHierarchy(children);
  score += scoreEmptyChildren(children);
  score += scoreContentElements(children);

  return Math.max(Math.min(score / 100, 1), 0);
}

function scoreChildCount(count: number): number {
  if (count >= 10 && count <= 100) return 30;
  if (count >= 5 && count < 200) return 15;
  return 0;
}

function scoreHeadingHierarchy(children: HTMLElement[]): number {
  const headings = children.filter((el) => /^H[1-6]$/i.test(el.tagName));
  if (headings.length === 0) return 0;

  let consistencyCount = 0;
  let previousLevel = 0;

  for (const heading of headings) {
    const level = Number.parseInt(heading.tagName[1], 10);
    if (previousLevel === 0 || level <= previousLevel + 1) {
      consistencyCount++;
    }
    previousLevel = level;
  }

  const consistency = consistencyCount / Math.max(headings.length, 1);
  return consistency * 30;
}

function scoreEmptyChildren(children: HTMLElement[]): number {
  const emptyChildren = children.filter((el) => {
    const text = el.textContent?.trim() ?? '';
    return text.length === 0;
  });

  const emptyRatio = emptyChildren.length / Math.max(children.length, 1);
  if (emptyRatio < 0.3) return 25;
  if (emptyRatio < 0.5) return 10;
  if (emptyRatio >= 0.7) return -20;
  return 0;
}

function scoreContentElements(children: HTMLElement[]): number {
  const contentElements = children.filter(
    (el) => el.tagName === 'P' || el.tagName === 'ARTICLE' || el.tagName === 'SECTION'
  );
  return contentElements.length > 0 ? 15 : 0;
}

function scoreTextDensity(node: HTMLElement): number {
  const text = node.textContent ?? '';
  const cleanText = text.trim();

  if (cleanText.length < 100) return 0;

  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  let score = 0;

  score += scoreWordCount(words.length);
  score += scoreCharDiversity(cleanText);
  score -= scoreBoilerplatePenalty(cleanText);
  score += scoreWordLength(cleanText.length, words.length);

  return Math.max(Math.min(score / 100, 1), 0);
}

function scoreWordCount(wordCount: number): number {
  if (wordCount > 200) return 40;
  if (wordCount > 100) return 25;
  if (wordCount > 50) return 10;
  return 0;
}

function scoreCharDiversity(text: string): number {
  const uniqueChars = new Set(text.toLowerCase()).size;
  const diversity = uniqueChars / Math.min(text.length, 200);
  if (diversity > 0.5) return 30;
  if (diversity > 0.3) return 15;
  return 0;
}

function scoreBoilerplatePenalty(text: string): number {
  const patterns = [
    'cookie',
    'advertisement',
    'subscribe',
    'newsletter',
    'follow us',
    'share this',
    'comments',
    'copyright',
    'all rights reserved',
  ];

  const lowerText = text.toLowerCase();
  const hits = patterns.filter((p) => lowerText.includes(p)).length;
  return Math.min(hits * 5, 25);
}

function scoreWordLength(textLength: number, wordCount: number): number {
  const avgLength = wordCount > 0 ? textLength / wordCount : 0;
  if (avgLength > 4 && avgLength < 15) return 20;
  if (avgLength > 3 && avgLength < 20) return 10;
  return 0;
}

// Export for testing
export {
    calculateConfidenceScore,
    findBestContentElement,
    getMetaTags,
    scoreSemantic,
    scoreStructural,
    scoreTextDensity
};
