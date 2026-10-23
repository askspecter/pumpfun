"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zeroAddress, type Address } from "viem";
import { coinLink } from "@/lib/solana";
import { BrandLogo } from "../BrandLogo";
import { CurveTradeWidget } from "../CurveTradeWidget";
import { SolanaTradeWidget } from "../SolanaTradeWidget";
import { PriceChartV2 } from "../PriceChartV2";
import { ProfileAvatar } from "../home/ProfileAvatar";
import { PairChip, VerifiedBadge } from "../markets/Badges";
import { fmtPct, fmtUsd, pctClass, useMarket, type MarketItem } from "../markets/useMarket";
import { useWatchlist } from "../markets/useWatchlist";
import type { TradeIntent } from "../tradeIntent";
import { HELP, parseCommand } from "./commands";

type ListTab = "all" | "watch" | "verified" | "stocks";
type Line = { kind: "in" | "ok" | "err"; text: string };

const HOTKEYS: [string, string][] = [
  ["/", "command bar"],
  ["J / K", "next / previous coin"],
  ["B / S", "buy / sell side"],
  ["1 2 3", "amount presets"],
  ["W", "watch ★"],
  ["?", "help"],
];

const idOf = (t: string) => (t.startsWith("0x") ? t.toLowerCase() : t);

/** Buy presets in the coin's quote asset; sells are shares of your bag. */
function presets(item: MarketItem | null, side: "buy" | "sell"): string[] {
  if (side === "sell") return ["25%", "50%", "100%"];
  if (item?.chain === "solana") return ["0.1", "0.5", "1"];
  if (item?.pair?.symbol === "USDG") return ["10", "50", "100"];
  if (item?.pair) return ["0.1", "0.5", "1"];
  return ["0.01", "0.05", "0.1"];
}

