"use client";

import Link from "next/link";
import { coinLink } from "@/lib/solana";
import { ProfileAvatar } from "../home/ProfileAvatar";
import { fmtPct, fmtUsd, pctClass, type MarketItem } from "./useMarket";

/** Scrolling ticker tape of profile coins: $TICKER, market cap and 24h move. */
export function MarketTicker({ items }: { items: MarketItem[] }) {
  const rows = items.filter((i) => i.marketCapUsd != null).slice(0, 24);
  if (rows.length < 3) return null;
  return (
    <div className="marquee-mask overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-2.5">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {rows.map((it) => {
              const link = coinLink(it);
              return (
                <Link
                  key={it.token}
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className="flex items-center gap-2 px-5 font-mono text-xs"
                >
                  <ProfileAvatar src={it.logo || null} name={it.symbol || "?"} className="h-4 w-4" />
                  <span className="font-semibold text-white">${it.symbol}</span>
                  <span className="text-zinc-500">{fmtUsd(it.marketCapUsd)}</span>
                  <span className={pctClass(it.change24h)}>{fmtPct(it.change24h)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
