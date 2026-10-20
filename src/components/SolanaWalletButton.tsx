"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

/**
 * Solana wallet button for the Pump.fun launch path (Phantom, Solflare,
 * Backpack… via the Wallet Standard). Rendered after mount only, like the EVM
 * WalletButton, so SSR never touches wallet state.
 */
export function SolanaWalletButton({
  className = "btn-ghost",
  label = "Connect Solana wallet",
}: {
  className?: string;
  label?: string;
}) {
  const { publicKey, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button type="button" className={className} aria-hidden style={{ opacity: 0, pointerEvents: "none" }}>
        Connect Solana
      </button>
    );
  }

  if (!publicKey) {
    return (
      <button type="button" className={className} onClick={() => setVisible(true)} disabled={connecting}>
        {connecting ? "Connecting…" : label}
      </button>
    );
  }

  const addr = publicKey.toBase58();
  return (
    <button
      type="button"
      className={className}
      onClick={() => void disconnect()}
      title={`Connected with ${wallet?.adapter.name ?? "wallet"} · click to disconnect`}
    >
      <span className="h-2 w-2 rounded-full bg-[#14f195] shadow-[0_0_8px_#14f195]" />
      <span className="font-mono">
        {addr.slice(0, 4)}…{addr.slice(-4)}
      </span>
    </button>
  );
}
