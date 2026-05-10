# Design: Markdown Conversion (REQ-3)

## HTML → Markdown Mapping

| HTML | Markdown | Notes |
|------|----------|-------|
| `<h1>`-`<h6>` | `#`-`######` + text | Preserve text content |
| `<strong>`, `<b>` | `**text**` | Wrap text in asterisks |
| `<em>`, `<i>` | `*text*` | Single asterisk |
| `<a>` | `[text](url)` | Preserve href, escape text |
| `<img>` | `![alt](src)` | Alt = image alt or empty |
| `<ul>` | `- item` | Unordered list |
| `<ol>` | `1. item` | Ordered list |
| `<blockquote>` | `> text` | Prefixed with > |
| `<code>` | `` `code` `` | Inline code |
| `<pre>` | ``` ``` ``` ``` | Fenced code block |
| `<table>` | GFM table | Pipe-separated |
| `<br>` | `\n` | Hard line break |
| `<hr>` | `---` | Horizontal rule |

## Whitespace Rules
- Collapse multiple blank lines to single blank line
- Trim leading/trailing whitespace per line
- Preserve indentation within `<pre>` blocks
- No trailing spaces on lines

## Structure Preservation
- Headers create natural document breaks
- Lists remain under parent header
- Tables grouped together
- Images placed near their reference in text

## Edge Cases
- Nested lists → flatten with proper indentation (2 spaces)
- Blockquotes with multiple paragraphs → `>` on each line
- Links without text → use URL as text
- Empty elements → skip

## Turndown Configuration
```typescript
{
  headingStyle: 'atx',        // # style headers (or 'setext' forunderline)
  codeBlockStyle: 'fenced',   // ``` code blocks
  bulletListMarker: '-',      // - for unordered
  emDelimiter: '*',           // * for emphasis
  strongDelimiter: '**',       // ** for strong
  linkStyle: 'inlined',       // [text](url) inline
}
```

**Note:** `headingStyle` accepts `'atx'` (default, `#` headers) or `'setext'` (underline style, V2).