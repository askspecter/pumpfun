/**
 * A prefill for a trade widget, from the Terminal's command bar or hotkeys:
 * switch side and/or set the amount. A new nonce applies it again. It never
 * submits: the user still presses Buy/Sell and their wallet signs.
 * `amount` is in the quote asset for buys, tokens for sells, or "25%" of the
 * token balance for sells.
 */
export interface TradeIntent {
  side?: "buy" | "sell";
  amount?: string;
  nonce: number;
}

/** "50%" → 0.5; anything else → null. */
export function pctOf(amount: string): number | null {
  const m = /^(\d{1,3}(?:\.\d+)?)%$/.exec(amount.trim());
  return m ? Math.min(100, Number(m[1])) / 100 : null;
}
