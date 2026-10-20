import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import { fetchLeaderboard } from "@/lib/fomo/resolve";
import { fetchTopPumpProfiles } from "@/lib/pumpfun/top";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One real profile, normalized across fomo.family and Pump.fun. */
export interface TopProfile {
  source: "fomo" | "pumpfun";
  /** fomo handle, or the Pump.fun username. */
  handle: string;
  displayName: string;
  avatar: string | null;
  followers: number | null;
  verified: boolean;
  /** What /create?handle= should receive (Pump.fun: the wallet address). */
  lookup: string;
  url: string;
  /** fomo only: realized PnL over 30d. */
  pnlUsd: number | null;
}

/**
 * GET /api/top-profiles
 * The most-followed real profiles on fomo.family and Pump.fun, merged and
 * ranked by followers. Cached (KV + memory) for 30 minutes so the upstream
 * APIs are hit at most twice an hour.
 */
const TTL_SECONDS = 60 * 30;
const KEY = "noir:top-profiles:v1";
let memo: { at: number; data: { profiles: TopProfile[] } } | null = null;

async function build(): Promise<{ profiles: TopProfile[] }> {
  const [fomo, pump] = await Promise.allSettled([fetchLeaderboard("30d", 100), fetchTopPumpProfiles(20)]);

  const fomoProfiles: TopProfile[] =
    fomo.status === "fulfilled"
      ? fomo.value.traders
          .filter((t) => t.handle)
          .map((t) => ({
            source: "fomo" as const,
            handle: t.handle,
            displayName: t.displayName || t.handle,
            avatar: t.avatar,
            followers: t.followers,
            verified: t.verified,
            lookup: t.handle,
            url: `https://fomo.family/${t.handle}`,
            pnlUsd: t.pnlUsd,
          }))
          .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))
          .slice(0, 20)
      : [];

  const pumpProfiles: TopProfile[] =
    pump.status === "fulfilled"
      ? pump.value.map((p) => ({
          source: "pumpfun" as const,
          handle: p.username,
          displayName: p.username,
          avatar: p.avatar || null,
          followers: p.followers,
          verified: false,
          lookup: p.address,
          url: `https://pump.fun/profile/${p.address}`,
          pnlUsd: null,
        }))
      : [];

  const profiles = [...fomoProfiles, ...pumpProfiles].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
  return { profiles };
}

export async function GET() {
  if (memo && Date.now() - memo.at < TTL_SECONDS * 1000) return NextResponse.json(memo.data);

  const kv = getKv();
  if (kv) {
    try {
      const cached = await kv.get<{ profiles: TopProfile[] }>(KEY);
      if (cached?.profiles?.length) {
        memo = { at: Date.now(), data: cached };
        return NextResponse.json(cached);
      }
    } catch {
      // cache is best-effort
    }
  }

  const data = await build();
  // Only cache a useful answer, so an upstream outage isn't pinned for 30 minutes.
  if (data.profiles.length > 0) {
    memo = { at: Date.now(), data };
    if (kv) await kv.set(KEY, data, { ex: TTL_SECONDS }).catch(() => {});
  }
  return NextResponse.json(data);
}
