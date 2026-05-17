import {
  GEMINI_API_ENDPOINT,
  GEMINI_TIMEOUT_MS,
  GEMINI_DEFAULT_QUOTA,
  GEMINI_CACHE_TTL_DAYS,
} from '../shared/constants';
import type { RefinedContent, GeminiSettings, ConfidenceScores } from '../shared/types';

const DEFAULT_SETTINGS: GeminiSettings = {
  apiKey: '',
  enabled: false,
  dailyQuota: GEMINI_DEFAULT_QUOTA,
  callsToday: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
  useAgentDuringExtraction: true,
};

export async function getGeminiSettings(): Promise<GeminiSettings> {
  try {
    const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    return stored as GeminiSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function checkQuota(): Promise<boolean> {
  const settings = await getGeminiSettings();
  const today = new Date().toISOString().split('T')[0];

  // Reset quota if new day
  if (settings.lastResetDate !== today) {
    await chrome.storage.sync.set({
      lastResetDate: today,
      callsToday: 0,
    });
    return true;
  }

  return settings.callsToday < settings.dailyQuota;
}

export function getCacheKey(url: string, contentHash: string): string {
  // Simple hash: url + content hash
  const combined = `${url}:${contentHash}`;
  // In a real app, use crypto.subtle.digest for SHA256
  // For now, use simple hash
  return btoa(combined).substring(0, 32);
}

export async function getCachedResult(cacheKey: string): Promise<RefinedContent | null> {
  try {
    const stored = await chrome.storage.local.get(cacheKey);
    if (!stored[cacheKey]) return null;

    const cached = stored[cacheKey] as { result: RefinedContent; timestamp: number };
    const cacheAge = Date.now() - cached.timestamp;
    const ttlMs = GEMINI_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

    if (cacheAge > ttlMs) {
      // Cache expired, remove it
      await chrome.storage.local.remove(cacheKey);
      return null;
    }

    return cached.result;
  } catch {
    return null;
  }
}

export async function setCachedResult(cacheKey: string, result: RefinedContent): Promise<void> {
  try {
    await chrome.storage.local.set({
      [cacheKey]: {
        result,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.warn('Failed to cache result:', error);
  }
}

export async function callGeminiAPI(
  content: RefinedContent,
  apiKey: string
): Promise<RefinedContent | null> {
  if (!apiKey) return null;

  const systemPrompt = `You are an expert content extraction and validation system. Your task is to:
1. Validate and refine the provided article metadata (title, author, published date)
2. Ensure the content body is clean and complete
3. Provide confidence scores (0.0-1.0) for each field
4. Return the result as valid JSON with this exact structure: {
  "title": "string or null",
  "author": "string or null",
  "publishedAt": "ISO 8601 string or null",
  "content": "string",
  "confidence": {
    "title": 0.0-1.0,
    "author": 0.0-1.0,
    "publishedAt": 0.0-1.0,
    "content": 0.0-1.0
  }
}
Return ONLY the JSON, no additional text.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEMINI_API_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Extract and validate this article data:\n${JSON.stringify(content, null, 2)}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return null;
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('No text in Gemini response');
      return null;
    }

    // Parse JSON response
    const refined = JSON.parse(textContent) as RefinedContent & {
      confidence?: ConfidenceScores;
    };

    // Validate structure
    if (!refined.title && !refined.author && !refined.publishedAt && !refined.content) {
      console.error('Empty refined content');
      return null;
    }

    return {
      ...refined,
      refined: true,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Gemini API call timeout');
    } else {
      console.error('Gemini API call failed:', error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function refineContent(
  content: RefinedContent,
  apiKey: string,
  url: string
): Promise<RefinedContent> {
  // Check if LLM enabled
  const settings = await getGeminiSettings();
  if (!settings.enabled || !apiKey) {
    return { ...content, refined: false };
  }

  // Check if agent usage enabled
  if (!settings.useAgentDuringExtraction) {
    return { ...content, refined: false };
  }

  // Check quota
  const hasQuota = await checkQuota();
  if (!hasQuota) {
    console.warn('Gemini quota exceeded');
    return { ...content, refined: false };
  }

  // Check cache
  const contentHash = JSON.stringify(content).substring(0, 16);
  const cacheKey = getCacheKey(url, contentHash);
  const cached = await getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }

  // Call Gemini
  const refined = await callGeminiAPI(content, apiKey);

  if (!refined) {
    // If LLM failed, return original with refined: false
    return { ...content, refined: false };
  }

  // Cache result
  await setCachedResult(cacheKey, refined);

  // Increment quota
  await chrome.storage.sync.set({
    callsToday: settings.callsToday + 1,
  });

  return refined;
}
