"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { pctOf, type TradeIntent } from "./tradeIntent";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { SolanaWalletButton } from "./SolanaWalletButton";
import { BrandLogo } from "./BrandLogo";
import { solanaTx } from "@/lib/solana";

const FEE = 0.01; // Pump.fun curve fee, approximately; used for estimates only.

interface Reserves {
  virtualTokenReserves: string;
  virtualSolReserves: string;
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function fmt(n: number, max = 4): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: n >= 1000 ? 0 : max });
}

/**
 * Buy/sell a Pump.fun coin from NOIR. PumpPortal builds the transaction
 * (bonding curve, or PumpSwap after graduation); the user's wallet signs it.
 */
export function SolanaTradeWidget({
  mint,
  symbol,
  reserves,
  onTraded,
  intent,
}: {
  mint: string;
  symbol: string;
  reserves: Reserves | null;
  onTraded?: () => void;
  /** Prefill from the Terminal (side / amount); never submits. */
  intent?: TradeIntent;
}) {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(10);
  const [solBal, setSolBal] = useState<number | null>(null);
  const [tokBal, setTokBal] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "building" | "signing" | "confirming" | "done" | "error">("idle");
  const [sig, setSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Terminal prefill: switch side and/or fill the amount ("25%" = share of the token balance).
  useEffect(() => {
    if (!intent) return;
    if (intent.side) setSide(intent.side);
    if (intent.amount == null) return;
    const pct = pctOf(intent.amount);
    if (pct == null) setAmount(intent.amount.replace(/[^0-9.]/g, ""));
    else setAmount(tokBal ? String(Math.floor(tokBal * pct * 1e6) / 1e6) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent?.nonce]);

  const loadBalances = useCallback(async () => {
    if (!publicKey) return;
    try {
      setSolBal((await connection.getBalance(publicKey)) / 1e9);
      const accts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: new PublicKey(mint) });
      const total = accts.value.reduce(
        (n, a) => n + Number(a.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0),
        0,
      );
      setTokBal(total);
    } catch {
      // balances are a convenience; trading still works without them
    }
  }, [connection, publicKey, mint]);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  const n = Number(amount);
  const estimate = useMemo(() => {
    if (!reserves || !(n > 0)) return null;
    const vT = Number(reserves.virtualTokenReserves) / 1e6;
    const vS = Number(reserves.virtualSolReserves) / 1e9;
    if (side === "buy") {
      const inSol = n * (1 - FEE);
      return { label: `${fmt((vT * inSol) / (vS + inSol), 0)} ${symbol}` };
    }
    return { label: `${fmt(((vS * n) / (vT + n)) * (1 - FEE))} SOL` };
  }, [reserves, n, side, symbol]);

  async function trade(override?: string) {
    if (!publicKey) return;
    setError(null);
    setSig(null);
    const value = override ?? amount;
    try {
      setStatus("building");
      const res = await fetch("/api/pumpfun/trade-tx", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          mint,
          action: side,
          amount: value,
          denominatedInSol: side === "buy",
          slippage,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't build the trade.");
      const tx = VersionedTransaction.deserialize(decodeBase64(json.tx));

      setStatus("signing");
      let signature: string;
      if (signTransaction) {
        const signed = await signTransaction(tx);
        signature = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3 });
      } else {
        signature = await sendTransaction(tx, connection, { maxRetries: 3 });
      }
      setSig(signature);

      setStatus("confirming");
      const latest = await connection.getLatestBlockhash();
      const conf = await connection.confirmTransaction(
        { signature, blockhash: tx.message.recentBlockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        "confirmed",
      );
      if (conf.value.err) throw new Error("The trade failed on-chain. Try a higher slippage.");
      setStatus("done");
      setAmount("");
      void loadBalances();
      onTraded?.();
    } catch (err) {
      setStatus("error");
      const message = err instanceof Error ? err.message : "Trade failed.";
      setError(/reject/i.test(message) ? "You rejected the transaction in your wallet." : message);
    }
  }

  const busy = status === "building" || status === "signing" || status === "confirming";
  const presets = side === "buy" ? ["0.1", "0.5", "1"] : ["25%", "50%", "100%"];

  return (
    <div className="card p-5">
      <div className="grid grid-cols-2 rounded-xl bg-white/[0.04] p-1 text-sm font-semibold">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setSide(s);
              setAmount("");
              setStatus("idle");
              setError(null);
            }}
            className={`rounded-lg py-2.5 capitalize transition ${
              side === s ? (s === "buy" ? "bg-up text-[#03130b]" : "bg-down text-white") : "text-zinc-500 hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
        <span>{side === "buy" ? "You pay" : "You sell"}</span>
        {publicKey && (
          <span className="font-mono">
            Balance: {side === "buy" ? `${solBal === null ? "…" : fmt(solBal)} SOL` : `${tokBal === null ? "…" : fmt(tokBal, 2)} ${symbol}`}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.0"
          inputMode="decimal"
          className="w-full bg-transparent font-mono text-xl font-semibold text-white outline-none placeholder:text-zinc-400"
        />
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-white">
          {side === "buy" ? (
            <>
              <BrandLogo brand="solana" className="h-5 w-5 rounded-full" /> SOL
            </>
          ) : (
            <span className="font-mono">{symbol}</span>
          )}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {presets.map((p) => (
          <button
            key={p}
            disabled={busy || !publicKey}
            onClick={() => {
              if (p.endsWith("%")) {
                if (tokBal) setAmount(String(Math.floor(((tokBal * parseFloat(p)) / 100) * 1e6) / 1e6));
              } else setAmount(p);
            }}
            className="rounded-lg bg-white/[0.04] py-2 font-mono text-xs text-zinc-500 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-zinc-500">
        <div className="flex justify-between">
          <span>You receive (est.)</span>
          <span className="font-mono text-white">{estimate?.label ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Slippage</span>
          <span className="flex gap-1">
            {[5, 10, 20].map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`rounded-md px-2 py-0.5 font-mono ${slippage === s ? "bg-white/10 text-white" : "hover:text-white"}`}
              >
                {s}%
              </button>
            ))}
          </span>
        </div>
      </div>

      <div className="mt-4">
        {!publicKey ? (
          <SolanaWalletButton className="btn-brand w-full" />
        ) : (
          <button
            onClick={() => trade()}
            disabled={busy || !(n > 0)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition disabled:opacity-40 ${
              side === "buy" ? "bg-up text-[#03130b]" : "bg-down text-white"
            }`}
          >
            {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />}
            {status === "building"
              ? "Building…"
              : status === "signing"
                ? "Sign in your wallet…"
                : status === "confirming"
                  ? "Confirming…"
                  : `${side === "buy" ? "Buy" : "Sell"} $${symbol}`}
          </button>
        )}
      </div>

      {status === "done" && sig && (
        <a href={solanaTx(sig)} target="_blank" rel="noreferrer" className="mt-3 block text-center text-xs text-up underline">
          ✓ Trade confirmed · view on Solscan
        </a>
      )}
      {error && <p className="mt-3 whitespace-pre-wrap text-xs text-red-600">{error}</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
        Estimates use the live curve and ~1% fee. Trades route through PumpPortal to the Pump.fun curve, or PumpSwap after
        graduation.
      </p>
    </div>
  );
}
