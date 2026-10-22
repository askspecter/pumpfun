"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { BrandLogo } from "./BrandLogo";
import { OFFICIAL_TOKEN } from "@/lib/site";

interface TokenData {
  name?: string;
  symbol?: string;
  marketCapUsd?: number | null;
  marketCapEth?: number | null;
  phase?: number;
  priceSource?: "dex" | "curve" | null;
  curve?: { progress?: number; graduated?: boolean } | null;
}

function money(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/** The official $NOIR coin, pinned above the launch feed. */
export function OfficialCoin() {
  const ca = OFFICIAL_TOKEN.address;
  const [data, setData] = useState<TokenData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/v2/token?address=${ca}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d: TokenData & { error?: string }) => !cancelled && !d.error && setData(d))
        .catch(() => {});
    load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ca]);

  const mc = data?.marketCapUsd ?? null;
  const progress = data?.curve && !data.curve.graduated ? data.curve.progress ?? null : null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-[#c7cdff]/30 p-5 sm:p-6"
      style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(199,205,255,0.14), transparent 55%), linear-gradient(180deg,#111216,#0b0c0e)" }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <Link href={`/launch/${ca}`} className="flex min-w-0 flex-1 items-center gap-4">
          {/* Always the brand mark: it's the official coin, and the on-chain logo URL may not load. */}
          <Logo className="h-16 w-16" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-semibold text-white">{data?.name || "NOIR"}</span>
              <span className="font-mono text-sm text-pink">${data?.symbol || OFFICIAL_TOKEN.symbol}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#c7cdff] px-2.5 py-0.5 text-[11px] font-semibold text-[#08090a]">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
                  <path d="M16 3l5 5-3 1-4 4 1 5-2 2-4-4-5 5-1-1 5-5-4-4 2-2 5 1 4-4z" />
                </svg>
                Official
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
              <BrandLogo brand="robinhood" className="h-3.5 w-3.5 rounded-full" /> Robinhood Chain ·{" "}
              {data?.priceSource === "dex" || (data?.phase ?? 0) !== 0 ? "Graduated · DEX" : "Pons v2"}
            </div>
          </div>
        </Link>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Market cap</div>
          <div className="font-mono text-xl font-semibold text-white">{mc !== null && mc > 0 ? money(mc) : "—"}</div>
        </div>
      </div>

      {progress !== null && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full" style={{ width: `${Math.max(2, progress * 100)}%`, background: "linear-gradient(90deg,#2fe39a,#7cf3ff)" }} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() =>
            navigator.clipboard?.writeText(ca).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
          className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-zinc-600 transition hover:text-white"
          title="Copy contract address"
        >
          <span className="truncate">CA {ca}</span>
          <span>{copied ? "✓" : "⧉"}</span>
        </button>
        <Link href={`/launch/${ca}`} className="btn-brand ml-auto !px-4 !py-2">
          Trade $NOIR →
        </Link>
      </div>
    </div>
  );
}
