import type { ChromeMessage, ExtractionResponse, ExtractionResult } from '../shared/types';
import { addRecentExtraction } from './storage';

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
      // Content script not loaded, fallback to executeScript
      console.log('Content script not responding, using fallback extraction');
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          pageType: { type: 'generic', confidence: 0.5, metadata: {} },
          title: document.title || 'Untitled',
          content: document.body?.innerText || 'No content',
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
      if (results?.[0]?.result) {
        extracted = results[0].result as ExtractionResult;
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
