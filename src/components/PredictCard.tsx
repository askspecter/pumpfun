"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { callMessage, type Call, type Chain, type Side } from "@/lib/predict-shared";
import { WalletButton } from "./WalletButton";
import { SolanaWalletButton } from "./SolanaWalletButton";

interface RoundState {
  round: number;
  endsAt: number;
  locked: boolean;
  mc: number | null;
  tally: { up: number; down: number };
  mine: Call | null;
  stats: { points: number; calls: number; wins: number } | null;
  last: { round: number; endMc: number; winners: number; players: number } | null;
  error?: string;
}

function money(n: number | null | undefined): string {
  if (n == null || !(n > 0)) return "—";
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function left(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
}

/**
 * NOIR Predict: call whether this coin's market cap ends today's round higher
 * or lower than right now. Signed by the wallet, points only, no funds move.
 */
export function PredictCard({ chain, token, symbol }: { chain: Chain; token: string; symbol: string }) {
  const evm = useAccount();
  const { signMessageAsync } = useSignMessage();
  const sol = useWallet();
  const address = chain === "solana" ? sol.publicKey?.toBase58() ?? null : evm.address ?? null;

  const [state, setState] = useState<RoundState | null>(null);
  const [busy, setBusy] = useState<Side | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(() => {
    const q = new URLSearchParams({ chain, token, ...(address ? { address } : {}) });
    fetch(`/api/predict?${q}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: RoundState) => {
        if (d.error || !d.tally) setErr(d.error ?? "Predictions aren't available right now.");
        else setState(d);
      })
      .catch(() => {});
  }, [chain, token, address]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function call(side: Side) {
    if (!address || !state) return;
    setErr(null);
    setBusy(side);
    try {
      const message = callMessage(chain, token, state.round, side);
      let signature: string;
      if (chain === "solana") {
        if (!sol.signMessage) throw new Error("This wallet can't sign messages.");
        const sig = await sol.signMessage(new TextEncoder().encode(message));
        signature = btoa(String.fromCharCode(...sig));
      } else {
        signature = await signMessageAsync({ message });
      }
      const r = await fetch("/api/predict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chain, token, side, address, signature, round: state.round }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Couldn't place your call.");
      load();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Couldn't place your call.";
      setErr(/reject|denied|cancel/i.test(m) ? "You cancelled the signature." : m);
    } finally {
      setBusy(null);
    }
  }

  const total = state ? state.tally.up + state.tally.down : 0;
  const upPct = total > 0 ? Math.round((state!.tally.up / total) * 100) : 50;
  const mine = state?.mine;
  const live = state?.mc ?? null;
  const winning = mine && live ? (mine.side === "up" ? live > mine.mc : live < mine.mc) : null;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-900">Predict</h2>
        <span className="chip">points · no funds</span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        Will <span className="font-mono text-zinc-900">${symbol}</span>&apos;s market cap end today&apos;s round higher than right now?
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-500">
        <div>
          Market cap now
          <div className="mt-0.5 font-mono text-base font-semibold text-zinc-900">{money(live)}</div>
        </div>
        <div className="text-right">
          {state?.locked ? "Calls closed · settles in" : "Round ends in"}
          <div className="mt-0.5 font-mono text-base font-semibold text-zinc-900">{state ? left(state.endsAt - now) : "—"}</div>
        </div>
      </div>

      {/* crowd */}
      <div className="mt-4">
        <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full bg-up transition-all" style={{ width: `${upPct}%` }} />
          <div className="h-full flex-1 bg-down/80" />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
          <span>▲ Up {state?.tally.up ?? 0}</span>
          <span>{state?.tally.down ?? 0} Down ▼</span>
        </div>
      </div>

      <div className="mt-4">
        {!address ? (
          chain === "solana" ? <SolanaWalletButton className="btn-brand w-full" /> : <WalletButton />
        ) : mine ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Your call</span>
              <span className={`font-semibold ${mine.side === "up" ? "text-up" : "text-down"}`}>{mine.side === "up" ? "▲ Up" : "▼ Down"}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
              <span>from {money(mine.mc)}</span>
              {winning !== null && <span className={winning ? "text-up" : "text-down"}>{winning ? "winning right now" : "losing right now"}</span>}
            </div>
          </div>
        ) : state?.locked ? (
          <p className="text-xs text-zinc-500">Calls are closed for the final hour. The next round opens at midnight UTC.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => call("up")} disabled={!!busy || !live} className="rounded-xl bg-up py-3 text-sm font-bold text-[#03130b] transition disabled:opacity-40">
              {busy === "up" ? "Sign in wallet…" : "▲ Up"}
            </button>
            <button onClick={() => call("down")} disabled={!!busy || !live} className="rounded-xl bg-down py-3 text-sm font-bold text-white transition disabled:opacity-40">
              {busy === "down" ? "Sign in wallet…" : "▼ Down"}
            </button>
          </div>
        )}
        {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        {state?.stats ? (
          <span>
            You: <span className="font-semibold text-zinc-900">{state.stats.points} pts</span> · {state.stats.wins}/{state.stats.calls} right
          </span>
        ) : (
          <span>+10 points for every right call</span>
        )}
        {state?.last && <span>Last round: {state.last.winners}/{state.last.players} called it</span>}
        <Link href="/leaderboard#predictors" className="hover:text-white">Leaderboard →</Link>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">
        A free game for fun. Your wallet signs a message (no gas, no funds). Points have no cash value.
      </p>
    </section>
  );
}
