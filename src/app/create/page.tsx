import type { Metadata } from "next";
import { ProfileStudio } from "@/components/ProfileStudio";
import { toSource } from "@/lib/profile-source";

export const metadata: Metadata = {
  title: "Launch",
  description:
    "Tokenize your fomo.family, Pump.fun or GitHub profile and launch it on Pons v2 (Robinhood Chain) or Pump.fun (Solana).",
};

export default function CreatePage({
  searchParams,
}: {
  searchParams: { handle?: string; source?: string; chain?: string };
}) {
  const initialHandle = typeof searchParams?.handle === "string" ? searchParams.handle : "";
  const initialSource = toSource(searchParams?.source);
  const initialChain = searchParams?.chain === "solana" || initialSource === "pumpfun" ? "solana" : "robinhood";
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
          Launch your <span className="grad-text">profile coin</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Detect it from your @fomo, @Pumpfun or GitHub profile, tune every field, then launch on the Pons v2
          bonding curve (Robinhood Chain) or on Pump.fun (Solana). Your wallet signs the transaction.
          Nothing is custodied.
        </p>
      </div>
      <ProfileStudio initialHandle={initialHandle} initialSource={initialSource} initialChain={initialChain} />
    </div>
  );
}
