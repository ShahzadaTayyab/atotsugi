# ATOTSUGI (跡継ぎ) — The AI Heir

Hackathon prototype. ~2.5h build window. DEMO PATH ONLY. Working > pretty. Story > features.
An aging shop owner talks for one afternoon → an AI ingests his knowledge into a "shop codex" → the AI runs the shop's digital side today (bilingual storefront, orders, ledger) and trains a human successor tomorrow. The bridge, not the replacement.

## Non-negotiables
- Deploy a skeleton to Vercel within the FIRST 20 MINUTES. Deploy again after every working feature. Never let deploy be the last step.
- Every sponsor adapter makes at least ONE real API call on the happy path. Judges check code-level integration.
- Every adapter fails gracefully: surface a visible UI badge (e.g. "fallback: Qwen") and continue. Nothing may crash the demo.
- Do not build anything not in this file.

## Stack
Next.js 14 (app router) + TypeScript. No auth. No database. State = Daytona sandbox filesystem + in-memory fallback.

## Env (.env.local — also produce .env.example)
- QWEN_API_KEY          → base https://dashscope-intl.aliyuncs.com/compatible-mode/v1 (if 401/404, try https://dashscope.aliyuncs.com/compatible-mode/v1). Verify model availability with a test call; prefer qwen-plus, else qwen-max, else any qwen3 chat model.
- GMI_API_KEY           → base https://api.gmi-serving.com/v1 (OpenAI-compatible). On first run, GET /v1/models and pick: one strong chat model, one vision-capable model (Qwen2.5-VL family or similar), one audio/whisper model if present.
- DAYTONA_API_KEY       → @daytonaio/sdk
- NOSANA_WHISPER_URL    → OpenAI-compatible Whisper endpoint (vLLM/Ollama recipe). POST {URL}/v1/audio/transcriptions, multipart, model "whisper".
- AIAND_BASE_URL, AIAND_API_KEY → assume OpenAI-compatible chat completions. If unset or erroring: fall through to Qwen, console.warn, show UI badge.

## Adapters — lib/adapters/, one file each, exact signatures
- nosana.ts  → transcribeAudio(buf: Buffer, filename: string): Promise<string>  // Nosana first, GMI audio fallback, error string last
- gmi.ts     → gmiChat(messages: Msg[]): Promise<string>; gmiVision(imageB64: string, prompt: string): Promise<string>
- qwen.ts    → qwenChat(messages: Msg[], json?: boolean): Promise<string>  // json=true → instruct model to return ONLY raw JSON, strip ``` fences before parse
- daytona.ts → createSandbox(label: string); writeSandboxFile(id, path, content); readSandboxFile(id, path); execInSandbox(id, cmd)  // wrap all in try/catch; on failure flip global flag STATE_FALLBACK=true and use an in-memory Map, badge the UI "state: in-memory"
- aiand.ts   → aiandChat(messages: Msg[]): Promise<string>  // throws NotConfigured when env missing

## Shop Codex schema (lib/codex.ts)
{ shop: {name, location, founded, story}, owner: {name, age, voice_tone, greeting_style},
  products: [{name, price_jpy, description, story}],
  methods: [{name, steps: [string], sensory_cues: [string], secrets: [string]}],
  suppliers: [string], regulars: [string], rules: [string], gaps: [string] }

