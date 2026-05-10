import { PageTypeResult, PageType } from '../shared/types';
import {
  CONFIDENCE_THRESHOLD,
  ARTICLE_META_SELECTORS,
  VIDEO_DOMAINS,
  SITE_SPECIFIC_SELECTORS,
} from '../shared/constants';

export function identifyPageType(): PageTypeResult {
  const url = window.location.href;
  const domain = window.location.hostname;

  // Check for video first
  const videoResult = checkVideoType(url, domain);
  if (videoResult.confidence > CONFIDENCE_THRESHOLD) {
    return videoResult;
  }

  // Check for article
  const articleResult = checkArticleType();
  if (articleResult.confidence > CONFIDENCE_THRESHOLD) {
    return articleResult;
  }

  // Check site-specific selectors
  const siteSpecific = checkSiteSpecific();
  if (siteSpecific.confidence > CONFIDENCE_THRESHOLD) {
    return siteSpecific;
  }

// Default to generic
  return {
    type: 'generic',
    confidence: 1.0,
    metadata: { source: 'fallback' },
  };
}

function checkVideoType(url: string, domain: string): PageTypeResult {
  let confidence = 0;
  const metadata: Record<string, string> = {};

  // Check URL against known video domains
  for (const videoDomain of VIDEO_DOMAINS) {
    if (domain.includes(videoDomain) || url.includes(videoDomain)) {
      confidence = 0.9;
      metadata['videoDomain'] = videoDomain;
      break;
    }
  }

  // Check meta tags
  const ogType = getMetaContent('og:type');
  if (ogType === 'video') {
    confidence = Math.max(confidence, 0.8);
  }

  const twitterCard = getMetaContent('twitter:card');
  if (twitterCard === 'player') {
    confidence = Math.max(confidence, 0.8);
    metadata['twitterCard'] = 'player';
  }

  // Check for video element
  const hasVideoElement = document.querySelector('video') !== null;
  if (hasVideoElement) {
    confidence = Math.max(confidence, 0.7);
  }

  return { type: 'video', confidence, metadata };
}

function checkArticleType(): PageTypeResult {
  let confidence = 0;
  const metadata: Record<string, string> = {};

  // Check meta tags
  const ogType = getMetaContent('og:type');
  if (ogType === 'article') {
    confidence = 0.8;
    metadata['ogType'] = 'article';
  }

  const twitterCard = getMetaContent('twitter:card');
  if (twitterCard === 'summary_large_image') {
    confidence = Math.max(confidence, 0.7);
  }

  // Check for article element
  const articleElement = document.querySelector('article');
  if (articleElement) {
    confidence = Math.max(confidence, 0.75);
  }

  // Check for article role
  const articleRole = document.querySelector('[role="article"]');
  if (articleRole) {
    confidence = Math.max(confidence, 0.7);
  }

  // Check class names
  const articleClasses = ['post-content', 'article-body', 'entry-content', 'article-content'];
  for (const cls of articleClasses) {
    if (document.querySelector(`.${cls}`)) {
      confidence = Math.max(confidence, 0.6);
      break;
    }
  }

  // Check URL patterns
  const urlPatterns = [/\.html$/, /\/blog\//, /\/news\//, /\/article\//];
  for (const pattern of urlPatterns) {
    if (pattern.test(window.location.href)) {
      confidence = Math.max(confidence, 0.5);
      break;
    }
  }

  // Extract essential metadata only (author, date, image)
  const author = getMetaContent('article:author') || getMetaContent('author');
  if (author) metadata.author = author;

  const date = getMetaContent('article:published_time') || getMetaContent('date');
  if (date) metadata.date = date;

  const image = getMetaContent('og:image');
  if (image) metadata.image = image;

  return { type: 'article', confidence, metadata };
}

function checkSiteSpecific(): PageTypeResult {
  const hostname = window.location.hostname.replace('www.', '');

  for (const [site, selector] of Object.entries(SITE_SPECIFIC_SELECTORS)) {
    if (hostname.includes(site) || hostname.includes(site.replace('.com', ''))) {
      const element = document.querySelector(selector);
      if (element) {
        return {
          type: 'article',
          confidence: 0.85,
          metadata: { site, selector },
        };
      }
    }
  }

  return { type: 'generic', confidence: 0, metadata: {} };
}

function getMetaContent(name: string): string | null {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return meta?.getAttribute('content') ?? null;
}

export function getMetaTags(): Record<string, string> {
  const metas = document.querySelectorAll('meta');
  const result: Record<string, string> = {};

  metas.forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    const content = meta.getAttribute('content');
    if (name && content) {
      result[name] = content;
    }
  });

  return result;
}