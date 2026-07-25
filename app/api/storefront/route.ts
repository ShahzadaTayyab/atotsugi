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
      content: `You generate ONE self-contained, single-file bilingual (Japanese + English) HTML shop storefront page from a JSON shop codex. Output ONLY raw HTML (a full <html> document with inline <style>, no external resources, no markdown fences). Design tokens to follow exactly: page background ink #1C1B18, content panels washi #EDE6D6 (dark ink text on washi), indigo #23395B for accents/borders/dividers, no gradients, no purple, no glassmorphism. Headings: a serif "mincho" font stack (e.g. "Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif) with generous letter-spacing for large Japanese characters; body text a clean Japanese-capable sans-serif (e.g. "Noto Sans JP", sans-serif). Show the shop name, story, owner greeting, and a product list with JA name and EN gloss displayed SIDE BY SIDE (JA prominent, EN as a smaller subtitle beside or beneath each), plus price in yen. Use generous spacing/padding between sections. The overall feel should be solemn and crafted, like aged washi paper and sumi ink — not a generic SaaS page.`,
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
