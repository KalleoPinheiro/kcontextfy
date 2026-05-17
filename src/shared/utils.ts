export function escapeMarkdown(text: string): string {
  const escapeChars = /[\\`*_\[\]{}()#+\-.!|]/g;
  return text.replace(escapeChars, '\\$&');
}

export function trimWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n');
}

export function getMetadata(metaTags: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(metaTags)) {
    if (value) result[key] = value;
  }
  return result;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getMetaContent(name: string): string | null {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return meta?.getAttribute('content') ?? null;
}

export function extractAuthorFromText(text: string): string | null {
  if (!text) return null;

  const patterns = [
    /^by\s+([a-z\s.]+?)(?:\s+on\s+|,|\s*$)/i,
    /^by\s+([a-z\s.]+?)$/im,
    /author:\s*([a-z\s.]+?)(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

export function parsePublishedDate(dateString: string | null): string | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString();
  }

  const monthNamePattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i;
  if (monthNamePattern.test(dateString)) {
    const parsed = new Date(dateString);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}