import { describe, expect, it } from 'vitest';
import { processExtractedContent, convertToMarkdown } from '../background/converter';

const fixtureHtml = `<br>
<h1>RAG Está Morto?</h1>
<div class="lang-toggle hx:text-sm">
<a href="/pt" class="lang-toggle-link lang-toggle-active" data-lang="pt">PT</a>
<span class="hx:mx-1">|</span>
<a href="/en" class="lang-toggle-link" data-lang="en">EN</a></div>
<div class="hx:text-center hx:mt-4 hx:text-sm hx:text-gray-500"><em>6 de abril de 2026</em>
<span class="hx:mx-2">·</span>
<a href="#disqus_wrapper" class="hx:text-gray-400">💬 Participe da Discussão</a></div>
<div class="hx:text-center hx:mt-2 hx:mb-0 hx:text-sm"><em>Se tem preguiça de ler, clique <a href="https://chatgpt.com">aqui</a> pro TL;DR</em></div>
<div class="hx:mb-16"></div>
<div class="content">
<p>Já tem um tempo que essa coceira não me larga.</p>
<p>Daí virou indústria. Pinecone, Weaviate.</p>
<h2>O que o vazamento do Claude Code mostrou<span class="hx:absolute hx:-mt-20" id="vazamento"></span>
<a href="#vazamento" class="subheading-anchor" aria-label="Permalink for this section"></a></h2>
<p>Antes de entrar na parte teórica, vale falar de algo.</p>
<p>O que interessa pra essa discussão é o sistema de <a href="https://example.com/leak">memória do Claude Code</a>.</p>
<h2>Onde a história começou a virar<span class="hx:absolute hx:-mt-20" id="onde"></span>
<a href="#onde" class="subheading-anchor"></a></h2>
<p>Quando o teto era 32k de contexto.</p>
<h2>Tabela de preços</h2>
<table>
<thead><tr><th>Modelo</th><th>Input</th><th>Output</th></tr></thead>
<tbody>
<tr><td>Claude Sonnet 4.6</td><td>$0.60</td><td>$0.03</td></tr>
<tr><td>GLM 5</td><td>$0.12</td><td>$0.0044</td></tr>
</tbody>
</table>
<p>Após tabela.</p>
</div>`;

const nestedHtml = `<main>
<h1>RAG Está Morto?</h1>
<div class="content">
<p>Primeiro paragrafo.</p>
<h2>Onde a história começou a virar<span class="hx:absolute" id="onde"></span>
<a href="#onde" class="subheading-anchor"></a></h2>
<p>Quando o teto era 32k.</p>
<h2>Os problemas reais<span class="hx:absolute" id="probl"></span>
<a href="#probl" class="subheading-anchor"></a></h2>
<p>A propaganda vende sonho.</p>
</div>
</main>`;

describe('converter against fixture', () => {
  it('emits ## for h2 nested inside main > content div (real-world layout)', () => {
    const md = convertToMarkdown(nestedHtml);
    expect(md).toContain('## Onde a história começou a virar');
    expect(md).toContain('## Os problemas reais');
    expect(md).toContain('# RAG Está Morto?');
  });

  it('emits ## for h2 with inline anchor children', () => {
    const md = convertToMarkdown(fixtureHtml);
    console.log('=== convertToMarkdown output ===\n', md);
    expect(md).toContain('## O que o vazamento do Claude Code mostrou');
    expect(md).toContain('## Onde a história começou a virar');
    expect(md).toContain('## Tabela de preços');
  });

  it('removes lang-toggle / TL;DR noise', () => {
    const md = processExtractedContent({
      pageType: { type: 'article', confidence: 1, metadata: {} },
      title: 'Test',
      url: 'http://x',
      timestamp: 'now',
      content: fixtureHtml,
    } as never);
    console.log('=== processExtractedContent output ===\n', md);
    expect(md).not.toMatch(/^PT$/m);
    expect(md).not.toMatch(/^EN$/m);
    expect(md).not.toMatch(/^\|$/m);
    expect(md).not.toContain('Participe da Discussão');
  });

  it('keeps inline links', () => {
    const md = convertToMarkdown(fixtureHtml);
    expect(md).toContain('[memória do Claude Code](https://example.com/leak)');
  });

  it('keeps table', () => {
    const md = convertToMarkdown(fixtureHtml);
    expect(md).toMatch(/\| Modelo\s*\| Input\s*\| Output\s*\|/);
  });
});
