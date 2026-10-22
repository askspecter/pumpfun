import { isAddress, parseAbi, zeroAddress, type Address } from "viem";
import { getKv } from "@/lib/kv";
import { readLaunches, type LaunchRecord } from "@/lib/launches";
import { dexQuotes, type DexQuote } from "@/lib/dexscreener";
import { ethUsd } from "@/lib/eth-price";
import { solUsd } from "@/lib/sol-price";
import { readCurves, type CurveState as PumpCurve } from "@/lib/pumpfun/curve";
import { getCurveState, getLaunchedTokenV2, getQuoteMeta, type LaunchedTokenV2 } from "@/lib/pons/readerV2";
import { ponsClient } from "@/lib/pons/reader";
import { PONS_V2, V2_QUOTE_TOKENS } from "@/lib/pons/registry";
import { verifyMany, type Verification } from "@/lib/verify";
import type { LaunchChain } from "@/lib/solana";
import type { ProfileSource } from "@/lib/profile-source";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  NOIR Markets (server-side only).
 *
 *  One snapshot of every profile coin launched through NOIR, on both chains:
 *  USD market cap, 24h change, bonding-curve progress, the asset it's paired
 *  with, and its creator verification. Prices come from the DEX pool when one
 *  exists, else from the bonding curve.
 *
 *  24h change comes from DexScreener for coins with a pool. Curve coins have
 *  no price history API, so we keep hourly market-cap snapshots in KV and
 *  measure against the oldest one inside the last 24h.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface MarketItem {
  chain: LaunchChain;
  token: string;
  name: string;
  symbol: string;
  logo: string;
  handle: string | null;
  source: ProfileSource | null;
  createdAt: number;
  /** On-chain creator (Pons deployer / Pump.fun curve creator). */
  creator: string | null;
  /** On-chain creator-fee recipient (Pons); the creator on Pump.fun. */
  feeRecipient: string | null;
  /** The asset a Robinhood coin is paired with, when it isn't native ETH. */
  pair: { symbol: string; name: string; address: string } | null;
  marketCapUsd: number | null;
  /** 0..1 bonding-curve progress; null once the coin trades on a DEX. */
  progress: number | null;
  graduated: boolean;
  /** Percent change over the last 24h (12.5 = +12.5%). */
  change24h: number | null;
  verified: Verification;
}

export interface MarketSnapshot {
  items: MarketItem[];
  updatedAt: number;
}

const CACHE_KEY = "markets:v1";
const CACHE_TTL = 30; // seconds
const SNAPS_KEY = "markets:snaps";
const SNAP_EVERY_MS = 60 * 60 * 1000;
const SNAP_KEEP_MS = 26 * 60 * 60 * 1000;

const erc20Supply = parseAbi(["function totalSupply() view returns (uint256)"]);
const PAIRS = new Map(V2_QUOTE_TOKENS.map((q) => [q.address.toLowerCase(), q]));
/** Dollar-pegged quotes, priced at $1 when no pool quote is available. */
const STABLES = new Set(["USDG"]);

let memo: MarketSnapshot | null = null;

/** The market, cached ~30s in KV (shared across instances) and in-process. */
export async function getMarket(): Promise<MarketSnapshot> {
  if (memo && Date.now() - memo.updatedAt < CACHE_TTL * 1000) return memo;
  const kv = getKv();
  if (kv) {
    const hit = await kv.get<MarketSnapshot>(CACHE_KEY).catch(() => null);
    if (hit && Date.now() - hit.updatedAt < CACHE_TTL * 1000) return (memo = hit);
  }
  const snapshot = await buildMarket();
  memo = snapshot;
  if (kv) await kv.set(CACHE_KEY, snapshot, { ex: CACHE_TTL }).catch(() => {});
  return snapshot;
}

