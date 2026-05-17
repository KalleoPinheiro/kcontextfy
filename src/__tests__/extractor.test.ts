import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock DOM environment for testing
function createMockElement(tag = 'div', props: Record<string, string> = {}): HTMLElement {
  const mockElement: any = {
    tagName: tag.toUpperCase(),
    className: props.class || '',
    id: props.id || '',
    children: [] as HTMLElement[],
    textContent: props.text || '',
    _parent: null as HTMLElement | null,
    getAttribute: (name: string) => props[name] || null,
    setAttribute: (name: string, value: string) => {
      props[name] = value;
    },
    appendChild: function (child: HTMLElement) {
      this.children.push(child);
      (child as any)._parent = this;
      return child;
    },
    querySelectorAll: () => [],
    querySelector: () => null,
  };

  // Add parentElement as getter that uses _parent
  Object.defineProperty(mockElement, 'parentElement', {
    get: function () {
      return this._parent;
    },
  });

  return mockElement as HTMLElement;
}

// Import after setting up mock
import {
  calculateConfidenceScore,
  scoreSemantic,
  scoreStructural,
  scoreTextDensity,
} from '../content/extractor';

describe('Content Scoring Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scoreSemantic', () => {
    it('rewards main role attribute', () => {
      const div = createMockElement('div', { role: 'main' });
      const score = scoreSemantic(div);
      expect(score).toBeGreaterThan(0.3);
    });

    it('rewards article class', () => {
      const div = createMockElement('div', { class: 'article' });
      const score = scoreSemantic(div);
      expect(score).toBeGreaterThan(0.2);
    });

    it('rewards article ID', () => {
      const div = createMockElement('div', { id: 'article' });
      const score = scoreSemantic(div);
      expect(score).toBeGreaterThan(0.2);
    });

    it('combines multiple semantic signals', () => {
      const div = createMockElement('div', {
        role: 'article',
        class: 'article-content',
        id: 'main-content',
      });
      const score = scoreSemantic(div);
      expect(score).toBeGreaterThan(0.5);
    });

    it('returns 0 for element with no semantic signals', () => {
      const div = createMockElement('div');
      const score = scoreSemantic(div);
      expect(score).toBe(0);
    });

    it('rewards ancestor role', () => {
      const parent = createMockElement('div', { role: 'main' });
      const child = createMockElement('div');
      parent.appendChild(child);

      const score = scoreSemantic(child);
      expect(score).toBeGreaterThan(0.1);
    });

    it('scores higher with multiple semantic signals than single signal', () => {
      const single = createMockElement('div', { role: 'article' });
      const multi = createMockElement('div', {
        role: 'article',
        class: 'article-content',
        id: 'article',
      });

      const singleScore = scoreSemantic(single);
      const multiScore = scoreSemantic(multi);

      expect(multiScore).toBeGreaterThan(singleScore);
    });

    it('ignores unrelated attributes', () => {
      const unrelated = createMockElement('div', {
        class: 'sidebar',
        id: 'ads',
      });
      const score = scoreSemantic(unrelated);
      expect(score).toBe(0);
    });
  });

  describe('scoreStructural', () => {
    it('rewards reasonable number of children', () => {
      const div = createMockElement('div');
      for (let i = 0; i < 50; i++) {
        const child = createMockElement('p', { text: `Paragraph ${i}` });
        div.appendChild(child);
      }
      const score = scoreStructural(div);
      expect(score).toBeGreaterThan(0.2);
    });

    it('penalizes too few children', () => {
      const div = createMockElement('div');
      div.appendChild(createMockElement('p'));
      const score = scoreStructural(div);
      expect(score).toBeLessThan(0.2);
    });

    it('rewards logical heading hierarchy', () => {
      const div = createMockElement('div');
      const h1 = createMockElement('h1', { text: 'Title' });
      const h2 = createMockElement('h2', { text: 'Subtitle' });
      const p = createMockElement('p', { text: 'Content' });

      div.appendChild(h1);
      div.appendChild(h2);
      div.appendChild(p);

      const score = scoreStructural(div);
      expect(score).toBeGreaterThan(0.1);
    });

    it('penalizes excessive empty children', () => {
      const div = createMockElement('div');
      for (let i = 0; i < 10; i++) {
        div.appendChild(createMockElement('div'));
      }
      const score = scoreStructural(div);
      expect(score).toBeLessThan(0.5);
    });

    it('rewards content elements like paragraphs', () => {
      const div = createMockElement('div');
      for (let i = 0; i < 10; i++) {
        const p = createMockElement('p', { text: 'Some content' });
        div.appendChild(p);
      }
      const score = scoreStructural(div);
      expect(score).toBeGreaterThan(0.2);
    });

    it('scores well-structured content higher than empty divs', () => {
      // Well-structured: paragraphs with text
      const good = createMockElement('div');
      for (let i = 0; i < 20; i++) {
        const p = createMockElement('p', { text: 'Content here' });
        good.appendChild(p);
      }

      // Poorly structured: mostly empty elements
      const poor = createMockElement('div');
      for (let i = 0; i < 20; i++) {
        poor.appendChild(createMockElement('div'));
      }

      const goodScore = scoreStructural(good);
      const poorScore = scoreStructural(poor);

      expect(goodScore).toBeGreaterThan(poorScore);
    });

    it('handles mixed heading hierarchy degradation', () => {
      const div = createMockElement('div');
      // H1 -> H2 -> H4 (jump, not ideal)
      div.appendChild(createMockElement('h1', { text: 'Title' }));
      div.appendChild(createMockElement('h2', { text: 'Section' }));
      div.appendChild(createMockElement('h4', { text: 'Subsection' }));

      const score = scoreStructural(div);
      // Score should still be positive (headings present) but not optimal
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe('scoreTextDensity', () => {
    it('returns 0 for insufficient text', () => {
      const div = createMockElement('div', { text: 'Short' });
      const score = scoreTextDensity(div);
      expect(score).toBe(0);
    });

    it('rewards substantial word count', () => {
      const div = createMockElement('div', { text: 'word '.repeat(150) });
      const score = scoreTextDensity(div);
      expect(score).toBeGreaterThan(0.2);
    });

    it('rewards high character diversity', () => {
      const diverseText = 'The quick brown fox jumps over the lazy dog. '.repeat(10);
      const div = createMockElement('div', { text: diverseText });
      const score = scoreTextDensity(div);
      expect(score).toBeGreaterThanOrEqual(0.25);
    });

    it('penalizes boilerplate content', () => {
      const boilerplateText =
        'Lorem ipsum dolor sit amet. ' +
        'Please subscribe to our newsletter. ' +
        'Follow us on social media. ' +
        'All rights reserved. ';
      const div = createMockElement('div', {
        text: boilerplateText.repeat(20),
      });
      const score = scoreTextDensity(div);
      expect(score).toBeLessThan(0.5);
    });

    it('rewards natural word length', () => {
      const naturalText =
        'This is a well-written article with many paragraphs about interesting topics. '.repeat(20);
      const div = createMockElement('div', { text: naturalText });
      const score = scoreTextDensity(div);
      expect(score).toBeGreaterThan(0.2);
    });

    it('scores quality content higher than boilerplate', () => {
      // Quality content
      const quality = createMockElement('div', {
        text: 'The quick brown fox jumps over the lazy dog. This is meaningful content with depth and substance. '.repeat(
          15
        ),
      });

      // Boilerplate content
      const boilerplate = createMockElement('div', {
        text: 'Please subscribe to our newsletter. Follow us on social media. All rights reserved. Copyright notice. '.repeat(
          15
        ),
      });

      const qualityScore = scoreTextDensity(quality);
      const boilerplateScore = scoreTextDensity(boilerplate);

      expect(qualityScore).toBeGreaterThan(boilerplateScore);
    });

    it('returns 0 for text below minimum threshold', () => {
      const tooShort = createMockElement('div', { text: 'Short' });
      const justUnderLimit = createMockElement('div', {
        text: 'a'.repeat(99),
      });

      expect(scoreTextDensity(tooShort)).toBe(0);
      expect(scoreTextDensity(justUnderLimit)).toBe(0);
    });

    it('handles both diverse and repetitive text appropriately', () => {
      // Highly repetitive (low diversity, simple words)
      const repetitive = createMockElement('div', {
        text: 'a b c d e '.repeat(50),
      });

      // Diverse quality text
      const diverse = createMockElement('div', {
        text: 'The quick brown fox jumps over the lazy dog. '.repeat(15),
      });

      const repScore = scoreTextDensity(repetitive);
      const divScore = scoreTextDensity(diverse);

      // Diverse text with natural language should score better
      expect(divScore).toBeGreaterThanOrEqual(repScore);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('combines all three scoring modules', () => {
      const div = createMockElement('div', {
        role: 'article',
        class: 'article-content',
      });

      // Add children
      for (let i = 0; i < 20; i++) {
        const p = createMockElement('p', {
          text: 'The quick brown fox jumps over the lazy dog. '.repeat(5),
        });
        div.appendChild(p);
      }

      const score = calculateConfidenceScore(div);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('returns normalized score between 0 and 1', () => {
      const div = createMockElement('div');
      const score = calculateConfidenceScore(div);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('scores well-structured article higher than poor structure', () => {
      // Well-structured article
      const goodArticle = createMockElement('div', {
        role: 'article',
        class: 'article-content',
      });
      for (let i = 0; i < 15; i++) {
        const p = createMockElement('p', {
          text:
            'The quick brown fox jumps over the lazy dog. ' +
            'This is quality content with good structure. '.repeat(3),
        });
        goodArticle.appendChild(p);
      }

      // Poor article
      const poorArticle = createMockElement('div', { text: 'Short' });

      const goodScore = calculateConfidenceScore(goodArticle);
      const poorScore = calculateConfidenceScore(poorArticle);

      expect(goodScore).toBeGreaterThan(poorScore);
    });

    it('integrates all three dimensions: semantic + structure + text', () => {
      // Only semantic signal
      const semantic = createMockElement('div', {
        role: 'article',
        text: 'Short text',
      });

      // Semantic + structural
      const semStruct = createMockElement('div', {
        role: 'article',
      });
      for (let i = 0; i < 15; i++) {
        semStruct.appendChild(createMockElement('p', { text: 'Minimal content here' }));
      }

      // All three: semantic + structural + text quality
      const complete = createMockElement('div', {
        role: 'article',
        class: 'article-content',
      });
      for (let i = 0; i < 15; i++) {
        complete.appendChild(
          createMockElement('p', {
            text: 'The quick brown fox jumps over the lazy dog. '.repeat(5),
          })
        );
      }

      const s1 = calculateConfidenceScore(semantic);
      const s2 = calculateConfidenceScore(semStruct);
      const s3 = calculateConfidenceScore(complete);

      // Demonstrates that all three factors are necessary for high scores
      expect(s1).toBeLessThan(s2);
      expect(s2).toBeLessThan(s3);
      expect(s3 - s1).toBeGreaterThan(0.2); // Quality difference is substantial
    });

    it('consistent scoring for identical inputs', () => {
      const article1 = createMockElement('div', {
        role: 'article',
        class: 'post-content',
      });
      for (let i = 0; i < 10; i++) {
        article1.appendChild(createMockElement('p', { text: 'Content example. '.repeat(10) }));
      }

      const article2 = createMockElement('div', {
        role: 'article',
        class: 'post-content',
      });
      for (let i = 0; i < 10; i++) {
        article2.appendChild(createMockElement('p', { text: 'Content example. '.repeat(10) }));
      }

      const score1 = calculateConfidenceScore(article1);
      const score2 = calculateConfidenceScore(article2);

      expect(score1).toBe(score2); // Same structure = same score
    });
  });
});
