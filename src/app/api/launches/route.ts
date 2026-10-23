import { NextResponse } from "next/server";
import { isAddress, verifyMessage, type Address } from "viem";
import { getKv } from "@/lib/kv";
import { isSolanaAddress, type LaunchChain } from "@/lib/solana";
import {
  LAUNCHES_KEY as KEY,
  isTokenFor,
  readLaunches,
  safeParse,
  sameId,
  type LaunchRecord,
} from "@/lib/launches";
import { proveRobinhoodLaunch, proveSolanaLaunch } from "@/lib/launch-proof";
import { toSource } from "@/lib/profile-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export type { LaunchRecord };

/** GET /api/launches?limit=48 - newest profile launches (from KV). */
export async function GET(req: Request) {
  const kv = getKv();
  if (!kv) return NextResponse.json({ items: [] });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 48), 1), 100);
  const token = searchParams.get("token"); // optional: fetch one record
  const deployer = searchParams.get("deployer"); // optional: filter by creator

  const all = await readLaunches();
  const chainFilter = searchParams.get("chain"); // optional: "robinhood" | "solana"

  // Single-token lookup (used as an image/metadata fallback on the profile page).
  if (token && (isAddress(token) || isSolanaAddress(token))) {
    const item = all.find((r) => sameId(r.token, token)) ?? null;
    return NextResponse.json({ item });
  }

  const items = all
    .filter((r) => (deployer ? sameId(r.deployer, deployer) : true))
    .filter((r) => (chainFilter ? (r.chain ?? "robinhood") === chainFilter : true))
    .slice(0, limit);

  return NextResponse.json({ items });
}

/**
 * POST /api/launches - record a profile launch made through NOIR.
 * The launch transaction (txHash) must prove the coin on-chain; the creator
 * is taken from the chain, not from the request.
 */
export async function POST(req: Request) {
  const kv = getKv();
  if (!kv) return NextResponse.json({ error: "Storage not configured." }, { status: 503 });

  let body: Partial<LaunchRecord>;
  try {
    body = (await req.json()) as Partial<LaunchRecord>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const chain: LaunchChain = body.chain === "solana" ? "solana" : "robinhood";
  if (!isTokenFor(chain, body.token)) {
    return NextResponse.json({ error: "Missing/invalid token address." }, { status: 400 });
  }
  const evm = chain === "robinhood";
  const txHash = String(body.txHash ?? "");

  // Already listed (the browser and the server fallback can both record).
  if ((await readLaunches()).some((r) => sameId(r.token, body.token!))) return NextResponse.json({ ok: true });

  const proof = evm ? await proveRobinhoodLaunch(txHash, body.token) : await proveSolanaLaunch(txHash, body.token);
  if (!proof) {
    return NextResponse.json({ error: "Couldn't verify this launch on-chain." }, { status: 422 });
  }

  const record: LaunchRecord = {
    chain,
    token: body.token,
    curve: proof.curve,
    version: "v2",
    name: String(body.name ?? "").slice(0, 80),
    symbol: String(body.symbol ?? "").slice(0, 16),
    logo: String(body.logo ?? "").slice(0, 2000),
    handle: body.handle ? String(body.handle).slice(0, 80) : undefined,
    source: toSource(body.source),
    twitter: body.twitter ? String(body.twitter).slice(0, 200) : undefined,
    telegram: body.telegram ? String(body.telegram).slice(0, 200) : undefined,
    website: body.website ? String(body.website).slice(0, 200) : undefined,
    deployer: proof.deployer,
    txHash: txHash.slice(0, 100),
    createdAt: Date.now(),
  };

  await kv.lpush(KEY, JSON.stringify(record));
  await kv.ltrim(KEY, 0, 199); // cap the list

  return NextResponse.json({ ok: true });
}

/** The message a creator signs to remove one of their launches from the feed. */
function removeMessage(token: string): string {
  return `Remove ${token.toLowerCase()} from the NOIR feed`;
}

/**
 * DELETE /api/launches - remove a launch record from the feed.
 * Body: { token, address, signature }. Authorized only when the signature over
 * removeMessage(token) recovers to the record's deployer.
 */
export async function DELETE(req: Request) {
  const kv = getKv();
  if (!kv) return NextResponse.json({ error: "Storage not configured." }, { status: 503 });

  let body: { token?: string; address?: string; signature?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { token, address, signature } = body;
  if (!token || !isAddress(token) || !address || !isAddress(address) || !signature) {
    return NextResponse.json({ error: "token, address and signature are required." }, { status: 400 });
  }

  let validSig = false;
  try {
    validSig = await verifyMessage({
      address: address as Address,
      message: removeMessage(token),
      signature: signature as `0x${string}`,
    });
  } catch {
    validSig = false;
  }
  if (!validSig) return NextResponse.json({ error: "Bad signature." }, { status: 401 });

  const admin = (process.env.ADMIN_ADDRESS ?? "").toLowerCase();
  const raw = (await kv.lrange<LaunchRecord | string>(KEY, 0, 999)) ?? [];

  let removed = 0;
  for (const item of raw) {
    const rec = typeof item === "string" ? safeParse(item) : item;
    if (!rec || rec.token.toLowerCase() !== token.toLowerCase()) continue;
    const authorized =
      rec.deployer.toLowerCase() === address.toLowerCase() || (admin && admin === address.toLowerCase());
    if (!authorized) return NextResponse.json({ error: "Not your launch." }, { status: 403 });
    await kv.lrem(KEY, 0, item as string);
    removed++;
  }

  return NextResponse.json({ ok: true, removed });
}
