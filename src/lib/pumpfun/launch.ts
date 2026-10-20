import { getKv } from "@/lib/kv";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Pump.fun launch helpers (server-side only).
 *
 *  A Solana profile coin launches on the Pump.fun bonding curve in two steps:
 *   1. Upload the image + metadata to Pump.fun's IPFS endpoint → metadata URI.
 *   2. Ask PumpPortal's local-transaction API to build an unsigned `create`
 *      transaction for the user's wallet and a fresh mint keypair.
 *  The browser then signs with the mint keypair + the user's wallet and sends
 *  it. Nothing here holds keys: the server only relays public data.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const PUMP_IPFS_URL = process.env.PUMPFUN_IPFS_URL || "https://pump.fun/api/ipfs";
export const PUMPPORTAL_TRADE_LOCAL_URL =
  process.env.PUMPPORTAL_TRADE_LOCAL_URL || "https://pumpportal.fun/api/trade-local";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export class PumpLaunchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PumpLaunchError";
  }
}

/** Reject hosts that would let a caller probe our own network. */
function isPublicHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const [a, b] = h.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return false;
    }
  }
  if (h.startsWith("[") || h.includes(":")) return false; // IPv6 literals
  return true;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) throw new PumpLaunchError("Unsupported image data.", 400);
  const buf = Buffer.from(m[2], "base64");
  if (buf.byteLength > MAX_IMAGE_BYTES) throw new PumpLaunchError("Image is too large (max 4 MB).", 413);
  return new Blob([buf], { type: m[1] });
}

/**
 * Turn the studio's avatar (a data URL, one of our /api/img/{id} uploads, or a
 * public https image such as a fomo.family / Pump.fun profile picture) into a
 * Blob for the IPFS upload.
 */
export async function loadImage(image: string): Promise<Blob> {
  const v = image.trim();
  if (v.startsWith("data:")) return dataUrlToBlob(v);

  let url: URL;
  try {
    url = new URL(v);
  } catch {
    throw new PumpLaunchError("The avatar must be an uploaded image or an https URL.", 400);
  }

  // Our own stored uploads: read straight from KV instead of over HTTP.
  const own = /^\/api\/img\/([a-zA-Z0-9]+)$/.exec(url.pathname);
  if (own) {
    const kv = getKv();
    const stored = kv ? await kv.get<string>(`img:${own[1]}`).catch(() => null) : null;
    if (stored) return dataUrlToBlob(stored);
  }

  if (url.protocol !== "https:" || !isPublicHost(url.hostname)) {
    throw new PumpLaunchError("The avatar URL must be a public https image.", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "error", cache: "no-store" });
    if (!res.ok) throw new PumpLaunchError(`Couldn't fetch the avatar (${res.status}).`, 400);
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new PumpLaunchError("The avatar URL isn't an image.", 400);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_IMAGE_BYTES) throw new PumpLaunchError("Image is too large (max 4 MB).", 413);
    return new Blob([buf], { type });
  } catch (err) {
    if (err instanceof PumpLaunchError) throw err;
    throw new PumpLaunchError("Couldn't fetch the avatar image.", 400);
  } finally {
    clearTimeout(timeout);
  }
}

export interface PumpMetadataInput {
  name: string;
  symbol: string;
  description: string;
  image: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

/** Upload image + metadata to Pump.fun's IPFS endpoint; returns the metadata URI. */
export async function uploadPumpMetadata(input: PumpMetadataInput): Promise<{ uri: string; name: string; symbol: string }> {
  const form = new FormData();
  form.append("file", await loadImage(input.image), "avatar");
  form.append("name", input.name);
  form.append("symbol", input.symbol);
  form.append("description", input.description);
  if (input.twitter) form.append("twitter", input.twitter);
  if (input.telegram) form.append("telegram", input.telegram);
  if (input.website) form.append("website", input.website);
  form.append("showName", "true");

  let res: Response;
  try {
    res = await fetch(PUMP_IPFS_URL, {
      method: "POST",
      body: form,
      headers: { origin: "https://pump.fun", referer: "https://pump.fun/" },
      cache: "no-store",
    });
  } catch {
    throw new PumpLaunchError("Couldn't reach Pump.fun to upload metadata.", 502);
  }
  if (!res.ok) throw new PumpLaunchError(`Pump.fun metadata upload failed (${res.status}).`, 502);

  const data = (await res.json().catch(() => null)) as
    | { metadataUri?: string; metadata?: { name?: string; symbol?: string } }
    | null;
  if (!data?.metadataUri) throw new PumpLaunchError("Pump.fun didn't return a metadata URI.", 502);
  return {
    uri: data.metadataUri,
    name: data.metadata?.name || input.name,
    symbol: data.metadata?.symbol || input.symbol,
  };
}

export interface PumpCreateTxInput {
  publicKey: string;
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  /** Dev buy in SOL (0 for none). */
  amountSol: number;
  slippage: number;
  priorityFee: number;
}

/** Build the unsigned Pump.fun `create` transaction via PumpPortal. Returns base64. */
export async function buildPumpCreateTx(input: PumpCreateTxInput): Promise<string> {
  let res: Response;
  try {
    res = await fetch(PUMPPORTAL_TRADE_LOCAL_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        publicKey: input.publicKey,
        action: "create",
        tokenMetadata: { name: input.name, symbol: input.symbol, uri: input.uri },
        mint: input.mint,
        denominatedInSol: "true",
        amount: input.amountSol,
        slippage: input.slippage,
        priorityFee: input.priorityFee,
        pool: "pump",
      }),
      cache: "no-store",
    });
  } catch {
    throw new PumpLaunchError("Couldn't reach PumpPortal to build the launch transaction.", 502);
  }
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    throw new PumpLaunchError(`PumpPortal rejected the launch (${res.status})${detail ? `: ${detail}` : ""}.`, 502);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength === 0) throw new PumpLaunchError("PumpPortal returned an empty transaction.", 502);
  return buf.toString("base64");
}
