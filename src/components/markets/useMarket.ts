"use client";

import { useEffect, useState } from "react";
import type { MarketItem } from "@/lib/markets";

export type { MarketItem };

/** The NOIR market (/api/markets), refreshed every 20s. null while loading. */
export function useMarket(): MarketItem[] | null {
  const [items, setItems] = useState<MarketItem[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/markets", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && setItems(Array.isArray(d.items) ? d.items : []))
        .catch(() => !cancelled && setItems((prev) => prev ?? []));
    load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  return items;
}

/** One coin's market row (verification, pair, 24h), or null while loading / unlisted. */
export function useMarketItem(token: string): MarketItem | null {
  const items = useMarket();
  if (!items || !token) return null;
  const key = token.startsWith("0x") ? token.toLowerCase() : token;
  return items.find((i) => (i.token.startsWith("0x") ? i.token.toLowerCase() : i.token) === key) ?? null;
}

export function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(n < 10 ? 2 : 0)}`;
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  return `${n >= 0 ? "+" : "−"}${a >= 1000 ? `${(a / 1000).toFixed(1)}K` : a.toFixed(a >= 100 ? 0 : 1)}%`;
}

export function pctClass(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n === 0) return "text-zinc-500";
  return n > 0 ? "text-up" : "text-down";
}
