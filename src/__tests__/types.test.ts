import { describe, expect, it } from 'vitest';
import type {
  PageType,
  PageTypeResult,
  ExtractionResult,
  ArticleMetadata,
  VideoMetadata,
  ConversionOptions,
  ChromeMessage,
  ExtractionRequest,
  ExtractionResponse,
} from '../shared/types';

describe('types', () => {
  describe('PageType', () => {
    it('allows article, video, generic', () => {
      const article: PageType = 'article';
      const video: PageType = 'video';
      const generic: PageType = 'generic';

      expect(article).toBe('article');
      expect(video).toBe('video');
      expect(generic).toBe('generic');
    });
  });

  describe('PageTypeResult', () => {
    it('has correct structure', () => {
      const result: PageTypeResult = {
        type: 'article',
        confidence: 0.85,
        metadata: { ogType: 'article' },
      };

      expect(result.type).toBe('article');
      expect(result.confidence).toBe(0.85);
      expect(result.metadata).toEqual({ ogType: 'article' });
    });
  });

  describe('ExtractionResult', () => {
    it('has correct structure', () => {
      const result: ExtractionResult = {
        pageType: { type: 'article', confidence: 0.9, metadata: {} },
        title: 'Test Article',
        content: '<p>Hello world</p>',
        url: 'https://example.com/article',
        timestamp: '2024-01-01T00:00:00Z',
      };

      expect(result.pageType.type).toBe('article');
      expect(result.title).toBe('Test Article');
      expect(result.content).toContain('Hello');
      expect(result.url).toBe('https://example.com/article');
      expect(result.timestamp).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('ArticleMetadata', () => {
    it('allows optional fields', () => {
      const meta: ArticleMetadata = {
        author: 'John Doe',
        date: '2024-01-01',
        images: ['https://example.com/image.jpg'],
      };

      expect(meta.author).toBe('John Doe');
      expect(meta.date).toBe('2024-01-01');
      expect(meta.images).toHaveLength(1);
    });

    it('can be empty', () => {
      const meta: ArticleMetadata = {};
      expect(meta.author).toBeUndefined();
      expect(meta.date).toBeUndefined();
      expect(meta.images).toBeUndefined();
    });
  });

  describe('VideoMetadata', () => {
    it('allows optional fields', () => {
      const meta: VideoMetadata = {
        channel: 'Test Channel',
        transcript: 'Hello this is a transcript',
      };

      expect(meta.channel).toBe('Test Channel');
      expect(meta.transcript).toBe('Hello this is a transcript');
    });
  });

  describe('ConversionOptions', () => {
    it('has correct defaults', () => {
      const opts: ConversionOptions = {
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*',
        strongDelimiter: '**',
        linkStyle: 'inlined',
      };

      expect(opts.headingStyle).toBe('atx');
      expect(opts.codeBlockStyle).toBe('fenced');
      expect(opts.bulletListMarker).toBe('-');
      expect(opts.emDelimiter).toBe('*');
      expect(opts.strongDelimiter).toBe('**');
      expect(opts.linkStyle).toBe('inlined');
    });

    it('accepts setex heading style', () => {
      const opts: ConversionOptions = {
        headingStyle: 'setext',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*',
        strongDelimiter: '**',
        linkStyle: 'inlined',
      };

      expect(opts.headingStyle).toBe('setext');
    });
  });

  describe('ChromeMessage', () => {
    it('has action and optional payload', () => {
      const msg: ChromeMessage = { action: 'extract' };
      expect(msg.action).toBe('extract');
      expect(msg.payload).toBeUndefined();

      const msgWithPayload: ChromeMessage = { action: 'extract', payload: { foo: 'bar' } };
      expect(msgWithPayload.payload).toEqual({ foo: 'bar' });
    });
  });

  describe('ExtractionRequest', () => {
    it('action is always extract', () => {
      const req: ExtractionRequest = { action: 'extract' };
      expect(req.action).toBe('extract');
    });
  });

  describe('ExtractionResponse', () => {
    it('can have result', () => {
      const res: ExtractionResponse = {
        action: 'extractionComplete',
        result: {
          pageType: { type: 'article', confidence: 1.0, metadata: {} },
          title: 'Test',
          content: 'Content',
          url: 'https://example.com',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      expect(res.action).toBe('extractionComplete');
      expect(res.result?.title).toBe('Test');
    });

    it('can have error', () => {
      const res: ExtractionResponse = {
        action: 'extractionError',
        error: 'Something went wrong',
      };

      expect(res.action).toBe('extractionError');
      expect(res.error).toBe('Something went wrong');
    });

    it('can have conversionComplete action', () => {
      const res: ExtractionResponse = {
        action: 'conversionComplete',
        result: {
          pageType: { type: 'generic', confidence: 1.0, metadata: {} },
          title: 'Test',
          content: '# Markdown',
          url: 'https://example.com',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      expect(res.action).toBe('conversionComplete');
    });

    it('can have conversionError action', () => {
      const res: ExtractionResponse = {
        action: 'conversionError',
        error: 'Conversion failed',
      };

      expect(res.action).toBe('conversionError');
    });
  });
});
