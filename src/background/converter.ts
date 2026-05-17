import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ConversionOptions, ExtractionResult } from '../shared/types';

const NOISE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'form',
  'nav',
  'header',
  'footer',
  'aside',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '[role="complementary"]',
  '.hextra-toc',
  '.hextra-sidebar-container',
  '.hextra-footer',
  '.hextra-nav-container',
  '.hextra-search-wrapper',
  '.hextra-theme-toggle',
  '.hextra-theme-toggle-options',
  '.hextra-language-switcher',
  '.hextra-language-options',
  '.hextra-hamburger-menu',
  '.hextra-code-copy-btn-container',
  '.lang-toggle',
  '.subheading-anchor',
  '.toc',
  '.table-of-contents',
  '.share',
  '.social-share',
  '.share-buttons',
  '.comments',
  '.comment-section',
  '.related-posts',
  '.suggested-posts',
  '.newsletter-signup',
  '#disqus_wrapper',
  '#disqus_thread',
  '#backToTop',
  '[class*="sidebar"]',
  '[class*="advertisement"]',
];

export function createTurndownService(options?: Partial<ConversionOptions>): TurndownService {
  const td = new TurndownService({
    headingStyle: options?.headingStyle ?? 'atx',
    codeBlockStyle: options?.codeBlockStyle ?? 'fenced',
    bulletListMarker: options?.bulletListMarker ?? '-',
    emDelimiter: options?.emDelimiter ?? '*',
    strongDelimiter: options?.strongDelimiter ?? '**',
    linkStyle: options?.linkStyle ?? 'inlined',
    fence: '```',
  });

  // GFM (tables, strikethrough, task lists)
  td.use(gfm as Parameters<typeof td.use>[0]);

  // Drop unwanted tags entirely
  const dropTags = ['script', 'style', 'noscript', 'form', 'iframe', 'svg', 'button', 'input', 'select', 'textarea'];
  for (const tag of dropTags) {
    td.addRule(`drop-${tag}`, {
      filter: (node) => node.nodeName.toLowerCase() === tag,
      replacement: () => '',
    });
  }

  // Drop empty anchors (e.g. subheading permalinks)
  td.addRule('drop-empty-anchors', {
    filter: (node) => {
      if (node.nodeName.toLowerCase() !== 'a') return false;
      const text = (node.textContent ?? '').trim();
      return text.length === 0;
    },
    replacement: () => '',
  });

  // Headings: emit `## text` cleanly even with inline anchor/span children
  td.addRule('clean-headings', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: (_content, node) => {
      const level = Number.parseInt(node.nodeName[1], 10);
      const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (!text) return '';
      return `\n\n${'#'.repeat(level)} ${text}\n\n`;
    },
  });

  return td;
}

export function convertToMarkdown(html: string, options?: Partial<ConversionOptions>): string {
  const sanitized = sanitizeHtml(html);
  const td = createTurndownService(options);
  return td.turndown(sanitized);
}

export function processExtractedContent(result: ExtractionResult): string {
  let markdown = convertToMarkdown(result.content);

  markdown = cleanEmptyElements(markdown);
  markdown = removeNoise(markdown);
  markdown = promoteOrphanHeadings(markdown);
  markdown = fenceLooseCodeBlocks(markdown);
  markdown = cleanEmptyElements(markdown);

  const frontmatter = generateFrontmatter(result);
  return `${frontmatter}\n\n${markdown}`;
}

function stripDangerousTags(html: string): string {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, '')
    .replace(/<link\b[^>]*\/?>/gi, '')
    .replace(/<meta\b[^>]*\/?>/gi, '');
}

