import type { ConversionOptions } from '../shared/types';

interface StoredSettings {
  options?: Partial<ConversionOptions>;
  recentExtractions?: ExtractionRecord[];
}

interface ExtractionRecord {
  url: string;
  title: string;
  timestamp: string;
}

const STORAGE_KEY = 'kcontextify_settings';

export async function getSettings(): Promise<Partial<ConversionOptions>> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const settings: StoredSettings = result[STORAGE_KEY] || {};
  return settings.options || {};
}

export async function saveSettings(options: Partial<ConversionOptions>): Promise<void> {
  const current = await chrome.storage.local.get(STORAGE_KEY);
  const settings: StoredSettings = current[STORAGE_KEY] || {};
  settings.options = { ...settings.options, ...options };
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

export async function addRecentExtraction(record: ExtractionRecord): Promise<void> {
  const current = await chrome.storage.local.get(STORAGE_KEY);
  const settings: StoredSettings = current[STORAGE_KEY] || {};

  if (!settings.recentExtractions) {
    settings.recentExtractions = [];
  }

  // Add to front, keep max 10
  settings.recentExtractions = [record, ...settings.recentExtractions].slice(0, 10);

  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

export async function getRecentExtractions(): Promise<ExtractionRecord[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const settings: StoredSettings = result[STORAGE_KEY] || {};
  return settings.recentExtractions || [];
}

export async function clearRecentExtractions(): Promise<void> {
  const current = await chrome.storage.local.get(STORAGE_KEY);
  const settings: StoredSettings = current[STORAGE_KEY] || {};
  settings.recentExtractions = [];
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}
