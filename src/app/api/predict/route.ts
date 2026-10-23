import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import {
  callMessage,
  coinId,
  getCalls,
  isLocked,
  observe,
  placeCall,
  playerId,
  playerStats,
  roundEnd,
  roundOf,
  settle,
  validToken,
  verifyCall,
  type Chain,
  type Side,
} from "@/lib/predict";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live market cap (USD) for a coin, from the same endpoints the feed uses. */
async function liveMc(origin: string, chain: Chain, token: string): Promise<number | null> {
  try {
    const url =
      chain === "solana" ? `${origin}/api/pumpfun/prices?mints=${token}` : `${origin}/api/v2/prices?tokens=${token}`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
    const prices = ((await res.json()) as { prices?: Record<string, { marketCapUsd?: number | null }> }).prices ?? {};
    const row = prices[chain === "solana" ? token : token.toLowerCase()];
    const mc = row?.marketCapUsd;
    return typeof mc === "number" && mc > 0 ? mc : null;
  } catch {
    return null;
  }
}

function parse(req: Request, src: URLSearchParams | Record<string, unknown>) {
  const get = (n: string) => (src instanceof URLSearchParams ? src.get(n) : (src[n] as string | undefined)) ?? "";
  const chain: Chain = get("chain") === "solana" ? "solana" : "robinhood";
  const token = String(get("token"));
  return { chain, token, origin: new URL(req.url).origin, get };
}

/**
 * GET /api/predict?chain=&token=&address=
 * The coin's current round: tallies, time left, the viewer's call and points,
 * and the result of the previous round (settling it if needed).
 */
export async function GET(req: Request) {
  const { chain, token, origin, get } = parse(req, new URL(req.url).searchParams);
  if (!validToken(chain, token)) return NextResponse.json({ error: "Unknown coin." }, { status: 400 });
  if (!getKv()) return NextResponse.json({ error: "Predictions aren't available right now." }, { status: 503 });

  const coin = coinId(chain, token);
  const round = roundOf();
  const mc = await liveMc(origin, chain, token);
  if (mc) await observe(coin, mc);
  const last = await settle(coin, round - 1).catch(() => null);

  const calls = await getCalls(coin, round);
  const tally = { up: 0, down: 0 };
  for (const c of Object.values(calls)) tally[c.side]++;

  const address = get("address");
  const player = address ? playerId(address) : null;
  const mine = player ? (calls[player] ?? null) : null;
  const stats = player ? await playerStats(player) : null;

  return NextResponse.json({
    round,
    endsAt: roundEnd(round),
    locked: isLocked(round),
    mc,
    tally,
    mine,
    stats,
    last,
  });
}

/**
 * POST /api/predict  { chain, token, side, address, signature }
 * Place a signed UP/DOWN call for the current round.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { chain, token, origin } = parse(req, body);
  const side = body.side === "down" ? "down" : body.side === "up" ? "up" : null;
  const address = String(body.address ?? "");
  const signature = String(body.signature ?? "");
  const round = Number(body.round);
  if (!validToken(chain, token) || !side || !address || !signature) {
    return NextResponse.json({ error: "Missing call details." }, { status: 400 });
  }
  if (!getKv()) return NextResponse.json({ error: "Predictions aren't available right now." }, { status: 503 });
  if (round !== roundOf()) return NextResponse.json({ error: "That round has ended. Refresh and call again." }, { status: 409 });
  if (isLocked(round)) return NextResponse.json({ error: "Calls are closed for the final hour of this round." }, { status: 409 });

  const ok = await verifyCall(chain, address, callMessage(chain, token, round, side as Side), signature);
  if (!ok) return NextResponse.json({ error: "The wallet signature didn't match." }, { status: 401 });

  const mc = await liveMc(origin, chain, token);
  if (!mc) return NextResponse.json({ error: "Couldn't read this coin's market cap. Try again in a moment." }, { status: 503 });

  const coin = coinId(chain, token);
  await observe(coin, mc);
  const placed = await placeCall(coin, round, playerId(address), { side: side as Side, mc, at: Date.now() });
  if (!placed) return NextResponse.json({ error: "You already made your call this round." }, { status: 409 });
  return NextResponse.json({ ok: true, call: { side, mc } });
}
