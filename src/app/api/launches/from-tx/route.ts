import { NextResponse } from "next/server";
import { parseEventLogs } from "viem";
import { ponsClient } from "@/lib/pons/reader";
import { v2TokenLaunchedEvent } from "@/lib/pons/abisV2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/launches/from-tx  { txHash, name, symbol, logo, handle, source, … }
 * Server-side fallback for recording a Robinhood launch: when the user's
 * browser can't read the receipt (flaky RPC on their network), the server
 * reads it, finds the new token, and records it through /api/launches.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const hash = body.txHash;
  if (typeof hash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    return NextResponse.json({ error: "txHash is required." }, { status: 400 });
  }

  let receipt;
  try {
    receipt = await ponsClient().waitForTransactionReceipt({ hash: hash as `0x${string}`, timeout: 45_000 });
  } catch {
    return NextResponse.json({ error: "Transaction not confirmed yet." }, { status: 504 });
  }
  const ev = parseEventLogs({ abi: [v2TokenLaunchedEvent], logs: receipt.logs }).find(
    (l) => (l.args as { token?: string })?.token,
  );
  const args = ev?.args as { token?: string; curve?: string } | undefined;
  if (!args?.token) return NextResponse.json({ error: "No launch found in this transaction." }, { status: 404 });

  const res = await fetch(new URL("/api/launches", req.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, chain: "robinhood", token: args.token, curve: args.curve, deployer: receipt.from }),
  });
  return NextResponse.json({ ok: res.ok, token: args.token, curve: args.curve });
}
