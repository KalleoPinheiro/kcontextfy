import type {
  ChromeMessage,
  ExtractionResponse,
  ExtractionResult,
  RefineRequest,
  RefineResponse,
  RefinedContent,
} from '../shared/types';
import { addRecentExtraction } from './storage';
import { refineContent, getGeminiSettings, generateFormattedMarkdown } from './llm-refiner';
function fallbackExtraction(): {
  pageType: { type: string; confidence: number; metadata: Record<string, unknown> };
  title: string;
  content: string;
  url: string;
  timestamp: string;
} {
  // Clone body so we don't mutate the live page
  const bodyClone = document.body?.cloneNode(true) as HTMLElement | null;
  if (!bodyClone) {
    return {
      pageType: { type: 'generic', confidence: 0.3, metadata: {} },
      title: document.title || 'Untitled',
      content: 'No content',
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
  }

  // Strip page chrome: nav, header, footer, sidebars, ads, TOCs, share widgets
  const stripSelectors = [
    'nav',
    'header',
    'footer',
    'aside',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '[role="complementary"]',
    '.nav',
    '.navbar',
    '.menu',
    '.sidebar',
    '.header',
    '.footer',
    '.toc',
    '.table-of-contents',
    '.share',
    '.social',
    '.ads',
    '.advertisement',
    '.comments',
    '.related',
    '.recommended',
    '.newsletter',
    '[class*="sidebar"]',
    '[class*="nav-"]',
    '[class*="menu-"]',
    '[id*="sidebar"]',
    '[id*="nav"]',
    'script',
    'style',
    'noscript',
    'iframe',
    'form',
  ];
  for (const sel of stripSelectors) {
    try {
      for (const el of Array.from(bodyClone.querySelectorAll(sel))) {
        el.remove();
      }
    } catch {
      /* skip invalid selector */
    }
  }

  // Prefer <article> or <main> if present, else use stripped body
  const article =
    bodyClone.querySelector('article') ||
    bodyClone.querySelector('main') ||
    bodyClone.querySelector('[role="main"]') ||
    bodyClone.querySelector('[role="article"]');
  const html = (article as HTMLElement | null)?.innerHTML || bodyClone.innerHTML;

  // Minimal markdown conversion in page context (avoid DOMParser dependency in service worker)
  let markdown = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n\n\n+/g, '\n\n')
    .trim();

  const frontmatter = [
    '---',
    `title: "${(document.title || 'Untitled').replace(/"/g, '\\"')}\"`,
    `url: "${window.location.href}"`,
    'type: "article"',
    '---',
  ].join('\n');

  return {
    pageType: { type: 'generic', confidence: 0.5, metadata: {} },
    title: document.title || 'Untitled',
    content: `${frontmatter}\n\n${markdown}`,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };
}

chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
  if (message.action === 'extract') {
    handleExtract(message as ChromeMessage & { action: 'extract' })
      .then((response) => sendResponse(response))
      .catch((error) => {
        sendResponse({
          action: 'extractionError',
          error: error instanceof Error ? error.message : String(error),
        } as ExtractionResponse);
      });
    return true;
  }

  if (message.action === 'convert') {
    handleConvert(message as ChromeMessage & { action: 'convert'; payload: ExtractionResult })
      .then((response) => sendResponse(response))
      .catch((error) => {
        sendResponse({
          action: 'conversionError',
          error: error instanceof Error ? error.message : String(error),
        } as ExtractionResponse);
      });
    return true;
  }

  if (message.action === 'refineContent') {
    handleRefineContent(message as RefineRequest)
      .then((response) => sendResponse(response))
      .catch((error) => {
        sendResponse({
          action: 'refineError',
          error: error instanceof Error ? error.message : String(error),
        } as RefineResponse);
      });
    return true;
  }

  return false;
});

async function handleExtract(
  message: ChromeMessage & { action: 'extract' }
): Promise<ExtractionResponse> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error('No active tab');
    }

    let extracted: ExtractionResult | null = null;

    // Try message-based extraction first
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extract',
      } as ChromeMessage);
      if (response?.result) {
        extracted = response.result as ExtractionResult;
      }
    } catch (e) {
      // Content script not loaded — try injecting it then retry
      console.log('Content script not responding, injecting then retrying');
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        });
        // Brief delay for listener registration
        await new Promise((r) => setTimeout(r, 100));
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'extract',
        } as ChromeMessage);
        if (response?.result) {
          extracted = response.result as ExtractionResult;
        }
      } catch (injectErr) {
        // Last-resort fallback: in-page minimal extraction with chrome stripping
        console.log('Inject+retry failed, using minimal fallback:', injectErr);
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: fallbackExtraction,
        });
        if (results?.[0]?.result) {
          extracted = results[0].result as ExtractionResult;
        }
      }
    }

    if (!extracted) {
      throw new Error('Extraction failed');
    }

    // Save to recent extractions
    await addRecentExtraction({
      url: extracted.url,
      title: extracted.title,
      timestamp: extracted.timestamp,
    });

    return {
      action: 'extractionComplete',
      result: extracted,
    };
  } catch (error) {
    return {
      action: 'extractionError',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function handleConvert(
  message: ChromeMessage & { action: 'convert'; payload: ExtractionResult }
): Promise<ExtractionResponse> {
  try {
    // Conversion now happens in content script, just save and return
    await addRecentExtraction({
      url: message.payload.url,
      title: message.payload.title,
      timestamp: message.payload.timestamp,
    });

    return {
      action: 'conversionComplete',
      result: message.payload,
    };
  } catch (error) {
    return {
      action: 'conversionError',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function handleRefineContent(message: RefineRequest): Promise<RefineResponse> {
  try {
    if (!message.payload) {
      throw new Error('No payload provided');
    }

    // Get API key and current tab URL
    const settings = await getGeminiSettings();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url || 'unknown';

    // Call refiner (returns original if LLM disabled or fails)
    const refined = await refineContent(
      message.payload as RefinedContent,
      settings.apiKey,
      url
    );

    // Generate formatted markdown with frontmatter
    const formattedContent = generateFormattedMarkdown(refined, url);

    return {
      action: 'refineComplete',
      result: { ...refined, content: formattedContent },
    };
  } catch (error) {
    console.error('Refinement error:', error);
    // Return original content on error
    return {
      action: 'refineError',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
