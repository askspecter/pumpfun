"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { coinLink } from "@/lib/solana";
import { BrandLogo } from "@/components/BrandLogo";
import { ProfileAvatar } from "@/components/home/ProfileAvatar";
import { MarketTicker } from "@/components/markets/MarketTicker";
import { PairChip, VerifiedBadge } from "@/components/markets/Badges";
import { fmtPct, fmtUsd, pctClass, useMarket, type MarketItem } from "@/components/markets/useMarket";

type Tab = "top" | "gainers" | "losers" | "new" | "verified" | "stocks" | "watchlist";

const TABS: { id: Tab; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "gainers", label: "Gainers" },
  { id: "losers", label: "Losers" },
  { id: "new", label: "New" },
  { id: "verified", label: "Verified" },
  { id: "stocks", label: "Stock-paired" },
  { id: "watchlist", label: "★ Watchlist" },
];

const WATCH_KEY = "noir.watchlist";

/** Watchlist kept in this browser (best-effort: storage can be unavailable). */
function useWatchlist() {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(WATCH_KEY) ?? "[]");
      if (Array.isArray(raw)) setList(raw.filter((x): x is string => typeof x === "string"));
    } catch {
      // storage unavailable
    }
  }, []);
  const toggle = (token: string) =>
    setList((prev) => {
      const next = prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token];
      try {
        localStorage.setItem(WATCH_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable
      }
      return next;
    });
  return { list, toggle };
}

function byMc(a: MarketItem, b: MarketItem) {
  return (b.marketCapUsd ?? -1) - (a.marketCapUsd ?? -1) || b.createdAt - a.createdAt;
}

