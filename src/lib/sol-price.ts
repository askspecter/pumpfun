/**
 * SOL/USD spot price, cached in-process for a minute; falls back to the last
 * value seen (or null) so a flaky feed never breaks a page. Server-side only.
 */
let cache: { usd: number; at: number } | null = null;

export async function solUsd(): Promise<number | null> {
  if (cache && Date.now() - cache.at < 60_000) return cache.usd;
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { data?: { amount?: string } };
    const usd = Number(data?.data?.amount);
    if (Number.isFinite(usd) && usd > 0) {
      cache = { usd, at: Date.now() };
      return usd;
    }
  } catch {
    // fall through to last-known
  }
  return cache?.usd ?? null;
}
