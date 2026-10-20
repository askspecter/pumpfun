"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { SolanaWalletButton } from "./SolanaWalletButton";
import { BrandLogo } from "./BrandLogo";
import { SITE, NAV } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090a]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logo className="h-7 w-7" />
          <span className="wordmark text-[15px]">{SITE.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive(item.href) ? "text-white" : "text-[#8a8f98] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] py-0.5 pl-2.5">
            <BrandLogo brand="solana" className="h-4 w-4 rounded-full" />
            <SolanaWalletButton
              label="Solana"
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium text-[#d0d3d9] transition hover:text-white"
            />
          </span>
          <WalletButton variant="solid" />
        </div>

        {/* Mobile: Connect only — navigation lives in the bottom bar. */}
        <div className="flex shrink-0 items-center md:hidden">
          <WalletButton variant="solid" />
        </div>
      </div>
    </header>
  );
}
