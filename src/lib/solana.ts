/**
 * Solana network settings for the Pump.fun launch path.
 * Public values only — safe to expose to the browser.
 */
function env(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value.trim() : fallback;
}

// NEXT_PUBLIC_* must be read with literal property access so Next inlines them.
export const SOLANA_RPC_URL = env(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  "https://api.mainnet-beta.solana.com",
);

export const SOLANA_EXPLORER_URL = env(process.env.NEXT_PUBLIC_SOLANA_EXPLORER_URL, "https://solscan.io");

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Shape check for a base58 Solana public key (wallet or mint). */
export function isSolanaAddress(value: unknown): value is string {
  return typeof value === "string" && BASE58.test(value);
}

export function solanaTx(signature: string): string {
  return `${SOLANA_EXPLORER_URL}/tx/${signature}`;
}

export function pumpCoinUrl(mint: string): string {
  return `https://pump.fun/coin/${mint}`;
}

export function pumpProfileUrl(addressOrName: string): string {
  return `https://pump.fun/profile/${addressOrName}`;
}

export type LaunchChain = "robinhood" | "solana";

/** Where a feed record's coin page lives: our Pons page, or Pump.fun for Solana. */
export function coinLink(item: { chain?: LaunchChain; token: string }): { href: string; external: boolean } {
  return item.chain === "solana"
    ? { href: pumpCoinUrl(item.token), external: true }
    : { href: `/launch/${item.token}`, external: false };
}

/** Public profile page for a feed record's handle. */
export function profileLink(handle: string, source?: "fomo" | "pumpfun"): string {
  const h = handle.replace(/^@+/, "");
  return source === "pumpfun" ? pumpProfileUrl(h) : `https://fomo.family/${h}`;
}
