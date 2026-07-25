import { createSandbox, readSandboxFile } from "@/lib/adapters/daytona";
import { SANDBOX, SHOP_PATH } from "@/lib/sandboxPaths";
import { cachedShopHtml, setCachedShopHtml } from "@/lib/shopCache";

export const dynamic = "force-dynamic";

export async function GET() {
  let html = cachedShopHtml;
  if (!html) {
    const sandboxId = await createSandbox(SANDBOX);
    html = await readSandboxFile(sandboxId, SHOP_PATH);
    if (html) setCachedShopHtml(html);
  }

  if (!html) {
    html =
      "<html><body style='font-family:sans-serif;padding:40px'><p>店はまだ準備中です — the shop isn't built yet. Use [Build Storefront] first.</p></body></html>";
  }

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
