# Design: LLM Content Refinement

**Status**: Ready | **Date**: 2026-05-17

## Architecture

### Components

**1. Settings Modal (Popup UI)**
- New file: `src/popup/SettingsModal.tsx` (React component)
- Popup button: "⚙️" in top-right corner
- Modal overlay with:
  - API key input (masked, no display on blur)
  - "Test connection" button (validate key)
  - Enable/disable toggle
  - Daily quota slider (1-50 calls)
  - Close button
- Save to `chrome.storage.sync`

**2. Background Service Worker**
- New file: `src/background/llm-refiner.ts`
- Exports: `refineSanitizedContent(content, apiKey): Promise<RefinedContent>`
- Logic:
  - Check cache (URL + content hash)
  - If cache hit → return cached
  - If quota hit → return original content
  - Call Gemini API with timeout (5s)
  - Validate response JSON
  - Cache result if valid
  - Return refined content OR original on error

**3. Message Handler**
- Update `src/background/index.ts`
- New action: `'refineContent'`
- Content script sends: local SanitizedContent
- Background worker calls llm-refiner
- Returns refined content + confidence scores

**4. Popup Update**
- Update `src/popup/popup.tsx`
- Add settings button (⚙️)
- Show "AI-refined" badge if LLM result used
- Display confidence scores as tooltips (optional, nice-to-have)

### Data Structures

```typescript
// Request
interface RefineRequest {
  action: 'refineContent'
  payload: SanitizedContent
}

// Response
interface RefinedContent extends SanitizedContent {
  confidence?: {
    title: number      // 0.0-1.0
    author: number
    publishedAt: number
    content: number
  }
  refined: boolean     // true if LLM improved result
}

// Storage
interface GeminiSettings {
  apiKey: string       // encrypted by Chrome
  enabled: boolean
  dailyQuota: number
  callsToday: number
  lastResetDate: string
}
```

### Flow Diagram

```
Content Script
    ↓ (extractContent)
SanitizedContent (local)
    ↓ (show immediately in popup)
Popup displays local result
    ↓ (async: sendMessage 'refineContent')
Background Worker
    ↓ (check cache + quota)
    ├─ Cache hit? → return cached
    ├─ Quota hit? → return original
    └─ Call Gemini API (5s timeout)
         ↓
    Validate JSON + store cache
         ↓ (send updated content back)
Popup (if LLM <2s) updates display + shows badge
```

## Implementation Path

1. **Storage + Settings**: Create GeminiSettings schema, settings modal UI
2. **API Wrapper**: llm-refiner.ts (Gemini call + error handling)
3. **Message Integration**: Add refineContent handler to background worker
4. **UI Polish**: Settings button + badge in popup
5. **Testing**: Mock API, cache logic, quota enforcement

## Files to Create/Modify

**Create**:
- `src/background/llm-refiner.ts` (API wrapper)
- `src/popup/SettingsModal.tsx` (UI component)

**Modify**:
- `src/background/index.ts` (message handler)
- `src/popup/popup.tsx` (settings button + badge)
- `src/shared/types.ts` (add RefinedContent, GeminiSettings)
- `src/shared/constants.ts` (Gemini endpoint, timeouts)

**No changes**: extractor.ts, content script, sanitizer.ts (backward compatible)
