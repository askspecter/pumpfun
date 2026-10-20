import { NextResponse } from "next/server";
import { buildPumpTradeTx, PumpLaunchError } from "@/lib/pumpfun/launch";
import { isSolanaAddress } from "@/lib/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/pumpfun/trade-tx
 * Body: { publicKey, mint, action: "buy"|"sell", amount, denominatedInSol?, slippage? }
 * Returns { tx }: a base64 unsigned VersionedTransaction for the user's wallet.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { publicKey, mint, action } = body;
  if (!isSolanaAddress(publicKey) || !isSolanaAddress(mint)) {
    return NextResponse.json({ error: "publicKey and mint must be Solana addresses." }, { status: 400 });
  }
  if (action !== "buy" && action !== "sell") {
    return NextResponse.json({ error: "action must be buy or sell." }, { status: 400 });
  }

  let amount: number | string;
  if (typeof body.amount === "string" && /^\d{1,3}(\.\d+)?%$/.test(body.amount)) {
    if (action !== "sell") return NextResponse.json({ error: "Percent amounts are for sells." }, { status: 400 });
    amount = body.amount;
  } else {
    const n = Number(body.amount);
    if (!Number.isFinite(n) || n <= 0) return NextResponse.json({ error: "Enter an amount." }, { status: 400 });
    if (action === "buy" && n > 100) return NextResponse.json({ error: "Max 100 SOL per trade." }, { status: 400 });
    amount = n;
  }
  const slippage = Math.min(Math.max(Number(body.slippage) || 10, 1), 50);

  try {
    const tx = await buildPumpTradeTx({
      publicKey,
      mint,
      action,
      amount,
      denominatedInSol: action === "buy" ? true : body.denominatedInSol === true,
      slippage,
      priorityFee: 0.0005,
    });
    return NextResponse.json({ tx });
  } catch (err) {
    if (err instanceof PumpLaunchError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Couldn't build the trade." }, { status: 500 });
  }
}