export default function MarketsPage() {
  const items = useMarket();
  const [tab, setTab] = useState<Tab>("top");
  const watch = useWatchlist();

  const stats = useMemo(() => {
    if (!items) return null;
    return {
      cap: items.reduce((n, i) => n + (i.marketCapUsd ?? 0), 0),
      coins: items.length,
      verified: items.filter((i) => i.verified === "verified").length,
      graduated: items.filter((i) => i.graduated).length,
    };
  }, [items]);

  const rows = useMemo(() => {
    if (!items) return null;
    const list = [...items];
    switch (tab) {
      case "gainers":
        return list.filter((i) => (i.change24h ?? 0) > 0).sort((a, b) => b.change24h! - a.change24h!);
      case "losers":
        return list.filter((i) => (i.change24h ?? 0) < 0).sort((a, b) => a.change24h! - b.change24h!);
      case "new":
        return list.sort((a, b) => b.createdAt - a.createdAt);
      case "verified":
        return list.filter((i) => i.verified === "verified").sort(byMc);
      case "stocks":
        return list.filter((i) => i.pair).sort(byMc);
      case "watchlist":
        return list.filter((i) => watch.list.includes(i.token)).sort(byMc);
      default:
        return list.sort(byMc);
    }
  }, [items, tab, watch.list]);

  const race = useMemo(
    () =>
      (items ?? [])
        .filter((i) => !i.graduated && i.progress != null)
        .sort((a, b) => b.progress! - a.progress!)
        .slice(0, 6),
    [items],
  );

  const stocks = useMemo(() => (items ?? []).filter((i) => i.pair).sort(byMc).slice(0, 5), [items]);

  return (
    <div className="pb-16">
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
        <div className="eyebrow">NOIR Markets</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
          The profile market<span className="text-zinc-500">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-zinc-600">
          Every creator coin launched on NOIR, live across Robinhood Chain and Solana. Verified creators,
          stock-paired profiles, and the race to graduation.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total market cap" value={stats ? fmtUsd(stats.cap) : "…"} />
          <Stat label="Profile coins" value={stats ? String(stats.coins) : "…"} />
          <Stat label="Verified creators" value={stats ? String(stats.verified) : "…"} accent />
          <Stat label="Graduated" value={stats ? String(stats.graduated) : "…"} />
        </div>
      </section>

      {items && items.length > 0 && (
        <div className="mt-8">
          <MarketTicker items={[...items].sort(byMc)} />
        </div>
      )}

      <section className="mx-auto mt-8 grid max-w-6xl gap-6 px-4 lg:grid-cols-[1fr,320px]">
        <div className="min-w-0">
          <div className="thin-scroll -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  tab === t.id ? "font-semibold" : "border border-white/10 text-zinc-500 hover:text-white"
                }`}
                style={tab === t.id ? { background: "#fff", color: "#08090a" } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="card mt-3 overflow-hidden">
            <div className="hidden grid-cols-[28px,1fr,110px,80px,110px] gap-3 border-b border-white/[0.06] py-2.5 pl-11 pr-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 sm:grid">
              <span>#</span>
              <span>Profile</span>
              <span className="text-right">Market cap</span>
              <span className="text-right">24h</span>
              <span className="text-right">Curve</span>
            </div>
            <MarketRows rows={rows} tab={tab} watch={watch} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Graduation race</h2>
              <span className="text-[11px] text-zinc-500">closest to DEX</span>
            </div>
            {items === null ? (
              <div className="mt-4 h-40 animate-pulse rounded-xl bg-white/[0.03]" />
            ) : race.length === 0 ? (
              <p className="mt-3 text-xs text-zinc-500">No coins on the curve right now.</p>
            ) : (
              <ol className="mt-4 space-y-3.5">
                {race.map((it, i) => (
                  <li key={it.token}>
                    <CoinLink item={it} className="block">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-3 font-mono text-zinc-500">{i + 1}</span>
                        <ProfileAvatar src={it.logo || null} name={it.symbol || "?"} className="h-5 w-5" />
                        <span className="truncate font-semibold text-white">${it.symbol}</span>
                        <VerifiedBadge verified={it.verified} compact />
                        <span className="ml-auto font-mono text-zinc-600">{(it.progress! * 100).toFixed(1)}%</span>
                      </div>
                      <div className="ml-5 mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(2, it.progress! * 100)}%`,
                            background: "linear-gradient(90deg,#9aa3ff,#2fe39a)",
                          }}
                        />
                      </div>
                    </CoinLink>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="card relative overflow-hidden p-5">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl"
              style={{ background: "rgba(124,140,255,0.25)" }}
            />
            <h2 className="text-sm font-semibold text-white">Stock-paired profiles</h2>
            <p className="mt-1.5 text-xs text-zinc-600">
              On Robinhood Chain a profile can trade against tokenized stocks, not just ETH. Pair your coin with
              NVDA, TSLA, AAPL and more.
            </p>
            {stocks.length > 0 && (
              <ul className="mt-4 space-y-2.5">
                {stocks.map((it) => (
                  <li key={it.token}>
                    <CoinLink item={it} className="flex items-center gap-2 text-xs">
                      <ProfileAvatar src={it.logo || null} name={it.symbol || "?"} className="h-5 w-5" />
                      <span className="truncate font-semibold text-white">${it.symbol}</span>
                      <span className="text-zinc-500">×</span>
                      <PairChip pair={it.pair} />
                      <span className="ml-auto font-mono text-zinc-600">{fmtUsd(it.marketCapUsd)}</span>
                    </CoinLink>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/create" className="btn-ghost mt-4 w-full">
              Launch a stock-paired profile →
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className={`mt-1 font-mono text-xl font-semibold ${accent ? "text-[#2fe39a]" : "text-white"}`}>{value}</div>
    </div>
  );
}

function CoinLink({ item, className, children }: { item: MarketItem; className?: string; children: React.ReactNode }) {
  const link = coinLink(item);
  return (
    <Link href={link.href} {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})} className={className}>
      {children}
    </Link>
  );
}

const EMPTY: Record<Tab, string> = {
  top: "No profiles launched on NOIR yet. Be the first.",
  gainers: "No gainers in the last 24h yet.",
  losers: "Nothing in the red. Nice.",
  new: "No profiles launched on NOIR yet.",
  verified: "No verified creators yet. Launch your own profile from your own wallet to get the badge.",
  stocks: "No stock-paired profiles yet. Be the first to pair with a stock.",
  watchlist: "Tap ☆ on any coin to add it to your watchlist.",
};

function MarketRows({
  rows,
  tab,
  watch,
}: {
  rows: MarketItem[] | null;
  tab: Tab;
  watch: { list: string[]; toggle: (t: string) => void };
}) {
  if (rows === null) {
    return (
      <div className="space-y-px">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse bg-white/[0.02]" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-zinc-500">{EMPTY[tab]}</p>;
  }

  return (
    <ul className="divide-y divide-white/[0.05]">
      {rows.map((it, i) => {
        const watched = watch.list.includes(it.token);
        return (
          <li key={it.token} className="flex items-center transition hover:bg-white/[0.025]">
            <button
              onClick={() => watch.toggle(it.token)}
              aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
              aria-pressed={watched}
              className={`flex h-10 w-11 shrink-0 items-center justify-center text-sm transition ${watched ? "text-amber-600" : "text-zinc-500 opacity-50 hover:opacity-100"}`}
            >
              {watched ? "★" : "☆"}
            </button>
            <CoinLink
              item={it}
              className="grid min-w-0 flex-1 grid-cols-[28px,1fr,auto] items-center gap-3 py-3 pr-4 sm:grid-cols-[28px,1fr,110px,80px,110px]"
            >
              <span className="font-mono text-xs text-zinc-500">{i + 1}</span>
              <div className="flex min-w-0 items-center gap-3">
                <ProfileAvatar src={it.logo || null} name={it.symbol || it.name || "?"} className="h-9 w-9" rounded="rounded-xl" />
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-white">{it.name || it.symbol}</span>
                    <VerifiedBadge verified={it.verified} compact />
                    <PairChip pair={it.pair} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <BrandLogo brand={it.chain === "solana" ? "solana" : "robinhood"} className="h-3 w-3 rounded-full" />
                    <span className="font-mono text-pink">${it.symbol}</span>
                    {it.handle && <span className="truncate">· @{it.handle}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right sm:contents">
                <div className="font-mono text-sm font-semibold text-white sm:text-right">{fmtUsd(it.marketCapUsd)}</div>
                <div className={`font-mono text-xs sm:text-right sm:text-sm ${pctClass(it.change24h)}`}>{fmtPct(it.change24h)}</div>
                <div className="hidden sm:block">
                  {it.progress != null ? (
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1 w-14 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-pink" style={{ width: `${Math.max(3, it.progress * 100)}%` }} />
                      </div>
                      <span className="w-9 text-right font-mono text-[11px] text-zinc-500">{Math.round(it.progress * 100)}%</span>
                    </div>
                  ) : (
                    <div className="text-right text-[11px] text-zinc-500">{it.graduated ? "On DEX" : "—"}</div>
                  )}
                </div>
              </div>
            </CoinLink>
          </li>
        );
      })}
    </ul>
  );
}
