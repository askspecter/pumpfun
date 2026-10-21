import { NextResponse } from "next/server";
import { isAddress, zeroAddress, type Address } from "viem";
import { canLaunch, launchFee, previewLaunchEconomics } from "@/lib/pons/readerV2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v2/launch-prep?account=0x…&config=0&pair=0x…
 * The three reads a Pons v2 launch needs (whitelist, pinned economics, launch
 * fee), done server-side so a launch doesn't depend on the user's own network
 * reaching the Robinhood RPC. The browser falls back to reading directly.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const account = q.get("account") ?? "";
  const pair = q.get("pair") || zeroAddress;
  const config = q.get("config") ?? "0";
  if (!isAddress(account) || !isAddress(pair) || !/^\d{1,6}$/.test(config)) {
    return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
  }
  try {
    const [allowed, economics, fee] = await Promise.all([
      canLaunch(account as Address).catch(() => null),
      previewLaunchEconomics(BigInt(config), pair as Address),
      launchFee(),
    ]);
    return NextResponse.json({ allowed, economics, fee: fee.toString() });
  } catch (err) {
    const message = err instanceof Error ? err.message.split("\n")[0] : "Read failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
