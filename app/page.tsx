"use client";

import { useState } from "react";
import type { ShopCodex } from "@/lib/codex";
import { emptyCodex } from "@/lib/codex";
import type { LedgerEntry } from "@/lib/ledger";

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

type ChatResponse = {
  reply: string;
  ledger: LedgerEntry[];
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

  const [storefrontLoading, setStorefrontLoading] = useState(false);
  const [storefrontError, setStorefrontError] = useState<string | null>(null);
  const [storefrontReady, setStorefrontReady] = useState(false);

  async function buildStorefront() {
    setStorefrontError(null);
    setStorefrontLoading(true);
    try {
      const res = await fetch("/api/storefront", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Storefront build failed.");
      setStorefrontReady(true);
    } catch (err) {
      setStorefrontError((err as Error).message);
    } finally {
      setStorefrontLoading(false);
    }
  }

  const [chatMode, setChatMode] = useState<"customer" | "successor">("customer");
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ mode: string; message: string; reply: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  async function sendChat() {
    if (!chatInput.trim()) return;
    setChatError(null);
    setChatLoading(true);
    const message = chatInput.trim();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mode: chatMode }),
      });
      const data: ChatResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed.");
      setChatLog((prev) => [...prev, { mode: chatMode, message, reply: data.reply }]);
      setLedger(data.ledger);
      setChatInput("");
    } catch (err) {
      setChatError((err as Error).message);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="badges-row">
        {badges?.processedBy === "aiand" && <span className="badge badge-hanko">日本国内</span>}
        {badges?.processedBy === "qwen-fallback" && (
          <span className="badge badge-amber">fallback: Qwen</span>
        )}
        {badges?.stateFallback && <span className="badge badge-amber">state: in-memory</span>}
      </div>

      <div className="columns">
        <section className="panel panel-left">
          <h2 className="jp-heading">
            <span className="heading-ja">相続</span>
            <span className="heading-en">Inheritance</span>
          </h2>

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
          <h2 className="jp-heading">
            <span className="heading-ja">跡継ぎ</span>
            <span className="heading-en">The Heirs</span>
          </h2>
          <button onClick={buildStorefront} disabled={storefrontLoading} className="btn-primary">
            {storefrontLoading ? "生成中… building…" : "店を作る — Build Storefront"}
          </button>
          {storefrontError && <p className="error-text">{storefrontError}</p>}
          {storefrontReady && (
            <p>
              <a href="/shop" target="_blank" rel="noreferrer" className="shop-link">
                /shop を開く — open the shop →
              </a>
            </p>
          )}
          {isCodexEmpty && (
            <p className="empty-state">codexを先に作成してください — build the codex first (left).</p>
          )}
        </section>

        <section className="panel panel-right">
          <h2 className="jp-heading">
            <span className="heading-ja">店は生きる</span>
            <span className="heading-en">The Shop Lives</span>
          </h2>

          <div className="mode-toggle">
            <button
              className={chatMode === "customer" ? "mode-btn mode-active" : "mode-btn"}
              onClick={() => setChatMode("customer")}
            >
              客 Customer
            </button>
            <button
              className={chatMode === "successor" ? "mode-btn mode-active" : "mode-btn"}
              onClick={() => setChatMode("successor")}
            >
              弟子 Successor
            </button>
          </div>

          <ul className="chat-log">
            {chatLog.map((entry, i) => (
              <li key={i}>
                <p className="chat-you">
                  <strong>{entry.mode === "customer" ? "客" : "弟子"}:</strong> {entry.message}
                </p>
                <p className="chat-reply">{entry.reply}</p>
              </li>
            ))}
          </ul>

          <div className="field-group">
            <textarea
              rows={2}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                chatMode === "customer"
                  ? "例: Hello! Can I order 2 boxes of the kombu tsukudani?"
                  : "例: How do I know when the kombu is done?"
              }
              disabled={chatLoading}
            />
          </div>
          <button onClick={sendChat} disabled={chatLoading} className="btn-primary">
            {chatLoading ? "…" : "送信 — send"}
          </button>
          {chatError && <p className="error-text">{chatError}</p>}

          <h3 className="jp-heading">台帳 Ledger</h3>
          {ledger.length === 0 ? (
            <p className="empty-state">まだ注文はありません — no orders yet.</p>
          ) : (
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>item</th>
                  <th>qty</th>
                  <th>ts</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry, i) => (
                  <tr key={i}>
                    <td>{entry.item}</td>
                    <td>{entry.qty}</td>
                    <td>{new Date(entry.ts).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