## API routes (app/api/*/route.ts)
- POST /api/ingest        audio file → nosana.transcribeAudio → aiandChat (fallback qwenChat) merges transcript into codex JSON (send current codex + transcript, get full updated codex back) → persist codex.json to Recipe Keeper sandbox → return {codex, transcript, processedBy: "aiand"|"qwen-fallback"}
- POST /api/ingest-image  image → gmiVision("identify this tool/product/ledger content for a Japanese shop codex") → qwenChat merges into codex → persist
- POST /api/heirs/boot    creates 3 Daytona sandboxes: recipe-keeper, storefront, voice-of-the-shop → returns ids + boot logs for UI
- POST /api/storefront    qwenChat generates ONE self-contained bilingual (JA/EN) HTML shop page from codex → writeSandboxFile(storefront, "shop.html", html) → also cache in memory → return ok
- GET  /shop              serves cached shop.html (read from sandbox if cache cold)
- POST /api/chat          {message, mode: "customer"|"successor"} → qwenChat with codex as system context. customer: reply as the shop in owner's tone, JA+EN, detect order intent → append {ts, item, qty, buyer_msg} to ledger.json in voice sandbox. successor: answer method/recipe questions STRICTLY from codex, in owner's voice; if codex lacks it, say so and add to gaps[]. Return {reply, ledger}
- POST /api/shred         destroy all sandboxes, wipe memory state → {shredded: true}
- GET  /api/state         {codex, ledger, heirs, badges} for UI polling

## UI — single page app/page.tsx, three columns
LEFT  "相続 Inheritance": audio file upload (mic later ONLY if everything else done), image upload, transcript feed, codex tree as nested list.
MID   "跡継ぎ The Heirs": 3 heir cards with boot status logs; [Boot the Heirs] button; [Build Storefront] button + link to /shop.
RIGHT "店は生きる The Shop Lives": chat with mode toggle 客 Customer / 弟子 Successor; ledger table below; prominent red 破棄 SHRED button (confirm dialog) bottom-right.
Badges row: "処理は日本国内 processed in Japan" (green, when ai& live) / "fallback: Qwen" (amber) / "state: in-memory" (amber).

## Design tokens (follow exactly — no generic dark-SaaS look)
Subject: sumi ink, aged washi, shokunin indigo, hanko seal. 
Palette: ink #1C1B18 (page bg), washi #EDE6D6 (content panels: codex, shop, ledger), aizome indigo #23395B (heir cards, primary buttons), hanko red #B3341F (ONLY the seal stamp + shred), kin gold #B8963E (ONLY active-heir state).
Type: Shippori Mincho (Google Fonts) for display/headings incl. large JA characters; Noto Sans JP for body/UI. Generous letter-spacing on JA headings.
Signature element: a red hanko-style square seal that stamps onto the codex panel (simple CSS scale+fade, respect prefers-reduced-motion) each time a codex operation completes with ai& — the seal reads 日本国内. This doubles as the sovereignty demo beat.
Restraint: no gradients, no glassmorphism, no purple. Empty states instruct ("音声をアップロード — upload the owner's voice to begin").

## Build order (timeboxed)
1. 0:00–0:20 scaffold + vercel deploy skeleton + push public GitHub repo
2. 0:20–0:50 five adapters + a scripts/smoke.ts that calls each once and prints PASS/FAIL per sponsor
3. 0:50–1:30 /api/ingest + codex render (TEST WITH THE REAL AUDIO CLIPS from TANAKA_SCRIPT.md)
4. 1:30–2:00 heirs boot + storefront gen + /shop
5. 2:00–2:20 chat both modes + ledger + shred + badges
6. 2:20–2:30 polish pass on tokens, redeploy, README
STOP. Anything else goes on the "what ships next" slide.

## README.md must open with this table (fill File:Line refs at the end)
| Organ | Sponsor | What it does here | File:Line |
| The Body — isolated stateful computers per heir | Daytona | 3 sandboxes hold codex, storefront, ledger | lib/adapters/daytona.ts |
| The Mind — orchestration, JA reasoning | Qwen | codex merge, storefront gen, both chat modes | lib/adapters/qwen.ts |
| The Ears — the owner never types | Nosana | Whisper transcription on decentralized GPU | lib/adapters/nosana.ts |
| The Memory that never leaves Japan | ai& | codex processing on JP infra (hanko badge) | lib/adapters/aiand.ts |
| The Hundred Hands — vision & fallback models | GMI Cloud | ledger/tool photo reading, audio fallback | lib/adapters/gmi.ts |
| Built by an AI team | Qoder | Repo Wiki committed at /wiki | wiki/ |
