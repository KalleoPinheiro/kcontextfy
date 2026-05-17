# Design Document: Content Scoring Engine (calculateConfidenceScore)

## Overview
The scoring engine will use a modular, weighted system to evaluate the confidence of any candidate DOM node as the primary content container. The score is calculated by summing three main components: Semantic Matching, Structural Cohesion, and Text Density.

## Core Function Signature
\`const calculateConfidenceScore(candidateNode: HTMLElement): number\`;

## Scoring Modules & Logic Contracts

### 1. Semantic Matching Score (\`scoreSemantic\`)
*   **Goal:** Measures how "official" the node appears based on its context.
*   **Input:** Node, Global Document Context.
*   **Scoring Criteria (Example Weights):**
    *   Ancestor has `role="main"`: +20 points.
    *   Class/ID matches known pattern (`article__content`): +15 points.
    *   Relative to viewport: Near top/center (+5 pts).

### 2. Structural Cohesion Score (\`scoreStructural\`)
*   **Goal:** Measures the internal organizational quality of the node's children.
*   **Input:** Node, List of Children.
*   **Scoring Criteria (Example Weights):**
    *   P tag ratio: High $\text{P}/\text{ChildCount}$ is good (+10 pts).
    *   Heading Hierarchy Check: Consistent $H_x \to H_{x+1} \to H_x$ sequence is a major positive.
    *   Empty Container Ratio Penalty: Penalize if many child tags have no text content (-25 pts).

### 3. Text Density Score (\`scoreTextDensity\`)
*   **Goal:** Measures the sheer quality and volume of readable, unique characters.
*   **Input:** Node, Full Accessible Text Content.
*   **Scoring Criteria (Example Weights):**
    *   Word/Unique Character Ratio: High value suggests rich content (+20 pts).
    *   Boilerplate Detection: Penalty for high frequency of common filler phrases ("read more", etc.).

## Final Composite Score Formula
$$\text{CompositeScore} = (W_S \cdot \text{scoreSemantic}) + (W_{St} \cdot \text{scoreStructural}) + (W_T \cdot \text{scoreTextDensity})$$

**Actionable Insight:** The initial implementation will use placeholder weights ($W_S=1, W_{St}=1.5, W_T=2$) and focus on making the structure operational before tuning these weights with real data.