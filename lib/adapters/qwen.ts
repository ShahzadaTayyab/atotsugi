import type { Msg } from "@/lib/types";
import { stripJsonFences } from "@/lib/json";

const BASE_URL =
  process.env.QWEN_BASE_URL ||
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const MODEL = process.env.QWEN_MODEL || "qwen-plus";

export async function qwenChat(messages: Msg[], json = false): Promise<string> {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) throw new Error("QWEN_API_KEY is not configured");

  const finalMessages = json
    ? [
        {
          role: "system" as const,
          content:
            "Respond with ONLY raw JSON. No prose, no explanation, no markdown code fences.",
        },
        ...messages,
      ]
    : messages;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: finalMessages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Qwen API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  return json ? stripJsonFences(content) : content;
}
