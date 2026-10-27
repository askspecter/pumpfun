import { NextResponse } from "next/server";
import { topPlayers } from "@/lib/predict";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/predict/leaderboard - top NOIR Predict players by points. */
export async function GET() {
  return NextResponse.json({ players: await topPlayers(25) });
}
