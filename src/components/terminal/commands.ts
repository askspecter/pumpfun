import type { MarketItem } from "@/lib/markets";

/**
 * NOIR Terminal command language. Pure: parses a line into an action the
 * page performs. Trades only prefill the trade panel; the wallet still signs.
 *
 *   open $MIRA | $MIRA | @mira | <address>
 *   buy [$coin] <amount>        (ETH/quote on Robinhood, SOL on Solana)
 *   sell [$coin] <amount|25%>
 *   watch [$coin]
 *   launch @handle [--chain robinhood|solana] [--source fomo|pumpfun]
 *   markets | bank | help | clear
 */
export type Command =
  | { kind: "open"; item: MarketItem }
  | { kind: "trade"; side: "buy" | "sell"; item: MarketItem | null; amount: string | null }
  | { kind: "watch"; item: MarketItem | null }
  | { kind: "launch"; href: string; label: string }
  | { kind: "go"; href: string; label: string }
  | { kind: "help" }
  | { kind: "clear" }
  | { kind: "error"; message: string };

export const HELP: [string, string][] = [
  ["$MIRA · @handle · 0x…", "open a coin"],
  ["buy 0.1", "prefill a buy of the open coin"],
  ["buy $MIRA 0.1", "open a coin and prefill a buy"],
  ["sell 50%", "prefill a sell of half your bag"],
  ["watch", "add / remove the open coin from ★"],
  ["launch @handle --chain solana", "go launch a profile coin"],
  ["markets · bank · clear", "go to Markets / Creator Bank, clear the log"],
];

const norm = (s: string) => s.trim().replace(/^[$@]+/, "").toLowerCase();
const isAmount = (s: string) => /^(\d+(\.\d+)?|\.\d+)%?$/.test(s);

/** Find a coin by $ticker, @handle, address, or a name/ticker prefix; biggest market cap wins. */
export function findCoin(items: MarketItem[], query: string): MarketItem | null {
  const q = norm(query);
  if (!q) return null;
  const byMc = (a: MarketItem, b: MarketItem) => (b.marketCapUsd ?? -1) - (a.marketCapUsd ?? -1);
  const tests: ((i: MarketItem) => boolean)[] = [
    (i) => i.token.toLowerCase() === q,
    (i) => i.symbol.toLowerCase() === q,
    (i) => (i.handle ?? "").toLowerCase() === q,
    (i) => i.symbol.toLowerCase().startsWith(q),
    (i) => i.name.toLowerCase().startsWith(q),
  ];
  for (const test of tests) {
    const hit = items.filter(test).sort(byMc)[0];
    if (hit) return hit;
  }
  return null;
}

export function parseCommand(line: string, items: MarketItem[]): Command {
  const words = line.trim().replace(/^>\s*/, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return { kind: "error", message: "Type a command, or help." };
  const [head, ...rest] = words;
  const verb = head.toLowerCase();

  switch (verb) {
    case "help":
    case "?":
      return { kind: "help" };
    case "clear":
    case "cls":
      return { kind: "clear" };
    case "markets":
      return { kind: "go", href: "/markets", label: "NOIR Markets" };
    case "bank":
      return { kind: "go", href: "/profile", label: "Creator Bank" };

    case "buy":
    case "sell": {
      const amount = rest.find(isAmount) ?? null;
      const coinWord = rest.find((w) => !isAmount(w));
      if (verb === "buy" && amount?.endsWith("%")) return { kind: "error", message: "Percent amounts are for sells." };
      if (!coinWord) return { kind: "trade", side: verb, item: null, amount };
      const item = findCoin(items, coinWord);
      if (!item) return { kind: "error", message: `No coin matches “${coinWord}”.` };
      return { kind: "trade", side: verb, item, amount };
    }

    case "watch": {
      if (rest.length === 0) return { kind: "watch", item: null };
      const item = findCoin(items, rest[0]);
      return item ? { kind: "watch", item } : { kind: "error", message: `No coin matches “${rest[0]}”.` };
    }

    case "launch": {
      const flags: Record<string, string> = {};
      let handle: string | undefined;
      for (let i = 0; i < rest.length; i++) {
        if (rest[i].startsWith("--")) flags[rest[i].slice(2).toLowerCase()] = (rest[++i] ?? "").toLowerCase();
        else handle ??= rest[i];
      }
      const flag = (name: string) => flags[name];
      const source = flag("source") === "pumpfun" ? "pumpfun" : "fomo";
      const chain = flag("chain") === "solana" || source === "pumpfun" ? "solana" : "robinhood";
      const params = new URLSearchParams({ chain, source });
      if (handle) params.set("handle", handle.replace(/^@+/, ""));
      return { kind: "launch", href: `/create?${params}`, label: handle ? `@${handle.replace(/^@+/, "")} on ${chain}` : `on ${chain}` };
    }

    case "open":
    case "o": {
      const item = rest[0] ? findCoin(items, rest[0]) : null;
      return item ? { kind: "open", item } : { kind: "error", message: rest[0] ? `No coin matches “${rest[0]}”.` : "open what? e.g. open $MIRA" };
    }

    default: {
      // A bare coin reference opens it.
      const item = words.length === 1 ? findCoin(items, head) : null;
      return item ? { kind: "open", item } : { kind: "error", message: `Unknown command “${head}”. Type help.` };
    }
  }
}
