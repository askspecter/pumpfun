import type { Verification } from "@/lib/verify";
import { AssetLogo } from "../AssetLogo";

/**
 * Creator verification, from on-chain facts: "Verified" when the profile's own
 * wallet launched the coin, "Fees to creator" when someone else launched it
 * but its creator fees route to the profile's wallet.
 */
export function VerifiedBadge({ verified, compact = false }: { verified: Verification; compact?: boolean }) {
  if (verified === "verified") {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#2fe39a]/30 bg-[#2fe39a]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#2fe39a]"
        title="Launched by the profile's own wallet (checked on-chain)"
      >
        <CheckIcon />
        {!compact && "Verified"}
      </span>
    );
  }
  if (verified === "fees" && !compact) {
    return (
      <span
        className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-zinc-500"
        title="Creator fees route to the profile's own wallet (checked on-chain)"
      >
        Fees → creator
      </span>
    );
  }
  return null;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

/** The asset a profile coin is paired with (e.g. NVDA), when it isn't native ETH. */
export function PairChip({ pair }: { pair: { symbol: string; name: string } | null }) {
  if (!pair) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] py-0.5 pl-0.5 pr-1.5 text-[10px] font-semibold text-zinc-600"
      title={`Paired with ${pair.name || pair.symbol}`}
    >
      <AssetLogo symbol={pair.symbol} size={14} />
      {pair.symbol}
    </span>
  );
}
