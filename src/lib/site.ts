/** Shared site constants (links, copy). */
export const SITE = {
  name: "NOIR",
  shortName: "NOIR",
  tagline: "Your profile. Now a market.",
  description:
    "Turn your fomo.family or Pump.fun profile into a token. Launch it on the Pons v2 bonding curve on Robinhood Chain, or on Pump.fun on Solana, non-custodial. Your wallet signs every transaction.",
  x: "https://x.com/usenoirapp",
  xHandle: "@usenoirapp",
  company: "NOIR",
  chain: "Robinhood Chain",
  poweredBy: "Pons",
  ponsUrl: "https://ponsfamily.com",
  fomoUrl: "https://fomo.family",
  pumpfunUrl: "https://pump.fun",
} as const;

/** The official $NOIR coin, pinned at the top of the feed. */
export const OFFICIAL_TOKEN = {
  chain: "robinhood" as const,
  address: (process.env.NEXT_PUBLIC_OFFICIAL_TOKEN?.trim() || "0x598c669d41927200b46c9856c25dcb9fffe3ef2d") as `0x${string}`,
  symbol: "NOIR",
};

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/create", label: "Launch" },
  { href: "/profile", label: "Creator Bank" },
] as const;
