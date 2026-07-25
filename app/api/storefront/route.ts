import { NextResponse } from "next/server";
import { qwenChat } from "@/lib/adapters/qwen";
import { createSandbox, readSandboxFile, writeSandboxFile } from "@/lib/adapters/daytona";
import { emptyCodex, parseCodex } from "@/lib/codex";
import { SANDBOX, CODEX_PATH, SHOP_PATH } from "@/lib/sandboxPaths";
import { setCachedShopHtml } from "@/lib/shopCache";

export async function POST() {
  const sandboxId = await createSandbox(SANDBOX);
  const raw = await readSandboxFile(sandboxId, CODEX_PATH);
  const codex = raw ? parseCodex(raw) : emptyCodex();

  const html = await qwenChat([
    {
      role: "system",
      content: `You generate ONE self-contained bilingual (Japanese + English) HTML shop storefront page from a JSON shop codex. Output ONLY raw HTML (a full <html> document with inline <style>, no external resources, no markdown fences). Show the shop name, story, owner greeting, and a product list with JA name, EN gloss, and price in yen. Keep it simple, warm, readable. Use serif headings for Japanese text.`,
    },
    { role: "user", content: JSON.stringify(codex) },
  ]);

  const cleaned = html
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  await writeSandboxFile(sandboxId, SHOP_PATH, cleaned);
  setCachedShopHtml(cleaned);

  return NextResponse.json({ ok: true });
}
