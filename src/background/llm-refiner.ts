import {
  GEMINI_API_ENDPOINT,
  GEMINI_TIMEOUT_MS,
  GEMINI_DEFAULT_QUOTA,
  GEMINI_CACHE_TTL_DAYS,
} from '../shared/constants';
import type { RefinedContent, GeminiSettings, ConfidenceScores } from '../shared/types';

function stripFrontmatter(text: string): string {
  return text.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();
}

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

export async function getCacheKey(url: string, content: string): Promise<string> {
  // Strong hash via SHA-256 over url + full content to prevent cross-article collisions
  const encoder = new TextEncoder();
  const data = encoder.encode(`${url}:${content}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
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

  const systemPrompt = `You are an expert article-to-Markdown formatter. Input is partially-converted markdown that often has structural problems. Your job is to RESTORE proper Markdown structure by reading the content semantically.

CRITICAL FORMATTING RULES:

1. SECTION HEADINGS: Detect section titles that lost their heading tags. Signs of a heading:
   - Short line (under ~120 chars), no trailing period
   - Sits alone between paragraphs
   - Matches a TOC entry if present at top of article
   - Capitalized or title-cased
   Promote these to "## " (h2). Sub-sections inside become "### " (h3). Keep article title as "# " (h1).

2. CODE BLOCKS: Detect code that appears as plain lines (no fences). Wrap in fenced blocks with language hint:
   \`\`\`ruby ... \`\`\`, \`\`\`javascript ... \`\`\`, \`\`\`python ... \`\`\`, \`\`\`bash ... \`\`\`, etc.
   Signs of code: shebang (#!/), keywords like def/class/require/import/function/const/let, assignments, brackets, indentation, => arrows.

3. TABLES: Detect concatenated table content (cells merged into one line like "Col1Col2Col3Row1aRow1bRow1c") and reconstruct as GitHub Flavored Markdown tables with | pipes | and --- separators.

4. INLINE CODE: Wrap technical terms, filenames, commands, variable names in single backticks: \`grep\`, \`MEMORY.md\`, \`autoDream\`.

5. LISTS: Ensure list items use "- " or "1. " prefix consistently with blank line before list start.

6. NOISE REMOVAL: Strip leftover UI text: language toggles ("PT | EN"), share buttons ("💬 Participe"), "Voltar ao topo", date/author lines if already in metadata, navigation breadcrumbs, "Skip to content", cookie notices.

7. INLINE SPACING: Fix concatenated text like "EN6 de abril" → "EN | 6 de abril" or split into separate elements.

8. PRESERVE: All paragraph text, all links (use [text](url) format), all emphasis (**bold**, *italic*), all blockquotes (>), and the article's logical flow.

METADATA: Extract validated title, author, published date (ISO 8601 like 2026-04-06T11:00:00-03:00). Use null when uncertain.

DO NOT include YAML frontmatter (no "---" blocks) in the content field — frontmatter is added separately.

OUTPUT: Return ONLY valid JSON, no preamble, no markdown fences around the JSON:
{
  "title": "string or null",
  "author": "string or null",
  "publishedAt": "ISO 8601 string or null",
  "content": "fully-restored Markdown string",
  "confidence": {
    "title": 0.0-1.0,
    "author": 0.0-1.0,
    "publishedAt": 0.0-1.0,
    "content": 0.0-1.0
  }
}`;

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
                  text: `Restructure this article to proper Markdown. Strip any existing YAML frontmatter from the input before processing.

INPUT METADATA:
- title: ${content.title ?? 'unknown'}
- author: ${content.author ?? 'unknown'}
- publishedAt: ${content.publishedAt ?? 'unknown'}

INPUT CONTENT (may have broken structure — fix it):
${stripFrontmatter(content.content)}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
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

  // Check cache (hash full content to avoid prefix collisions across articles)
  const cacheKey = await getCacheKey(url, JSON.stringify(content));
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

export function generateFormattedMarkdown(
  refined: RefinedContent,
  url: string
): string {
  const frontmatter = [
    '---',
    `title: "${escapeFrontmatter(refined.title || 'Untitled')}"`,
    `url: "${url}"`,
    'type: "article"',
  ];

  if (refined.author) {
    frontmatter.push(`author: "${escapeFrontmatter(refined.author)}"`);
  }

  if (refined.publishedAt) {
    frontmatter.push(`date: "${refined.publishedAt}"`);
  }

  frontmatter.push('---');

  return `${frontmatter.join('\n')}\n\n${refined.content}`;
}

function escapeFrontmatter(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, ' ');
}
