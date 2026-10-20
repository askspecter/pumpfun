import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import { isSolanaAddress } from "@/lib/solana";
import { solUsd } from "@/lib/sol-price";
import { readCurve } from "@/lib/pumpfun/curve";
import { pumpGet } from "@/lib/pumpfun/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LaunchRecordLite {
  chain?: string;
  token: string;
  name?: string;
  symbol?: string;
  logo?: string;
  handle?: string;
  source?: "fomo" | "pumpfun";
  twitter?: string;
  telegram?: string;
  website?: string;
  deployer?: string;
  createdAt?: number;
}

async function launchRecord(mint: string): Promise<LaunchRecordLite | null> {
  const kv = getKv();
  if (!kv) return null;
  const raw = (await kv.lrange<LaunchRecordLite | string>("fomo:launches", 0, 199).catch(() => [])) ?? [];
  for (const r of raw) {
    const rec = typeof r === "string" ? (JSON.parse(r) as LaunchRecordLite) : r;
    if (rec?.token === mint) return rec;
  }
  return null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * GET /api/pumpfun/coin?mint=…
 * One Solana profile coin: on-chain bonding-curve state (price, market cap,
 * progress), Pump.fun metadata when reachable, and the NOIR launch record.
 */
export async function GET(req: Request) {
  const mint = new URL(req.url).searchParams.get("mint") ?? "";
  if (!isSolanaAddress(mint)) return NextResponse.json({ error: "Invalid mint address." }, { status: 400 });

  const [curve, pump, record, usd] = await Promise.all([
    readCurve(mint).catch(() => null),
    pumpGet(`/coins/${mint}`)
      .then((r) => (r?.ok ? (r.json() as Promise<Record<string, unknown>>) : null))
      .catch(() => null),
    launchRecord(mint),
    solUsd(),
  ]);

  if (!curve && !pump && !record) {
    return NextResponse.json({ error: "Couldn’t find this coin on Pump.fun." }, { status: 404 });
  }

  const pumpMcUsd = typeof pump?.usd_market_cap === "number" ? (pump.usd_market_cap as number) : null;
  const marketCapSol = curve?.marketCapSol ?? (typeof pump?.market_cap === "number" ? (pump.market_cap as number) : null);
  const marketCapUsd = marketCapSol !== null && usd ? marketCapSol * usd : pumpMcUsd;

  return NextResponse.json({
    mint,
    name: record?.name || str(pump?.name) || "Unnamed",
    symbol: record?.symbol || str(pump?.symbol),
    logo: record?.logo || str(pump?.image_uri),
    description: str(pump?.description),
    creator: str(pump?.creator) || record?.deployer || "",
    handle: record?.handle ?? null,
    source: record?.source ?? null,
    twitter: record?.twitter || str(pump?.twitter) || null,
    telegram: record?.telegram || str(pump?.telegram) || null,
    website: record?.website || str(pump?.website) || null,
    createdAt: record?.createdAt ?? (typeof pump?.created_timestamp === "number" ? pump.created_timestamp : null),
    solUsd: usd,
    priceSol: curve?.priceSol ?? null,
    priceUsd: curve && usd ? curve.priceSol * usd : null,
    marketCapSol,
    marketCapUsd,
    complete: curve?.complete ?? pump?.complete === true,
    progress: curve?.progress ?? null,
    curve,
  });
}