async function buildMarket(): Promise<MarketSnapshot> {
  const launches = dedupe(await readLaunches());
  const evm = launches.filter((l) => (l.chain ?? "robinhood") === "robinhood");
  const sol = launches.filter((l) => l.chain === "solana");

  const [evmItems, solItems] = await Promise.all([robinhoodItems(evm), solanaItems(sol)]);
  const items = [...evmItems, ...solItems];

  const verdicts = await verifyMany(
    items.map((i) => ({
      chain: i.chain,
      token: i.token,
      handle: i.handle ?? undefined,
      source: i.source ?? undefined,
      creator: i.creator,
      feeRecipient: i.feeRecipient,
    })),
  );
  for (const i of items) i.verified = verdicts[i.token] ?? null;

  await applySnapshots(items);
  return { items, updatedAt: Date.now() };
}

/** A token can be recorded twice (client + server fallback); keep the newest. */
function dedupe(launches: LaunchRecord[]): LaunchRecord[] {
  const seen = new Set<string>();
  return launches.filter((l) => {
    const k = l.token.startsWith("0x") ? l.token.toLowerCase() : l.token;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function baseItem(l: LaunchRecord, chain: LaunchChain): MarketItem {
  return {
    chain,
    token: l.token,
    name: l.name,
    symbol: l.symbol,
    logo: l.logo,
    handle: l.handle?.replace(/^@+/, "") || null,
    source: l.handle ? (l.source ?? "fomo") : null,
    createdAt: l.createdAt,
    creator: null,
    feeRecipient: null,
    pair: null,
    marketCapUsd: null,
    progress: null,
    graduated: false,
    change24h: null,
    verified: null,
  };
}

// ── Robinhood Chain (Pons v2) ────────────────────────────────────────────────

async function robinhoodItems(launches: LaunchRecord[]): Promise<MarketItem[]> {
  if (launches.length === 0) return [];
  const records = await Promise.all(launches.map((l) => getLaunchedTokenV2(l.token as Address).catch(() => null)));
  const pairTokens = [
    ...new Set(records.map((r) => r?.pairToken).filter((p): p is Address => !!p && p !== zeroAddress)),
  ];
  const [usd, dex, pairDex] = await Promise.all([
    ethUsd(),
    dexQuotes(launches.map((l) => l.token)),
    pairTokens.length ? dexQuotes(pairTokens) : Promise.resolve({} as Record<string, DexQuote>),
  ]);

  return Promise.all(
    launches.map(async (l, i) => {
      const item = baseItem(l, "robinhood");
      const rec = records[i];
      if (rec?.exists) {
        // Launches with a dev buy record the LaunchAndBuy router as deployer;
        // the person is the launch record's deployer (the tx sender) then.
        const viaRouter = rec.deployer.toLowerCase() === PONS_V2.launchAndBuy.toLowerCase();
        item.creator = viaRouter ? (isAddress(l.deployer) ? l.deployer : null) : rec.deployer;
        item.feeRecipient = rec.creatorFeeRecipient;
        if (rec.pairToken && rec.pairToken !== zeroAddress) {
          const meta = PAIRS.get(rec.pairToken.toLowerCase());
          item.pair = { symbol: meta?.symbol ?? "TOKEN", name: meta?.name ?? "", address: rec.pairToken };
        }
      }

      // A live DEX pool is the market whenever one exists.
      const quote = dex[l.token.toLowerCase()];
      if (quote?.marketCapUsd) {
        item.marketCapUsd = quote.marketCapUsd;
        item.change24h = quote.change24h;
        item.graduated = true;
        return item;
      }
      if (!rec?.exists) return item;
      if (rec.phase !== 0 || !rec.curve || rec.curve === zeroAddress) {
        item.graduated = true;
        return item;
      }
      const pairUsd = item.pair
        ? (pairDex[item.pair.address.toLowerCase()]?.priceUsd ?? (STABLES.has(item.pair.symbol) ? 1 : null))
        : usd;
      const curve = await curveMarket(l.token as Address, rec).catch(() => null);
      if (curve) {
        item.progress = Math.min(1, curve.progress);
        item.marketCapUsd = pairUsd != null ? curve.marketCapQuote * pairUsd : null;
      }
      return item;
    }),
  );
}

/** Market cap (in whole quote units) and progress from a live Pons curve. */
async function curveMarket(token: Address, rec: LaunchedTokenV2) {
  const native = !rec.pairToken || rec.pairToken === zeroAddress;
  const [state, supplyRaw, meta] = await Promise.all([
    getCurveState(rec.curve),
    ponsClient().readContract({ address: token, abi: erc20Supply, functionName: "totalSupply" }) as Promise<bigint>,
    native ? Promise.resolve({ decimals: 18 }) : getQuoteMeta(rec.curve),
  ]);
  const supply = Number(supplyRaw) / 1e18; // factory tokens are 18-decimals
  // spotPrice is a raw-unit ratio; rescale to whole quote units per whole token.
  const price = state.spotPrice * 10 ** (18 - meta.decimals);
  return { marketCapQuote: price * supply, progress: state.progress };
}

// ── Solana (Pump.fun) ────────────────────────────────────────────────────────

async function solanaItems(launches: LaunchRecord[]): Promise<MarketItem[]> {
  if (launches.length === 0) return [];
  const mints = launches.map((l) => l.token);
  const curves: Record<string, PumpCurve> = {};
  for (let i = 0; i < mints.length; i += 100) {
    Object.assign(curves, await readCurves(mints.slice(i, i + 100)).catch(() => ({})));
  }
  // Graduated (or curve-less) coins trade on PumpSwap/Raydium: price them from the pool.
  const onDex = mints.filter((m) => !curves[m] || curves[m].complete);
  const [usd, dex] = await Promise.all([solUsd(), onDex.length ? dexQuotes(onDex) : Promise.resolve({} as Record<string, DexQuote>)]);

  return launches.map((l) => {
    const item = baseItem(l, "solana");
    const curve = curves[l.token];
    // Pump.fun pays creator fees to the coin's creator.
    item.creator = curve?.creator ?? null;
    item.feeRecipient = item.creator;
    const quote = dex[l.token];
    if (quote?.marketCapUsd) {
      item.marketCapUsd = quote.marketCapUsd;
      item.change24h = quote.change24h;
      item.graduated = true;
    } else if (curve) {
      item.graduated = curve.complete;
      item.progress = curve.complete ? null : curve.progress;
      item.marketCapUsd = usd != null ? curve.marketCapSol * usd : null;
    }
    return item;
  });
}

// ── 24h change from hourly snapshots ────────────────────────────────────────

type Snap = [ts: number, mcUsd: number];

async function applySnapshots(items: MarketItem[]): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  const all = ((await kv.hgetall<Record<string, Snap[]>>(SNAPS_KEY).catch(() => null)) ?? {}) as Record<string, Snap[]>;
  const now = Date.now();
  const updates: Record<string, Snap[]> = {};

  for (const item of items) {
    if (item.marketCapUsd == null) continue;
    const snaps = (Array.isArray(all[item.token]) ? all[item.token] : []).filter((s) => now - s[0] < SNAP_KEEP_MS);

    if (item.change24h == null) {
      // The oldest snapshot inside the 24h window, if it's at least an hour old.
      const base = snaps.find((s) => now - s[0] <= 24 * 60 * 60 * 1000 && now - s[0] >= SNAP_EVERY_MS);
      if (base && base[1] > 0) item.change24h = (item.marketCapUsd / base[1] - 1) * 100;
    }

    const last = snaps[snaps.length - 1];
    if (!last || now - last[0] >= SNAP_EVERY_MS) updates[item.token] = [...snaps, [now, item.marketCapUsd]];
  }

  if (Object.keys(updates).length) await kv.hset(SNAPS_KEY, updates).catch(() => {});
}
