import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sanitizeContent } from '../content/sanitizer';

describe('sanitizeContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('title extraction', () => {
    it('extracts og:title when available', () => {
      const mockMeta = { getAttribute: vi.fn(() => 'OpenGraph Title') };
      const mockDoc = {
        title: 'Doc Title',
        querySelector: vi.fn((selector: string) => {
          if (selector.includes('og:title')) return mockMeta;
          if (selector === 'h1') return { textContent: 'H1 Title' };
          return null;
        }),
      } as unknown as Document;

      vi.stubGlobal('document', {
        querySelector: vi.fn((selector: string) => {
          if (selector.includes('og:title')) return mockMeta;
          return null;
        }),
      });

      const result = sanitizeContent(mockDoc);
      expect(result.title).toBe('OpenGraph Title');
    });

    it('falls back to document.title if og:title missing', () => {
      const mockDoc = {
        title: 'Fallback Title',
        querySelector: vi.fn(() => null),
      } as unknown as Document;

      vi.stubGlobal('document', { querySelector: vi.fn(() => null) });

      const result = sanitizeContent(mockDoc);
      expect(result.title).toBe('Fallback Title');
    });

    it('returns null if no title found', () => {
      const mockDoc = {
        title: '',
        querySelector: vi.fn(() => null),
      } as unknown as Document;

      vi.stubGlobal('document', { querySelector: vi.fn(() => null) });

      const result = sanitizeContent(mockDoc);
      expect(result.title).toBeNull();
    });
  });

  describe('author extraction', () => {
    it('extracts author from meta tag', () => {
      const mockMeta = { getAttribute: vi.fn(() => 'John Doe') };
      const mockDoc = {
        title: '',
        querySelector: vi.fn(() => null),
      } as unknown as Document;

      vi.stubGlobal('document', {
        querySelector: vi.fn((selector: string) => {
          if (selector.includes('article:author')) return mockMeta;
          return null;
        }),
      });

      const result = sanitizeContent(mockDoc);
      expect(result.author).toBe('John Doe');
    });

    it('returns null if no author found', () => {
      const mockDoc = {
        title: '',
        querySelector: vi.fn(() => null),
      } as unknown as Document;

      vi.stubGlobal('document', { querySelector: vi.fn(() => null) });

      const result = sanitizeContent(mockDoc);
      expect(result.author).toBeNull();
    });
  });

  describe('published date extraction', () => {
    it('extracts ISO date from meta tag', () => {
      const mockMeta = { getAttribute: vi.fn(() => '2026-05-17T10:00:00Z') };
      const mockDoc = {
        title: '',
        querySelector: vi.fn(() => null),
      } as unknown as Document;

      vi.stubGlobal('document', {
        querySelector: vi.fn((selector: string) => {
          if (selector.includes('article:published_time')) return mockMeta;
          return null;
        }),
      });

      const result = sanitizeContent(mockDoc);
      expect(result.publishedAt).toBe('2026-05-17T10:00:00.000Z');
    });

    it('returns null if no date found', () => {
      const mockDoc = {
        title: '',
        querySelector: vi.fn(() => null),
      } as unknown as Document;

      vi.stubGlobal('document', { querySelector: vi.fn(() => null) });

      const result = sanitizeContent(mockDoc);
      expect(result.publishedAt).toBeNull();
    });
  });

  describe('output format', () => {
    it('returns object with all required fields', () => {
      const mockDoc = {
        title: '',
        querySelector: vi.fn(() => null),
        body: { innerHTML: 'test content' },
      } as unknown as Document;

      vi.stubGlobal('document', { querySelector: vi.fn(() => null) });

      const result = sanitizeContent(mockDoc);
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('author');
      expect(result).toHaveProperty('publishedAt');
      expect(result).toHaveProperty('content');
    });

    it('handles missing metadata gracefully', () => {
      const mockDoc = {
        title: '',
        querySelector: vi.fn(() => null),
        body: { innerHTML: 'test' },
      } as unknown as Document;

      vi.stubGlobal('document', { querySelector: vi.fn(() => null) });

      const result = sanitizeContent(mockDoc);
      expect(result.title).toBeNull();
      expect(result.author).toBeNull();
      expect(result.publishedAt).toBeNull();
    });
  });
});
