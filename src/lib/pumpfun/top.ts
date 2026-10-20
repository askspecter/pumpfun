import { isSolanaAddress } from "@/lib/solana";
import { resolvePumpProfile, type PumpProfile } from "./resolve";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Top Pump.fun creators (server-side only).
 *
 *  Pump.fun has no public "top profiles" endpoint, so we take the creators of
 *  the highest market-cap coins, resolve each creator's public profile, and
 *  rank them by followers. Uses the same unofficial frontend API as
 *  resolve.ts; every field is read defensively.
 * ─────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = (process.env.PUMPFUN_API_BASE_URL || "https://frontend-api-v3.pump.fun").replace(/\/+$/, "");

/** How many top coins to scan for creators, and how many creators to resolve. */
const COIN_SCAN = 60;
const CREATOR_LIMIT = 24;

async function topCoinCreators(): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(
      `${BASE_URL}/coins?offset=0&limit=${COIN_SCAN}&sort=market_cap&order=DESC&includeNsfw=false`,
      {
        headers: { accept: "application/json", origin: "https://pump.fun", referer: "https://pump.fun/" },
        signal: controller.signal,
        cache: "no-store",
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    const rows = Array.isArray(data)
      ? data
      : Array.isArray((data as { coins?: unknown[] })?.coins)
        ? (data as { coins: unknown[] }).coins
        : [];
    const creators: string[] = [];
    for (const row of rows as Record<string, unknown>[]) {
      const c = row?.creator;
      if (isSolanaAddress(c) && !creators.includes(c)) creators.push(c);
      if (creators.length >= CREATOR_LIMIT) break;
    }
    return creators;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/** Top Pump.fun profiles by followers. Returns [] when Pump.fun is unreachable. */
export async function fetchTopPumpProfiles(limit = 20): Promise<PumpProfile[]> {
  const creators = await topCoinCreators();
  const settled = await Promise.allSettled(creators.map((c) => resolvePumpProfile(c)));
  return settled
    .filter((r): r is PromiseFulfilledResult<PumpProfile> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))
    .slice(0, limit);
}
