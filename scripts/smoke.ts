import { readFileSync, existsSync } from "fs";
import { join } from "path";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

type Result = { sponsor: string; status: "PASS" | "FAIL"; detail: string };
const results: Result[] = [];

async function run(sponsor: string, fn: () => Promise<string>) {
  try {
    const detail = await fn();
    results.push({ sponsor, status: "PASS", detail });
  } catch (err) {
    results.push({ sponsor, status: "FAIL", detail: (err as Error).message });
  }
}

async function main() {
  const { qwenChat } = await import("../lib/adapters/qwen");
  const { gmiChat, gmiVision } = await import("../lib/adapters/gmi");
  const { aiandChat } = await import("../lib/adapters/aiand");
  const { transcribeAudio } = await import("../lib/adapters/nosana");
  const { createSandbox, writeSandboxFile, readSandboxFile, execInSandbox, STATE_FALLBACK } =
    await import("../lib/adapters/daytona");

  await run("Qwen", async () => {
    const reply = await qwenChat([{ role: "user", content: "Reply with the single word PASS" }]);
    return `qwen-plus replied: "${reply.trim()}"`;
  });

  await run("GMI Cloud", async () => {
    const chat = await gmiChat([{ role: "user", content: "Reply with the single word PASS" }]);
    const pixel =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const vision = await gmiVision(pixel, "What color is this image? One word.");
    return `chat: "${chat.trim()}" | vision: "${vision.trim()}"`;
  });

  await run("Daytona", async () => {
    const label = `smoke-test-${process.pid}`;
    const id = await createSandbox(label);
    try {
      await writeSandboxFile(id, "smoke.txt", "hello from smoke test");
      const content = await readSandboxFile(id, "smoke.txt");
      const execOut = await execInSandbox(id, "echo hi");
      if (content !== "hello from smoke test") {
        throw new Error(`round-trip file mismatch: got "${content}"`);
      }
      return STATE_FALLBACK
        ? `fallback to in-memory (sandbox id: ${id}, exec: "${execOut.trim()}")`
        : `sandbox ${id} created, file round-tripped, exec: "${execOut.trim()}"`;
    } finally {
      if (!STATE_FALLBACK) {
        const { Daytona } = await import("@daytonaio/sdk");
        const client = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
        const sandbox = await client.get(id);
        await client.delete(sandbox, 60, true);
      }
    }
  });

  await run("Nosana", async () => {
    if (!process.env.NOSANA_WHISPER_URL) {
      throw new Error("NOSANA_WHISPER_URL not set — Whisper GPU job not deployed yet");
    }
    const buf = Buffer.from("fake audio bytes");
    const text = await transcribeAudio(buf, "smoke.wav");
    if (text.startsWith("[transcription failed")) throw new Error(text);
    return `transcribed: "${text.trim()}"`;
  });

  await run("ai&", async () => {
    const reply = await aiandChat([{ role: "user", content: "Reply with the single word PASS" }]);
    return `ai& replied: "${reply.trim()}"`;
  });

  const width = Math.max(...results.map((r) => r.sponsor.length), "Sponsor".length);
  const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - s.length));

  console.log("");
  console.log(`${pad("Sponsor", width)} | Status | Detail`);
  console.log(`${"-".repeat(width)}-|--------|${"-".repeat(40)}`);
  for (const r of results) {
    console.log(`${pad(r.sponsor, width)} | ${r.status}   | ${r.detail}`);
  }
  console.log("");

  const failed = results.filter((r) => r.status === "FAIL").length;
  if (failed > 0) process.exitCode = 1;
}

main();
