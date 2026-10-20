import { isSolanaAddress } from "@/lib/solana";
import { pumpGet, type PumpAttempt } from "./http";
import { resolvePumpProfile, type PumpProfile } from "./resolve";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Top Pump.fun creators (server-side only).
 *
 *  Pump.fun has no public "top profiles" endpoint. We build a wide pool of
 *  creators from several coin listings (the market-cap list is often
 *  Cloudflare-blocked for servers, so the others matter), add any featured
 *  profiles from FEATURED_PUMPFUN, resolve each profile, and rank by
 *  followers. Uses the unofficial frontend API; fields are read defensively.
 * ─────────────────────────────────────────────────────────────────────────
 */

const POOL_LIMIT = 60;
const BATCH = 10;

const COIN_LISTS = [
  "/coins?offset=0&limit=100&sort=market_cap&order=DESC&includeNsfw=false",
  "/coins?offset=0&limit=100&sort=last_trade_timestamp&order=DESC&includeNsfw=false",
  "/coins/currently-live?offset=0&limit=100&includeNsfw=false",
  "/coins/for-you?offset=0&limit=100&includeNsfw=false",
  "/coins/king-of-the-hill?includeNsfw=false",
];

/** Featured Pump.fun profiles (wallets or usernames), comma-separated. */
export function featuredPumpIds(): string[] {
  return (process.env.FEATURED_PUMPFUN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function rowsOf(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const obj = data as { coins?: unknown; data?: unknown; creator?: unknown } | null;
  if (Array.isArray(obj?.coins)) return obj!.coins as Record<string, unknown>[];
  if (Array.isArray(obj?.data)) return obj!.data as Record<string, unknown>[];
  if (obj && typeof obj === "object" && obj.creator) return [obj as Record<string, unknown>];
  return [];
}

async function creatorPool(log?: PumpAttempt[]): Promise<string[]> {
  const pool: string[] = [];
  const lists = await Promise.all(COIN_LISTS.map((path) => pumpGet(path, log)));
  for (const res of lists) {
    if (!res?.ok) continue;
    for (const row of rowsOf(await res.json().catch(() => null))) {
      const c = row?.creator;
      if (isSolanaAddress(c) && !pool.includes(c)) pool.push(c);
    }
  }
  return pool.slice(0, POOL_LIMIT);
}

/** Resolve profiles a batch at a time so Pump.fun doesn't rate-limit us. */
async function resolveAll(ids: string[], log?: PumpAttempt[]): Promise<PumpProfile[]> {
  const out: PumpProfile[] = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const settled = await Promise.allSettled(
      ids.slice(i, i + BATCH).map((id, k) => resolvePumpProfile(id, i + k < 2 ? log : undefined)),
    );
    for (const r of settled) if (r.status === "fulfilled") out.push(r.value);
  }
  return out;
}

/** Top Pump.fun profiles by followers. Returns [] when Pump.fun is unreachable. */
export async function fetchTopPumpProfiles(limit = 20, log?: PumpAttempt[]): Promise<PumpProfile[]> {
  const ids = [...featuredPumpIds(), ...(await creatorPool(log))];
  const seen = new Set<string>();
  return (await resolveAll(ids, log))
    .filter((p) => (seen.has(p.address) ? false : (seen.add(p.address), true)))
    .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))
    .slice(0, limit);
}
