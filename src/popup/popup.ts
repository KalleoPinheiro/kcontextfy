import { SettingsModal } from './settings-modal';

interface ExtractionResult {
  pageType: { type: string; confidence: number; metadata: Record<string, string> };
  title: string;
  content: string;
  url: string;
  timestamp: string;
}

interface ChromeMessage {
  action: string;
  payload?: unknown;
  result?: ExtractionResult;
  error?: string;
}

type StatusState = 'idle' | 'loading' | 'success' | 'error';

const statusEl = document.getElementById('status')!;
const statusIconEl = statusEl.querySelector('.status-icon')!;
const statusTextEl = statusEl.querySelector('.status-text')!;
const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement;
const resultSection = document.getElementById('result-section')!;
const resultTitle = document.getElementById('result-title')!;
const resultType = document.getElementById('result-type')!;
const resultPreview = document.getElementById('result-preview')!;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
const includeFrontmatterCheckbox = document.getElementById('include-frontmatter') as HTMLInputElement;
const waitTimeInput = document.getElementById('wait-time') as HTMLInputElement;

let lastExtraction: ExtractionResult | null = null;
let lastMarkdown: string = '';
const settingsModal = new SettingsModal();

function setStatus(state: StatusState, text: string) {
  statusEl.className = `status ${state}`;
  statusIconEl.textContent = state === 'idle' ? '○' : state === 'loading' ? '◌' : state === 'success' ? '✓' : '✕';
  statusTextEl.textContent = text;
}

function sanitizeText(text: string, maxLength: number = 0): string {
  // Strip HTML tags, limit length if needed
  const stripped = text.replace(/<[^>]*>/g, '');
  if (maxLength > 0 && stripped.length > maxLength) {
    return stripped.slice(0, maxLength) + '...';
  }
  return stripped;
}

function showResult(result: ExtractionResult, markdown: string) {
  lastExtraction = result;
  lastMarkdown = markdown;

  // Use textContent for safe DOM text insertion (prevents XSS)
  resultTitle.textContent = sanitizeText(result.title);
  resultType.textContent = result.pageType.type;
  resultPreview.textContent = sanitizeText(markdown, 500);

  resultSection.classList.remove('hidden');
}

extractBtn.addEventListener('click', async () => {
  extractBtn.disabled = true;
  setStatus('loading', 'Extracting...');

  try {
    const response = await chrome.runtime.sendMessage({ action: 'extract' } as ChromeMessage);

    if (response.action === 'extractionComplete' && response.result) {
      const convertResponse = await chrome.runtime.sendMessage({
        action: 'convert',
        payload: response.result,
      } as ChromeMessage & { payload: ExtractionResult });

      if (convertResponse.result) {
        lastMarkdown = convertResponse.result.content;
        showResult(convertResponse.result, lastMarkdown);
        setStatus('success', 'Extraction complete');

        // Async LLM refinement (non-blocking)
        refineContentAsync(convertResponse.result);
      } else {
        throw new Error(convertResponse.error || 'Conversion failed');
      }
    } else {
      throw new Error(response.error || 'Extraction failed');
    }
  } catch (error) {
    setStatus('error', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    extractBtn.disabled = false;
  }
});

copyBtn.addEventListener('click', async () => {
  if (!lastMarkdown) return;

  try {
    await navigator.clipboard.writeText(lastMarkdown);
    // Use textContent to avoid XSS
    const originalHtml = copyBtn.innerHTML;
    const span = copyBtn.ownerDocument.createElement('span');
    span.textContent = '✓ Copied';
    copyBtn.innerHTML = '';
    copyBtn.appendChild(span);
    setTimeout(() => {
      copyBtn.innerHTML = '';
      const originalSpan = copyBtn.ownerDocument.createElement('span');
      originalSpan.textContent = '⧉ Copy';
      copyBtn.appendChild(originalSpan);
    }, 2000);
  } catch (error) {
    console.error('Copy failed:', error);
  }
});

downloadBtn.addEventListener('click', () => {
  if (!lastExtraction || !lastMarkdown) return;

  const sanitizedTitle = sanitizeText(lastExtraction.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = (sanitizedTitle || 'untitled') + '.md';

  const blob = new Blob([lastMarkdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

settingsBtn?.addEventListener('click', () => {
  settingsModal.open();
});

async function refineContentAsync(result: ExtractionResult) {
  try {
    const refinedPayload = {
      title: result.title || null,
      author: null,
      publishedAt: null,
      content: result.content,
      refined: false,
    };

    const refineResponse = await chrome.runtime.sendMessage({
      action: 'refineContent',
      payload: refinedPayload,
    } as ChromeMessage);

    if (refineResponse.action === 'refineComplete' && refineResponse.result?.refined) {
      updateResultWithRefinement(refineResponse.result);
    }
  } catch (error) {
    console.debug('LLM refinement skipped:', error);
  }
}

function updateResultWithRefinement(refined: ExtractionResult & { refined?: boolean }) {
  if (refined.title && refined.title !== lastExtraction?.title) {
    resultTitle.textContent = sanitizeText(refined.title);
  }

  const badge = resultSection.querySelector('.ai-refined-badge');
  if (!badge && refined.refined) {
    const newBadge = document.createElement('span');
    newBadge.className = 'ai-refined-badge';
    newBadge.textContent = '✨';
    newBadge.title = 'AI-Refined';
    resultTitle.parentElement?.appendChild(newBadge);
  }
}

// Initialize
setStatus('idle', 'Ready to extract');