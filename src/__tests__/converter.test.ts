import { describe, expect, it } from 'vitest';
import { convertToMarkdown, createTurndownService } from '../background/converter';

describe('converter', () => {
  describe('createTurndownService', () => {
    it('creates service with default options', () => {
      const td = createTurndownService();
      expect(td).toBeDefined();
    });

    it('creates service with custom options', () => {
      const td = createTurndownService({ headingStyle: 'setext' });
      expect(td).toBeDefined();
    });
  });

  describe('convertToMarkdown', () => {
    it('converts simple HTML to markdown', () => {
      const md = convertToMarkdown('<h1>Hello World</h1>');
      expect(md).toContain('# Hello World');
    });

    it('converts bold to markdown', () => {
      const md = convertToMarkdown('<strong>bold text</strong>');
      expect(md).toContain('**bold text**');
    });

    it('converts links to markdown (reference-style)', () => {
      const md = convertToMarkdown('<a href="https://example.com">Example</a>');
      // T5: Links now use reference-style [text][1]
      expect(md).toContain('[Example][1]');
      expect(md).toContain('https://example.com');
    });

    it('handles empty HTML', () => {
      const md = convertToMarkdown('');
      expect(md).toBe('');
    });
  });
});
