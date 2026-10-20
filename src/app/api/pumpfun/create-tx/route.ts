import { NextResponse } from "next/server";
import { buildPumpCreateTx, PumpLaunchError } from "@/lib/pumpfun/launch";
import { isSolanaAddress } from "@/lib/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/pumpfun/create-tx
 * Body: { publicKey, mint, name, symbol, uri, amountSol?, slippage?, priorityFee? }
 * Returns { tx } — a base64 unsigned VersionedTransaction that the browser signs
 * with the mint keypair and the user's wallet.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { publicKey, mint, uri } = body;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 32) : "";
  const symbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase().slice(0, 10) : "";
  const number = (v: unknown, fallback: number, min: number, max: number) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
  };

  if (!isSolanaAddress(publicKey) || !isSolanaAddress(mint)) {
    return NextResponse.json({ error: "publicKey and mint must be Solana addresses." }, { status: 400 });
  }
  if (typeof uri !== "string" || !/^https:\/\//.test(uri) || uri.length > 300) {
    return NextResponse.json({ error: "A metadata URI is required." }, { status: 400 });
  }
  if (!name || symbol.length < 2) {
    return NextResponse.json({ error: "A coin name and ticker are required." }, { status: 400 });
  }

  try {
    const tx = await buildPumpCreateTx({
      publicKey,
      mint,
      name,
      symbol,
      uri,
      amountSol: number(body.amountSol, 0, 0, 100),
      slippage: number(body.slippage, 10, 1, 50),
      priorityFee: number(body.priorityFee, 0.0005, 0, 0.01),
    });
    return NextResponse.json({ tx });
  } catch (err) {
    if (err instanceof PumpLaunchError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Couldn't build the launch transaction." }, { status: 500 });
  }
}
