# ATOTSUGI — Execution Checklist

## RIGHT NOW, in order (before/while Claude Code scaffolds)
1. [ ] Start the Nosana Whisper job FIRST — GPU host matching takes time; this is the longest pole. Use their vLLM/Ollama Whisper recipe, save the endpoint URL.
2. [ ] Create public GitHub repo `atotsugi`, empty, push init commit.
3. [ ] `vercel login` on the MacBook so deploys are one command later.
4. [ ] Collect keys into .env.local as they arrive: QWEN_API_KEY, GMI_API_KEY, DAYTONA_API_KEY, NOSANA_WHISPER_URL. (ai& comes at the workshop — grab the rep at 10:45, ask for base URL + key + whether it's OpenAI-compatible. If nothing by 12:30, ship with the Qwen fallback and the amber badge; say so honestly in the demo.)
5. [ ] Record the two Tanaka clips (TANAKA_SCRIPT.md). Do this before the ingest UI exists.
6. [ ] Install Qoder alongside — open the repo once it has files, generate Repo Wiki, commit it to /wiki, make 1–2 commits from Qoder.

## Terminal sequence
mkdir atotsugi && cd atotsugi && git init
# drop CLAUDE.md from this kit into the folder
claude
# then say: "Read CLAUDE.md and build it exactly. Start with step 1 of the build order: scaffold, deploy skeleton to Vercel, push to GitHub. Then run scripts/smoke.ts after step 2 and show me the PASS/FAIL table before continuing."

## Parallel split
YOU: Claude Code loop, keys, deploys. Nothing else.
FRIEND: Nosana job, ai& rep, record Tanaka clips, then Google Slides deck from PITCH.md S1–S6, then screen-record the 2-min video per PITCH.md.
CLAUDE (this chat): send me screenshots of the working app + your team names → I assemble the deck PDF and check it <10MB.

## Cutoffs (event clock)
- 12:00 architecture frozen (it already is — CLAUDE.md is law)
- 2:00  FEATURE FREEZE (yes, 2:00 — the story artifacts win, not feature #9)
- 2:00–2:45 video recorded, deck PDF exported
- 3:00  deployed URL tested from a PHONE on venue wifi
- 3:15  submit at tinyurl.com/hackathonsubmit: project name ATOTSUGI (跡継ぎ), team names+emails, public repo link, deck PDF ≤10MB, video <2min
- 3:30  rehearse the 3-min live demo twice, out loud, timed; Google Meet link (tinyurl.com/projector0725) open and screen-share tested BEFORE they call top 10

## Failure rules
- Any sponsor API down → amber badge, keep moving. 4 real integrations beats 6 broken ones.
- Live mic, live typing, live anything untested = banned. Demo runs on the two pre-tested clips and one pre-tested English order message.
- If Daytona flakes on stage: state falls back to memory with the badge — the demo still completes. Mention the sandbox architecture verbally.
