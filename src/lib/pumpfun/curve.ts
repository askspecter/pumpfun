import { Connection, PublicKey } from "@solana/web3.js";
import { SOLANA_RPC_URL } from "@/lib/solana";

/**
 * On-chain state of a Pump.fun bonding curve (server-side).
 *
 * Every Pump.fun coin has a bonding-curve account at the PDA
 * ["bonding-curve", mint] of the Pump program. Its layout:
 *   8  discriminator
 *   8  virtual_token_reserves (u64, 6-dec base units)
 *   8  virtual_sol_reserves   (u64, lamports)
 *   8  real_token_reserves    (u64)
 *   8  real_sol_reserves      (u64)
 *   8  token_total_supply     (u64)
 *   1  complete               (bool)
 */

export const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const TOKEN_DECIMALS = 6;
/** Tokens sold on the curve before it completes (793.1M of the 1B supply). */
const INITIAL_REAL_TOKEN_RESERVES = 793_100_000n * 10n ** BigInt(TOKEN_DECIMALS);

export interface CurveState {
  bondingCurve: string;
  virtualTokenReserves: string;
  virtualSolReserves: string;
  realTokenReserves: string;
  realSolReserves: string;
  totalSupply: string;
  complete: boolean;
  /** SOL per whole token. */
  priceSol: number;
  marketCapSol: number;
  /** 0..1 progress to graduation. */
  progress: number;
  /** The wallet that created the coin (and is paid its creator fees), when the curve records one. */
  creator: string | null;
}

export function bondingCurvePda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), mint.toBuffer()], PUMP_PROGRAM_ID)[0];
}

let connection: Connection | null = null;
export function rpc(): Connection {
  connection ??= new Connection(process.env.SOLANA_RPC_URL?.trim() || SOLANA_RPC_URL, "confirmed");
  return connection;
}

export async function readCurve(mintAddress: string): Promise<CurveState | null> {
  const pda = bondingCurvePda(new PublicKey(mintAddress));
  const info = await rpc().getAccountInfo(pda);
  return info ? parseCurve(pda, info.data) : null;
}

/** Many curves in one RPC call (feed market caps). Keys are the mints. */
export async function readCurves(mints: string[]): Promise<Record<string, CurveState>> {
  const pdas = mints.map((m) => bondingCurvePda(new PublicKey(m)));
  const infos = await rpc().getMultipleAccountsInfo(pdas);
  const out: Record<string, CurveState> = {};
  infos.forEach((info, i) => {
    const state = info ? parseCurve(pdas[i], info.data) : null;
    if (state) out[mints[i]] = state;
  });
  return out;
}

function parseCurve(pda: PublicKey, d: Buffer): CurveState | null {
  if (d.length < 49) return null;
  const vToken = d.readBigUInt64LE(8);
  const vSol = d.readBigUInt64LE(16);
  const rToken = d.readBigUInt64LE(24);
  const rSol = d.readBigUInt64LE(32);
  const supply = d.readBigUInt64LE(40);
  const complete = d[48] === 1;
  const creator = d.length >= 81 ? new PublicKey(d.subarray(49, 81)) : null;

  const priceSol = vToken > 0n ? Number(vSol) / 1e9 / (Number(vToken) / 10 ** TOKEN_DECIMALS) : 0;
  const supplyTokens = Number(supply) / 10 ** TOKEN_DECIMALS;
  const progress = complete
    ? 1
    : Math.min(1, Math.max(0, 1 - Number(rToken) / Number(INITIAL_REAL_TOKEN_RESERVES)));

  return {
    bondingCurve: pda.toBase58(),
    virtualTokenReserves: vToken.toString(),
    virtualSolReserves: vSol.toString(),
    realTokenReserves: rToken.toString(),
    realSolReserves: rSol.toString(),
    totalSupply: supply.toString(),
    complete,
    priceSol,
    marketCapSol: priceSol * supplyTokens,
    progress,
    creator: creator && !creator.equals(PublicKey.default) ? creator.toBase58() : null,
  };
}
