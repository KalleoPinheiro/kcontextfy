import { describe, expect, it } from 'vitest';
import { collapseBlankLines, delay, escapeMarkdown, trimWhitespace } from '../shared/utils';

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
});