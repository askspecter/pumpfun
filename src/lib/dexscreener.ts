/**
 * DEX price for a token that has graduated off its bonding curve. Once a Pons
 * coin graduates, the curve no longer prices it: the market is the DEX pool, so
 * we read price and market cap from DexScreener's public API (no key needed).
 * Cached in-process for 30s; on failure we return the last quote we saw.
 * Server-side only.
 */
const DEX_API = process.env.DEXSCREENER_API_URL || "https://api.dexscreener.com/latest/dex/tokens";
const TTL_MS = 30_000;

export interface DexQuote {
  chainId: string;
  dexId: string;
  pairAddress: string;
  url: string;
  priceUsd: number | null;
  /** Price in the pair's quote token (ETH/WETH for native pairs). */
  priceNative: number | null;
  quoteSymbol: string | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  liquidityUsd: number | null;
}

interface DexPair {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string };
  quoteToken?: { symbol?: string };
  priceNative?: string;
  priceUsd?: string;
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
}

const cache = new Map<string, { quote: DexQuote | null; at: number }>();

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** The deepest pool where this token is the base asset. */
function pick(token: string, pairs: DexPair[]): DexQuote | null {
  const own = pairs.filter((p) => p.baseToken?.address?.toLowerCase() === token);
  if (own.length === 0) return null;
  own.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
  const p = own[0];
  const fdv = num(p.fdv);
  return {
    chainId: p.chainId ?? "",
    dexId: p.dexId ?? "",
    pairAddress: p.pairAddress ?? "",
    url: p.url ?? `https://dexscreener.com/search?q=${token}`,
    priceUsd: num(p.priceUsd),
    priceNative: num(p.priceNative),
    quoteSymbol: p.quoteToken?.symbol ?? null,
    // DexScreener's market cap when it has one, otherwise FDV.
    marketCapUsd: num(p.marketCap) ?? fdv,
    fdvUsd: fdv,
    liquidityUsd: num(p.liquidity?.usd),
  };
}

/** Quotes for up to 30 tokens in one request (DexScreener's batch limit). */
export async function dexQuotes(tokens: string[]): Promise<Record<string, DexQuote>> {
  const out: Record<string, DexQuote> = {};
  const want: string[] = [];
  for (const t of tokens.map((x) => x.toLowerCase())) {
    const hit = cache.get(t);
    if (hit && Date.now() - hit.at < TTL_MS) {
      if (hit.quote) out[t] = hit.quote;
    } else want.push(t);
  }
  for (let i = 0; i < want.length; i += 30) {
    const batch = want.slice(i, i + 30);
    try {
      const res = await fetch(`${DEX_API}/${batch.join(",")}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(`DexScreener ${res.status}`);
      const data = (await res.json()) as { pairs?: DexPair[] | null };
      const pairs = data.pairs ?? [];
      for (const t of batch) {
        const quote = pick(t, pairs);
        cache.set(t, { quote, at: Date.now() });
        if (quote) out[t] = quote;
      }
    } catch {
      // Keep serving the last quote we had for these tokens.
      for (const t of batch) {
        const last = cache.get(t)?.quote;
        if (last) out[t] = last;
      }
    }
  }
  return out;
}

export async function dexQuote(token: string): Promise<DexQuote | null> {
  return (await dexQuotes([token]))[token.toLowerCase()] ?? null;
}
