"use client";

import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/**
 * AI Twin: chat with an AI persona inspired by the public profile behind a
 * coin. Answered by /api/twin (Bankr LLM Gateway). Clearly labelled as an AI
 * simulation, never the real person, and never financial advice.
 */
export function TwinChat({
  chain,
  token,
  name,
  symbol,
  handle,
  avatar,
  description,
}: {
  chain: "robinhood" | "solana";
  token: string;
  name: string;
  symbol: string;
  handle?: string | null;
  avatar?: string | null;
  description?: string | null;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  // The profile handle lives on our launch record; look it up if the page didn't pass it.
  const [found, setFound] = useState<string | null>(null);
  useEffect(() => {
    if (handle) return;
    fetch(`/api/launches?token=${token}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { item?: { handle?: string } | null }) => setFound(d.item?.handle ?? null))
      .catch(() => {});
  }, [handle, token]);
  const h = (handle || found)?.replace(/^@+/, "");
  const who = h ? `@${h}` : name;

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(content: string) {
    const body = content.trim();
    if (!body || busy) return;
    const next = [...msgs, { role: "user" as const, content: body }];
    setMsgs(next);
    setText("");
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/twin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chain, token, name, symbol, description: description ?? "", messages: next }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "The twin couldn't answer.");
      setMsgs((m) => [...m, { role: "assistant", content: d.reply }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The twin couldn't answer.");
    } finally {
      setBusy(false);
    }
  }

  const prompts = ["Who are you?", `What's the vibe of $${symbol}?`, "Give me a hot take"];

  return (
    <section className="card p-5">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm">✦</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-bold text-zinc-900">{who} · AI Twin</h2>
            <span className="chip">beta</span>
          </div>
          <p className="text-[11px] text-zinc-500">An AI simulation inspired by public profile info. Not the real person.</p>
        </div>
      </div>

      <div ref={box} className="mt-4 max-h-80 min-h-[120px] space-y-2 overflow-y-auto pr-1">
        {msgs.length === 0 && !busy && (
          <div className="flex flex-wrap gap-2">
            {prompts.map((p) => (
              <button key={p} onClick={() => send(p)} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-600 transition hover:text-white">
                {p}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                m.role === "user" ? "bg-[#ffffff] text-black" : "border border-white/10 bg-white/[0.04] text-zinc-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-zinc-500">
              <span className="animate-pulse">{who} is typing…</span>
            </div>
          </div>
        )}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 600))}
          placeholder={`Ask ${who}'s twin anything…`}
          className="field flex-1"
        />
        <button type="submit" disabled={busy || !text.trim()} className="btn-brand !px-4">
          Send
        </button>
      </form>
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      <p className="mt-2 text-[10px] text-zinc-400">Powered by Bankr LLM. Not financial advice. Don&apos;t share private keys or seed phrases.</p>
    </section>
  );
}
