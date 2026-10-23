import { NextResponse } from "next/server";
import { getMarket } from "@/lib/markets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/markets
 * Every profile coin launched through NOIR on both chains, with USD market
 * cap, 24h change, curve progress, pair asset and creator verification.
 * Cached ~30s server-side.
 */
export async function GET() {
  try {
    return NextResponse.json(await getMarket());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load the market.";
    return NextResponse.json({ error: message, items: [], updatedAt: Date.now() }, { status: 502 });
  }
}
