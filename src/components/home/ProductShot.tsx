"use client";

import { BrandLogo } from "../BrandLogo";
import { ProfileAvatar } from "./ProfileAvatar";
import { compact } from "./format";
import type { TopProfile } from "./types";

const UP = "#2fe39a";
const DOWN = "#ff5c6c";

/** Deterministic PRNG so the server and client draw the same demo chart. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number, mean: number, sd: number) {
  const u = 1 - r();
  const v = r();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Illustrative candlestick chart for the product preview (not market data). */
function DemoCandles({ width, height, count }: { width: number; height: number; count: number }) {
  const r = rng(5);
  let p = 40;
  const data = Array.from({ length: count }, () => {
    const o = p;
    const c = o + gauss(r, 0.9, 3.2);
    const hi = Math.max(o, c) + Math.abs(gauss(r, 0, 1.6));
    const lo = Math.min(o, c) - Math.abs(gauss(r, 0, 1.6));
    p = c;
    return { o, c, hi, lo, v: 4 + r() * 26 };
  });
  const mn = Math.min(...data.map((d) => d.lo));
  const mx = Math.max(...data.map((d) => d.hi));
  const y = (v: number) => height - 8 - ((v - mn) / (mx - mn)) * (height - 16);
  const cw = width / count;
  const lastY = y(data[data.length - 1].c);

  return (
    <svg viewBox={`0 0 ${width} ${height + 34}`} className="h-auto w-full overflow-visible" aria-hidden>
      {[1, 2, 3].map((t) => (
        <line key={t} x1={0} x2={width} y1={(height * t) / 4} y2={(height * t) / 4} stroke="#ffffff0d" />
      ))}
      {data.map((d, k) => (
        <rect
          key={`v${k}`}
          x={k * cw + cw * 0.18}
          y={height + 34 - d.v}
          width={cw * 0.64}
          height={d.v}
          fill={d.c >= d.o ? UP : DOWN}
          opacity={0.25}
        />
      ))}
      {data.map((d, k) => {
        const x = k * cw + cw / 2;
        const col = d.c >= d.o ? UP : DOWN;
        return (
          <g key={k}>
            <line x1={x} x2={x} y1={y(d.hi)} y2={y(d.lo)} stroke={col} strokeWidth={1} />
            <rect
              x={x - cw * 0.32}
              y={Math.min(y(d.o), y(d.c))}
              width={cw * 0.64}
              height={Math.max(1.5, Math.abs(y(d.o) - y(d.c)))}
              fill={col}
              rx={1}
            />
          </g>
        );
      })}
      <line x1={0} x2={width} y1={lastY} y2={lastY} stroke={UP} strokeDasharray="3 4" opacity={0.7} />
    </svg>
  );
}

/**
 * The hero "product shot": a preview of a profile-coin market on NOIR. The
 * coin in the middle is a labelled demo ($YOU); the sidebar lists the REAL
 * most-followed profiles, each linking to tokenize it.
 */