function sanitizeHtml(html: string): string {
  const pre = stripDangerousTags(html);
  if (typeof DOMParser === 'undefined') return pre;
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(pre, 'text/html');
  } catch {
    return pre;
  }
  if (!doc?.body) return pre;

  // Drop noise nodes
  for (const selector of NOISE_SELECTORS) {
    try {
      for (const el of Array.from(doc.querySelectorAll(selector))) {
        el.remove();
      }
    } catch {
      /* skip invalid selector */
    }
  }

  // Strip data-*/on-* attributes everywhere
  for (const el of Array.from(doc.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('data-') || attr.name.startsWith('on') || attr.name === 'aria-hidden') {
        el.removeAttribute(attr.name);
      }
    }
  }

  // Remove empty anchors and spans inside headings
  for (const heading of Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))) {
    for (const child of Array.from(heading.querySelectorAll('a, span'))) {
      if (!(child.textContent ?? '').trim()) {
        child.remove();
      }
    }
  }

  // Drop empty container divs that produce noise lines
  for (const el of Array.from(doc.querySelectorAll('div'))) {
    if (!(el.textContent ?? '').trim() && el.children.length === 0) {
      el.remove();
    }
  }

  // Normalize heading hierarchy: collapse runs so lowest visible level == h1+
  normalizeHeadings(doc);

  return doc.body.innerHTML;
}

function normalizeHeadings(doc: Document): void {
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  if (headings.length === 0) return;

  let previousLevel = 0;

  for (const heading of headings) {
    const level = Number.parseInt(heading.tagName[1], 10);
    if (previousLevel === 0) {
      previousLevel = level;
      continue;
    }
    if (level > previousLevel + 1) {
      const newLevel = previousLevel + 1;
      const newTag = doc.createElement(`h${newLevel}`);
      newTag.innerHTML = heading.innerHTML;
      heading.replaceWith(newTag);
      previousLevel = newLevel;
    } else {
      previousLevel = level;
    }
  }
}

