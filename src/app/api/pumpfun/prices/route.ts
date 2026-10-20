import { NextResponse } from "next/server";
import { isSolanaAddress } from "@/lib/solana";
import { solUsd } from "@/lib/sol-price";
import { readCurves } from "@/lib/pumpfun/curve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/pumpfun/prices?mints=a,b,c
 * Market caps for Solana profile coins, read from their bonding curves in one
 * RPC call. Shape matches /api/v2/prices so the feed can merge both.
 */
export async function GET(req: Request) {
  const mints = (new URL(req.url).searchParams.get("mints") ?? "")
    .split(",")
    .filter(isSolanaAddress)
    .slice(0, 100);
  if (mints.length === 0) return NextResponse.json({ prices: {} });

  try {
    const [curves, usd] = await Promise.all([readCurves(mints), solUsd()]);
    const prices: Record<string, { marketCapSol: number; marketCapUsd: number | null }> = {};
    for (const [mint, c] of Object.entries(curves)) {
      prices[mint] = { marketCapSol: c.marketCapSol, marketCapUsd: usd ? c.marketCapSol * usd : null };
    }
    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ prices: {} });
  }
}
