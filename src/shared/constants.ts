export const CONFIDENCE_THRESHOLD = 0.5;
export const DEFAULT_WAIT_TIME = 2000;
export const MIN_WORD_COUNT = 100;

export const ARTICLE_META_SELECTORS = [
  'og:type',
  'article:published_time',
  'author',
];

export const VIDEO_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'dailymotion.com',
];

export const SITE_SPECIFIC_SELECTORS: Record<string, string> = {
  wikipedia: '.mw-parser-output',
  reddit: '.usertext',
  twitter: 'article[data-testid="tweet"]',
  github: '.markdown-body',
};