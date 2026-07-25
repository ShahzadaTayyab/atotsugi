# ATOTSUGI (跡継ぎ) — The AI Heir

An aging shop owner talks for one afternoon → an AI ingests his knowledge into a "shop codex" → the AI runs the shop's digital side today (bilingual storefront, orders, ledger) and trains a human successor tomorrow. The bridge, not the replacement.

Live: https://atotsugi.vercel.app

| Organ | Sponsor | What it does here | Status | File:Line |
|---|---|---|---|---|
| The Body — isolated stateful computer holding the codex, storefront, and ledger | Daytona | One sandbox (`recipe-keeper`) persists `codex.json`, `shop.html`, `ledger.json`; falls back to in-memory with a visible badge if the sandbox is unreachable | **Live** | `lib/adapters/daytona.ts` |
| The Mind — orchestration, JA reasoning | Qwen | Codex merge fallback, storefront HTML generation, both chat modes | **Live** | `lib/adapters/qwen.ts` |
| The Ears — the owner never types | Nosana | Whisper endpoint wired in; **transcription deferred** — the deployed endpoint currently serves a Gradio UI, not the OpenAI-compatible `/v1/audio/transcriptions` API CLAUDE.md expects. Demo path uses the paste-transcript field instead | Configured, transcription deferred | `lib/adapters/nosana.ts` |
| The Memory that never leaves Japan | ai& | Primary codex processor via `qwen/qwen3.6-27b` (verified live, Japanese-capable); hanko badge turns green when it serves the request | **Live** | `lib/adapters/aiand.ts` |
| The Hundred Hands — vision & fallback models | GMI Cloud | Vision model for future ledger/tool photo reading (`google/gemini-3.5-flash`), chat fallback model (`deepseek-ai/DeepSeek-V3-0324`) | **Live** | `lib/adapters/gmi.ts` |
| Built by an AI team | Qoder | Repo Wiki | **Not integrated** | — |

## Routes

- `POST /api/ingest` — audio file or pasted transcript → ai& (primary) with Qwen fallback → merges into codex → persists to Daytona
- `POST /api/storefront` — generates a bilingual HTML shop page from the codex
- `GET /shop` — serves the generated storefront
- `POST /api/chat` — `{message, mode: "customer"|"successor"}`; customer orders append to the ledger, successor gaps append to `codex.gaps[]`

## Local dev

```
npm install
npm run dev
npm run smoke   # PASS/FAIL table per sponsor, real API calls
```
