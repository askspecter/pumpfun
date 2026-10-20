import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { V2_GRADUATION_THRESHOLD_ETH } from "@/lib/pons";
import { Callout, DocCta, DocSection, DocShell, DocTable, Faq, Steps } from "@/components/DocShell";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Docs",
  description: "How NOIR tokenizes fomo.family and Pump.fun profiles on Robinhood Chain and Solana.",
};

const TOC = [
  { id: "overview", title: "Overview" },
  { id: "quickstart", title: "Quickstart" },
  { id: "profiles", title: "Profile sources" },
  { id: "chains", title: "Robinhood vs Solana" },
  { id: "robinhood", title: "Launching on Robinhood" },
  { id: "solana", title: "Launching on Solana" },
  { id: "trading", title: "Trading & graduation" },
  { id: "fees", title: "Creator fees" },
  { id: "top-profiles", title: "Top profiles" },
  { id: "safety", title: "Safety & risks" },
  { id: "faq", title: "FAQ" },
];

export default function DocsPage() {
  return (
    <DocShell
      eyebrow="Documentation"
      title="How NOIR works"
      intro={
        <>
          {SITE.name} turns a <span className="text-zinc-800">@fomo</span> or <span className="text-zinc-800">@Pumpfun</span>{" "}
          profile into a coin and launches it on a bonding curve, on {SITE.chain} through {SITE.poweredBy} v2 or on
          Solana through Pump.fun. Everything is non-custodial: your wallet signs every transaction.
        </>
      }
      toc={TOC}
    >
      <DocSection id="overview" title="Overview">
        <p>
          A <strong>profile coin</strong> is a token that represents a creator’s public profile: their name, avatar,
          bio and links. People who believe in a creator can buy in early on the curve; as demand grows, the price
          rises along the curve until the coin <strong>graduates</strong> to a permanent liquidity pool.
        </p>
        <div className="my-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Detect", "Pull a real profile from fomo.family or Pump.fun in one click."],
            ["Launch", "Pick Robinhood Chain or Solana and sign one transaction."],
            ["Trade", "The coin trades on a bonding curve, then graduates."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="text-[15px] font-semibold text-white">{t}</div>
              <div className="mt-1.5 text-sm text-zinc-600">{b}</div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="quickstart" title="Quickstart" kicker="~1 minute">
        <Steps
          items={[
            {
              title: "Open the launch studio",
              body: (
                <>
                  Go to <Link href="/create">Launch</Link>, or press <strong>Tokenize</strong> next to any profile on the
                  homepage.
                </>
              ),
            },
            {
              title: "Detect your profile",
              body: "Pick @fomo or @Pumpfun, enter your handle (or Solana wallet for Pump.fun) and press Detect. Name, ticker, bio and avatar fill in automatically.",
            },
            {
              title: "Choose a chain",
              body: "Robinhood (Pons v2, paid in ETH) or Solana (Pump.fun, paid in SOL). Add an optional first buy.",
            },
            {
              title: "Sign and launch",
              body: "Connect the matching wallet and sign. Your coin is live as soon as the transaction confirms.",
            },
          ]}
        />
      </DocSection>

      <DocSection id="profiles" title="Profile sources">
        <h3 className="flex items-center gap-2">
          <BrandLogo brand="fomo" className="h-5 w-5 rounded-full" /> @fomo · fomo.family
        </h3>
        <p>
          Enter a fomo.family handle. NOIR reads the public profile through the FOMO API: display name, avatar, bio,
          verification and the trader’s real wallets. On Robinhood, the profile’s EVM wallet becomes the coin’s
          <strong> creator-fee recipient</strong>, so fees go to the person behind the profile, not to whoever pressed
          launch.
        </p>
        <h3 className="flex items-center gap-2">
          <BrandLogo brand="pumpfun" className="h-5 w-5 rounded-full" /> @Pumpfun · pump.fun
        </h3>
        <p>
          Enter a Pump.fun username or, more reliably, the profile’s Solana wallet address. NOIR reads the public
          profile (username, avatar, bio) from Pump.fun.
        </p>
        <Callout title="Everything stays editable">
          Detection only pre-fills the form. You can change the name, ticker (auto-generated from the handle), hook,
          avatar and links before you launch.
        </Callout>
      </DocSection>

      <DocSection id="chains" title="Robinhood vs Solana">
        <DocTable
          head={[
            "",
            <span key="rh" className="flex items-center gap-2"><BrandLogo brand="robinhood" className="h-4 w-4 rounded-full" /> Robinhood · Pons v2</span>,
            <span key="sol" className="flex items-center gap-2"><BrandLogo brand="solana" className="h-4 w-4 rounded-full" /> Solana · Pump.fun</span>,
          ]}
          rows={[
            ["Wallet", "MetaMask, Rainbow, WalletConnect…", "Phantom, Solflare, Backpack…"],
            ["Paid in", "ETH (plus approved RWA quote assets)", "SOL"],
            ["Curve", "Pons v2 bonding curve", "Pump.fun bonding curve"],
            ["Graduates to", `Uniswap V4 (~${V2_GRADUATION_THRESHOLD_ETH} ETH by default)`, "PumpSwap"],
            ["Creator fees to", "The fomo profile’s wallet (or yours)", "The wallet that launches"],
            ["Launch access", "Whitelist-gated on-chain for now", "Open"],
            ["Explorer", "Blockscout", "Solscan"],
          ]}
        />
      </DocSection>

      <DocSection id="robinhood" title="Launching on Robinhood">
        <p>
          NOIR prepares a <code>launchToken</code> call on the {SITE.poweredBy} v2 factory, <strong>simulates it
          on-chain first</strong>, and only then asks your wallet to sign. If the launch would revert (for example, the
          wallet isn’t whitelisted) you see the reason before spending any gas.
        </p>
        <ul>
          <li>Pair against native ETH, or any RWA quote asset the factory has approved on-chain.</li>
          <li>An optional initial buy is sent in the same transaction (native pairs only).</li>
          <li>Protocol buybacks can be enabled per launch.</li>
          <li>Avatars are shortened to a stored URL so on-chain metadata stays within the contract’s limit.</li>
        </ul>
        <Callout tone="warn" title="Whitelist">
          {SITE.poweredBy} is deployed but unaudited, and public launches are whitelist-gated on-chain. The studio checks
          your wallet up front and warns you before you sign.
        </Callout>
      </DocSection>

      <DocSection id="solana" title="Launching on Solana">
        <Steps
          items={[
            { title: "Metadata", body: "Your avatar and coin details are pinned to IPFS through Pump.fun." },
            { title: "Transaction", body: "PumpPortal builds an unsigned create transaction for your wallet and a brand-new mint." },
            { title: "Signatures", body: "The fresh mint key and your wallet sign it in your browser. NOIR never sees your keys." },
            { title: "Live", body: "Once confirmed on Solana, the coin is live on pump.fun and in the NOIR feed." },
          ]}
        />
        <Callout title="Tip">
          An avatar is required on Pump.fun. A dedicated Solana RPC (Helius, QuickNode…) makes sends far more reliable
          than the public endpoint.
        </Callout>
      </DocSection>

      <DocSection id="trading" title="Trading & graduation">
        <p>
          While a coin is on its curve, every buy raises the price and every sell lowers it, following a fixed formula.
          When the curve fills up, the coin graduates automatically: on Robinhood into a locked Uniswap V4 pool, on
          Solana into PumpSwap. After graduation, trading continues on that pool.
        </p>
        <p>
          On Robinhood coins you can buy and sell directly from the coin’s page on NOIR. Estimates assume zero snipe tax;
          the first seconds of a launch may tax buys more, so raise slippage if a trade reverts.
        </p>
      </DocSection>

      <DocSection id="fees" title="Creator fees">
        <p>
          <strong>Robinhood:</strong> curve fees accrue to the creator-fee recipient in the {SITE.poweredBy} fee escrow,
          payable in ETH (plus the quote token for RWA pairs). Claim them from <Link href="/profile">My profile</Link> or
          a coin’s page. Fees are credited after a sweep, so a zero balance doesn’t always mean zero lifetime earnings.
        </p>
        <p>
          <strong>Solana:</strong> Pump.fun pays creator fees to the wallet that launched the coin. Creators should
          launch from their own profile wallet and claim on pump.fun.
        </p>
      </DocSection>

      <DocSection id="top-profiles" title="Top profiles & leaderboard">
        <p>
          The homepage and <Link href="/leaderboard">Leaderboard</Link> list real, public profiles ranked by followers:
        </p>
        <ul>
          <li>
            <strong>fomo.family:</strong> every window of the FOMO leaderboard (24h, 7d, 30d, all time) is merged, plus
            featured accounts, then ranked by followers. PnL shown is the last 30 days.
          </li>
          <li>
            <strong>Pump.fun:</strong> creators of active and trending coins plus featured accounts, ranked by
            followers.
          </li>
        </ul>
        <p>
          Lists refresh every few minutes. Being listed is not an endorsement, and a listed profile has not necessarily
          launched a coin. Only coins in “Launched on NOIR” exist on-chain.
        </p>
      </DocSection>

      <DocSection id="safety" title="Safety & risks">
        <ul>
          <li>Profile coins are extremely volatile and can go to zero. Only use money you can afford to lose.</li>
          <li>Anyone can launch a coin with any name. Always verify the contract or mint address before buying.</li>
          <li>Transactions on public blockchains are final. NOIR cannot reverse or refund them.</li>
          <li>{SITE.poweredBy} contracts are unaudited. Pump.fun and PumpPortal are third-party services.</li>
        </ul>
        <Callout tone="warn" title="Only tokenize what you have the right to">
          Launch your own profile, or one you have permission to tokenize. Impersonation is not allowed; see the{" "}
          <Link href="/terms">Terms of Use</Link>.
        </Callout>
      </DocSection>

      <DocSection id="faq" title="FAQ">
        <Faq
          items={[
            { q: "Does NOIR hold my funds?", a: "No. NOIR never holds funds or keys. Every action is a transaction your own wallet signs." },
            { q: "Which wallet do I need?", a: "An EVM wallet (MetaMask, Rainbow, WalletConnect) for Robinhood Chain, or a Solana wallet (Phantom, Solflare, Backpack) for Pump.fun." },
            { q: "Why did my Robinhood launch fail?", a: "Most often the wallet isn’t whitelisted on Pons yet, or the wallet is on the wrong network. The studio shows the on-chain reason before you sign." },
            { q: "Can I change my coin after launch?", a: "No. Name, ticker and metadata are fixed once the transaction confirms, so double-check before signing." },
            { q: "Why can’t I find a profile?", a: "fomo detection needs the exact handle. For Pump.fun, paste the Solana wallet address from the profile URL; usernames don’t always resolve." },
            { q: "Is NOIR affiliated with Robinhood, Pons, fomo or Pump.fun?", a: "No. NOIR is an independent, third-party interface." },
          ]}
        />
        <div className="mt-8">
          <DocCta />
        </div>
      </DocSection>
    </DocShell>
  );
}
