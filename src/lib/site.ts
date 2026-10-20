/** Shared site constants (links, copy). */
export const SITE = {
  name: "Dime",
  shortName: "Dime",
  tagline: "Tokenize your @fomo & @Pumpfun profile.",
  description:
    "Turn your fomo.family or Pump.fun profile into a token. Launch it on the Pons v2 bonding curve on Robinhood Chain, or on Pump.fun on Solana, non-custodial. Your wallet signs every transaction.",
  x: "https://x.com/dimedotfamily",
  xHandle: "@dimedotfamily",
  company: "Dime",
  chain: "Robinhood Chain",
  poweredBy: "Pons",
  ponsUrl: "https://ponsfamily.com",
  fomoUrl: "https://fomo.family",
  pumpfunUrl: "https://pump.fun",
} as const;

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/create", label: "Launch" },
  { href: "/profile", label: "Profile" },
] as const;
