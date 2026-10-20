import Link from "next/link";
import { SITE } from "@/lib/site";
import { TokenFeed } from "@/components/TokenFeed";
import { BrandLogo } from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ── Compact hero ── */}
      <section className="relative pt-10 sm:pt-14">
        <div className="animate-fade-up">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-pink" /> Profile coins on {SITE.poweredBy} v2 · Pump.fun
          </span>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-black leading-[1.05] tracking-tight text-zinc-900 sm:text-5xl">
            Tokenize your{" "}
            <span className="inline-flex items-center gap-2 align-middle">
              <BrandLogo brand="fomo" className="h-8 w-8 rounded-xl sm:h-11 sm:w-11" />
              <span className="grad-text">@fomo</span>
            </span>{" "}
            &amp;{" "}
            <span className="inline-flex items-center gap-2 align-middle">
              <BrandLogo brand="pumpfun" className="h-8 w-8 rounded-xl sm:h-11 sm:w-11" />
              <span className="grad-text">@Pumpfun</span>
            </span>{" "}
            profile.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            Launch your profile coin on the {SITE.poweredBy} v2 bonding curve on {SITE.chain}, or on
            Pump.fun on Solana. Every coin below launched on Dime. Non-custodial: your wallet signs.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/create" className="btn-brand">
              <BrandLogo brand="robinhood" className="h-5 w-5 rounded-full" /> Launch on Robinhood →
            </Link>
            <Link href="/create?chain=solana&source=pumpfun" className="btn-brand">
              <BrandLogo brand="solana" className="h-5 w-5 rounded-full" /> Launch on Pump.fun →
            </Link>
            <Link href="/explore" className="btn-ghost">Search by contract</Link>
          </div>
        </div>
      </section>

      {/* ── Feed of Dime launches ── */}
      <section className="mt-10 pb-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-black tracking-tight text-zinc-900">
            Latest on <span className="grad-text">Dime</span>
          </h2>
          <Link href="/leaderboard" className="text-xs font-semibold text-pink hover:underline">
            Leaderboard →
          </Link>
        </div>
        <TokenFeed limit={48} />
      </section>

      <p className="mb-8 text-center text-[11px] text-zinc-400">
        {SITE.name} is a third-party interface to the {SITE.poweredBy} protocol, not an official{" "}
        {SITE.poweredBy}, fomo.family or Pump.fun product. Not financial advice.
      </p>
    </div>
  );
}
