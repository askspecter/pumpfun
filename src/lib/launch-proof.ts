import { getAddress, isAddress, parseEventLogs, type Address } from "viem";
import { ponsClient } from "@/lib/pons/reader";
import { v2TokenLaunchedEvent } from "@/lib/pons/abisV2";
import { PONS_V2 } from "@/lib/pons/registry";
import { PUMP_PROGRAM_ID, readCurve, rpc } from "@/lib/pumpfun/curve";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Launch proofs (server-side only).
 *
 *  A launch is only listed on NOIR when its transaction proves it on-chain,
 *  so nobody can post a made-up coin (or someone else's coin under a famous
 *  handle) straight into the feed. The proof also fixes the creator to the
 *  on-chain one, whatever the request claims.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface LaunchProof {
  /** The wallet that launched the coin, as recorded on-chain. */
  deployer: string;
  /** Pons bonding curve (Robinhood only). */
  curve?: string;
}

/** The Pons factory's TokenLaunched event for `token` inside tx `hash`, or null. */
export async function proveRobinhoodLaunch(hash: string, token: string): Promise<LaunchProof | null> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash) || !isAddress(token)) return null;
  const receipt = await ponsClient()
    .waitForTransactionReceipt({ hash: hash as `0x${string}`, timeout: 30_000 })
    .catch(() => null);
  if (!receipt || receipt.status !== "success") return null;
  const factory = PONS_V2.factory.toLowerCase();
  const launch = parseEventLogs({ abi: [v2TokenLaunchedEvent], logs: receipt.logs }).find(
    // Only the factory's own event counts: any contract could emit a look-alike.
    (l) => l.address.toLowerCase() === factory && (l.args.token as string | undefined)?.toLowerCase() === token.toLowerCase(),
  );
  if (!launch) return null;
  // A launch with a dev buy goes through the LaunchAndBuy router, which the
  // factory records as the deployer; the person is the tx sender then.
  const deployer = launch.args.deployer as Address;
  const viaRouter = deployer.toLowerCase() === PONS_V2.launchAndBuy.toLowerCase();
  return { deployer: getAddress(viaRouter ? receipt.from : deployer), curve: launch.args.curve as string };
}

/**
 * A successful Pump.fun create transaction `signature` for `mint`. The
 * deployer is the transaction's fee payer, which must also be the creator
 * the bonding curve records (when it records one).
 */
export async function proveSolanaLaunch(signature: string, mint: string): Promise<LaunchProof | null> {
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(signature)) return null;
  // The browser records right after confirmation; give a lagging RPC a moment.
  let tx = null;
  for (let i = 0; i < 4 && !tx; i++) {
    if (i) await new Promise((r) => setTimeout(r, 1500));
    tx = await rpc()
      .getTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: "confirmed" })
      .catch(() => null);
  }
  if (!tx || !tx.meta || tx.meta.err) return null;

  const keys = tx.transaction.message.getAccountKeys({ accountKeysFromLookups: tx.meta.loadedAddresses }).keySegments().flat();
  const ids = keys.map((k) => k.toBase58());
  const payer = ids[0];
  if (!ids.includes(mint) || !ids.includes(PUMP_PROGRAM_ID.toBase58())) return null;
  // It must be the coin's creation, not just any trade of it.
  if (!(tx.meta.logMessages ?? []).some((l) => /Instruction: Create/.test(l))) return null;

  const curve = await readCurve(mint).catch(() => null);
  if (!curve) return null;
  if (curve.creator && curve.creator !== payer) return null;
  return { deployer: payer };
}
