import { Readability } from '@mozilla/readability';
import { DEFAULT_WAIT_TIME } from '../shared/constants';
import type {
  ExtractionResult,
  PageTypeResult,
  VideoMetadata,
} from '../shared/types';
import { delay } from '../shared/utils';
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

  // Additional wait for lazy-loaded content
  await delay(DEFAULT_WAIT_TIME);
}

function stripUIElements(): void {
  const selectors = [
    'nav',
    'footer',
    '[role="navigation"]',
    '[role="complementary"]',
    '[role="contentinfo"]',
    '.ads',
    '.sidebar',
    '.advertisement',
  ];

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.remove();
    });
  });
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
    // Strip UI chrome before Readability
    stripUIElements();

    // Use Mozilla Readability for clean extraction (removes noise)
    const reader = new Readability(document);
    const article = reader.parse();
    if (article && article.content && article.content.trim().length > 100) {
      return article.content;
    }
  } catch (e) {
    console.error('[KContextify] Readability error:', e);
  }

  // Fallback to manual extraction
  const articleEl = findMainArticle();
  if (articleEl) {
    return articleEl.innerHTML;
  }

  // Last resort
  return document.body?.innerHTML || '';
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

function findMainArticle(): HTMLElement | null {
  // Try article element
  const article = document.querySelector('article');
  if (article) return article;

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
    const element = document.querySelector(`.${cls}`) as HTMLElement | null;
    if (element) return element;
  }

  const contentDiv = document.querySelector('#content, #main-content') as HTMLElement | null;
  if (contentDiv) return contentDiv;

  return null;
}

function getMetaContent(name: string): string | null {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return meta?.getAttribute('content') ?? null;
}

export { getMetaTags };
