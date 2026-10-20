/** Shape returned by /api/top-profiles (see that route). */
export interface TopProfile {
  source: "fomo" | "pumpfun";
  handle: string;
  displayName: string;
  avatar: string | null;
  followers: number | null;
  verified: boolean;
  lookup: string;
  url: string;
  pnlUsd: number | null;
}

export function tokenizeHref(p: TopProfile): string {
  const q = new URLSearchParams({ handle: p.lookup, source: p.source });
  if (p.source === "pumpfun") q.set("chain", "solana");
  return `/create?${q.toString()}`;
}
