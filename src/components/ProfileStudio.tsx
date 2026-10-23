"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { zeroAddress } from "viem";
import { QuoteAssetSelect, type QuoteAsset } from "./QuoteAssetSelect";
import { DeployButton } from "./DeployButton";
import { PumpDeployButton, type PumpLaunchInput } from "./PumpDeployButton";
import { BrandLogo } from "./BrandLogo";
import { AssetLogo } from "./AssetLogo";
import { PROFILE_SOURCES, SOURCE_LABEL, type ProfileSource } from "@/lib/profile-source";
import { uploadLogo } from "@/lib/upload";
import { V2_GRADUATION_THRESHOLD_ETH } from "@/lib/pons";
import type { LaunchInput } from "@/lib/pons";
import type { LaunchChain } from "@/lib/solana";

interface LaunchOptions {
  launchFee: string;
  canLaunch: boolean | null;
  configs: { id: string }[];
  quoteAssets: QuoteAsset[];
}

export type { ProfileSource };

const ETH_ASSET: QuoteAsset = {
  asset: zeroAddress,
  symbol: "ETH",
  name: "Ether",
};

const CHAIN_LABEL: Record<LaunchChain, string> = {
  robinhood: "Robinhood",
  solana: "Solana",
};

/** Normalize a handle for display + ticker seeding. */
function cleanHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

function short(a: string): string {
  return `${a.slice(0, a.startsWith("0x") ? 6 : 4)}…${a.slice(-4)}`;
}

/** What to type into the handle field, per source. */
const HANDLE_PROMPT: Record<ProfileSource, { label: string; placeholder: string; missing: string }> = {
  fomo: { label: "Handle", placeholder: "yourname", missing: "Enter your fomo.family handle first." },
  pumpfun: { label: "Username or wallet address", placeholder: "yourname or 7xKX…", missing: "Enter your Pump.fun username or wallet first." },
  github: { label: "GitHub username", placeholder: "octocat", missing: "Enter your GitHub username first." },
};

/** A detected profile, normalized across fomo.family, Pump.fun and GitHub. */
interface DetectedProfile {
  source: ProfileSource;
  handle: string;
  displayName: string;
  verified: boolean;
  wallets: { evm: string | null; solana: string | null };
  url: string;
}

