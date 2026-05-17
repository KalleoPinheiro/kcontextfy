import { Readability } from '@mozilla/readability';
import { getMetaContent, extractAuthorFromText, parsePublishedDate } from '../shared/utils';

export interface SanitizedContent {
  title: string | null;
  author: string | null;
  publishedAt: string | null;
  content: string;
}

export function sanitizeContent(doc: Document): SanitizedContent {
  const title = extractTitle(doc);
  const author = extractAuthor(doc);
  const publishedAt = extractPublishedDate(doc);
  const content = extractContent(doc);

  return {
    title,
    author,
    publishedAt,
    content,
  };
}

function extractTitle(doc: Document): string | null {
  // og:title
  const ogTitle = getMetaContent('og:title');
  if (ogTitle) return ogTitle;

  // twitter:title
  const twitterTitle = getMetaContent('twitter:title');
  if (twitterTitle) return twitterTitle;

  // document.title
  if (doc.title) return doc.title;

  // h1
  const h1 = doc.querySelector('h1');
  if (h1?.textContent) return h1.textContent.trim();

  // fallback to hostname
  return null;
}

function extractAuthor(doc: Document): string | null {
  // article:author meta tag
  const articleAuthor = getMetaContent('article:author');
  if (articleAuthor) return articleAuthor;

  // author meta tag
  const authorMeta = getMetaContent('author');
  if (authorMeta) return authorMeta;

  // byline patterns
  const byline = doc.querySelector('[rel="author"], .author, .by-author, .by');
  if (byline?.textContent) {
    const extracted = extractAuthorFromText(byline.textContent);
    if (extracted) return extracted;
  }

  return null;
}

function extractPublishedDate(doc: Document): string | null {
  // article:published_time
  const articleDate = getMetaContent('article:published_time');
  if (articleDate) return parsePublishedDate(articleDate);

  // datePublished
  const datePublished = getMetaContent('datePublished');
  if (datePublished) return parsePublishedDate(datePublished);

  // time element with datetime attribute
  const timeEl = doc.querySelector('time[datetime]');
  if (timeEl) {
    const datetime = timeEl.getAttribute('datetime');
    if (datetime) return parsePublishedDate(datetime);
  }

  return null;
}

function extractContent(doc: Document): string {
  try {
    stripUIElements(doc);

    const reader = new Readability(doc);
    const article = reader.parse();
    if (article?.content && article.content.trim().length > 100) {
      return article.content;
    }
  } catch {
    // Readability failed, use fallback
  }

  const main = doc.querySelector('main') || doc.querySelector('[role="main"]');
  if (main) {
    return main.innerHTML;
  }

  const article = doc.querySelector('article');
  if (article) {
    return article.innerHTML;
  }

  return doc.body?.innerHTML || '';
}

function stripUIElements(doc: Document): void {
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

  for (const selector of selectors) {
    for (const el of Array.from(doc.querySelectorAll(selector))) {
      el.remove();
    }
  }
}
