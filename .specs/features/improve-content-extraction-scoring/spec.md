# Project Proposal: Improve Content Extraction Scoring (kcontextify)

## 🌟 What & Why
The current content extraction process relies heavily on heuristics and fixed selectors (`src/content/extractor.ts`). While functional, this approach is brittle; it breaks when web pages change their underlying structure (a common occurrence in modern SPAs). We need to shift from a "blacklist/whitelist" approach to a **statistical, confidence-based scoring model** that can dynamically identify the most probable primary content container, regardless of superficial HTML changes. This massively increases our robustness and reliability for production use.

## 🎯 Goal
To implement `calculateConfidenceScore(candidateNode)`—a master function that evaluates candidate DOM nodes using weighted scoring across Semantic, Structural, and Text Density metrics to pinpoint the best possible source element for extraction.