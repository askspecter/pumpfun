import Link from "next/link";
import { Logo } from "./Logo";
import { BrandLogo } from "./BrandLogo";
import { SITE } from "@/lib/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/markets", label: "Markets" },
      { href: "/terminal", label: "Terminal" },
      { href: "/explore", label: "Explore" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/create", label: "Launch" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/profile", label: "Creator Bank" },
      { href: "/docs", label: "Docs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    // Extra bottom padding on mobile so the fixed bottom nav never covers the footer.
    <footer className="mt-16 border-t border-white/[0.06] px-4 pb-32 pt-10 sm:mt-24 sm:pt-12 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.4fr,2fr] md:gap-10">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="wordmark text-[15px]">{SITE.name}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
            Tokenize your @fomo &amp; @Pumpfun profile on Robinhood Chain or Solana. Your wallet signs every transaction.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <a
              href={SITE.x}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              <XIcon className="h-3.5 w-3.5" />
              {SITE.xHandle}
            </a>
            <span className="ml-1 flex items-center gap-1.5">
              {(["robinhood", "solana", "fomo", "pumpfun"] as const).map((b) => (
                <BrandLogo key={b} brand={b} className="h-5 w-5 rounded-md opacity-70 grayscale" />
              ))}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-medium text-zinc-400">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-zinc-500 transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-white/[0.06] pt-5 sm:mt-12 sm:pt-6">
        <p className="max-w-3xl text-[11px] leading-relaxed text-zinc-400 sm:text-xs">
          {SITE.name} is a non-custodial, third-party interface to the {SITE.poweredBy} protocol and Pump.fun. Transactions
          may be irreversible and tokens can lose all value. Not an official {SITE.poweredBy}, fomo.family or Pump.fun
          product. Profiles shown are public data, not endorsements.
        </p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">© {year} {SITE.company}</p>
          <a href={SITE.x} target="_blank" rel="noreferrer" className="text-zinc-500 transition hover:text-white" aria-label={`${SITE.name} on X`}>
            <XIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
