/** Client-safe parts of NOIR Predict (shared by the API and the UI). */

export type Chain = "robinhood" | "solana";
export type Side = "up" | "down";

export const ROUND_MS = 24 * 60 * 60 * 1000;
export const LOCK_MS = 60 * 60 * 1000; // calls close in the round's final hour
export const WIN_POINTS = 10;

export interface Call {
  side: Side;
  mc: number;
  at: number;
}

export const roundOf = (t = Date.now()) => Math.floor(t / ROUND_MS);
export const roundEnd = (round: number) => (round + 1) * ROUND_MS;
export const isLocked = (round: number, t = Date.now()) => t >= roundEnd(round) - LOCK_MS;

export const coinId = (chain: Chain, token: string) => `${chain}:${chain === "solana" ? token : token.toLowerCase()}`;
export const playerId = (address: string) => (address.startsWith("0x") ? address.toLowerCase() : address);

/** The exact text a player signs; must match byte-for-byte on both sides. */
export function callMessage(chain: Chain, token: string, round: number, side: Side): string {
  return `NOIR Predict\n\nCoin: ${coinId(chain, token)}\nRound: ${round}\nCall: ${side.toUpperCase()}\n\nPoints only. No funds move.`;
}

