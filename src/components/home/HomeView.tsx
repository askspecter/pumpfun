"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "../BrandLogo";
import { TokenFeed } from "../TokenFeed";
import { ProductShot } from "./ProductShot";
import { ProfileAvatar } from "./ProfileAvatar";
import { TopProfiles } from "./TopProfiles";
import { useTopProfiles } from "./useTopProfiles";
import { compact } from "./format";

function Bento({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-[#0f1013] to-[#0a0b0d] p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

export function HomeView() {
  const profiles = useTopProfiles();
  const [launches, setLaunches] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/launches?limit=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLaunches(Array.isArray(d.items) ? d.items.length : 0))
      .catch(() => setLaunches(0));
  }, []);

  const reach = profiles ? profiles.reduce((n, p) => n + (p.followers ?? 0), 0) : null;
  const top = profiles?.[0];

  return (
    <div className="relative">
      {/* Beam behind the product shot */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[520px] -z-10 h-[420px] w-[1200px] max-w-[100vw] -translate-x-1/2 blur-[40px]"
        style={{ background: "radial-gradient(ellipse at center, rgba(124,140,255,0.3), transparent 65%)" }}
      />

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-4 pt-10 text-center sm:pt-24">
        <Link
          href="/create?chain=solana&source=pumpfun"
          className="animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-1.5 pr-3.5 text-[13px] text-zinc-600 transition hover:border-white/20"
        >
          <span className="flex">
            <BrandLogo brand="robinhood" className="h-5 w-5 rounded-full border-2 border-[#08090a]" />
            <BrandLogo brand="solana" className="-ml-1.5 h-5 w-5 rounded-full border-2 border-[#08090a]" />
          </span>
          Now live on Robinhood Chain &amp; Solana <span className="text-white">→</span>
        </Link>
        <h1 className="animate-fade-up mx-auto mt-7 max-w-4xl text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-7xl lg:text-[88px]">
          <span className="bg-gradient-to-b from-white from-30% to-white/55 bg-clip-text text-transparent">
            Your profile.
            <br />
            Now a market.
          </span>
        </h1>
        <p className="animate-fade-up mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
          Tokenize your <span className="text-zinc-800">@fomo</span> &amp; <span className="text-zinc-800">@Pumpfun</span>{" "}
          profile and trade it on a bonding curve. Built for speed. Non-custodial by design.
        </p>
        <div className="animate-fade-up mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/create" className="btn-brand !px-6 !py-3.5 !text-[15px]">
            Launch your profile
          </Link>
          <a href="#top-profiles" className="btn-dark !px-6 !py-3.5 !text-[15px]">
            Explore profiles <span className="text-zinc-500">→</span>
          </a>
        </div>
      </section>

      {/* ── Product shot ── */}
      <section className="relative mx-auto mt-10 max-w-6xl px-4 sm:mt-20 lg:[perspective:2400px]">
        <div aria-hidden className="absolute -top-px left-1/2 z-10 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c7cdff] to-transparent" />
        <div className="origin-top lg:[transform:rotateX(14deg)]">
          <ProductShot profiles={profiles} />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-24 h-64 bg-gradient-to-b from-transparent to-[#08090a]" />
      </section>

      {/* ── Ecosystem strip ── */}
      <div className="relative mx-auto mt-2 flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-4 text-[15px] font-semibold text-zinc-400">
        {(
          [
            ["robinhood", "Robinhood Chain"],
            ["solana", "Solana"],
            ["fomo", "fomo.family"],
            ["pumpfun", "Pump.fun"],
          ] as const
        ).map(([b, label]) => (
          <span key={b} className="flex items-center gap-2.5 opacity-70 grayscale">
            <BrandLogo brand={b} className="h-6 w-6 rounded-md" />
            {label}
          </span>
        ))}
      </div>

      {/* ── Bento ── */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:mt-28">
        <h2 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-[54px]">
          Designed for creators.
          <br />
          <span className="text-zinc-400">Engineered for traders.</span>
        </h2>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-6">
          <Bento className="md:col-span-3 md:min-h-[320px]">
            <div className="text-xl font-semibold text-white">Detect in one click</div>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-zinc-600">
              Paste a handle. Name, avatar, bio and wallet are pulled straight from fomo.family or Pump.fun.
            </p>
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#08090a] p-3.5">
              <div className="flex w-max gap-1 rounded-lg bg-white/[0.04] p-0.5 text-xs font-semibold">
                <span className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 text-white">
                  <BrandLogo brand="fomo" className="h-3.5 w-3.5 rounded-full" />@fomo
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-500">
                  <BrandLogo brand="pumpfun" className="h-3.5 w-3.5 rounded-full" />@Pumpfun
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.03] p-2.5">
                {top ? (
                  <ProfileAvatar src={top.avatar} name={top.displayName} className="h-10 w-10" />
                ) : (
                  <span className="h-10 w-10 animate-pulse rounded-full bg-white/5" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {top?.displayName ?? "Loading…"} {top?.verified && <span className="text-pink">✓</span>}
                  </div>
                  <div className="truncate text-xs text-zinc-500">
                    {top ? `@${top.handle} · ${compact(top.followers)} followers` : "fetching profile"}
                  </div>
                </div>
                <span className="ml-auto rounded-md bg-up/15 px-2.5 py-1 text-xs font-semibold text-up">Detected</span>
              </div>
            </div>
          </Bento>

          <Bento className="md:col-span-3 md:min-h-[320px]">
            <div className="text-xl font-semibold text-white">Two chains. One click.</div>
            <p className="mt-2 text-[15px] text-zinc-600">Pons v2 on Robinhood Chain, or Pump.fun on Solana.</p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <BrandLogo brand="robinhood" className="h-20 w-20 !rounded-3xl shadow-[0_20px_60px_-10px_#ccff0066]" />
              <span className="h-0.5 w-14 bg-gradient-to-r from-[#ccff00] to-[#9945ff]" />
              <BrandLogo brand="solana" className="h-20 w-20 !rounded-3xl shadow-[0_20px_60px_-10px_#9945ff88]" />
            </div>
          </Bento>

          <Bento className="md:col-span-2 md:min-h-[260px]">
            <div className="text-sm text-zinc-600">Combined reach of top profiles</div>
            <div className="mt-1.5 text-5xl font-semibold tracking-[-0.04em] text-white">{reach === null ? "—" : compact(reach)}</div>
            <div className="mt-1 text-sm text-zinc-500">followers on fomo &amp; Pump.fun</div>
          </Bento>

          <Bento className="md:col-span-2 md:min-h-[260px]">
            <div className="text-sm text-zinc-600">Profiles minted on NOIR</div>
            <div className="mt-1.5 text-5xl font-semibold tracking-[-0.04em] text-white">
              {launches === null ? "—" : launches >= 100 ? "100+" : launches}
            </div>
            <div className="mt-8 flex md:absolute md:bottom-7 md:left-7 md:mt-0">
              {(profiles ?? []).slice(0, 6).map((p, i) => (
                <span key={p.lookup} className={i ? "-ml-3" : ""}>
                  <ProfileAvatar src={p.avatar} name={p.displayName} className="h-11 w-11 border-[3px] !border-[#0c0d0f]" />
                </span>
              ))}
            </div>
          </Bento>

          <Bento className="md:col-span-2 md:min-h-[260px]">
            <div className="text-sm text-zinc-600">Non-custodial</div>
            <div className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white">
              Your keys.
              <br />
              Your coin.
            </div>
            <svg viewBox="0 0 120 120" className="absolute bottom-6 right-6 h-24 w-24" aria-hidden>
              <defs>
                <linearGradient id="noir-shield" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fff" />
                  <stop offset="1" stopColor="#50545c" />
                </linearGradient>
              </defs>
              <path d="M60 10 L100 26 V58 C100 84 82 102 60 110 C38 102 20 84 20 58 V26Z" fill="none" stroke="url(#noir-shield)" strokeWidth="3" />
              <path d="M42 60 L55 73 L80 46" fill="none" stroke="#2fe39a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Bento>
        </div>
      </section>

      {/* ── Real top profiles ── */}
      <div id="top-profiles" className="mx-auto mt-16 max-w-6xl scroll-mt-24 px-4 sm:mt-28">
        <TopProfiles profiles={profiles} />
        <div className="mt-6 text-center">
          <Link href="/leaderboard" className="text-sm font-medium text-zinc-600 transition hover:text-white">
            See the full leaderboard →
          </Link>
        </div>
      </div>

      {/* ── Coins launched on NOIR ── */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:mt-24">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-[44px] sm:leading-none">Launched on NOIR</h2>
            <p className="mt-3 text-[15px] text-zinc-600">Profile coins live on Robinhood Chain and Solana.</p>
          </div>
          <Link href="/explore" className="hidden text-sm font-medium text-zinc-600 hover:text-white sm:block">
            Explore →
          </Link>
        </div>
        <TokenFeed limit={24} />
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:mt-28">
        <div
          className="overflow-hidden rounded-[28px] border border-white/[0.07] px-6 py-12 text-center sm:py-20"
          style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(93,107,255,0.25), transparent 60%), #0b0c0e" }}
        >
          <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl">
            <span className="bg-gradient-to-b from-white from-40% to-white/50 bg-clip-text text-transparent">
              Mint your profile
              <br />
              in under a minute.
            </span>
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/create" className="btn-brand !px-5 !py-3.5">
              <BrandLogo brand="robinhood" className="h-5 w-5 rounded-full" /> Launch on Robinhood
            </Link>
            <Link href="/create?chain=solana&source=pumpfun" className="btn-dark !px-5 !py-3.5">
              <BrandLogo brand="solana" className="h-5 w-5 rounded-full" /> Launch on Solana
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
