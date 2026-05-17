import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  collapseBlankLines,
  delay,
  escapeMarkdown,
  trimWhitespace,
  getMetaContent,
  extractAuthorFromText,
  parsePublishedDate,
} from '../shared/utils';

describe('utils', () => {
  describe('escapeMarkdown', () => {
    it('escapes special characters', () => {
      expect(escapeMarkdown('**bold**')).toBe('\\*\\*bold\\*\\*');
      expect(escapeMarkdown('[link](url)')).toBe('\\[link\\]\\(url\\)');
      expect(escapeMarkdown('# heading')).toBe('\\# heading');
    });

    it('handles empty string', () => {
      expect(escapeMarkdown('')).toBe('');
    });
  });

  describe('trimWhitespace', () => {
    it('collapses multiple spaces', () => {
      expect(trimWhitespace('hello    world')).toBe('hello world');
    });

    it('trims leading and trailing whitespace', () => {
      expect(trimWhitespace('  hello  ')).toBe('hello');
    });
  });

  describe('collapseBlankLines', () => {
    it('collapses multiple blank lines', () => {
      expect(collapseBlankLines('hello\n\n\n\nworld')).toBe('hello\n\nworld');
    });

    it('keeps single blank lines', () => {
      expect(collapseBlankLines('hello\n\nworld')).toBe('hello\n\nworld');
    });
  });

  describe('delay', () => {
    it('resolves after specified time', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('getMetaContent', () => {
    beforeEach(() => {
      const mockQuerySelector = (selector: string) => {
        if (selector.includes('author')) {
          return { getAttribute: () => 'Test Author' };
        }
        if (selector.includes('og:title')) {
          return { getAttribute: () => 'Test Title' };
        }
        return null;
      };
      vi.stubGlobal('document', { querySelector: mockQuerySelector });
    });

    it('retrieves meta tag by name attribute', () => {
      const result = getMetaContent('author');
      expect(result).toBe('Test Author');
    });

    it('retrieves meta tag by property attribute', () => {
      const result = getMetaContent('og:title');
      expect(result).toBe('Test Title');
    });

    it('returns null if meta tag not found', () => {
      const result = getMetaContent('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('extractAuthorFromText', () => {
    it('extracts author from "by" pattern', () => {
      expect(extractAuthorFromText('By John Doe')).toBe('John Doe');
      expect(extractAuthorFromText('by Jane Smith')).toBe('Jane Smith');
    });

    it('extracts author with "on" date separator', () => {
      expect(extractAuthorFromText('By Alice on May 17')).toBe('Alice');
    });

    it('returns null if no author pattern found', () => {
      expect(extractAuthorFromText('No author here')).toBeNull();
    });

    it('returns null if text is empty', () => {
      expect(extractAuthorFromText('')).toBeNull();
    });

    it('returns null if text is null', () => {
      expect(extractAuthorFromText(null as any)).toBeNull();
    });
  });

  describe('parsePublishedDate', () => {
    it('parses ISO 8601 dates', () => {
      const result = parsePublishedDate('2026-05-17T10:00:00Z');
      expect(result).toBe('2026-05-17T10:00:00.000Z');
    });

    it('parses common date formats', () => {
      const result = parsePublishedDate('May 17, 2026');
      expect(result).toContain('2026-05-17');
    });

    it('parses abbreviated month names', () => {
      const result = parsePublishedDate('Jan 1, 2026');
      expect(result).toContain('2026-01-01');
    });

    it('returns null if date string is null', () => {
      expect(parsePublishedDate(null)).toBeNull();
    });

    it('returns null if date cannot be parsed', () => {
      expect(parsePublishedDate('invalid date')).toBeNull();
    });
  });
});