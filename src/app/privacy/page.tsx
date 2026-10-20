import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { Callout, DocSection, DocShell, DocTable } from "@/components/DocShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What NOIR processes, what it never collects, and the third parties involved.",
};

const UPDATED = "October 20, 2026";

const TOC = [
  { id: "summary", title: "At a glance" },
  { id: "processed", title: "What we process" },
  { id: "never", title: "What we never collect" },
  { id: "third-parties", title: "Third-party services" },
  { id: "storage", title: "Browser storage" },
  { id: "retention", title: "Retention" },
  { id: "choices", title: "Your choices" },
  { id: "security", title: "Security" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes" },
  { id: "contact", title: "Contact" },
];

export default function PrivacyPage() {
  return (
    <DocShell
      eyebrow="Legal"
      title="Privacy Policy"
      intro={
        <>
          {SITE.name} is built to know as little about you as possible. There are no accounts, no passwords, no emails
          and no ad tracking. This policy explains exactly what is processed when you use the app.
        </>
      }
      updated={UPDATED}
      toc={TOC}
    >
      <DocSection id="summary" title="At a glance">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["No accounts", "You connect a wallet. There is nothing to sign up for."],
            ["No custody", "Keys never leave your wallet. We can’t move your funds."],
            ["Public by nature", "Launches and trades are recorded on public blockchains."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="text-[15px] font-semibold text-white">{t}</div>
              <div className="mt-1.5 text-sm text-zinc-600">{b}</div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="processed" title="What we process">
        <DocTable
          head={["Data", "Why", "Where it lives"]}
          rows={[
            ["Public wallet address", "Read balances, build transactions, show your launches", "Your browser; on launch records"],
            ["Launch records", "Show coins in the NOIR feed and on your profile page", "Our storage (token, name, ticker, logo, handle, links, deployer, tx hash)"],
            ["Uploaded avatars", "Display your coin’s image and keep on-chain metadata short", "Our storage; on Solana also pinned to IPFS (public, permanent)"],
            ["Comments", "Holders’ comments on a coin page, signed by your wallet", "Our storage, shown publicly"],
            ["Profile lookups", "Detect a fomo.family or Pump.fun profile you entered", "Fetched from their public APIs; cached briefly"],
            ["Basic request logs", "Keep the service running and stop abuse", "Our hosting provider, short-term"],
          ]}
        />
        <p>
          Profile data shown in Top profiles and the Leaderboard is <strong>public information</strong> published by
          fomo.family and Pump.fun.
        </p>
      </DocSection>

      <DocSection id="never" title="What we never collect">
        <ul>
          <li>Private keys, seed phrases or wallet passwords. Never enter them anywhere on NOIR.</li>
          <li>Names, emails, phone numbers or government IDs.</li>
          <li>Advertising identifiers or cross-site tracking cookies.</li>
        </ul>
        <Callout tone="warn" title="Nobody from NOIR will ever ask for your seed phrase">
          If someone does, it is a scam.
        </Callout>
      </DocSection>

      <DocSection id="third-parties" title="Third-party services">
        <p>Using NOIR means some requests go to services we don’t control, each with its own privacy policy:</p>
        <DocTable
          head={["Service", "Used for"]}
          rows={[
            ["Robinhood Chain RPC & Blockscout", "Reading the chain and viewing transactions"],
            ["Solana RPC & Solscan", "Sending Solana transactions and viewing them"],
            ["FOMO API (fomo.family)", "fomo profile detection and the leaderboard"],
            ["Pump.fun", "Pump.fun profiles, metadata upload to IPFS"],
            ["PumpPortal", "Building the unsigned Pump.fun create transaction"],
            ["WalletConnect / Reown", "Connecting mobile EVM wallets"],
            ["Vercel & Upstash", "Hosting and storage"],
            ["Google Fonts", "Loading the site’s typefaces"],
          ]}
        />
      </DocSection>

      <DocSection id="storage" title="Browser storage">
        <p>
          We use your browser’s local storage only for conveniences: remembering your wallet connection, that you
          accepted the Terms for a given wallet, and similar preferences. You can clear it at any time in your browser
          settings.
        </p>
      </DocSection>

      <DocSection id="retention" title="Retention">
        <ul>
          <li>The feed keeps the most recent launch records; older ones roll off automatically.</li>
          <li>Profile lookups are cached for minutes to days, then expire.</li>
          <li>
            Anything written to a blockchain or IPFS is permanent and public. We cannot delete it, and neither can
            anyone else.
          </li>
        </ul>
      </DocSection>

      <DocSection id="choices" title="Your choices">
        <ul>
          <li>Disconnect your wallet at any time from the wallet menu.</li>
          <li>Creators can ask for a launch to be removed from the NOIR feed (the on-chain coin itself remains).</li>
          <li>Depending on where you live, you may have rights to access or delete data we hold. Contact us below.</li>
        </ul>
      </DocSection>

      <DocSection id="security" title="Security">
        <p>
          Every transaction is built in your browser and signed by your wallet. Server-side keys (for example API keys)
          never reach the browser. No system is perfectly secure; always review what your wallet asks you to sign.
        </p>
      </DocSection>

      <DocSection id="children" title="Children">
        <p>NOIR is not intended for anyone under 18, or under the age of majority where you live.</p>
      </DocSection>

      <DocSection id="changes" title="Changes">
        <p>We may update this policy. The date at the top always shows the latest version.</p>
      </DocSection>

      <DocSection id="contact" title="Contact">
        <p>
          Questions or requests: reach us on X at{" "}
          <a href={SITE.x} target="_blank" rel="noreferrer">
            {SITE.xHandle}
          </a>
          . See also the <Link href="/terms">Terms of Use</Link>.
        </p>
      </DocSection>
    </DocShell>
  );
}
