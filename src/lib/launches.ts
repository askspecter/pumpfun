import { isAddress } from "viem";
import { getKv } from "@/lib/kv";
import { isSolanaAddress, type LaunchChain } from "@/lib/solana";

/** KV list holding the launches made through NOIR, newest first. */
export const LAUNCHES_KEY = "fomo:launches";

/** A profile coin launched through NOIR (Pons on Robinhood, or Pump.fun on Solana). */
export interface LaunchRecord {
  /** Missing on older records, which are all Robinhood. */
  chain?: LaunchChain;
  token: string;
  curve?: string;
  version: "v2";
  name: string;
  symbol: string;
  logo: string;
  /** The profile handle this coin represents. */
  handle?: string;
  /** Where the handle lives. Missing on older records, which are all fomo.family. */
  source?: "fomo" | "pumpfun";
  twitter?: string;
  telegram?: string;
  website?: string;
  deployer: string;
  txHash: string;
  createdAt: number;
}

/** Every listed launch record (valid, not hidden), newest first. Empty without KV. */
export async function readLaunches(): Promise<LaunchRecord[]> {
  const kv = getKv();
  if (!kv) return [];
  const raw = (await kv.lrange<LaunchRecord | string>(LAUNCHES_KEY, 0, 199)) ?? [];
  return raw
    .map((r) => (typeof r === "string" ? safeParse(r) : r))
    .filter((r): r is LaunchRecord => !!r && isTokenFor(r.chain ?? "robinhood", r.token))
    .filter((r) => !isHidden(r.token));
}

/**
 * Launches hidden from the NOIR feed (test coins, abuse reports): a
 * comma-separated list of token addresses / mints in HIDDEN_LAUNCHES. The
 * coins still exist on-chain; NOIR just stops listing them.
 */
export function isHidden(token: string): boolean {
  const list = (process.env.HIDDEN_LAUNCHES ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return list.some((h) => sameId(h, token));
}

/** Token/mint shape check for the record's chain. */
export function isTokenFor(chain: LaunchChain, token: unknown): token is string {
  return chain === "solana" ? isSolanaAddress(token) : typeof token === "string" && isAddress(token);
}

/** EVM addresses compare case-insensitively; Solana base58 is case-sensitive. */
export function sameId(a: string, b: string): boolean {
  return a.startsWith("0x") ? a.toLowerCase() === b.toLowerCase() : a === b;
}

export function safeParse(s: string): LaunchRecord | null {
  try {
    return JSON.parse(s) as LaunchRecord;
  } catch {
    return null;
  }
}
