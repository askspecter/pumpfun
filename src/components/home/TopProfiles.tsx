"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandLogo } from "../BrandLogo";
import { ProfileAvatar } from "./ProfileAvatar";
import { compact, usd } from "./format";
import { tokenizeHref, type TopProfile } from "./types";

type Filter = "all" | "fomo" | "pumpfun";

/**
 * Real most-followed profiles on fomo.family and Pump.fun, each with a
 * one-click "Tokenize" into the launch studio.
 */
export function TopProfiles({
  profiles,
  limit = 10,
  title = "Top profiles",
  subtitle = "The most-followed creators on fomo.family and Pump.fun. Tokenize any of them in one click.",
}: {
  profiles: TopProfile[] | null;
  limit?: number;
  title?: string;
  subtitle?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(
    () => (profiles ?? []).filter((p) => filter === "all" || p.source === filter).slice(0, limit),
    [profiles, filter, limit],
  );

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-[44px] sm:leading-none">{title}</h2>
          <p className="mt-3 max-w-xl text-[15px] text-zinc-600">{subtitle}</p>
        </div>
        <div className="flex w-max gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 text-[13px] font-semibold">
          {(
            [
              ["all", "All", null],
              ["fomo", "@fomo", "fomo"],
              ["pumpfun", "@Pumpfun", "pumpfun"],
            ] as const
          ).map(([id, label, brand]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                filter === id ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
              }`}
            >
              {brand && <BrandLogo brand={brand} className="h-3.5 w-3.5 rounded-full" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7">
        <div className="hidden grid-cols-[40px,1.8fr,1fr,1fr,120px] px-2 pb-3 text-[11px] font-medium tracking-wider text-zinc-400 sm:grid">
          <span>#</span>
          <span>PROFILE</span>
          <span>FOLLOWERS</span>
          <span>PNL · 30D</span>
          <span />
        </div>

        {profiles === null ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="my-2 h-14 animate-pulse rounded-xl bg-white/[0.03]" />
          ))
        ) : rows.length === 0 ? (
          <div className="card p-8 text-center text-sm text-zinc-500">
            Couldn’t load profiles right now. Try again in a moment.
          </div>
        ) : (
          rows.map((p, i) => (
            <div
              key={`${p.source}:${p.lookup}`}
              className="grid grid-cols-[28px,1fr,auto] items-center gap-3 border-t border-white/[0.05] px-2 py-3.5 sm:grid-cols-[40px,1.8fr,1fr,1fr,120px] sm:gap-0"
            >
              <span className="font-mono text-[13px] text-zinc-400">{i + 1}</span>
              <a href={p.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3">
                <ProfileAvatar src={p.avatar} name={p.displayName} className="h-10 w-10" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[15px] font-semibold text-white">
                    <span className="truncate">{p.displayName}</span>
                    {p.verified && <span className="text-pink" title="Verified">✓</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <BrandLogo brand={p.source} className="h-3.5 w-3.5 rounded-full" />
                    <span className="truncate">@{p.handle}</span>
                    <span className="font-mono sm:hidden">· {compact(p.followers)}</span>
                  </div>
                </div>
              </a>
              <span className="hidden font-mono text-sm text-white sm:block">{compact(p.followers)}</span>
              <span
                className={`hidden font-mono text-sm sm:block ${
                  p.pnlUsd === null ? "text-zinc-400" : p.pnlUsd >= 0 ? "text-up" : "text-down"
                }`}
              >
                {usd(p.pnlUsd)}
              </span>
              <Link
                href={tokenizeHref(p)}
                className="justify-self-end rounded-lg border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-white hover:text-[#08090a]"
              >
                Tokenize
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
