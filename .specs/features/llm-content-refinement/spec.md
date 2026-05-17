# LLM Content Refinement via Gemini

**Scope**: Medium | **Status**: Spec | **Created**: 2026-05-17

## Vision

Enhance local content sanitizer with Gemini 1.5 Flash to refine extracted metadata + body text. Async, non-blocking. User provides API key.

## Architecture

**Local-first + async LLM polish**:
1. Content script runs local sanitizer → SanitizedContent (instant)
2. Background service worker checks: user has Gemini key configured?
3. If yes → async call to Gemini with sanitized output + system prompt
4. LLM refines: validates title/author/date, fixes entity extraction errors
5. Cache result by URL hash (skip duplicate requests)
6. Update popup if LLM result differs from local (user sees improvement)

**Fallback**: If LLM fails (quota, network, bad response) → use local result. No breakage.

## Requirements

**REQ-1: Settings UI**
- Popup/settings page: input field for Gemini API key
- Store in `chrome.storage.sync` (encrypted by Chrome)
- Never log, console.log, or expose key
- Validation: test connectivity on save

**REQ-2: Gemini API Call**
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- Input: SanitizedContent (JSON)
- System prompt (EN): Extract + validate title, author, date, body. Return JSON.
- Output: `{ title, author, publishedAt, content, confidence: { title, author, publishedAt, content } }`
- Timeout: 5 second max (extension hangs if longer)

**REQ-3: Async + Non-Blocking**
- Content script shows local result immediately
- Background worker calls Gemini in parallel
- If LLM completes in <2s → update popup
- If LLM slower → user keeps local result (no update)

**REQ-4: Caching**
- Key: SHA256(URL + local_result_hash)
- Store in `chrome.storage.local`
- TTL: 30 days
- Skip Gemini call if cached + fresh

**REQ-5: Cost Awareness**
- Settings: checkbox "Enable AI refinement" (default: off)
- Quota setting: max calls per day (default: 10)
- Track: calls made today (in storage)
- Block: if quota hit, use local result silently

**REQ-6: Error Handling**
- LLM error → log warning, use local result (user doesn't know)
- Quota error → mark in storage, disable for day
- Bad JSON response → validate + fall back
- Network timeout → use local result

## Integration Points

- **Settings/Config**: New UI for API key + quota
- **Background Worker**: Call Gemini async
- **Popup**: Display "AI-refined" badge if result updated by LLM
- **Storage**: Cache + quota tracking

## Verification

- [ ] User can save API key without error
- [ ] Local sanitizer result appears instantly
- [ ] Gemini call succeeds, returns valid JSON
- [ ] Cached results skip API call
- [ ] Quota limit respected
- [ ] LLM failure → graceful fallback
- [ ] No API key in logs/console
- [ ] Test with mock API first
