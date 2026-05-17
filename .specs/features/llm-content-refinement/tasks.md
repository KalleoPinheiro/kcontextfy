# Tasks: LLM Content Refinement

**Status**: Ready | **Created**: 2026-05-17

## Task Breakdown

### [1] Storage + Types
- [ ] Add types to `src/shared/types.ts`:
  - `RefinedContent` (extends SanitizedContent + confidence + refined flag)
  - `GeminiSettings` (apiKey, enabled, dailyQuota, callsToday, lastResetDate)
- [ ] Add constants to `src/shared/constants.ts`:
  - `GEMINI_API_ENDPOINT`
  - `GEMINI_TIMEOUT_MS = 5000`
  - `GEMINI_DEFAULT_QUOTA = 10`
- **Verify**: Types exported, no TypeScript errors

### [2] Settings Modal UI
- [ ] Create `src/popup/SettingsModal.tsx`:
  - Modal overlay (dark background, centered)
  - API key input (type="password", no autocomplete)
  - "Test Connection" button (calls Gemini with test prompt)
  - Enable/disable toggle
  - Daily quota slider (1-50)
  - Save/Cancel buttons
  - Success/error feedback
- [ ] Update `src/popup/popup.tsx`:
  - Add ⚙️ button in corner
  - Open SettingsModal on click
  - Load settings on mount, display current state
- **Verify**: Modal opens, settings save to chrome.storage.sync, no errors on save

### [3] LLM Refiner Module
- [ ] Create `src/background/llm-refiner.ts`:
  - `getGeminiSettings()` → read from storage
  - `checkQuota()` → today's call count < limit?
  - `getCacheKey(url, contentHash)` → SHA256
  - `getCachedResult(key)` → check TTL (30 days)
  - `callGeminiAPI(content, apiKey)` → fetch + timeout + JSON validation
  - `validateResponse(json)` → check schema
  - `refineContent(content, apiKey)` → orchestrate flow
- **Verify**: Cache works, quota enforced, API calls timeout, bad responses handled

### [4] Message Handler
- [ ] Update `src/background/index.ts`:
  - Add case for action `'refineContent'`
  - Extract payload (SanitizedContent)
  - Call `refineSanitizedContent(payload, apiKey)`
  - Return RefinedContent or original on error
  - Don't throw (graceful fallback)
- **Verify**: Message roundtrip works, content script receives response

### [5] Popup UI Polish
- [ ] Update `src/popup/popup.tsx`:
  - Display "AI-refined ✓" badge if `refined === true`
  - Show confidence scores as tooltips (if present)
  - Add loading indicator while waiting for LLM
  - Handle missing settings (show prompt: "Configure API key in settings")
- **Verify**: Badge displays correctly, tooltips work, UX responsive

### [6] Integration + Tests
- [ ] Create `src/__tests__/llm-refiner.test.ts`:
  - Test cache hit/miss
  - Test quota enforcement
  - Test API timeout
  - Test bad JSON response
  - Test graceful fallback
- [ ] Integration test: content script → background → popup flow
- [ ] Manual test: real Gemini API call (use test key)
- **Verify**: 80%+ coverage, all tests pass, no regressions

## Verification Checklist

- [ ] Settings persist across popup closes
- [ ] API key never logged, console-free
- [ ] LLM call times out at 5s (doesn't hang extension)
- [ ] Cache prevents duplicate API calls for same URL
- [ ] Quota limit enforced (calls capped at setting)
- [ ] Network error → graceful fallback (use local result)
- [ ] Bad JSON from Gemini → handled, original result used
- [ ] Popup shows local result immediately, updates if LLM completes <2s
- [ ] 80%+ test coverage
- [ ] Build passes, no regressions in existing tests

## Dependencies

- Task 1 (types) → Task 2, 3, 5
- Task 2 (settings) → Task 3 (test connection)
- Task 3 (refiner) → Task 4 (message handler)
- Task 4 (message) → Task 5 (UI)
- Task 5, 3 (in parallel) → Task 6 (tests)

**Parallel**: Tasks 1 + 2 can start simultaneously. Tasks 3, 4, 5 can start once 1 is done.
