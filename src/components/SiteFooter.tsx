import Link from "next/link";
import { Logo } from "./Logo";
import { BrandLogo } from "./BrandLogo";
import { SITE } from "@/lib/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/", label: "Markets" },
      { href: "/explore", label: "Explore" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/create", label: "Launch" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/profile", label: "My profile" },
      { href: "/docs", label: "Docs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-white/[0.06] px-4 pb-10 pt-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr,1fr,1fr,1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="wordmark text-[15px]">{SITE.name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
            Tokenize your @fomo &amp; @Pumpfun profile. Launch on Robinhood Chain or Solana. Your wallet
            signs every transaction.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {(["robinhood", "solana", "fomo", "pumpfun"] as const).map((b) => (
              <BrandLogo key={b} brand={b} className="h-6 w-6 rounded-md opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0" />
            ))}
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="text-xs font-medium text-zinc-400">{col.title}</div>
            <ul className="mt-4 space-y-2.5">
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

      <div className="mx-auto mt-12 max-w-6xl border-t border-white/[0.06] pt-6">
        <p className="max-w-3xl text-xs leading-relaxed text-zinc-400">
          {SITE.name} is a non-custodial, third-party interface to the {SITE.poweredBy} protocol and
          Pump.fun. Transactions may be irreversible and tokens can lose all value. {SITE.name} provides no
          custody, warranties, or financial advice, and is not an official {SITE.poweredBy},
          fomo.family or Pump.fun product. Profiles shown are public data and are not endorsements.
        </p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">© {year} {SITE.company}</p>
          <a href={SITE.x} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 transition hover:text-white">
            {SITE.xHandle}
          </a>
        </div>
      </div>
    </footer>
  );
}
