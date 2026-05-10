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