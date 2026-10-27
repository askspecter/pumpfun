import { createPublicKey, verify as edVerify } from "crypto";
import { PublicKey } from "@solana/web3.js";
import { isAddress, verifyMessage } from "viem";
import { getKv } from "@/lib/kv";
import { isSolanaAddress } from "@/lib/solana";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  NOIR Predict (points, no money).
 *
 *  Every profile coin runs a daily round (UTC day). A player calls UP or DOWN:
 *  "will this coin's market cap be higher at the end of the round than right
 *  now?". The call records the market cap at that moment, so calling late
 *  carries no edge. Calls close in the round's last hour. Each call is signed
 *  by the player's wallet, so nobody can call for someone else.
 *
 *  Rounds settle lazily: the first request after a round ends compares each
 *  call against the last market cap we observed during that round and awards
 *  points to the right calls. No tokens, no stakes, no payouts.
 * ─────────────────────────────────────────────────────────────────────────
 */

export * from "./predict-shared";
import { coinId, roundEnd, roundOf, WIN_POINTS, type Call, type Chain } from "./predict-shared";

const k = {
  calls: (coin: string, round: number) => `pred:calls:${coin}:${round}`,
  last: (coin: string, round: number) => `pred:last:${coin}:${round}`,
  done: (coin: string, round: number) => `pred:done:${coin}:${round}`,
  result: (coin: string, round: number) => `pred:result:${coin}:${round}`,
  points: "pred:points",
  stats: (player: string) => `pred:stats:${player}`,
};

export function validToken(chain: Chain, token: string): boolean {
  return chain === "solana" ? isSolanaAddress(token) : isAddress(token);
}

/** Verify an EVM (personal_sign) or Solana (ed25519, base64 signature) signature. */
export async function verifyCall(chain: Chain, address: string, message: string, signature: string): Promise<boolean> {
  try {
    if (chain === "robinhood") {
      if (!isAddress(address)) return false;
      return await verifyMessage({ address, message, signature: signature as `0x${string}` });
    }
    if (!isSolanaAddress(address)) return false;
    const raw = Buffer.from(new PublicKey(address).toBytes());
    const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), raw]);
    const key = createPublicKey({ key: spki, format: "der", type: "spki" });
    return edVerify(null, Buffer.from(message, "utf8"), key, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}

/** Remember the latest market cap seen during a round (the settlement price). */
export async function observe(coin: string, mc: number): Promise<void> {
  const kv = getKv();
  if (!kv || !(mc > 0)) return;
  await kv.set(k.last(coin, roundOf()), { mc, at: Date.now() }, { ex: 3 * 86400 }).catch(() => {});
}

export interface RoundResult {
  round: number;
  endMc: number;
  winners: number;
  players: number;
}

/** Settle a finished round once (idempotent): award points to correct calls. */
export async function settle(coin: string, round: number): Promise<RoundResult | null> {
  const kv = getKv();
  if (!kv || Date.now() < roundEnd(round)) return null;
  const existing = await kv.get<RoundResult>(k.result(coin, round)).catch(() => null);
  if (existing) return existing;

  const last = await kv.get<{ mc: number; at: number }>(k.last(coin, round)).catch(() => null);
  const calls = (await kv.hgetall<Record<string, Call>>(k.calls(coin, round)).catch(() => null)) ?? {};
  if (!last || Object.keys(calls).length === 0) return null;

  // Only one request settles a round.
  const claimed = await kv.set(k.done(coin, round), 1, { nx: true, ex: 30 * 86400 }).catch(() => null);
  if (!claimed) return null;

  let winners = 0;
  for (const [player, raw] of Object.entries(calls)) {
    const c = (typeof raw === "string" ? JSON.parse(raw) : raw) as Call;
    if (last.mc === c.mc) continue; // flat: no result
    const won = c.side === "up" ? last.mc > c.mc : last.mc < c.mc;
    await kv.hincrby(k.stats(player), "calls", 1);
    if (won) {
      winners++;
      await kv.zincrby(k.points, WIN_POINTS, player);
      await kv.hincrby(k.stats(player), "wins", 1);
    }
  }
  const result: RoundResult = { round, endMc: last.mc, winners, players: Object.keys(calls).length };
  await kv.set(k.result(coin, round), result, { ex: 30 * 86400 });
  return result;
}

export async function getCalls(coin: string, round: number): Promise<Record<string, Call>> {
  const kv = getKv();
  if (!kv) return {};
  const raw = (await kv.hgetall<Record<string, Call | string>>(k.calls(coin, round)).catch(() => null)) ?? {};
  const out: Record<string, Call> = {};
  for (const [p, v] of Object.entries(raw)) out[p] = typeof v === "string" ? (JSON.parse(v) as Call) : v;
  return out;
}

/** Record a call. One call per player per coin per round. */
export async function placeCall(coin: string, round: number, player: string, call: Call): Promise<boolean> {
  const kv = getKv();
  if (!kv) return false;
  const added = await kv.hsetnx(k.calls(coin, round), player, JSON.stringify(call));
  await kv.expire(k.calls(coin, round), 30 * 86400);
  return added === 1;
}

export async function playerStats(player: string): Promise<{ points: number; calls: number; wins: number }> {
  const kv = getKv();
  if (!kv) return { points: 0, calls: 0, wins: 0 };
  const [points, stats] = await Promise.all([
    kv.zscore(k.points, player).catch(() => null),
    kv.hgetall<{ calls?: number; wins?: number }>(k.stats(player)).catch(() => null),
  ]);
  return { points: Number(points ?? 0), calls: Number(stats?.calls ?? 0), wins: Number(stats?.wins ?? 0) };
}

export async function topPlayers(limit = 20): Promise<{ player: string; points: number; calls: number; wins: number }[]> {
  const kv = getKv();
  if (!kv) return [];
  const flat = (await kv.zrange<(string | number)[]>(k.points, 0, limit - 1, { rev: true, withScores: true }).catch(() => [])) ?? [];
  const rows: { player: string; points: number }[] = [];
  for (let i = 0; i < flat.length; i += 2) rows.push({ player: String(flat[i]), points: Number(flat[i + 1]) });
  return Promise.all(
    rows.map(async (r) => {
      const s = await kv.hgetall<{ calls?: number; wins?: number }>(k.stats(r.player)).catch(() => null);
      return { ...r, calls: Number(s?.calls ?? 0), wins: Number(s?.wins ?? 0) };
    }),
  );
}
