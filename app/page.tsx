"use client";

import { useState } from "react";
import type { ShopCodex } from "@/lib/codex";
import { emptyCodex } from "@/lib/codex";

type TranscriptEntry = {
  transcript: string;
  processedBy: "aiand" | "qwen-fallback";
};

type IngestResponse = {
  codex: ShopCodex;
  transcript: string;
  processedBy: "aiand" | "qwen-fallback";
  stateFallback: boolean;
  error?: string;
};

function CodexNode({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="codex-empty">—</span>;
    return (
      <ul className="codex-list">
        {value.map((item, i) => (
          <li key={i}>
            {typeof item === "object" && item !== null ? (
              <CodexNode value={item} />
            ) : (
              String(item)
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object" && value !== null) {
    return (
      <ul className="codex-list">
        {Object.entries(value as Record<string, unknown>).map(([key, val]) => (
          <li key={key}>
            <span className="codex-key">{key}</span>
            {typeof val === "object" && val !== null ? (
              <CodexNode value={val} />
            ) : (
              <span className="codex-val"> {String(val) || "—"}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }
  return <span className="codex-val">{String(value)}</span>;
}

export default function Home() {
  const [codex, setCodex] = useState<ShopCodex>(emptyCodex());
  const [feed, setFeed] = useState<TranscriptEntry[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badges, setBadges] = useState<{ processedBy: string; stateFallback: boolean } | null>(
    null
  );

  async function submitIngest() {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      if (audioFile) {
        form.append("audio", audioFile);
      } else if (transcriptText.trim()) {
        form.append("transcript", transcriptText.trim());
      } else {
        setError("音声をアップロード、または書き起こしを貼り付けてください — upload audio or paste a transcript.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/ingest", { method: "POST", body: form });
      const data: IngestResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Ingest failed.");
        return;
      }

      setCodex(data.codex);
      setFeed((prev) => [{ transcript: data.transcript, processedBy: data.processedBy }, ...prev]);
      setBadges({ processedBy: data.processedBy, stateFallback: data.stateFallback });
      setAudioFile(null);
      setTranscriptText("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const isCodexEmpty =
    !codex.shop.name && codex.products.length === 0 && codex.methods.length === 0;

  return (
    <main className="app-shell">
      <div className="badges-row">
        {badges?.processedBy === "aiand" && (
          <span className="badge badge-green">処理は日本国内 processed in Japan</span>
        )}
        {badges?.processedBy === "qwen-fallback" && (
          <span className="badge badge-amber">fallback: Qwen</span>
        )}
        {badges?.stateFallback && <span className="badge badge-amber">state: in-memory</span>}
      </div>

      <div className="columns">
        <section className="panel panel-left">
          <h2 className="jp-heading">相続 Inheritance</h2>

          <div className="field-group">
            <label className="field-label">音声ファイル — audio file</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              disabled={loading}
            />
          </div>

          <div className="field-group">
            <label className="field-label">
              または書き起こしを貼り付け — or paste a transcript instead
            </label>
            <textarea
              rows={4}
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="店主の話をここに貼り付けてください..."
              disabled={loading || !!audioFile}
            />
          </div>

          <button onClick={submitIngest} disabled={loading} className="btn-primary">
            {loading ? "処理中… processing…" : "codexに取り込む — ingest"}
          </button>

          {error && <p className="error-text">{error}</p>}

          <h3 className="jp-heading">書き起こし — Transcripts</h3>
          {feed.length === 0 ? (
            <p className="empty-state">まだありません — no transcripts yet.</p>
          ) : (
            <ul className="transcript-feed">
              {feed.map((entry, i) => (
                <li key={i}>
                  <span className="transcript-tag">{entry.processedBy}</span> {entry.transcript}
                </li>
              ))}
            </ul>
          )}

          <h3 className="jp-heading">codex</h3>
          {isCodexEmpty ? (
            <p className="empty-state">
              音声をアップロード — upload the owner&apos;s voice to begin.
            </p>
          ) : (
            <div className="codex-tree">
              <CodexNode value={codex} />
            </div>
          )}
        </section>

        <section className="panel panel-mid">
          <h2 className="jp-heading">跡継ぎ The Heirs</h2>
          <p className="empty-state">Heir sandboxes boot in the next step.</p>
        </section>

        <section className="panel panel-right">
          <h2 className="jp-heading">店は生きる The Shop Lives</h2>
          <p className="empty-state">Customer and successor chat arrive in a later step.</p>
        </section>
      </div>
    </main>
  );
}
