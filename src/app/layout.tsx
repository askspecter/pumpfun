import type { Metadata, Viewport } from "next";
import "@rainbow-me/rainbowkit/styles.css"; // REQUIRED, before globals — styles the connect modal
import "@solana/wallet-adapter-react-ui/styles.css"; // Solana (Pump.fun) wallet modal
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BottomNav } from "@/components/BottomNav";
import { WalletGate } from "@/components/WalletGate";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute base for og:image / twitter:image (X and Telegram need full URLs).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://usenoir.app"),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  // Icons come from the file conventions: src/app/favicon.ico, icon.png,
  // apple-icon.png (cache-busted URLs) and manifest.ts.
  openGraph: {
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
    type: "website",
    images: [{ url: "/noir-og.png", width: 1200, height: 630, alt: "NOIR · Your profile. Now a market." }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
    images: ["/noir-og.png"],
    site: SITE.xHandle,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08090a",
};

// Render at request time, not static export. RainbowKit's config throws
// "reading 'uid'" during Next's static prerender step, so skip prerender.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          One-time cleanup of stale wallet state. Old wallet/WalletConnect keys
          can be in shapes the current setup can't rehydrate, which threw in the
          providers on mobile Safari. This runs before React hydrates and drops
          any stale wallet keys once per version so RainbowKit starts clean.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var V='fomo-wallet-reset-1';if(localStorage.getItem('fomo.walletReset')===V)return;var kill=/^(wagmi|wc@2|walletconnect|WALLETCONNECT|rk-|@rainbow|fomo\\.wagmi|W3M|WCM|@w3m|@appkit|reown|@reown|CBWSDK|-walletlink)/i;Object.keys(localStorage).forEach(function(k){if(kill.test(k))localStorage.removeItem(k)});localStorage.setItem('fomo.walletReset',V)}catch(e){}})();",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="cinema-bg" aria-hidden />
        <div className="grain" aria-hidden />
        <Providers>
          <div className="flex min-h-dvh flex-col overflow-x-clip">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <BottomNav />
          <WalletGate />
        </Providers>
      </body>
    </html>
  );
}
