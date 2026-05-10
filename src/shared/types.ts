export type PageType = 'article' | 'video' | 'generic';

export interface PageTypeResult {
  type: PageType;
  confidence: number;
  metadata: Record<string, string>;
}

export interface ExtractionResult {
  pageType: PageTypeResult;
  title: string;
  content: string;
  url: string;
  timestamp: string;
}

export interface ArticleMetadata {
  author?: string;
  date?: string;
  images?: string[];
}

export interface VideoMetadata {
  channel?: string;
  transcript?: string;
}

export interface ConversionOptions {
  headingStyle: 'atx' | 'setext';
  codeBlockStyle: 'fenced' | 'indented';
  bulletListMarker: '-' | '*' | '+';
  emDelimiter: '*' | '_';
  strongDelimiter: '**' | '__';
  linkStyle: 'inlined' | 'referenced';
}

export interface ChromeMessage {
  action: string;
  payload?: unknown;
}

export interface ExtractionRequest extends ChromeMessage {
  action: 'extract';
}

export interface ExtractionResponse extends ChromeMessage {
  action: 'extractionComplete' | 'extractionError' | 'conversionComplete' | 'conversionError';
  result?: ExtractionResult;
  error?: string;
}