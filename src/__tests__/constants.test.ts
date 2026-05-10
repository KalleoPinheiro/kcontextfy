import { describe, expect, it } from 'vitest';
import {
  CONFIDENCE_THRESHOLD,
  DEFAULT_WAIT_TIME,
  MIN_WORD_COUNT,
  ARTICLE_META_SELECTORS,
  VIDEO_DOMAINS,
  SITE_SPECIFIC_SELECTORS,
} from '../shared/constants';

describe('constants', () => {
  describe('CONFIDENCE_THRESHOLD', () => {
    it('is 0.5', () => {
      expect(CONFIDENCE_THRESHOLD).toBe(0.5);
    });
  });

  describe('DEFAULT_WAIT_TIME', () => {
    it('is 2000ms', () => {
      expect(DEFAULT_WAIT_TIME).toBe(2000);
    });
  });

  describe('MIN_WORD_COUNT', () => {
    it('is 100', () => {
      expect(MIN_WORD_COUNT).toBe(100);
    });
  });

  describe('ARTICLE_META_SELECTORS', () => {
    it('contains expected meta selectors', () => {
      expect(ARTICLE_META_SELECTORS).toContain('og:type');
      expect(ARTICLE_META_SELECTORS).toContain('article:published_time');
      expect(ARTICLE_META_SELECTORS).toContain('author');
    });
  });

  describe('VIDEO_DOMAINS', () => {
    it('contains known video platforms', () => {
      expect(VIDEO_DOMAINS).toContain('youtube.com');
      expect(VIDEO_DOMAINS).toContain('youtu.be');
      expect(VIDEO_DOMAINS).toContain('vimeo.com');
      expect(VIDEO_DOMAINS).toContain('dailymotion.com');
    });
  });

  describe('SITE_SPECIFIC_SELECTORS', () => {
    it('has selectors for known sites', () => {
      expect(SITE_SPECIFIC_SELECTORS).toHaveProperty('wikipedia');
      expect(SITE_SPECIFIC_SELECTORS).toHaveProperty('reddit');
      expect(SITE_SPECIFIC_SELECTORS).toHaveProperty('twitter');
      expect(SITE_SPECIFIC_SELECTORS).toHaveProperty('github');
    });

    it('wikipedia uses mw-parser-output', () => {
      expect(SITE_SPECIFIC_SELECTORS.wikipedia).toBe('.mw-parser-output');
    });

    it('github uses markdown-body', () => {
      expect(SITE_SPECIFIC_SELECTORS.github).toBe('.markdown-body');
    });
  });
});
