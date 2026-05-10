import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getSettings,
  addRecentExtraction,
  getRecentExtractions,
  clearRecentExtractions,
  saveSettings,
} from '../background/storage';

const STORAGE_KEY = 'kcontextify_settings';

const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
};

vi.stubGlobal('chrome', mockChrome);

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('returns empty object when nothing stored', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});

      const settings = await getSettings();

      expect(settings).toEqual({});
    });

    it('returns stored options', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        [STORAGE_KEY]: {
          options: { headingStyle: 'setext', bulletListMarker: '*' },
        },
      });

      const settings = await getSettings();

      expect(settings).toEqual({ headingStyle: 'setext', bulletListMarker: '*' });
    });
  });

  describe('saveSettings', () => {
    it('merges settings with existing', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        [STORAGE_KEY]: { options: { headingStyle: 'atx' } },
      });
      mockChrome.storage.local.set.mockResolvedValue(undefined);

      await saveSettings({ bulletListMarker: '*' });

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEY]: {
          options: { headingStyle: 'atx', bulletListMarker: '*' },
        },
      });
    });
  });

  describe('addRecentExtraction', () => {
    it('adds extraction to front of list', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ [STORAGE_KEY]: {} });
      mockChrome.storage.local.set.mockResolvedValue(undefined);

      await addRecentExtraction({
        url: 'https://example.com',
        title: 'Example',
        timestamp: '2024-01-01T00:00:00Z',
      });

      expect(mockChrome.storage.local.set).toHaveBeenCalled();
      const call = mockChrome.storage.local.set.mock.calls[0][0];
      expect(call[STORAGE_KEY].recentExtractions[0].url).toBe('https://example.com');
    });

    it('limits to 10 extractions', async () => {
      const existing = Array.from({ length: 10 }, (_, i) => ({
        url: `https://example.com/${i}`,
        title: `Page ${i}`,
        timestamp: new Date(i * 1000).toISOString(),
      }));
      mockChrome.storage.local.get.mockResolvedValue({
        [STORAGE_KEY]: { recentExtractions: existing },
      });
      mockChrome.storage.local.set.mockResolvedValue(undefined);

      await addRecentExtraction({
        url: 'https://new.com',
        title: 'New Page',
        timestamp: '2024-01-02T00:00:00Z',
      });

      const call = mockChrome.storage.local.set.mock.calls[0][0];
      expect(call[STORAGE_KEY].recentExtractions).toHaveLength(10);
      expect(call[STORAGE_KEY].recentExtractions[0].url).toBe('https://new.com');
    });
  });

  describe('getRecentExtractions', () => {
    it('returns empty array when none', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});

      const extractions = await getRecentExtractions();

      expect(extractions).toEqual([]);
    });

    it('returns stored extractions', async () => {
      const stored = [
        { url: 'https://example.com', title: 'Example', timestamp: '2024-01-01T00:00:00Z' },
      ];
      mockChrome.storage.local.get.mockResolvedValue({
        [STORAGE_KEY]: { recentExtractions: stored },
      });

      const extractions = await getRecentExtractions();

      expect(extractions).toEqual(stored);
    });
  });

  describe('clearRecentExtractions', () => {
    it('clears the recent extractions list', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        [STORAGE_KEY]: {
          recentExtractions: [
            { url: 'https://example.com', title: 'Example', timestamp: '2024-01-01T00:00:00Z' },
          ],
        },
      });
      mockChrome.storage.local.set.mockResolvedValue(undefined);

      await clearRecentExtractions();

      const call = mockChrome.storage.local.set.mock.calls[0][0];
      expect(call[STORAGE_KEY].recentExtractions).toEqual([]);
    });
  });
});
