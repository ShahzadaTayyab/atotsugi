import { NextRequest, NextResponse } from "next/server";
import { qwenChat } from "@/lib/adapters/qwen";
import { createSandbox, readSandboxFile, writeSandboxFile } from "@/lib/adapters/daytona";
import { emptyCodex, parseCodex, type ShopCodex } from "@/lib/codex";
import { parseLedger, type LedgerEntry } from "@/lib/ledger";
import { stripJsonFences } from "@/lib/json";
import { SANDBOX, CODEX_PATH, LEDGER_PATH } from "@/lib/sandboxPaths";

type ChatMode = "customer" | "successor";

function customerMessages(codex: ShopCodex, message: string) {
  return [
    {
      role: "system" as const,
      content: `You are the shop "${codex.shop.name || "the shop"}", replying as its owner ${
        codex.owner.name || ""
      } in this voice/tone: ${codex.owner.voice_tone || "warm, direct"}. Greeting style: ${
        codex.owner.greeting_style || ""
      }. Use this codex for products/prices/story: ${JSON.stringify(codex)}.
Reply bilingually: Japanese first, then an English translation. If the customer is placing an order, detect the item and quantity.
Respond with ONLY raw JSON: {"reply": string, "order": {"item": string, "qty": number} | null}`,
    },
    { role: "user" as const, content: message },
  ];
}

function successorMessages(codex: ShopCodex, message: string) {
  return [
    {
      role: "system" as const,
      content: `You are training the shop successor, speaking in the owner's voice (${
        codex.owner.voice_tone || "warm, direct"
      }). Answer the question STRICTLY using this codex, no invented facts: ${JSON.stringify(
        codex
      )}.
If the codex does not contain the answer, say so honestly (bilingually, Japanese then English) and describe the missing knowledge as a short gap.
Respond with ONLY raw JSON: {"reply": string, "gap": string | null}`,
    },
    { role: "user" as const, content: message },
  ];
}

export async function POST(req: NextRequest) {
  const { message, mode }: { message: string; mode: ChatMode } = await req.json();

  if (!message || (mode !== "customer" && mode !== "successor")) {
    return NextResponse.json(
      { error: 'Provide "message" and mode: "customer" | "successor".' },
      { status: 400 }
    );
  }

  const sandboxId = await createSandbox(SANDBOX);
  const codexRaw = await readSandboxFile(sandboxId, CODEX_PATH);
  const codex = codexRaw ? parseCodex(codexRaw) : emptyCodex();
  const ledgerRaw = await readSandboxFile(sandboxId, LEDGER_PATH);
  const ledger: LedgerEntry[] = ledgerRaw ? parseLedger(ledgerRaw) : [];

  const messages = mode === "customer" ? customerMessages(codex, message) : successorMessages(codex, message);
  const raw = await qwenChat(messages, true);

  let reply = raw;
  let order: { item: string; qty: number } | null = null;
  let gap: string | null = null;
  try {
    const parsed = JSON.parse(stripJsonFences(raw));
    reply = parsed.reply ?? raw;
    order = parsed.order ?? null;
    gap = parsed.gap ?? null;
  } catch {
    // Model didn't return valid JSON; fall back to using the raw text as the reply.
  }

  if (mode === "customer" && order && order.item) {
    ledger.push({
      ts: new Date().toISOString(),
      item: order.item,
      qty: order.qty || 1,
      buyer_msg: message,
    });
    await writeSandboxFile(sandboxId, LEDGER_PATH, JSON.stringify(ledger, null, 2));
  }

  if (mode === "successor" && gap && !codex.gaps.includes(gap)) {
    codex.gaps.push(gap);
    await writeSandboxFile(sandboxId, CODEX_PATH, JSON.stringify(codex, null, 2));
  }

  return NextResponse.json({ reply, ledger });
}
