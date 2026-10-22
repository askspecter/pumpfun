"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { ClaimFees } from "@/components/ClaimFees";
import { BrandLogo } from "@/components/BrandLogo";
import { ProfileAvatar } from "@/components/home/ProfileAvatar";
import { PairChip, VerifiedBadge } from "@/components/markets/Badges";
import { fmtPct, fmtUsd, pctClass, useMarket, type MarketItem } from "@/components/markets/useMarket";
import { coinLink, pumpCoinUrl } from "@/lib/solana";

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const same = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && (a.startsWith("0x") ? a.toLowerCase() === b.toLowerCase() : a === b);

interface BankRow extends MarketItem {
  /** You launched it, or someone launched it with its fees routed to you. */
  role: "launched" | "pays-you";
}

/**
 * Creator Bank: every profile coin the connected wallets launched or earn
 * creator fees from, on both chains, with the fees to claim.
 */
export default function CreatorBankPage() {
  const { address: evmAddress } = useAccount();
  const { publicKey } = useWallet();
  const solanaAddress = publicKey?.toBase58();
  const isConnected = Boolean(evmAddress || solanaAddress);
  const market = useMarket();
  const [recorded, setRecorded] = useState<string[]>([]);

  // Launches NOIR recorded for these wallets, for coins whose on-chain creator
  // isn't readable yet (e.g. a brand-new Solana curve).
  useEffect(() => {
    const deployers = [evmAddress, solanaAddress].filter((a): a is string => Boolean(a));
    if (deployers.length === 0) return setRecorded([]);
    let cancelled = false;
    Promise.all(
      deployers.map((d) =>
        fetch(`/api/launches?deployer=${d}&limit=100`, { cache: "no-store" })
          .then((r) => r.json())
          .then((j) => ((j.items ?? []) as { token: string }[]).map((i) => i.token))
          .catch(() => [] as string[]),
      ),
    ).then((lists) => !cancelled && setRecorded(lists.flat()));
    return () => {
      cancelled = true;
    };
  }, [evmAddress, solanaAddress]);

  const rows = useMemo<BankRow[] | null>(() => {
    if (!market) return null;
    const out: BankRow[] = [];
    for (const it of market) {
      const wallet = it.chain === "solana" ? solanaAddress : evmAddress;
      if (!wallet) continue;
      if (same(it.creator, wallet) || (!it.creator && recorded.some((t) => same(t, it.token)))) {
        out.push({ ...it, role: "launched" });
      } else if (same(it.feeRecipient, wallet)) {
        out.push({ ...it, role: "pays-you" });
      }
    }
    return out.sort((a, b) => (b.marketCapUsd ?? -1) - (a.marketCapUsd ?? -1));
  }, [market, evmAddress, solanaAddress, recorded]);

  const totals = useMemo(() => {
    if (!rows) return null;
    return {
      cap: rows.reduce((n, r) => n + (r.marketCapUsd ?? 0), 0),
      launched: rows.filter((r) => r.role === "launched").length,
      paying: rows.filter((r) => r.role === "pays-you").length,
      verified: rows.filter((r) => r.verified === "verified").length,
    };
  }, [rows]);

  // Robinhood fees accrue per quote asset: ETH, plus each stock/stable pair.
  const pairs = useMemo(() => {
    const seen = new Map<string, { address: Address; symbol: string }>();
    for (const r of rows ?? []) {
      if (r.chain === "robinhood" && r.pair && same(r.feeRecipient, evmAddress)) {
        seen.set(r.pair.address.toLowerCase(), { address: r.pair.address as Address, symbol: r.pair.symbol });
      }
    }
    return [...seen.values()];
  }, [rows, evmAddress]);

  const solanaCoins = (rows ?? []).filter((r) => r.chain === "solana");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:pt-14">
      <div className="eyebrow">Creator Bank</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
        Your profile<span className="text-zinc-500">,</span> paid<span className="text-zinc-500">.</span>
      </h1>
      <p className="mt-3 max-w-xl text-sm text-zinc-600">
        Every profile coin you launched or earn creator fees from, across Robinhood Chain and Solana, and the
        fees waiting for you.
      </p>

      {!isConnected ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-sm text-zinc-600">Connect your wallet to open your Creator Bank.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <WalletButton variant="solid" />
            <SolanaWalletButton />
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Combined market cap" value={totals ? fmtUsd(totals.cap) : "…"} />
            <Stat label="Coins you launched" value={totals ? String(totals.launched) : "…"} />
            <Stat label="Coins paying you" value={totals ? String(totals.paying) : "…"} />
            <Stat label="Verified" value={totals ? String(totals.verified) : "…"} accent />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {evmAddress ? (
              <div className="space-y-6">
                <ClaimFees creator={evmAddress} />
                {pairs.map((p) => (
                  <ClaimFees key={p.address} creator={evmAddress} pairToken={p.address} pairSymbol={p.symbol} tokenOnly />
                ))}
              </div>
            ) : (
              <div className="card p-5 text-sm">
                <div className="font-medium text-zinc-700">Robinhood Chain fees</div>
                <p className="mt-1.5 text-xs text-zinc-500">Connect an EVM wallet to see and claim Pons creator fees.</p>
                <div className="mt-3">
                  <WalletButton variant="solid" />
                </div>
              </div>
            )}

            <div className="card p-5 text-sm">
              <div className="flex items-center gap-2 font-medium text-zinc-700">
                <BrandLogo brand="pumpfun" className="h-4 w-4 rounded-full" /> Pump.fun creator fees
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">
                Pump.fun pays creator fees to the wallet that launched each coin. Claim them on Pump.fun.
              </p>
              {!solanaAddress ? (
                <div className="mt-3">
                  <SolanaWalletButton />
                </div>
              ) : solanaCoins.length === 0 ? (
                <p className="mt-3 text-xs text-zinc-500">No Solana profile coins for {short(solanaAddress)} yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {solanaCoins.map((c) => (
                    <li key={c.token} className="flex items-center gap-2 rounded-xl border border-ink-line p-2.5">
                      <ProfileAvatar src={c.logo || null} name={c.symbol || "?"} className="h-6 w-6" />
                      <span className="font-mono text-xs text-pink">${c.symbol}</span>
                      <a href={pumpCoinUrl(c.token)} target="_blank" rel="noreferrer" className="btn-ghost ml-auto !py-1 !text-xs">
                        Claim on Pump.fun ↗
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
              <h2 className="text-sm font-medium text-zinc-700">Your profile coins</h2>
              <Link href="/create" className="text-xs text-pink hover:underline">
                Launch another →
              </Link>
            </div>
            {rows === null ? (
              <div className="h-32 animate-pulse bg-white/[0.02]" />
            ) : rows.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-zinc-500">
                No profile coins for these wallets yet.{" "}
                <Link href="/create" className="text-pink underline underline-offset-2">
                  Launch your profile →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {rows.map((r) => {
                  const link = coinLink(r);
                  return (
                    <li key={r.token}>
                      <Link
                        href={link.href}
                        {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.025]"
                      >
                        <ProfileAvatar src={r.logo || null} name={r.symbol || "?"} className="h-9 w-9" rounded="rounded-xl" />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-white">{r.name || r.symbol}</span>
                            <VerifiedBadge verified={r.verified} compact />
                            <PairChip pair={r.pair} />
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <BrandLogo brand={r.chain === "solana" ? "solana" : "robinhood"} className="h-3 w-3 rounded-full" />
                            <span className="font-mono text-pink">${r.symbol}</span>
                            <span>· {r.role === "launched" ? "You launched" : "Fees pay you"}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm font-semibold text-white">{fmtUsd(r.marketCapUsd)}</div>
                          <div className={`font-mono text-xs ${pctClass(r.change24h)}`}>{fmtPct(r.change24h)}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <p className="text-[11px] text-zinc-400">
            Listed from launches made through NOIR. On-chain, your coins and fees are always yours regardless of
            this list.
          </p>
        </div>
      )}
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