function promoteOrphanHeadings(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const prev = result[result.length - 1] ?? '';
    const next = lines[i + 1] ?? '';

    const looksLikeHeading =
      trimmed.length > 0 &&
      trimmed.length < 120 &&
      prev.trim() === '' &&
      next.trim() !== '' &&
      !/^[#>\-*`|+]/.test(trimmed) &&
      !/^\d+\.\s/.test(trimmed) &&
      !/^\[/.test(trimmed) &&
      !/[.!?;:,]$/.test(trimmed) &&
      !/^\s*$/.test(trimmed) &&
      /^[A-Za-zÀ-ÿ0-9`\-*[]/.test(next.trim());

    if (looksLikeHeading) {
      result.push(`## ${trimmed}`);
      result.push('');
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

function fenceLooseCodeBlocks(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let i = 0;

  const codePatterns = [
    /^#!\S/, // shebang `#!/...`
    /^\s*(require|import|from|use)\s+['"`]/,
    /^\s*(def|class|module|function|fn|func|public|private|protected)\s+\w/,
    /^\s*(const|let|var)\s+\w+\s*=/,
    /^\s*(if|else|elsif|elif|end|return|while|for|do)\b/,
    /^\s*\w+\s*=\s*(\w+\(|\[|\{|".*"|'.*'|\d+)/,
    /^\s*\}\s*$/,
    /^\s*\)\s*$/,
    /\bdef\s+\w+\(/,
    /=>\s/,
    /\.split\(|\.join\(|\.map\b|\.reduce\b/,
  ];

  const looksLikeCode = (line: string): boolean => {
    if (line.trim() === '') return false;
    return codePatterns.some((p) => p.test(line));
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      result.push(line);
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        result.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        result.push(lines[i]);
        i++;
      }
      continue;
    }

    if (looksLikeCode(line)) {
      const block: string[] = [];
      let lastNonBlank = i;
      while (i < lines.length) {
        const cur = lines[i];
        if (cur.trim() === '') {
          block.push(cur);
          i++;
          continue;
        }
        if (looksLikeCode(cur) || (i - lastNonBlank <= 2 && /^\s{2,}\S/.test(cur))) {
          block.push(cur);
          lastNonBlank = i;
          i++;
          continue;
        }
        break;
      }

      while (block.length > 0 && block[block.length - 1].trim() === '') {
        block.pop();
      }

      if (block.length >= 2) {
        const blockText = block.join('\n');
        let lang = '';
        if (/\b(def|require|end|do\s*\|)\b/.test(blockText)) lang = 'ruby';
        else if (/\b(const|let|function|=>)\b/.test(blockText)) lang = 'javascript';
        else if (/\b(import|from|class\s+\w+:|def\s+\w+\()/.test(blockText)) lang = 'python';
        else if (/^#!\//.test(block[0])) lang = 'bash';

        result.push(`\`\`\`${lang}`);
        result.push(...block);
        result.push('```');
        continue;
      }
      result.push(...block);
      continue;
    }

    result.push(line);
    i++;
  }

  return result.join('\n');
}

function cleanEmptyElements(markdown: string): string {
  let result = markdown.replace(/^\s+$/gm, '');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

function removeNoise(markdown: string): string {
  let result = markdown;

  // Nuke any leaked CSS (e.g. :root {...}, .class {...}, @media {...})
  result = result.replace(/^[\s\S]*?\{[^}]*--[^}]*\}[\s\S]*?$/gm, (match) => {
    return /\{[^}]*--[\w-]+:/.test(match) ? '' : match;
  });
  result = result.replace(/:root\s*\{[\s\S]*?\}/g, '');
  result = result.replace(/@media[^{]*\{[\s\S]*?\}\s*\}/g, '');

  // Remove leftover empty link refs/inline links
  result = result.replace(/\[\]\[\d+\]/g, '');
  result = result.replace(/\[\]\([^)]*\)/g, '');

  // UI counters
  result = result.replace(
    /^\*?\*?[\d,]+\s*(like|share|comment|view|vote|point|upvote|downvote)s?\*?\*?$/gim,
    ''
  );

  // Single number lines
  result = result.replace(/^[\d]+\s*$/gm, '');

  // Common nav/CTA text
  result = result.replace(
    /^(Skip to content|Powered by .+|Create Post|Add reaction|Jump to Comments|Save|Boost|Voltar ao topo|Back to top|Nesta página|On this page)$/gim,
    ''
  );

  // Lang toggle: standalone PT or EN line, or "PT | EN" combinations
  result = result.replace(/^\s*(PT|EN|Português|English)\s*$/gm, '');
  result = result.replace(/^\s*\|\s*$/gm, '');
  result = result.replace(/^\s*(PT|EN)\s*\|\s*(PT|EN)\s*$/gm, '');

  // CTA "Participe da Discussão"
  result = result.replace(/\[?💬\]?\s*Participe da Discussão/gi, '');
  result = result.replace(/\[?💬\]?\s*Join the Discussion/gi, '');

  // Posted on / Updated on
  result = result.replace(/^(Posted on .+|Updated on .+)$/gim, '');

  // Empty link defs
  result = result.replace(/^\[\d+\]:\s*$/gm, '');

  // Solo hashtag noise
  result = result.replace(/^#\s*$/gm, '');

  // Collapse blank runs
  result = result.replace(/\n\n\n+/g, '\n\n');

  return result.trim();
}

function generateFrontmatter(result: ExtractionResult): string {
  const lines = ['---'];

  lines.push(`title: "${escapeYaml(result.title)}"`);
  lines.push(`url: "${result.url}"`);
  lines.push(`type: "${result.pageType.type}"`);

  let author = result.pageType.metadata?.author as string | undefined;
  let date = result.pageType.metadata?.date as string | undefined;

  if (result.metadata) {
    author =
      author ||
      result.metadata['article:author'] ||
      result.metadata.author ||
      result.metadata['og:author'] ||
      result.metadata.creator;
    date =
      date ||
      result.metadata['article:published_time'] ||
      result.metadata.published_date ||
      result.metadata.datePublished ||
      result.metadata.date;
  }

  if (author) lines.push(`author: "${escapeYaml(author)}"`);
  if (date) lines.push(`date: "${escapeYaml(date)}"`);

  lines.push('---');
  return lines.join('\n');
}

function escapeYaml(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, ' ');
}
