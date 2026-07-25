import {
  Daytona,
  DaytonaConflictError,
  DaytonaNotFoundError,
  type Sandbox,
} from "@daytonaio/sdk";

export let STATE_FALLBACK = false;

const memoryFiles = new Map<string, string>();
const memorySandboxIds = new Set<string>();

let client: Daytona | null = null;
function getClient(): Daytona {
  if (!client) {
    const apiKey = process.env.DAYTONA_API_KEY;
    if (!apiKey) throw new Error("DAYTONA_API_KEY is not configured");
    client = new Daytona({ apiKey });
  }
  return client;
}

function fallbackToMemory(label: string): string {
  STATE_FALLBACK = true;
  const id = `mem-${label}`;
  memorySandboxIds.add(id);
  return id;
}

export async function createSandbox(label: string): Promise<string> {
  try {
    const sandbox: Sandbox = await getClient().create({
      name: label,
      labels: { role: label },
    });
    await sandbox.waitUntilStarted(60);
    return sandbox.id;
  } catch (err) {
    if (err instanceof DaytonaConflictError) {
      try {
        const existing = await getClient().get(label);
        await existing.waitUntilStarted(60);
        return existing.id;
      } catch (getErr) {
        console.warn(`Daytona: failed to reuse existing sandbox "${label}", falling back to memory:`, getErr);
        return fallbackToMemory(label);
      }
    }
    console.warn(`Daytona createSandbox failed for "${label}", falling back to memory:`, err);
    return fallbackToMemory(label);
  }
}

export async function writeSandboxFile(
  id: string,
  path: string,
  content: string
): Promise<void> {
  if (STATE_FALLBACK || memorySandboxIds.has(id)) {
    memoryFiles.set(`${id}:${path}`, content);
    return;
  }
  try {
    const sandbox = await getClient().get(id);
    await sandbox.fs.uploadFile(Buffer.from(content), path);
  } catch (err) {
    console.warn(`Daytona writeSandboxFile failed for "${id}:${path}", falling back to memory:`, err);
    STATE_FALLBACK = true;
    memoryFiles.set(`${id}:${path}`, content);
  }
}

export async function readSandboxFile(id: string, path: string): Promise<string> {
  if (STATE_FALLBACK || memorySandboxIds.has(id)) {
    return memoryFiles.get(`${id}:${path}`) ?? "";
  }
  try {
    const sandbox = await getClient().get(id);
    const buf = await sandbox.fs.downloadFile(path);
    return buf.toString("utf-8");
  } catch (err) {
    if (err instanceof DaytonaNotFoundError) {
      return "";
    }
    console.warn(`Daytona readSandboxFile failed for "${id}:${path}", falling back to memory:`, err);
    STATE_FALLBACK = true;
    return memoryFiles.get(`${id}:${path}`) ?? "";
  }
}

export async function execInSandbox(id: string, cmd: string): Promise<string> {
  if (STATE_FALLBACK || memorySandboxIds.has(id)) {
    return `[state: in-memory] exec skipped for: ${cmd}`;
  }
  try {
    const sandbox = await getClient().get(id);
    const res = await sandbox.process.executeCommand(cmd);
    return res.result ?? "";
  } catch (err) {
    console.warn(`Daytona execInSandbox failed for "${id}", falling back to memory:`, err);
    STATE_FALLBACK = true;
    return `[state: in-memory] exec skipped for: ${cmd}`;
  }
}
