# Safety & Mental Health

呼呼 Huhu is entertainment / virtual companionship — **not** medical or psychological treatment.

## Crisis & wellness detection

`packages/ai/src/safety.ts` scans user messages for crisis and wellness patterns (zh-TW, en, ja, ko, vi). When flagged:

- Chat returns a **safety response** with locale-aware helpline text from `@huhu/shared` support resources.
- No LLM roleplay reply is generated for crisis/wellness hits.
- User + assistant safety messages are **persisted** to the message history (`mediaJson.safety.category`); clients restore safety bubble styling on reload.
- Crisis content is **not** indexed into the RAG vector store.

## PII scrubbing

`packages/ai/src/pii.ts` masks email, phone, and address patterns before:

- External LLM requests (`userMessage` in chat)
- RAG memory indexing (`indexMessageAsMemory` scrubs content; `retrieveMemories` scrubs query; diary entries ≥12 chars indexed)
- Web novel export (`formatWebNovelExport` scrubs user messages only)

Plaintext messages in SQLite still store the user's original text for history display; only vector memory, LLM payloads, and exported user lines are scrubbed.

## Character break guard

`packages/ai/src/character-guard.ts` detects obvious AI/meta replies (multilingual). When corrected:

- Reply content is replaced with an in-character fallback (locale-aware).
- `characterCorrected: true` on the chat response; persisted in `mediaJson.characterGuard.corrected` for history reload via `GET /v1/characters/:id/messages`.
- E2E: `e2e/character-guard.spec.ts`（mock LLM 訊息觸發子 `__mock_break_character__`）；測試子不寫入 RAG。
- Set `LLM_MOCK_BREAK_CHARACTER=1` in dev/test to exercise the path with the mock LLM.

## Support resources API

`GET /v1/meta/support-resources?locale=` returns:

- `privacyReminder` — PII / professional-care disclaimer
- `crisis` — immediate danger title + helpline lines
- `wellness` — prolonged low mood guidance

Bundles: TW, CN, JP, KR, VN, US (en). CN uses national **12356** hotline; KR **1393** suicide prevention line.

## Client surfaces

| Surface | Location |
|---------|----------|
| Web | Toolbar **支援資源** dialog; privacy dialog shows `privacyReminder` |
| Flutter | Settings → **支援資源** tile + dialog; Privacy screen reminder |
| Chat | Inline safety reply when patterns match |

## Operational notes

- Keep helplines updated per region; prefer official government / NGO sources.
- Do not log flagged message plaintext in production analytics.
- Age gate (18+) is required before first chat; no ID upload.
- Premium NSFW remains store-policy gated; crisis flow applies regardless of tier.

See also: [API.md](./API.md), [ARCHITECTURE.md](./ARCHITECTURE.md).
