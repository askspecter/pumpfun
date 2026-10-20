"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { SolanaWalletButton } from "./SolanaWalletButton";
import { pumpCoinUrl, solanaTx } from "@/lib/solana";

export interface PumpLaunchInput {
  name: string;
  ticker: string;
  description: string;
  imageUri: string;
  /** Optional dev buy, in SOL. */
  initialBuySol?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `Request failed (${res.status}).`);
  return json as T;
}

/**
 * Deploy path (Solana · Pump.fun): upload metadata to Pump.fun IPFS, have
 * PumpPortal build the `create` transaction, sign it with a fresh mint keypair
 * plus the user's wallet, send, and record the launch to the profile feed.
 * The creator (and Pump.fun creator-fee recipient) is the connected wallet.
 */
export function PumpDeployButton({
  input,
  handle,
  source,
  disabled,
}: {
  input: PumpLaunchInput;
  handle?: string;
  source?: "fomo" | "pumpfun";
  disabled?: boolean;
}) {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const [status, setStatus] = useState<"idle" | "uploading" | "building" | "signing" | "confirming" | "sent" | "error">("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [mint, setMint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deploy() {
    if (!publicKey) return;
    setError(null);
    try {
      setStatus("uploading");
      const meta = await postJson<{ uri: string; name: string; symbol: string }>("/api/pumpfun/metadata", {
        name: input.name,
        symbol: input.ticker,
        description: input.description,
        image: input.imageUri,
        twitter: input.twitter,
        telegram: input.telegram,
        website: input.website,
      });

      setStatus("building");
      const mintKeypair = Keypair.generate();
      const { tx } = await postJson<{ tx: string }>("/api/pumpfun/create-tx", {
        publicKey: publicKey.toBase58(),
        mint: mintKeypair.publicKey.toBase58(),
        name: meta.name,
        symbol: meta.symbol,
        uri: meta.uri,
        amountSol: input.initialBuySol && Number(input.initialBuySol) > 0 ? Number(input.initialBuySol) : 0,
      });
      const transaction = VersionedTransaction.deserialize(decodeBase64(tx));

      // The new mint must co-sign its own creation; the wallet signs as payer.
      transaction.sign([mintKeypair]);

      setStatus("signing");
      let sig: string;
      if (signTransaction) {
        const signed = await signTransaction(transaction);
        sig = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3 });
      } else {
        sig = await sendTransaction(transaction, connection, { maxRetries: 3 });
      }
      setSignature(sig);

      setStatus("confirming");
      const latest = await connection.getLatestBlockhash();
      const conf = await connection.confirmTransaction(
        { signature: sig, blockhash: transaction.message.recentBlockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        "confirmed",
      );
      if (conf.value.err) throw new Error("The launch transaction failed on-chain.");

      const mintAddress = mintKeypair.publicKey.toBase58();
      setMint(mintAddress);
      setStatus("sent");
      void fetch("/api/launches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chain: "solana",
          token: mintAddress,
          name: meta.name,
          symbol: meta.symbol,
          logo: input.imageUri.startsWith("data:") ? "" : input.imageUri,
          handle,
          source,
          twitter: input.twitter,
          telegram: input.telegram,
          website: input.website,
          deployer: publicKey.toBase58(),
          txHash: sig,
        }),
      }).catch(() => {});
    } catch (err) {
      setStatus("error");
      const message = err instanceof Error ? err.message : "Launch failed.";
      setError(/reject/i.test(message) ? "You rejected the transaction in your wallet." : message);
    }
  }

  if (status === "sent" && mint) {
    return (
      <div className="space-y-2">
        <a className="btn-brand w-full" href={`/sol/${mint}`}>
          ✓ Profile launched. Open your coin →
        </a>
        <a className="btn-ghost w-full" href={pumpCoinUrl(mint)} target="_blank" rel="noreferrer">
          View on Pump.fun ↗
        </a>
        {signature && (
          <a className="btn-ghost w-full" href={solanaTx(signature)} target="_blank" rel="noreferrer">
            View transaction →
          </a>
        )}
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="space-y-2">
        <SolanaWalletButton className="btn-brand w-full" />
        <p className="text-xs text-zinc-500">Connect a Solana wallet (Phantom, Solflare, Backpack…) to launch on Pump.fun.</p>
      </div>
    );
  }

  const busy = ["uploading", "building", "signing", "confirming"].includes(status);
  const label =
    status === "uploading"
      ? "Uploading metadata…"
      : status === "building"
        ? "Building transaction…"
        : status === "signing"
          ? "Sign in your wallet…"
          : status === "confirming"
            ? "Confirming on Solana…"
            : "Launch on Pump.fun";

  return (
    <div className="space-y-2">
      <button className="btn-brand w-full" disabled={disabled || busy} onClick={deploy}>
        {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {label}
      </button>
      {signature && status === "error" && (
        <a className="block text-xs text-pink underline" href={solanaTx(signature)} target="_blank" rel="noreferrer">
          Check the transaction on Solscan
        </a>
      )}
      {error && <p className="whitespace-pre-wrap text-xs text-red-600">{error}</p>}
    </div>
  );
}
