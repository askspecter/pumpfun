import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import { fetchLeaderboard } from "@/lib/fomo/resolve";
import { fetchTopPumpProfiles } from "@/lib/pumpfun/top";
import type { PumpAttempt } from "@/lib/pumpfun/http";

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
 * ranked by followers. Cached (KV + memory): 30 minutes when both sources
 * answered, 3 minutes when one failed, so a recovered source shows up fast.
 *
 * GET /api/top-profiles?debug=1 skips the cache and reports what each
 * upstream returned (status codes only), to diagnose a missing source.
 */
const TTL_FULL = 60 * 30;
const TTL_PARTIAL = 60 * 3;
const KEY = "noir:top-profiles:v2";
type Payload = { profiles: TopProfile[]; sources: { fomo: number; pumpfun: number } };
let memo: { until: number; data: Payload } | null = null;

async function build(log?: PumpAttempt[]): Promise<Payload & { fomoError?: string }> {
  const [fomo, pump] = await Promise.allSettled([fetchLeaderboard("30d", 100), fetchTopPumpProfiles(20, log)]);

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
  return {
    profiles,
    sources: { fomo: fomoProfiles.length, pumpfun: pumpProfiles.length },
    fomoError: fomo.status === "rejected" ? String((fomo.reason as Error)?.message ?? fomo.reason) : undefined,
  };
}

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("debug") === "1") {
    const log: PumpAttempt[] = [];
    const data = await build(log);
    return NextResponse.json({ sources: data.sources, fomoError: data.fomoError ?? null, pumpfunRequests: log });
  }

  if (memo && Date.now() < memo.until) return NextResponse.json(memo.data);

  const kv = getKv();
  if (kv) {
    try {
      const cached = await kv.get<Payload>(KEY);
      if (cached?.profiles?.length) {
        memo = { until: Date.now() + TTL_PARTIAL * 1000, data: cached };
        return NextResponse.json(cached);
      }
    } catch {
      // cache is best-effort
    }
  }

  const { fomoError: _ignored, ...data } = await build();
  if (data.profiles.length > 0) {
    const ttl = data.sources.fomo > 0 && data.sources.pumpfun > 0 ? TTL_FULL : TTL_PARTIAL;
    memo = { until: Date.now() + ttl * 1000, data };
    if (kv) await kv.set(KEY, data, { ex: ttl }).catch(() => {});
  }
  return NextResponse.json(data);
}
