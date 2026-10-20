import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { Callout, DocSection, DocShell } from "@/components/DocShell";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for using NOIR, a non-custodial interface for launching profile coins.",
};

const UPDATED = "October 20, 2026";

const TOC = [
  { id: "acceptance", title: "Acceptance" },
  { id: "eligibility", title: "Eligibility" },
  { id: "service", title: "What NOIR is" },
  { id: "wallets", title: "Wallets & keys" },
  { id: "launching", title: "Launching coins" },
  { id: "profiles", title: "Profiles & likeness" },
  { id: "prohibited", title: "Prohibited use" },
  { id: "third-parties", title: "Third-party protocols" },
  { id: "fees", title: "Fees" },
  { id: "risks", title: "Risks" },
  { id: "moderation", title: "Feed moderation" },
  { id: "ip", title: "Intellectual property" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "liability", title: "Limitation of liability" },
  { id: "indemnity", title: "Indemnity" },
  { id: "changes", title: "Changes & termination" },
  { id: "contact", title: "Contact" },
];

export default function TermsPage() {
  return (
    <DocShell
      eyebrow="Legal"
      title="Terms of Use"
      intro={
        <>
          These terms govern your use of {SITE.name}, a non-custodial, third-party interface for launching and trading
          profile coins on {SITE.chain} and Solana. Please read them carefully.
        </>
      }
      updated={UPDATED}
      toc={TOC}
    >
      <Callout tone="warn" title="The short version">
        NOIR never holds your funds. You sign every transaction yourself, transactions are final, profile coins are
        highly speculative and can lose all value, and you may only tokenize a profile you have the right to.
      </Callout>

      <DocSection id="acceptance" title="1. Acceptance">
        <p>
          By accessing or using {SITE.name} you agree to these Terms and to the <Link href="/privacy">Privacy Policy</Link>.
          If you do not agree, do not use the app.
        </p>
      </DocSection>

      <DocSection id="eligibility" title="2. Eligibility">
        <ul>
          <li>You are at least 18 years old, or the age of majority where you live.</li>
          <li>
            You are not located in, or a resident of, a jurisdiction where using the app is prohibited, and you are not
            on any sanctions list.
          </li>
          <li>You are responsible for complying with the laws that apply to you, including tax obligations.</li>
        </ul>
      </DocSection>

      <DocSection id="service" title="3. What NOIR is">
        <p>
          {SITE.name} is software that helps you prepare transactions for public protocols: the {SITE.poweredBy} v2
          contracts on {SITE.chain}, and Pump.fun on Solana. {SITE.name} is not an exchange, broker, custodian or
          financial adviser, and does not issue, sell or promote any token.
        </p>
      </DocSection>

      <DocSection id="wallets" title="4. Wallets & keys">
        <p>
          You use your own wallet. {SITE.name} never has access to your private keys or funds and cannot recover a lost
          wallet, reverse a transaction or refund a trade. Always review what your wallet asks you to sign.
        </p>
      </DocSection>

      <DocSection id="launching" title="5. Launching coins">
        <ul>
          <li>You are solely responsible for every coin you launch: its name, ticker, imagery, description and links.</li>
          <li>Metadata on a blockchain or IPFS is public and permanent and cannot be edited or removed after launch.</li>
          <li>
            A launch may fail or behave unexpectedly (for example, a {SITE.poweredBy} launch from a wallet that isn’t
            whitelisted). Network fees are not refundable.
          </li>
        </ul>
      </DocSection>

      <DocSection id="profiles" title="6. Profiles & likeness">
        <p>
          You may only tokenize <strong>your own profile</strong>, or a profile whose owner has given you permission.
          Profiles appearing in Top profiles or the Leaderboard are shown because they are public; their appearance is not
          an endorsement, and does not give you permission to tokenize them.
        </p>
        <p>
          Do not imply that a person endorses or is affiliated with a coin when they are not. Profile owners who believe a
          coin misuses their identity can contact us to have it removed from the NOIR feed.
        </p>
      </DocSection>

      <DocSection id="prohibited" title="7. Prohibited use">
        <ul>
          <li>Impersonating any person or organization, or misleading people about a coin’s origin.</li>
          <li>Market manipulation, wash trading, pump-and-dump schemes or other fraud.</li>
          <li>Content that is illegal, hateful, sexually exploitative, or infringes someone’s rights.</li>
          <li>Laundering funds, evading sanctions, or financing illegal activity.</li>
          <li>Attacking, overloading or reverse-engineering the app or its infrastructure.</li>
        </ul>
      </DocSection>

      <DocSection id="third-parties" title="8. Third-party protocols & services">
        <p>
          The protocols and services {SITE.name} connects to, including {SITE.poweredBy}, Pump.fun, PumpPortal,
          fomo.family, wallets, RPC providers and block explorers, are operated by others. {SITE.name} is not affiliated
          with or endorsed by any of them, does not control them, and is not responsible for their availability,
          security or conduct.
        </p>
      </DocSection>

      <DocSection id="fees" title="9. Fees">
        <p>
          Launching and trading may involve network fees, protocol launch fees and curve fees set by the underlying
          protocols. Where shown, these are estimates; the final amount is what your wallet confirms.
        </p>
      </DocSection>

      <DocSection id="risks" title="10. Risks">
        <ul>
          <li>Profile coins are highly volatile, often illiquid, and can lose all of their value.</li>
          <li>Smart contracts can contain bugs; the {SITE.poweredBy} contracts are unaudited.</li>
          <li>Blockchain transactions are irreversible.</li>
          <li>Regulation of digital assets is evolving and may affect your ability to use them.</li>
        </ul>
      </DocSection>

      <DocSection id="moderation" title="11. Feed moderation">
        <p>
          The NOIR feed is a convenience, not a registry. We may hide or remove any listing, at any time, for any reason,
          including reports of impersonation or abuse. Removing a listing does not affect the coin on-chain.
        </p>
      </DocSection>

      <DocSection id="ip" title="12. Intellectual property">
        <p>
          The {SITE.name} name, logo and interface are ours. Third-party names and logos (Robinhood, Solana, fomo.family,
          Pump.fun and others) belong to their owners and are used only to identify those services. You keep the rights
          to content you upload and grant us a license to display it within the app.
        </p>
      </DocSection>

      <DocSection id="disclaimers" title="13. Disclaimers">
        <p>
          The app is provided “as is” and “as available”, without warranties of any kind, express or implied. Nothing on{" "}
          {SITE.name} is financial, investment, legal or tax advice.
        </p>
      </DocSection>

      <DocSection id="liability" title="14. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {SITE.name} and its contributors are not liable for any indirect,
          incidental, special or consequential damages, or for any loss of funds, tokens, profits or data, arising from
          your use of the app or the underlying protocols.
        </p>
      </DocSection>

      <DocSection id="indemnity" title="15. Indemnity">
        <p>
          You agree to indemnify and hold harmless {SITE.name} and its contributors from claims arising out of your use
          of the app, the coins you launch, or your breach of these Terms.
        </p>
      </DocSection>

      <DocSection id="changes" title="16. Changes & termination">
        <p>
          We may update these Terms or change, suspend or discontinue the app at any time. Continued use after an update
          means you accept the new Terms. The date at the top shows the latest version.
        </p>
      </DocSection>

      <DocSection id="contact" title="17. Contact">
        <p>
          Questions, reports or removal requests: reach us on X at{" "}
          <a href={SITE.x} target="_blank" rel="noreferrer">
            {SITE.xHandle}
          </a>
          .
        </p>
      </DocSection>
    </DocShell>
  );
}
