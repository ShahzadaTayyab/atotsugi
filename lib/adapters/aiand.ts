import type { Msg } from "@/lib/types";

export class NotConfigured extends Error {
  constructor() {
    super("ai& is not configured (missing AIAND_BASE_URL or AIAND_API_KEY)");
    this.name = "NotConfigured";
  }
}

export async function aiandChat(messages: Msg[]): Promise<string> {
  const baseUrl = process.env.AIAND_BASE_URL;
  const apiKey = process.env.AIAND_API_KEY;
  if (!baseUrl || !apiKey) throw new NotConfigured();

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ai& API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