export function Terminal() {
  const router = useRouter();
  const params = useSearchParams();
  const market = useMarket();
  const watch = useWatchlist();
  const [tab, setTab] = useState<ListTab>("all");
  const [selected, setSelected] = useState<string | null>(params?.get("c") ?? null);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [intent, setIntent] = useState<(TradeIntent & { token: string }) | null>(null);
  const [cmd, setCmd] = useState("");
  const [log, setLog] = useState<Line[]>([{ kind: "ok", text: "NOIR Terminal. Type help, or press / to start." }]);
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nonce = useRef(0);

  const sorted = useMemo(() => [...(market ?? [])].sort((a, b) => (b.marketCapUsd ?? -1) - (a.marketCapUsd ?? -1)), [market]);
  const rows = useMemo(() => {
    if (tab === "watch") return sorted.filter((i) => watch.list.includes(i.token));
    if (tab === "verified") return sorted.filter((i) => i.verified === "verified");
    if (tab === "stocks") return sorted.filter((i) => i.pair);
    return sorted;
  }, [sorted, tab, watch.list]);

  const current = useMemo(
    () => (selected && sorted.find((i) => idOf(i.token) === idOf(selected))) || sorted[0] || null,
    [sorted, selected],
  );

  const select = useCallback(
    (item: MarketItem, keepIntent = false) => {
      setSelected(item.token);
      if (!keepIntent) setIntent(null);
      router.replace(`/terminal?c=${item.token}`, { scroll: false });
    },
    [router],
  );

  const prefill = useCallback((item: MarketItem, next: { side?: "buy" | "sell"; amount?: string }) => {
    if (next.side) setSide(next.side);
    setIntent({ ...next, token: item.token, nonce: ++nonce.current });
  }, []);

  const say = (lines: Line[]) => setLog((prev) => [...prev, ...lines].slice(-6));

  function run(line: string) {
    if (!line.trim()) return;
    setHistory((h) => [line, ...h].slice(0, 50));
    setHIdx(-1);
    const c = parseCommand(line, sorted);
    const echo: Line = { kind: "in", text: `> ${line}` };
    switch (c.kind) {
      case "open":
        select(c.item);
        return say([echo, { kind: "ok", text: `opened $${c.item.symbol}` }]);
      case "trade": {
        const item = c.item ?? current;
        if (!item) return say([echo, { kind: "err", text: "No coin open. Try: buy $MIRA 0.1" }]);
        if (c.item) select(item, true);
        prefill(item, { side: c.side, amount: c.amount ?? undefined });
        const what = c.amount ? `${c.side} ${c.amount}` : c.side;
        return say([echo, { kind: "ok", text: `$${item.symbol}: ${what} ready. Confirm in the panel; your wallet signs.` }]);
      }
      case "watch": {
        const item = c.item ?? current;
        if (!item) return say([echo, { kind: "err", text: "No coin open." }]);
        const on = !watch.list.includes(item.token);
        watch.toggle(item.token);
        return say([echo, { kind: "ok", text: `${on ? "★ watching" : "removed"} $${item.symbol}` }]);
      }
      case "launch":
      case "go":
        say([echo, { kind: "ok", text: `→ ${c.kind === "launch" ? "launch " : ""}${c.label}` }]);
        return router.push(c.href);
      case "help":
        setShowHelp(true);
        return say([echo]);
      case "clear":
        return setLog([]);
      case "error":
        return say([echo, { kind: "err", text: c.message }]);
    }
  }

  // Global hotkeys (ignored while typing in a field).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "Escape") {
        setShowHelp(false);
        inputRef.current?.blur();
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const at = current ? rows.findIndex((r) => r.token === current.token) : -1;
      if (key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if ((key === "j" || key === "arrowdown") && rows.length) {
        e.preventDefault();
        select(rows[Math.min(rows.length - 1, at + 1)]);
      } else if ((key === "k" || key === "arrowup") && rows.length) {
        e.preventDefault();
        select(rows[Math.max(0, at - 1)]);
      } else if ((key === "b" || key === "s") && current) {
        prefill(current, { side: key === "b" ? "buy" : "sell" });
      } else if (["1", "2", "3"].includes(key) && current) {
        prefill(current, { side, amount: presets(current, side)[Number(key) - 1] });
      } else if (key === "w" && current) {
        watch.toggle(current.token);
      } else if (e.key === "?") {
        setShowHelp((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, rows, side, select, prefill, watch]);

  const live = intent && current && intent.token === current.token ? intent : undefined;

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6">
      {/* Command bar */}
      <div className="card overflow-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(cmd);
            setCmd("");
          }}
          className="flex items-center gap-3 px-4 py-3"
        >
          <span className="font-mono text-sm font-semibold text-[#2fe39a]">&gt;</span>
          <input
            ref={inputRef}
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" && history.length) {
                e.preventDefault();
                const i = Math.min(history.length - 1, hIdx + 1);
                setHIdx(i);
                setCmd(history[i]);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                const i = hIdx - 1;
                setHIdx(Math.max(-1, i));
                setCmd(i >= 0 ? history[i] : "");
              }
            }}
            placeholder="buy $MIRA 0.1  ·  sell 50%  ·  launch @handle --chain solana  ·  help"
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal command"
            className="min-w-0 flex-1 bg-transparent font-mono text-sm text-white outline-none placeholder:text-zinc-500"
          />
          <kbd className="hidden rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:block">/</kbd>
        </form>
        {log.length > 0 && (
          <div className="border-t border-white/[0.05] bg-black/20 px-4 py-2 font-mono text-[11px] leading-5">
            {log.slice(-3).map((l, i) => (
              <div key={i} className={l.kind === "err" ? "text-down" : l.kind === "in" ? "text-zinc-500" : "text-zinc-600"}>
                {l.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {showHelp && (
        <div className="card mt-3 grid gap-6 p-5 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Commands</div>
            <ul className="mt-2 space-y-1.5 font-mono text-xs">
              {HELP.map(([c, d]) => (
                <li key={c} className="flex gap-3">
                  <span className="text-[#2fe39a]">{c}</span>
                  <span className="text-zinc-500">{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Hotkeys</div>
            <ul className="mt-2 space-y-1.5 text-xs">
              {HOTKEYS.map(([k, d]) => (
                <li key={k} className="flex gap-3">
                  <kbd className="w-14 font-mono text-white">{k}</kbd>
                  <span className="text-zinc-500">{d}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-zinc-500">Commands and hotkeys only fill the trade panel. Your wallet signs every trade.</p>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px,minmax(0,1fr),360px]">
        {/* Coin list */}
        <aside className="card order-3 flex min-h-0 flex-col overflow-hidden lg:order-1 lg:max-h-[calc(100dvh-190px)]">
          <div className="flex gap-1 border-b border-white/[0.06] p-2">
            {(
              [
                ["all", "All"],
                ["watch", "★"],
                ["verified", "✓"],
                ["stocks", "Stocks"],
              ] as [ListTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                  tab === id ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="thin-scroll min-h-0 flex-1 overflow-y-auto">
            {market === null ? (
              Array.from({ length: 8 }).map((_, i) => <li key={i} className="m-2 h-10 animate-pulse rounded-lg bg-white/[0.03]" />)
            ) : rows.length === 0 ? (
              <li className="p-4 text-xs text-zinc-500">{tab === "watch" ? "Press W on a coin to watch it." : "Nothing here yet."}</li>
            ) : (
              rows.map((it) => {
                const on = current?.token === it.token;
                return (
                  <li key={it.token}>
                    <button
                      onClick={() => select(it)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition ${
                        on ? "bg-white/[0.07] shadow-[inset_2px_0_0_#2fe39a]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <ProfileAvatar src={it.logo || null} name={it.symbol || "?"} className="h-7 w-7" rounded="rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="truncate font-mono text-xs font-semibold text-white">${it.symbol}</span>
                          <VerifiedBadge verified={it.verified} compact />
                          {watch.list.includes(it.token) && <span className="text-[10px] text-amber-600">★</span>}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <BrandLogo brand={it.chain === "solana" ? "solana" : "robinhood"} className="h-2.5 w-2.5 rounded-full" />
                          {fmtUsd(it.marketCapUsd)}
                        </div>
                      </div>
                      <span className={`font-mono text-[11px] ${pctClass(it.change24h)}`}>{fmtPct(it.change24h)}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="hidden border-t border-white/[0.06] px-3 py-2 text-[10px] text-zinc-500 lg:block">
            <kbd className="font-mono text-zinc-600">J/K</kbd> move · <kbd className="font-mono text-zinc-600">B/S</kbd> side ·{" "}
            <kbd className="font-mono text-zinc-600">1-3</kbd> amount · <kbd className="font-mono text-zinc-600">?</kbd> help
          </div>
        </aside>

        {current ? (
          <CoinPanels key={current.token} item={current} intent={live} watched={watch.list.includes(current.token)} side={side} />
        ) : (
          <div className="card order-1 p-10 text-center text-sm text-zinc-500 lg:order-2 lg:col-span-2">
            {market === null ? "Loading the market…" : "No profile coins yet. "}
            {market !== null && (
              <Link href="/create" className="text-pink underline underline-offset-2">
                Launch one →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── The open coin: header + chart (center) and trade panel (right) ──────────

interface RobinhoodDetail {
  token: string;
  decimals: number;
  curveAddress: string;
  pairToken: string;
  phase: number;
  marketCapUsd: number | null;
  marketCapEth: number | null;
  dex?: { url: string } | null;
  curve: { quoteReserve: string; tokenReserve: string; sellableTokens: string; feeBps: string; creatorTaxBps: string; graduated: boolean } | null;
}
interface SolanaDetail {
  complete: boolean;
  curve: { virtualTokenReserves: string; virtualSolReserves: string } | null;
}

function useCoinDetail(item: MarketItem) {
  const [rh, setRh] = useState<RobinhoodDetail | null>(null);
  const [sol, setSol] = useState<SolanaDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    const url = item.chain === "solana" ? `/api/pumpfun/coin?mint=${item.token}` : `/api/v2/token?address=${item.token}`;
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return setFailed(true);
        if (item.chain === "solana") setSol(d);
        else setRh(d);
      })
      .catch(() => setFailed(true));
  }, [item.chain, item.token]);
  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load]);
  return { rh, sol, failed, reload: load };
}

function CoinPanels({ item, intent, watched, side }: { item: MarketItem; intent?: TradeIntent; watched: boolean; side: "buy" | "sell" }) {
  const { rh, sol, failed, reload } = useCoinDetail(item);
  const [copied, setCopied] = useState(false);
  const link = coinLink(item);
  const solana = item.chain === "solana";
  const pairToken = ((rh?.pairToken || zeroAddress) as Address);
  const onCurve = !!rh && rh.phase === 0 && !!rh.curve && !rh.curve.graduated && !rh.dex;

  return (
    <>
      <section className="order-1 min-w-0 space-y-4 lg:order-2">
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <ProfileAvatar src={item.logo || null} name={item.symbol || "?"} className="h-12 w-12" rounded="rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-lg font-semibold text-white">{item.name || item.symbol}</span>
                <span className="font-mono text-sm text-pink">${item.symbol}</span>
                <VerifiedBadge verified={item.verified} />
                <PairChip pair={item.pair} />
                {watched && <span className="text-xs text-amber-600">★</span>}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <BrandLogo brand={solana ? "solana" : "robinhood"} className="h-3 w-3 rounded-full" />
                  {solana ? "Solana · Pump.fun" : "Robinhood Chain · Pons"}
                </span>
                {item.handle && <span>@{item.handle}</span>}
                <button
                  onClick={() =>
                    navigator.clipboard?.writeText(item.token).then(
                      () => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      },
                      () => {},
                    )
                  }
                  className="font-mono transition hover:text-white"
                >
                  CA {item.token.slice(0, 6)}…{item.token.slice(-4)} {copied ? "✓" : "⧉"}
                </button>
                <Link href={link.href} {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})} className="hover:text-white">
                  Full page ↗
                </Link>
              </div>
            </div>
            <div className="flex w-full gap-5 sm:w-auto sm:text-right">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">MC</div>
                <div className="font-mono text-base font-semibold text-white">{fmtUsd(item.marketCapUsd)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">24h</div>
                <div className={`font-mono text-base font-semibold ${pctClass(item.change24h)}`}>{fmtPct(item.change24h)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Curve</div>
                <div className="font-mono text-base font-semibold text-white">
                  {item.progress != null ? `${(item.progress * 100).toFixed(1)}%` : item.graduated ? "DEX" : "—"}
                </div>
              </div>
            </div>
          </div>
          {item.progress != null && (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full" style={{ width: `${Math.max(2, item.progress * 100)}%`, background: "linear-gradient(90deg,#9aa3ff,#2fe39a)" }} />
            </div>
          )}
        </div>

        {solana ? (
          <div className="card overflow-hidden p-0">
            <iframe
              src={`https://dexscreener.com/solana/${item.token}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=5`}
              title={`${item.symbol} chart`}
              className="h-[420px] w-full border-0 lg:h-[calc(100dvh-420px)] lg:min-h-[420px]"
              loading="lazy"
            />
          </div>
        ) : (
          <PriceChartV2
            token={item.token}
            marketCapUsd={rh?.marketCapUsd ?? item.marketCapUsd}
            marketCapEth={rh?.marketCapEth ?? null}
            quoteSymbol={item.pair?.symbol ?? "ETH"}
          />
        )}
      </section>

      <aside className="order-2 space-y-4 lg:order-3">
        <div className="hidden items-center justify-between text-[11px] text-zinc-500 lg:flex">
          <span>
            Side <span className={side === "buy" ? "text-up" : "text-down"}>{side.toUpperCase()}</span>
          </span>
          <span>B / S · 1 2 3</span>
        </div>
        {failed && !rh && !sol ? (
          <div className="card p-5 text-sm text-zinc-500">Couldn’t load this coin right now.</div>
        ) : solana ? (
          sol ? (
            <SolanaTradeWidget mint={item.token} symbol={item.symbol} reserves={sol.complete ? null : sol.curve} onTraded={reload} intent={intent} />
          ) : (
            <div className="card h-80 animate-pulse" />
          )
        ) : !rh ? (
          <div className="card h-80 animate-pulse" />
        ) : onCurve && rh.curve ? (
          <CurveTradeWidget
            curveAddress={rh.curveAddress as Address}
            token={rh.token as Address}
            symbol={item.symbol}
            decimals={rh.decimals}
            pairToken={pairToken}
            curve={rh.curve}
            intent={intent}
          />
        ) : (
          <div className="card p-5 text-sm text-zinc-600">
            <div className="font-medium text-zinc-700">Trading</div>
            <p className="mt-2">This coin has graduated off the bonding curve and trades on its DEX pool.</p>
            {rh.dex?.url && (
              <a href={rh.dex.url} target="_blank" rel="noreferrer" className="btn-brand mt-3 inline-flex">
                Trade on DEX ↗
              </a>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