export function ProductShot({ profiles }: { profiles: TopProfile[] | null }) {
  const side = (profiles ?? []).slice(0, 7);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0c0f] shadow-[0_80px_160px_-40px_#000]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/[0.05] bg-[#0e0f13] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <div className="mx-auto rounded-md bg-white/[0.04] px-10 py-1 text-[11px] text-zinc-500 sm:px-20">noir.app/you</div>
      </div>

      <div className="grid md:grid-cols-[250px,1fr] lg:grid-cols-[270px,1fr,260px]">
        {/* Sidebar: real top profiles */}
        <div className="hidden border-r border-white/[0.05] p-2.5 md:block">
          <div className="px-3 pb-2 pt-1.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-400">TOP PROFILES</div>
          {side.length === 0
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="mx-1 my-1.5 h-10 animate-pulse rounded-lg bg-white/[0.03]" />
              ))
            : side.map((p, i) => (
                <div
                  key={`${p.source}:${p.lookup}`}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${i === 0 ? "bg-white/[0.04]" : ""}`}
                >
                  <ProfileAvatar src={p.avatar} name={p.displayName} className="h-7 w-7" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-white">{p.displayName}</div>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <BrandLogo brand={p.source} className="h-3 w-3 rounded-full" />
                      <span className="truncate">@{p.handle}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-zinc-500">{compact(p.followers)}</div>
                </div>
              ))}
        </div>

        {/* Center: demo market */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-[#08090a]"
              style={{ background: "linear-gradient(135deg,#7cf3ff,#a77bff 55%,#ff6fd8)" }}
            >
              Y
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[17px] font-bold text-white">
                You <span className="font-mono text-xs font-medium text-zinc-500">$YOU</span>
                <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">Preview</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <BrandLogo brand="fomo" className="h-3 w-3 rounded-full" />
                <BrandLogo brand="pumpfun" className="h-3 w-3 rounded-full" />
                your profile · your coin
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="font-mono text-xl font-bold tracking-tight text-white sm:text-2xl">$84,219</div>
              <div className="font-mono text-xs text-up">▲ 212.4% · 24h</div>
            </div>
          </div>
          <div className="mt-4 flex gap-1 text-[11px] font-semibold text-zinc-400">
            {["5M", "15M", "1H", "4H", "1D", "ALL"].map((x) => (
              <span key={x} className={`rounded-md px-2.5 py-1 ${x === "1H" ? "bg-white/[0.07] text-white" : ""}`}>
                {x}
              </span>
            ))}
            <span className="ml-auto hidden rounded-md bg-white/[0.04] px-2.5 py-1 sm:inline">
              Bonding curve <b className="text-white">78%</b>
            </span>
          </div>
          <div className="mt-3">
            <DemoCandles width={600} height={300} count={54} />
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/[0.05]">
            <div className="h-1.5 w-[78%] rounded-full" style={{ background: "linear-gradient(90deg,#2fe39a,#7cf3ff)" }} />
          </div>
        </div>

        {/* Right: trade panel */}
        <div className="hidden border-l border-white/[0.05] p-4 lg:block">
          <div className="grid grid-cols-2 rounded-lg bg-white/[0.04] p-0.5 text-[13px] font-semibold">
            <span className="rounded-md bg-up py-2 text-center text-[#03130b]">Buy</span>
            <span className="py-2 text-center text-zinc-500">Sell</span>
          </div>
          <div className="mt-4 text-[11px] text-zinc-500">Amount</div>
          <div className="mt-1.5 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <span className="font-mono text-lg font-semibold text-white">2.50</span>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
              <BrandLogo brand="solana" className="h-4 w-4 rounded-full" />
              SOL
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {["0.1", "0.5", "1", "Max"].map((x) => (
              <span key={x} className="rounded-md bg-white/[0.04] py-1.5 text-center font-mono text-[11px] text-zinc-500">
                {x}
              </span>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-zinc-500">
            <div className="flex justify-between"><span>You receive</span><span className="font-mono text-white">296,812 YOU</span></div>
            <div className="flex justify-between"><span>Price impact</span><span className="font-mono">0.84%</span></div>
          </div>
          <div className="mt-3 rounded-lg bg-up py-2.5 text-center text-[13px] font-bold text-[#03130b]">Buy $YOU</div>
          <div className="mt-5 text-[10px] font-semibold tracking-[0.14em] text-zinc-400">LIVE TRADES</div>
          {[
            ["7xKX…9fQa", "+3.20", true],
            ["Bq4m…Lr2c", "+0.85", true],
            ["9pZt…Wk1d", "−1.40", false],
            ["Fh2s…Qe8n", "+0.25", true],
          ].map(([w, a, up]) => (
            <div key={w as string} className="mt-2 flex justify-between text-xs">
              <span className="font-mono text-zinc-500">{w}</span>
              <span className={`font-mono ${up ? "text-up" : "text-down"}`}>{a} SOL</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
