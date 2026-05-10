import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ConversionOptions, ExtractionResult } from '../shared/types';

export function createTurndownService(options?: Partial<ConversionOptions>): TurndownService {
  const td = new TurndownService({
    headingStyle: options?.headingStyle ?? 'atx',
    codeBlockStyle: options?.codeBlockStyle ?? 'fenced',
    bulletListMarker: options?.bulletListMarker ?? '-',
    emDelimiter: options?.emDelimiter ?? '*',
    strongDelimiter: options?.strongDelimiter ?? '**',
    linkStyle: options?.linkStyle ?? 'referenced',
  });

  // Remove unwanted tags (script, style, noscript, form, iframe)
  const unwantedTags = ['script', 'style', 'noscript', 'form', 'iframe'];
  unwantedTags.forEach((tag) => {
    td.addRule(tag, {
      filter: (node) => node.nodeName.toLowerCase() === tag,
      replacement: () => '',
    });
  });

  // Strip data-* and on* attributes (event handlers)
  td.addRule('stripAttributes', {
    filter: (node) => {
      if (node.nodeType !== 1) return false; // Element nodes only
      const element = node as Element;
      return Array.from(element.attributes).some(
        (attr) => attr.name.startsWith('data-') || attr.name.startsWith('on')
      );
    },
    replacement: (content, node) => {
      const element = (node as Element).cloneNode(true) as HTMLElement;
      // Remove data-* and on* attributes
      Array.from(element.attributes)
        .filter((attr) => attr.name.startsWith('data-') || attr.name.startsWith('on'))
        .forEach((attr) => element.removeAttribute(attr.name));
      return td.turndown(element);
    },
  });

  // Use GFM plugin for tables, strikethrough, etc.
  td.use(gfm as Parameters<typeof td.use>[0]);

  return td;
}

export function convertToMarkdown(html: string, options?: Partial<ConversionOptions>): string {
  const td = createTurndownService(options);
  return td.turndown(html);
}

export function processExtractedContent(result: ExtractionResult): string {
  // Normalize heading hierarchy before conversion
  const normalizedContent = normalizeHeadingHierarchy(result.content);

  let markdown = convertToMarkdown(normalizedContent);

  // Deduplicate reference-style links
  markdown = deduplicateLinks(markdown);

  // Remove empty elements and excess whitespace
  markdown = cleanEmptyElements(markdown);

  // Add frontmatter
  const frontmatter = generateFrontmatter(result);

  return `${frontmatter}\n\n${markdown}`;
}

function normalizeHeadingHierarchy(html: string): string {
  // Parse HTML and normalize heading levels (H1, H2, H3... no jumps)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let minLevel = 1;

  headings.forEach((heading) => {
    const currentLevel = Number.parseInt(heading.tagName[1], 10);

    if (currentLevel > minLevel + 1) {
      // Demote heading to minLevel + 1
      const newLevel = minLevel + 1;
      const newTag = `h${newLevel}`;
      const newHeading = doc.createElement(newTag);
      newHeading.innerHTML = heading.innerHTML;
      heading.replaceWith(newHeading);
      minLevel = newLevel;
    } else {
      minLevel = currentLevel;
    }
  });

  return doc.body?.innerHTML || html;
}

function cleanEmptyElements(markdown: string): string {
  // Remove lines with only whitespace
  let result = markdown.replace(/^\s+$/gm, '');

  // Collapse multiple blank lines to max 2
  result = result.replace(/\n{3,}/g, '\n\n');

  // Trim start and end
  result = result.trim();

  return result;
}

function deduplicateLinks(markdown: string): string {
  // Extract link definitions [N]: url
  const linkDefRegex = /^\[(\d+)\]:\s*(.+?)$/gm;
  const urlMap = new Map<string, number>();
  const linkMap = new Map<number, number>();
  let nextLinkNum = 1;

  // First pass: collect all link definitions and build mapping
  let match;
  while ((match = linkDefRegex.exec(markdown)) !== null) {
    const linkNum = Number.parseInt(match[1], 10);
    const url = match[2].trim();

    if (!urlMap.has(url)) {
      urlMap.set(url, nextLinkNum);
      nextLinkNum++;
    }
    linkMap.set(linkNum, urlMap.get(url)!);
  }

  // Second pass: replace link references with deduplicated numbers
  let result = markdown.replace(/\[([^\]]+)\]\[(\d+)\]/g, (match, text, linkNum) => {
    const newNum = linkMap.get(Number.parseInt(linkNum, 10)) ?? linkNum;
    return `[${text}][${newNum}]`;
  });

  // Third pass: rebuild link definitions with unique URLs only
  const uniqueLinks = new Map<number, string>();
  urlMap.forEach((newNum, url) => {
    uniqueLinks.set(newNum, url);
  });

  // Remove old link definitions
  result = result
    .replace(/^\[\d+\]:\s*.+?$/gm, '')
    .replace(/\n\n+/g, '\n\n')
    .trim();

  // Append deduplicated link definitions
  if (uniqueLinks.size > 0) {
    const linkDefs = Array.from(uniqueLinks.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([num, url]) => `[${num}]: ${url}`)
      .join('\n');
    result = `${result}\n\n${linkDefs}`;
  }

  return result;
}

function generateFrontmatter(result: ExtractionResult): string {
  const lines = ['---'];

  lines.push(`title: "${escapeYaml(result.title)}"`);
  lines.push(`url: "${result.url}"`);
  lines.push(`type: "${result.pageType.type}"`);

  // Add only essential metadata (whitelisted)
  const essentialMetadataKeys = ['author', 'date', 'image'];
  if (result.pageType.metadata) {
    for (const key of essentialMetadataKeys) {
      const value = result.pageType.metadata[key];
      if (value) {
        lines.push(`${key}: "${escapeYaml(String(value))}"`);
      }
    }
  }

  lines.push('---');
  return lines.join('\n');
}

function escapeYaml(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, ' ');
}
