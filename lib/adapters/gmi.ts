import type { Msg } from "@/lib/types";

const BASE_URL = process.env.GMI_BASE_URL || "https://api.gmi-serving.com/v1";
const CHAT_MODEL = process.env.GMI_CHAT_MODEL || "deepseek-ai/DeepSeek-V3-0324";
const VISION_MODEL = process.env.GMI_VISION_MODEL || "google/gemini-3.5-flash";

function requireKey(): string {
  const apiKey = process.env.GMI_API_KEY;
  if (!apiKey) throw new Error("GMI_API_KEY is not configured");
  return apiKey;
}

async function chatCompletion(body: object): Promise<string> {
  const apiKey = requireKey();
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }

    lastError = `GMI API error ${res.status}: ${await res.text()}`;
    if (res.status === 429 && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      continue;
    }
    break;
  }

  throw new Error(lastError);
}

export async function gmiChat(messages: Msg[]): Promise<string> {
  return chatCompletion({ model: CHAT_MODEL, messages });
}

export async function gmiVision(imageB64: string, prompt: string): Promise<string> {
  const dataUrl = imageB64.startsWith("data:")
    ? imageB64
    : `data:image/jpeg;base64,${imageB64}`;

  return chatCompletion({
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });
}
