import { describe, expect, it } from 'vitest';
import { convertToMarkdown } from '../background/converter';

describe('converter h2 + tables + links', () => {
  it('converts h2 with empty anchor child to ## heading', () => {
    const html = `<h2>Section<span class="x" id="anchor1"></span><a href="#anchor1" class="subheading-anchor"></a></h2><p>para</p>`;
    const md = convertToMarkdown(html);
    expect(md).toContain('## Section');
  });

  it('preserves inline link', () => {
    const html = `<p>Texto com <a href="https://example.com">link</a> aqui.</p>`;
    const md = convertToMarkdown(html);
    expect(md).toContain('[link](https://example.com)');
  });

  it('preserves table as GFM', () => {
    const html = `<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>`;
    const md = convertToMarkdown(html);
    expect(md).toMatch(/\|\s*A\s*\|\s*B\s*\|/);
    expect(md).toMatch(/\|\s*1\s*\|\s*2\s*\|/);
  });
});
