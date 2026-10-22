import { getKv } from "@/lib/kv";
import { cleanHandle, type FomoProfile } from "@/lib/fomo/resolve";
import { cleanPumpId, resolvePumpProfile } from "@/lib/pumpfun/resolve";
import { isSolanaAddress, type LaunchChain } from "@/lib/solana";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Verified creators (server-side only).
 *
 *  A profile coin is VERIFIED when its on-chain creator is one of the
 *  profile's own wallets: the person behind @handle launched it themselves.
 *  It is FEES-TO-CREATOR when someone else launched it but its creator fees
 *  route on-chain to the profile's wallet.
 *
 *  Both checks use on-chain facts only (the Pons factory record, or the
 *  Pump.fun bonding curve) against the wallets the profile source reports, so
 *  a launch record can't claim a badge it hasn't earned.
 *
 *  fomo.family wallets are read from the profile cache the studio fills when
 *  a creator drafts their coin (/api/fomo), never resolved here: the FOMO
 *  free tier allows only 25 resolutions a month.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type Verification = "verified" | "fees" | null;

export interface VerifyInput {
  chain: LaunchChain;
  token: string;
  handle?: string;
  source?: "fomo" | "pumpfun";
  /** On-chain creator (Pons deployer / Pump.fun curve creator). */
  creator: string | null;
  /** On-chain creator-fee recipient (Pons only; Pump.fun pays the creator). */
  feeRecipient?: string | null;
}

interface ProfileWallets {
  evm: string | null;
  solana: string | null;
}

const VERDICT_KEY = (chain: string, token: string) => `verify:${chain}:${token.startsWith("0x") ? token.toLowerCase() : token}`;
// A creator can't change after launch, so a positive verdict is kept long.
// "Unknown" is retried soon, in case the profile cache fills in later.
const POSITIVE_TTL = 60 * 60 * 24 * 30;
const NEGATIVE_TTL = 60 * 60;
const PUMP_PROFILE_TTL = 60 * 60 * 12;

const same = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && (a.startsWith("0x") ? a.toLowerCase() === b.toLowerCase() : a === b);

async function profileWallets(handle: string, source: "fomo" | "pumpfun"): Promise<ProfileWallets | null> {
  const kv = getKv();
  if (source === "fomo") {
    if (!kv) return null;
    const cached = await kv.get<FomoProfile>(`fomo:profile:${cleanHandle(handle).toLowerCase()}`).catch(() => null);
    return cached ? { evm: cached.wallets.evm, solana: cached.wallets.solana } : null;
  }

  const id = cleanPumpId(handle);
  // Read through a ternary so the type guard doesn't narrow `id` to never below.
  const wallet = isSolanaAddress(id) ? id : null;
  if (wallet) return { evm: null, solana: wallet };
  const key = `pump:wallet:${id.toLowerCase()}`;
  if (kv) {
    const hit = await kv.get<string>(key).catch(() => null);
    if (hit) return { evm: null, solana: hit };
  }
  try {
    const profile = await resolvePumpProfile(id);
    if (kv) await kv.set(key, profile.address, { ex: PUMP_PROFILE_TTL }).catch(() => {});
    return { evm: null, solana: profile.address };
  } catch {
    return null;
  }
}

async function judge(input: VerifyInput): Promise<Verification> {
  if (!input.handle) return null;
  const wallets = await profileWallets(input.handle, input.source ?? "fomo");
  if (!wallets) return null;
  const own = input.chain === "solana" ? wallets.solana : wallets.evm;
  if (same(input.creator, own)) return "verified";
  if (same(input.feeRecipient, own)) return "fees";
  return null;
}

/** Verdicts for many coins at once, cached per coin in KV. */
export async function verifyMany(inputs: VerifyInput[]): Promise<Record<string, Verification>> {
  const kv = getKv();
  const out: Record<string, Verification> = {};
  await Promise.all(
    inputs.map(async (input) => {
      const key = VERDICT_KEY(input.chain, input.token);
      if (kv) {
        const hit = await kv.get<{ v: Verification }>(key).catch(() => null);
        if (hit) {
          out[input.token] = hit.v;
          return;
        }
      }
      // A coin with no known on-chain creator can't be judged yet; don't cache that.
      if (!input.creator) {
        out[input.token] = null;
        return;
      }
      const v = await judge(input).catch(() => null);
      out[input.token] = v;
      if (kv) await kv.set(key, { v }, { ex: v ? POSITIVE_TTL : NEGATIVE_TTL }).catch(() => {});
    }),
  );
  return out;
}
