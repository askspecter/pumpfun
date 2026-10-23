"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SolanaTradeWidget } from "@/components/SolanaTradeWidget";
import { TwinChat } from "@/components/TwinChat";
import { PredictCard } from "@/components/PredictCard";
import { BrandLogo } from "@/components/BrandLogo";
import { compact } from "@/components/home/format";
import { isSolanaAddress, profileLink, pumpCoinUrl, SOLANA_EXPLORER_URL } from "@/lib/solana";

interface CoinData {
  mint: string;
  name: string;
  symbol: string;
  logo: string;
  description: string;
  creator: string;
  handle: string | null;
  source: "fomo" | "pumpfun" | null;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  priceSol: number | null;
  priceUsd: number | null;
  marketCapSol: number | null;
  marketCapUsd: number | null;
  complete: boolean;
  progress: number | null;
  curve: { virtualTokenReserves: string; virtualSolReserves: string; realSolReserves: string; bondingCurve: string } | null;
  error?: string;
}

function short(a: string) {
  return a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "";
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-white">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-zinc-400">{sub}</div>}
    </div>
  );
}

export default function SolanaCoinPage() {
  const params = useParams<{ mint: string }>();
  const mint = params?.mint ?? "";
  const [data, setData] = useState<CoinData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    if (!isSolanaAddress(mint)) {
      setError("Invalid mint address.");
      return;
    }
    fetch(`/api/pumpfun/coin?mint=${mint}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: CoinData) => (d.error ? setError(d.error) : setData(d)))
      .catch(() => setError("Couldn’t load this coin."));
  }, [mint]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load]);

  if (error && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-16 text-center">
        <div className="card p-10">
          <p className="text-sm text-zinc-600">{error}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/" className="btn-ghost">← Home</Link>
            {isSolanaAddress(mint) && (
              <a href={pumpCoinUrl(mint)} target="_blank" rel="noreferrer" className="btn-ghost">Open on Pump.fun ↗</a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-10">
        <div className="card h-36 animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-[1fr,360px]">
          <div className="card h-[460px] animate-pulse" />
          <div className="card h-[460px] animate-pulse" />
        </div>
      </div>
    );
  }

  const progress = data.progress ?? (data.complete ? 1 : null);
  const chartSrc = `https://dexscreener.com/solana/${data.mint}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=5`;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
      {/* Header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:h-20 sm:w-20">
            {data.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logo} alt={data.symbol} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl">🫥</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{data.name}</h1>
              <span className="font-mono text-sm text-pink">${data.symbol}</span>
              <span className="chip flex items-center gap-1">
                <BrandLogo brand="solana" className="h-3 w-3 rounded-full" /> Solana · Pump.fun
              </span>
              {data.complete && <span className="chip chip-accent">graduated</span>}
            </div>
            {data.description && <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-zinc-600">{data.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(data.mint).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  })
                }
                className="font-mono transition hover:text-white"
              >
                CA {short(data.mint)} {copied ? "✓" : "⧉"}
              </button>
              {data.handle && (
                <a href={profileLink(data.handle, data.source ?? undefined)} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white">
                  <BrandLogo brand={data.source === "pumpfun" ? "pumpfun" : "fomo"} className="h-3 w-3 rounded-full" />@{data.handle}
                </a>
              )}
              {data.creator && <span>Creator {short(data.creator)}</span>}
              <a href={`${SOLANA_EXPLORER_URL}/token/${data.mint}`} target="_blank" rel="noreferrer" className="hover:text-white">Solscan ↗</a>
              <a href={pumpCoinUrl(data.mint)} target="_blank" rel="noreferrer" className="hover:text-white">Pump.fun ↗</a>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Market cap" value={data.marketCapUsd !== null ? `$${compact(data.marketCapUsd)}` : "—"} sub={data.marketCapSol !== null ? `${data.marketCapSol.toFixed(2)} SOL` : undefined} />
          <Stat label="Price" value={data.priceUsd !== null ? `$${data.priceUsd < 0.01 ? data.priceUsd.toPrecision(3) : data.priceUsd.toFixed(4)}` : "—"} sub={data.priceSol !== null ? `${data.priceSol.toPrecision(3)} SOL` : undefined} />
          <Stat label="In curve" value={data.curve ? `${(Number(data.curve.realSolReserves) / 1e9).toFixed(2)} SOL` : "—"} />
          <Stat label="Bonding curve" value={progress !== null ? `${(progress * 100).toFixed(1)}%` : "—"} sub={data.complete ? "Graduated to PumpSwap" : "to graduation"} />
        </div>
        {progress !== null && !data.complete && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, progress * 100)}%`, background: "linear-gradient(90deg,#2fe39a,#7cf3ff)" }} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr,360px]">
        <div className="min-w-0 space-y-5">
          <div className="card overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3 text-sm">
              <span className="font-semibold text-white">Chart</span>
              <a href={`https://dexscreener.com/solana/${data.mint}`} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-white">
                DexScreener ↗
              </a>
            </div>
            <iframe src={chartSrc} title={`${data.symbol} chart`} className="h-[420px] w-full border-0 sm:h-[520px]" loading="lazy" />
            <p className="border-t border-white/[0.05] px-5 py-2.5 text-[11px] text-zinc-400">
              Brand-new coins can take a few minutes to appear on the chart.
            </p>
          </div>
          <TwinChat
            chain="solana"
            token={data.mint}
            name={data.name}
            symbol={data.symbol}
            handle={data.handle}
            avatar={data.logo || null}
            description={data.description}
          />
        </div>

        <div className="space-y-5">
          <SolanaTradeWidget mint={data.mint} symbol={data.symbol} reserves={data.complete ? null : data.curve} onTraded={load} />
          <PredictCard chain="solana" token={data.mint} symbol={data.symbol} />
          <div className="card p-5 text-sm">
            <div className="font-semibold text-white">Creator fees</div>
            <p className="mt-1.5 text-zinc-600">
              Pump.fun pays creator fees to the wallet that launched this coin. Claim them on Pump.fun.
            </p>
            <a href={pumpCoinUrl(data.mint)} target="_blank" rel="noreferrer" className="btn-ghost mt-3 inline-flex">
              Open on Pump.fun ↗
            </a>
          </div>
          {(data.twitter || data.telegram || data.website) && (
            <div className="card flex flex-wrap gap-2 p-4 text-sm">
              {data.twitter && <a href={data.twitter} target="_blank" rel="noreferrer" className="btn-ghost !py-1.5">X ↗</a>}
              {data.telegram && <a href={data.telegram} target="_blank" rel="noreferrer" className="btn-ghost !py-1.5">Telegram ↗</a>}
              {data.website && <a href={data.website} target="_blank" rel="noreferrer" className="btn-ghost !py-1.5">Website ↗</a>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
