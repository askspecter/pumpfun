import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import { cleanPumpId, resolvePumpProfile, PumpResolveError, type PumpProfile } from "@/lib/pumpfun/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/pumpfun/profile/{usernameOrAddress}
 * Resolve a Pump.fun profile to its public data + Solana wallet. Cached in KV
 * (when configured) so repeat lookups don't hammer Pump.fun.
 */
const CACHE_TTL_SECONDS = 60 * 30; // 30m
const cacheKey = (id: string) => `pumpfun:profile:${id.toLowerCase()}`;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = cleanPumpId(decodeURIComponent(params.id ?? ""));
  if (id.length < 2) {
    return NextResponse.json({ error: "Enter a Pump.fun username or wallet address." }, { status: 400 });
  }

  const kv = getKv();
  if (kv) {
    try {
      const cached = await kv.get<PumpProfile>(cacheKey(id));
      if (cached) return NextResponse.json({ profile: cached, cached: true });
    } catch {
      // cache is best-effort
    }
  }

  try {
    const profile = await resolvePumpProfile(id);
    if (kv) {
      try {
        await kv.set(cacheKey(id), profile, { ex: CACHE_TTL_SECONDS });
      } catch {
        // ignore cache write failures
      }
    }
    return NextResponse.json({ profile, cached: false });
  } catch (err) {
    if (err instanceof PumpResolveError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to resolve the profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
