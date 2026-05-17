import { processExtractedContent } from '../background/converter';
import type { ChromeMessage, ExtractionResponse } from '../shared/types';
import { extractContent } from './extractor';
import { getMetaTags } from './identifier';

console.log('[KContextify] Content script loaded — converter v2 (h2-anchor-fix)');

chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
  console.log('[KContextify] Message received:', message.action);
  if (message.action === 'extract') {
    handleExtract()
      .then((result) => {
        console.log('[KContextify] Extracting and converting');
        const markdown = processExtractedContent(result);
        sendResponse({
          action: 'extractionComplete',
          result: { ...result, content: markdown },
        } as ExtractionResponse);
      })
      .catch((error) => {
        console.error('[KContextify] Error caught:', error);
        sendResponse({
          action: 'extractionError',
          error: error instanceof Error ? error.message : String(error),
        } as ExtractionResponse);
      });
    return true;
  }
});

async function handleExtract() {
  const content = await extractContent();
  return {
    pageType: content.pageType,
    title: content.title,
    content: content.content,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    metadata: getMetaTags(),
  };
}
