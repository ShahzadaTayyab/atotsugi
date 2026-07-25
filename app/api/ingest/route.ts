import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/adapters/nosana";
import { aiandChat } from "@/lib/adapters/aiand";
import { qwenChat } from "@/lib/adapters/qwen";
import {
  createSandbox,
  readSandboxFile,
  writeSandboxFile,
  STATE_FALLBACK,
} from "@/lib/adapters/daytona";
import { emptyCodex, parseCodex, type ShopCodex } from "@/lib/codex";
import { stripJsonFences } from "@/lib/json";
import type { Msg } from "@/lib/types";

const RECIPE_KEEPER = "recipe-keeper";
const CODEX_PATH = "codex.json";

const CODEX_SCHEMA = `{
  "shop": {"name": string, "location": string, "founded": string, "story": string},
  "owner": {"name": string, "age": string, "voice_tone": string, "greeting_style": string},
  "products": [{"name": string, "price_jpy": number, "description": string, "story": string}],
  "methods": [{"name": string, "steps": [string], "sensory_cues": [string], "secrets": [string]}],
  "suppliers": [string],
  "regulars": [string],
  "rules": [string],
  "gaps": [string]
}`;

function buildMergeMessages(codex: ShopCodex, transcript: string): Msg[] {
  return [
    {
      role: "system",
      content: `You maintain a JSON "shop codex" for a Japanese shop succession AI. Given CURRENT_CODEX and a new TRANSCRIPT from the shop owner, merge new information into the codex and return the FULL UPDATED codex as raw JSON only — no prose, no markdown fences. Schema (keep every top-level key, even if empty):
${CODEX_SCHEMA}
Add new products/methods/suppliers/regulars/rules mentioned in the transcript. Fill in shop/owner fields as they're revealed. Remove an item from "gaps" once the transcript answers it; add a new gap if the transcript raises a question it doesn't answer. Never delete existing verified info unless the transcript directly corrects it.`,
    },
    {
      role: "user",
      content: JSON.stringify({ current_codex: codex, transcript }),
    },
  ];
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const audioFile = form.get("audio");
  const transcriptField = form.get("transcript");

  let transcript: string;
  if (audioFile instanceof File) {
    const buf = Buffer.from(await audioFile.arrayBuffer());
    transcript = await transcribeAudio(buf, audioFile.name || "audio");
  } else if (typeof transcriptField === "string" && transcriptField.trim()) {
    transcript = transcriptField.trim();
  } else {
    return NextResponse.json(
      { error: "Provide an audio file (field: audio) or a transcript (field: transcript)." },
      { status: 400 }
    );
  }

  const sandboxId = await createSandbox(RECIPE_KEEPER);
  const existingRaw = await readSandboxFile(sandboxId, CODEX_PATH);
  const currentCodex = existingRaw ? parseCodex(existingRaw) : emptyCodex();

  const messages = buildMergeMessages(currentCodex, transcript);

  let processedBy: "aiand" | "qwen-fallback" = "aiand";
  let raw: string;
  try {
    raw = await aiandChat(messages);
  } catch (err) {
    console.warn("ai& unavailable, falling back to Qwen:", err);
    processedBy = "qwen-fallback";
    raw = await qwenChat(messages, true);
  }

  let updatedCodex: ShopCodex;
  try {
    updatedCodex = JSON.parse(stripJsonFences(raw));
  } catch (err) {
    console.warn("Codex merge response was not valid JSON, keeping previous codex:", err, raw);
    updatedCodex = currentCodex;
  }

  await writeSandboxFile(sandboxId, CODEX_PATH, JSON.stringify(updatedCodex, null, 2));

  return NextResponse.json({
    codex: updatedCodex,
    transcript,
    processedBy,
    stateFallback: STATE_FALLBACK,
  });
}
