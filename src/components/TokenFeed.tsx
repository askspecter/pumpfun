"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { coinLink, profileLink, type LaunchChain } from "@/lib/solana";
import { BrandLogo } from "./BrandLogo";
import { OfficialCoin } from "./OfficialCoin";
import { OFFICIAL_TOKEN } from "@/lib/site";

/** A profile coin launched through NOIR (from /api/launches). */
interface LaunchItem {
  chain?: LaunchChain;
  source?: "fomo" | "pumpfun";
  token: string;
  name: string;
  symbol: string;
  logo: string;
  handle?: string;
  deployer: string;
  createdAt: number;
}

interface McInfo {
  /** Native-denominated market cap: ETH on Robinhood, SOL on Solana. */
  native: number;
  unit: "ETH" | "SOL";
  usd: number | null;
}

/** Feed keys: EVM addresses are case-insensitive, Solana mints are not. */
const mcKey = (it: { chain?: LaunchChain; token: string }) => (it.chain === "solana" ? it.token : it.token.toLowerCase());

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

function ago(ts: number): string {
  if (!ts) return "";
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtMc(m: McInfo): string {
  if (m.usd != null && m.usd > 0) {
    const n = m.usd;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  const e = m.native;
  if (e >= 1000) return `${(e / 1000).toFixed(1)}K ${m.unit}`;
  if (e >= 1) return `${e.toFixed(2)} ${m.unit}`;
  return `${e.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} ${m.unit}`;
}

/**
 * Live feed of profile coins launched through NOIR. Refreshes on an interval
 * and ranks by market cap, so a coin that gets bought rises up the list.
 */
export function TokenFeed({ limit = 48 }: { limit?: number }) {
  const [items, setItems] = useState<LaunchItem[] | null>(null);
  const [mcaps, setMcaps] = useState<Record<string, McInfo>>({});

  // Poll the launch list.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/launches?limit=${limit}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && setItems(d.items ?? []))
        .catch(() => !cancelled && setItems((prev) => prev ?? []));
    load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [limit]);

  // Poll market caps for the listed tokens (best-effort, one batched request).
  useEffect(() => {
    if (!items || items.length === 0) return;
    let cancelled = false;
    // Robinhood coins are priced by the Pons readers, Solana coins from their
    // Pump.fun bonding curves.
    const evm = items.filter((i) => (i.chain ?? "robinhood") === "robinhood").map((i) => i.token);
    const sol = items.filter((i) => i.chain === "solana").map((i) => i.token);
    type Rows = Record<string, { marketCapEth?: number; marketCapSol?: number; marketCapUsd: number | null }>;
    const get = (url: string): Promise<Rows> =>
      fetch(url, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => (d.prices ?? {}) as Rows)
        .catch(() => ({}));
    const none: Promise<Rows> = Promise.resolve({});
    const load = () =>
      Promise.all([
        evm.length ? get(`/api/v2/prices?tokens=${evm.join(",")}`) : none,
        sol.length ? get(`/api/pumpfun/prices?mints=${sol.join(",")}`) : none,
      ]).then(([e, s]) => {
        if (cancelled) return;
        const next: Record<string, McInfo> = {};
        for (const [k, v] of Object.entries(e)) {
          if (typeof v?.marketCapEth === "number") next[k.toLowerCase()] = { native: v.marketCapEth, unit: "ETH", usd: v.marketCapUsd ?? null };
        }
        for (const [k, v] of Object.entries(s)) {
          if (typeof v?.marketCapSol === "number") next[k] = { native: v.marketCapSol, unit: "SOL", usd: v.marketCapUsd ?? null };
        }
        setMcaps(next);
      });
    load();
    const id = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [items]);

  // Rank by market cap (bought coins rise); unpriced new coins fall in by recency.
  const ranked = useMemo(() => {
    if (!items) return null;
    // The official coin is pinned above the feed, so it isn't listed twice.
    return items.filter((i) => i.token.toLowerCase() !== OFFICIAL_TOKEN.address.toLowerCase()).sort((a, b) => {
      // Rank by USD so ETH and SOL coins compare fairly.
      const ma = mcaps[mcKey(a)]?.usd;
      const mb = mcaps[mcKey(b)]?.usd;
      if (ma != null && mb != null) return mb - ma;
      if (ma != null) return -1;
      if (mb != null) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [items, mcaps]);

  return (
    <div className="space-y-4">
      <OfficialCoin />
      <FeedBody ranked={ranked} mcaps={mcaps} />
    </div>
  );
}

function FeedBody({ ranked, mcaps }: { ranked: LaunchItem[] | null; mcaps: Record<string, McInfo> }) {
  if (ranked === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (ranked.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-zinc-600">No profiles launched on NOIR yet. Be the first.</p>
        <Link href="/create" className="btn-brand mt-4 inline-flex">Launch my profile →</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ranked.map((it, rank) => {
        const mc = mcaps[mcKey(it)];
        const link = coinLink(it);
        const solana = it.chain === "solana";
        return (
          <div key={it.token} className="card card-hover flex flex-col p-4 transition-all duration-500">
            <Link
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="flex items-center gap-3"
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-line bg-white">
                {it.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.logo} alt={it.symbol ?? "token"} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg">🫥</span>
                )}
                {rank < 3 && (
                  <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                    {rank + 1}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-zinc-900">{it.name || short(it.token)}</div>
                {it.symbol && <div className="font-mono text-xs text-pink">${it.symbol}</div>}
              </div>
              <BrandLogo brand={solana ? "solana" : "robinhood"} className="h-6 w-6 rounded-full" />
              {mc && (
                <div className="shrink-0 text-right">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">MC</div>
                  <div className="text-sm font-bold text-zinc-900">{fmtMc(mc)}</div>
                </div>
              )}
            </Link>

            <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
              {it.handle ? (
                <a
                  href={profileLink(it.handle, it.source)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 items-center gap-1.5 truncate font-medium text-pink hover:underline"
                  title={it.source === "pumpfun" ? "Pump.fun profile" : "fomo.family profile"}
                >
                  <BrandLogo brand={it.source === "pumpfun" ? "pumpfun" : "fomo"} className="h-4 w-4 rounded-full" />
                  @{it.handle.replace(/^@+/, "")}
                </a>
              ) : (
                <span className="font-mono">by {short(it.deployer)}</span>
              )}
              <span>{ago(it.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
