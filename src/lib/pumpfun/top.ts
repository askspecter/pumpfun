import { isSolanaAddress } from "@/lib/solana";
import { pumpGet, type PumpAttempt } from "./http";
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

const COIN_SCAN = 60;
const CREATOR_LIMIT = 24;

/** Coin listings to try, best first; later ones are fallbacks if Pump.fun renames things. */
const COIN_LISTS = [
  `/coins?offset=0&limit=${COIN_SCAN}&sort=market_cap&order=DESC&includeNsfw=false`,
  `/coins/currently-live?offset=0&limit=${COIN_SCAN}&includeNsfw=false`,
  `/coins/for-you?offset=0&limit=${COIN_SCAN}&includeNsfw=false`,
];

function rowsOf(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const obj = data as { coins?: unknown; data?: unknown } | null;
  if (Array.isArray(obj?.coins)) return obj!.coins as Record<string, unknown>[];
  if (Array.isArray(obj?.data)) return obj!.data as Record<string, unknown>[];
  return [];
}

async function topCoinCreators(log?: PumpAttempt[]): Promise<string[]> {
  for (const path of COIN_LISTS) {
    const res = await pumpGet(path, log);
    if (!res?.ok) continue;
    const rows = rowsOf(await res.json().catch(() => null));
    const creators: string[] = [];
    for (const row of rows) {
      const c = row?.creator;
      if (isSolanaAddress(c) && !creators.includes(c)) creators.push(c);
      if (creators.length >= CREATOR_LIMIT) break;
    }
    if (creators.length > 0) return creators;
  }
  return [];
}

/** Top Pump.fun profiles by followers. Returns [] when Pump.fun is unreachable. */
export async function fetchTopPumpProfiles(limit = 20, log?: PumpAttempt[]): Promise<PumpProfile[]> {
  const creators = await topCoinCreators(log);
  const settled = await Promise.allSettled(creators.map((c, i) => resolvePumpProfile(c, i < 2 ? log : undefined)));
  return settled
    .filter((r): r is PromiseFulfilledResult<PumpProfile> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))
    .slice(0, limit);
}