export function ProfileStudio({
  initialHandle = "",
  initialSource = "fomo",
  initialChain = "robinhood",
}: {
  initialHandle?: string;
  initialSource?: ProfileSource;
  initialChain?: LaunchChain;
}) {
  const { address } = useAccount();
  const { publicKey: solanaKey } = useWallet();

  // ── Where the profile comes from, and where the coin launches ──
  const [source, setSource] = useState<ProfileSource>(initialSource);
  const [chain, setChain] = useState<LaunchChain>(initialChain);

  // ── Profile seed inputs ──
  const [handle, setHandle] = useState(cleanHandle(initialHandle));
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string>("");

  // ── Resolved profile (real data + creator-fee wallet) ──
  const [profile, setProfile] = useState<DetectedProfile | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  // Editable launch fields
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [initialBuy, setInitialBuy] = useState("");
  const [buyback, setBuyback] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Launch options (live from the Pons factory) ──
  const [options, setOptions] = useState<LaunchOptions | null>(null);
  const [pairToken, setPairToken] = useState<string>(zeroAddress);

  useEffect(() => {
    const url = address ? `/api/v2/launch-options?address=${address}` : "/api/v2/launch-options";
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: LaunchOptions) => setOptions(d))
      .catch(() => setOptions(null));
  }, [address]);

  // Prefilled via /create?handle=… (e.g. the Tokenize button on the leaderboard):
  // auto-detect the profile on first load.
  useEffect(() => {
    if (cleanHandle(initialHandle).length >= 2) detectProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quoteAssets = useMemo<QuoteAsset[]>(() => {
    const list = options?.quoteAssets ?? [];
    if (list.length === 0) return [ETH_ASSET];
    return list;
  }, [options]);
  // Tokenized stocks the factory accepts as a pair (not ETH or stablecoins), for one-tap picks.
  const stockAssets = useMemo(
    () => quoteAssets.filter((a) => a.asset.toLowerCase() !== zeroAddress && !/^USD/i.test(a.symbol)).slice(0, 6),
    [quoteAssets],
  );

  function switchSource(next: ProfileSource) {
    if (next === source) return;
    setSource(next);
    setProfile(null);
    setDetectError(null);
    // A Pump.fun profile naturally launches on Pump.fun.
    if (next === "pumpfun") setChain("solana");
  }

  /** Prefill from a detected profile — everything stays editable before launch. */
  function prefill(p: { handle: string; displayName: string; bio: string; avatar: string }) {
    // Ticker from the @nick, e.g. @john_doe → JOHNDOE. Skipped for a Pump.fun
    // profile without a username (its "handle" is a shortened wallet).
    const fromHandle = p.handle.includes("…") ? "" : p.handle.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    if (fromHandle.length >= 2) setTicker((prev) => prev || fromHandle);
    if (p.displayName) {
      setDisplayName(p.displayName);
      setName((prev) => prev || p.displayName.slice(0, 32));
    }
    if (p.bio) {
      setBio(p.bio);
      setDescription((prev) => prev || p.bio.split("\n")[0].slice(0, 280));
    }
    if (p.avatar) setAvatar(p.avatar);
  }

  /**
   * Detect the real profile behind the handle: prefill name, ticker, bio and avatar
   * from live data, and capture the profile's wallets (EVM for Pons creator
   * fees, Solana for display on the Pump.fun path).
   */
  async function detectProfile() {
    const h = cleanHandle(handle);
    if (h.length < 2) {
      setDetectError(HANDLE_PROMPT[source].missing);
      return;
    }
    setDetectError(null);
    setDetecting(true);
    try {
      if (source === "fomo") {
        const res = await fetch(`/api/fomo/${encodeURIComponent(h)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't detect that profile.");
        const p = data.profile as {
          handle: string;
          displayName: string;
          bio: string;
          avatar: string;
          verified: boolean;
          wallets: { evm: string | null; solana: string | null };
        };
        setProfile({
          source,
          handle: p.handle,
          displayName: p.displayName,
          verified: p.verified,
          wallets: p.wallets,
          url: `https://fomo.family/${p.handle}`,
        });
        prefill(p);
      } else if (source === "github") {
        const res = await fetch(`/api/github/profile/${encodeURIComponent(h)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't detect that profile.");
        const p = data.profile as {
          login: string;
          displayName: string;
          bio: string;
          avatar: string;
          url: string;
          website: string;
          twitter: string;
          wallets: { evm: string | null; solana: string | null };
        };
        setProfile({ source, handle: p.login, displayName: p.displayName, verified: false, wallets: p.wallets, url: p.url });
        // Wallets in the bio are proof, not copy: keep them out of the coin's description.
        const bio = p.bio
          .replace(/\b(?:wallet|eth|evm|sol|solana)\s*[:=]\s*/gi, " ")
          .replace(/0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44}/g, "")
          .replace(/\s{2,}/g, " ")
          .trim()
          .replace(/[.,;:|·-]+$/, "")
          .trim();
        prefill({ handle: p.login, displayName: p.displayName, bio, avatar: p.avatar });
        setWebsite((prev) => prev || p.website || p.url);
        if (p.twitter) setTwitter((prev) => prev || p.twitter);
      } else {
        const res = await fetch(`/api/pumpfun/profile/${encodeURIComponent(h)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't detect that profile.");
        const p = data.profile as { address: string; username: string; bio: string; avatar: string };
        setProfile({
          source,
          handle: p.username,
          displayName: p.username,
          verified: false,
          wallets: { evm: null, solana: p.address },
          url: `https://pump.fun/profile/${p.address}`,
        });
        prefill({ handle: p.username, displayName: p.username, bio: p.bio, avatar: p.avatar });
      }
    } catch (err) {
      setProfile(null);
      setDetectError(err instanceof Error ? err.message : "Couldn't detect that profile.");
    } finally {
      setDetecting(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      setAvatar(url);
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const launchConfigId = options?.configs?.[0]?.id ? Number(options.configs[0].id) : 0;
  const cleanTicker = ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const coinName = name.trim() || cleanHandle(handle);
  // Pons creator fees go to the profile's EVM wallet; Pump.fun pays the signer.
  const feeWallet = (profile?.wallets.evm as `0x${string}` | null) ?? undefined;
  const recordHandle = cleanHandle(profile?.handle ?? handle) || undefined;

  const launchInput: LaunchInput = {
    version: "v2",
    name: coinName,
    ticker: cleanTicker,
    description: description.trim(),
    imageUri: avatar,
    creatorFeeRecipient: feeWallet,
    quoteAsset: "ETH",
    pairToken: pairToken as `0x${string}`,
    launchConfigId,
    buybackEnabled: buyback,
    initialBuyEth: initialBuy && Number(initialBuy) > 0 ? initialBuy : undefined,
    twitter: twitter.trim() || undefined,
    website: website.trim() || undefined,
  };

  const pumpInput: PumpLaunchInput = {
    name: coinName.slice(0, 32),
    ticker: cleanTicker,
    description: description.trim(),
    imageUri: avatar,
    initialBuySol: initialBuy && Number(initialBuy) > 0 ? initialBuy : undefined,
    twitter: twitter.trim() || undefined,
    telegram: telegram.trim() || undefined,
    website: website.trim() || undefined,
  };

  const isSolana = chain === "solana";
  const isNativePair = pairToken.toLowerCase() === zeroAddress.toLowerCase();
  const canDeploy = cleanTicker.length >= 2 && coinName.length >= 1 && (!isSolana || Boolean(avatar));
  const feeEth = options?.launchFee ? Number(options.launchFee) / 1e18 : null;
  const solanaFeeWallet = solanaKey?.toBase58();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,0.9fr]">
      {/* ── Left: detect the profile + editable seed ── */}
      <section className="card p-5 sm:p-6">
        <div className="eyebrow">
          <span className="step-badge">1</span> Your profile
        </div>

        {/* Profile source toggle */}
        <div className="mt-4 grid grid-cols-3 gap-1 rounded-full border border-ink-line bg-white/60 p-1">
          {PROFILE_SOURCES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => switchSource(s)}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                source === s ? "bg-zinc-900 text-white shadow" : "text-pink hover:text-zinc-900"
              }`}
            >
              <BrandLogo brand={s} className="h-5 w-5 rounded-full" />
              {s === "fomo" ? "@fomo" : s === "pumpfun" ? "@Pumpfun" : "GitHub"}
            </button>
          ))}
        </div>

        <p className="mt-3 text-sm text-zinc-600">
          {source === "fomo"
            ? "Drop your fomo.family handle and detect your profile. We pull your name, avatar and bio straight from fomo.family and route Pons creator fees to your profile’s wallet."
            : source === "pumpfun"
              ? "Drop your Pump.fun username or Solana wallet address. We pull your username, avatar and bio straight from your Pump.fun profile."
              : "Builders, this one’s for you. Drop your GitHub username and we pull your name, avatar and bio from GitHub. Put your wallet address in your GitHub bio to route creator fees to it and earn the ✓ Verified badge."}{" "}
          Everything stays editable before you launch.
        </p>

        <label className="mt-5 block text-xs font-semibold text-zinc-500">
          {HANDLE_PROMPT[source].label}
        </label>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-zinc-400">@</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={HANDLE_PROMPT[source].placeholder}
            className="field"
          />
        </div>

        <button className="btn-brand mt-4 w-full" onClick={detectProfile} disabled={detecting}>
          {detecting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {detecting ? "Detecting…" : profile ? "Re-detect profile" : `Detect my ${SOURCE_LABEL[source]} profile`}
        </button>
        {detectError && <p className="mt-2 text-xs text-red-600">{detectError}</p>}
        {profile && (
          <div className="mt-3 rounded-xl border border-ink-line bg-white/50 p-3 text-xs">
            <a
              href={profile.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-semibold text-zinc-700 hover:underline"
            >
              @{profile.handle}
              {profile.verified && <span className="text-pink" title="Verified">✓</span>}
              <span className="font-normal text-zinc-400">· {SOURCE_LABEL[profile.source]}</span>
            </a>
            {!isSolana &&
              (profile.wallets.evm ? (
                <p className="mt-1 text-zinc-500">
                  Creator fees route to this profile’s wallet:{" "}
                  <span className="font-mono text-zinc-700">{short(profile.wallets.evm)}</span>
                </p>
              ) : (
                <p className="mt-1 text-amber-600">
                  {profile.source === "github"
                    ? "No EVM wallet in this GitHub bio, so Pons fees fall back to your connected wallet. Add your address to your bio, then re-detect."
                    : "No EVM wallet on this profile, so Pons fees fall back to your connected wallet."}
                </p>
              ))}
            {profile.source === "github" && (
              <p className="mt-1 text-zinc-500">
                ✓ Verified when you launch from the {isSolana ? "Solana" : "EVM"} wallet listed in your GitHub bio.
              </p>
            )}
            {isSolana && profile.wallets.solana && (
              <p className="mt-1 text-zinc-500">
                Profile Solana wallet: <span className="font-mono text-zinc-700">{short(profile.wallets.solana)}</span>
                {solanaFeeWallet && solanaFeeWallet !== profile.wallets.solana && (
                  <span className="block text-amber-600">
                    Pump.fun pays creator fees to the wallet that launches. Connect this profile’s wallet to
                    receive them.
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-semibold text-zinc-500">Display name (optional)</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="field mt-1" />
        </div>

        <label className="mt-3 block text-xs font-semibold text-zinc-500">Bio (optional)</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A line or two about you."
          rows={3}
          className="field mt-1 resize-none"
        />
        <p className="mt-2 text-[11px] text-zinc-400">
          Detect fills these from {SOURCE_LABEL[source]}, or type them in by hand. Set the coin name, ticker and
          avatar on the right, then launch.
        </p>
      </section>

      {/* ── Right: editable package + launch ── */}
      <section className="card p-5 sm:p-6">
        <div className="eyebrow">
          <span className="step-badge">2</span> Review and launch
        </div>

        {/* Launch chain toggle */}
        <label className="mt-4 block text-xs font-semibold text-zinc-500">Launch on</label>
        <div className="mt-1 grid grid-cols-2 gap-1 rounded-full border border-ink-line bg-white/60 p-1">
          {(["robinhood", "solana"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChain(c)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                chain === c ? "bg-zinc-900 text-white shadow" : "text-pink hover:text-zinc-900"
              }`}
            >
              <BrandLogo brand={c} className="h-5 w-5 rounded-full" />
              {CHAIN_LABEL[c]}
            </button>
          ))}
        </div>

        {/* Avatar */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink-line bg-white">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Profile avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">🫥</span>
            )}
          </div>
          <div className="text-sm">
            <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : avatar ? "Replace avatar" : "Upload avatar"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            <p className="mt-1 text-[11px] text-zinc-400">
              {isSolana ? "Required on Pump.fun. Pinned to IPFS at launch." : "PNG/JPG. Auto-compressed for on-chain use."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-500">Coin name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your profile coin" className="field mt-1" maxLength={isSolana ? 32 : 40} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500">Ticker</label>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
              placeholder="TICKER"
              className="field mt-1 font-mono"
              maxLength={10}
            />
          </div>
        </div>

        <label className="mt-3 block text-xs font-semibold text-zinc-500">One-line hook</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who is this profile?" className="field mt-1" maxLength={280} />

        {/* Paired asset (Pons only) */}
        {!isSolana && (
          <>
            <label className="mt-4 block text-xs font-semibold text-zinc-500">Paired asset (quote)</label>
            <div className="mt-1">
              <QuoteAssetSelect assets={quoteAssets} value={pairToken} onChange={setPairToken} />
            </div>
            {stockAssets.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">Pair with a stock:</span>
                {stockAssets.map((a) => {
                  const on = a.asset.toLowerCase() === pairToken.toLowerCase();
                  return (
                    <button
                      key={a.asset}
                      type="button"
                      onClick={() => setPairToken(on ? zeroAddress : a.asset)}
                      aria-pressed={on}
                      title={on ? "Back to ETH" : `Pair with ${a.name}`}
                      className={`inline-flex items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-2 text-[11px] font-semibold transition ${
                        on ? "border-white/40 bg-white/[0.08] text-white" : "border-white/10 text-zinc-500 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      <AssetLogo symbol={a.symbol} size={16} />
                      {a.symbol}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Socials */}
        <div className={`mt-3 grid gap-3 ${isSolana ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <div>
            <label className="block text-xs font-semibold text-zinc-500">X / Twitter (optional)</label>
            <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" className="field mt-1" />
          </div>
          {isSolana && (
            <div>
              <label className="block text-xs font-semibold text-zinc-500">Telegram (optional)</label>
              <input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/…" className="field mt-1" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-zinc-500">Website (optional)</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="field mt-1" />
          </div>
        </div>

        {/* Initial buy (+ buyback on Pons) */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-500">
              Initial buy {isSolana ? "(SOL, optional)" : isNativePair ? "(ETH, optional)" : "(native only)"}
            </label>
            <input
              value={initialBuy}
              onChange={(e) => setInitialBuy(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.0"
              inputMode="decimal"
              className="field mt-1 font-mono disabled:opacity-50"
              disabled={!isSolana && !isNativePair}
            />
          </div>
          {!isSolana && (
            <label className="flex items-end gap-2 pb-2 text-sm text-zinc-600">
              <input type="checkbox" checked={buyback} onChange={(e) => setBuyback(e.target.checked)} className="h-5 w-5 accent-pink" />
              Enable protocol buybacks
            </label>
          )}
        </div>

        {/* Launch summary */}
        <div className="mt-4 space-y-1 rounded-xl border border-ink-line bg-white/50 p-3 text-xs text-zinc-500">
          {isSolana ? (
            <>
              <div className="flex justify-between"><span>Launch model</span><span className="font-semibold text-zinc-700">Pump.fun · bonding curve</span></div>
              <div className="flex justify-between"><span>Graduates to</span><span className="text-zinc-700">PumpSwap</span></div>
              {solanaFeeWallet && (
                <div className="flex justify-between">
                  <span>Creator fees →</span>
                  <span className="font-mono text-zinc-700">{short(solanaFeeWallet)}</span>
                </div>
              )}
              <div className="flex justify-between"><span>Network</span><span className="text-zinc-700">Solana mainnet</span></div>
              {!avatar && <div className="pt-1 text-amber-600">Pump.fun requires an avatar. Detect your profile or upload one.</div>}
            </>
          ) : (
            <>
              <div className="flex justify-between"><span>Launch model</span><span className="font-semibold text-zinc-700">Pons v2 · bonding curve</span></div>
              <div className="flex justify-between"><span>Graduates to</span><span className="text-zinc-700">Uniswap V4 (~{V2_GRADUATION_THRESHOLD_ETH} ETH)</span></div>
              {feeWallet && (
                <div className="flex justify-between">
                  <span>Creator fees →</span>
                  <span className="font-mono text-zinc-700">{short(feeWallet)}</span>
                </div>
              )}
              {feeEth !== null && <div className="flex justify-between"><span>Launch fee</span><span className="font-mono text-zinc-700">{feeEth} ETH</span></div>}
              {options?.canLaunch === false && (
                <div className="pt-1 text-amber-600">This wallet isn’t whitelisted for launches yet, so the launch would revert.</div>
              )}
            </>
          )}
        </div>

        <div className="mt-4">
          {isSolana ? (
            <PumpDeployButton input={pumpInput} handle={recordHandle} source={source} disabled={!canDeploy} />
          ) : (
            <DeployButton input={launchInput} handle={recordHandle} source={source} disabled={!canDeploy} />
          )}
        </div>
      </section>
    </div>
  );
}
