import { gmiChat } from "@/lib/adapters/gmi";

export async function transcribeViaNosana(buf: Buffer, filename: string): Promise<string> {
  const url = process.env.NOSANA_WHISPER_URL;
  if (!url) throw new Error("NOSANA_WHISPER_URL is not configured");

  const form = new FormData();
  form.append("model", "whisper");
  form.append(
    "file",
    new Blob([new Uint8Array(buf)]),
    filename
  );

  const res = await fetch(`${url}/v1/audio/transcriptions`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Nosana Whisper error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.text ?? "";
}

async function transcribeViaGmiFallback(): Promise<string> {
  // GMI Cloud has no whisper/audio-transcription model available at time of writing;
  // this call exists so a future audio-capable model just needs a model id here.
  return gmiChat([
    {
      role: "system",
      content:
        "You are a fallback transcription notice. GMI has no audio model configured.",
    },
    { role: "user", content: "audio fallback unavailable" },
  ]);
}

export async function transcribeAudio(buf: Buffer, filename: string): Promise<string> {
  try {
    return await transcribeViaNosana(buf, filename);
  } catch (nosanaError) {
    try {
      return await transcribeViaGmiFallback();
    } catch (gmiError) {
      return `[transcription failed: ${(nosanaError as Error).message}; fallback: ${(gmiError as Error).message}]`;
    }
  }
}
