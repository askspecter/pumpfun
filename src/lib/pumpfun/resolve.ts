import { isSolanaAddress } from "@/lib/solana";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Pump.fun profile resolution (server-side only).
 *
 *  Resolves a Pump.fun profile (wallet address or username) to its public
 *  profile — username, avatar, bio, followers — via Pump.fun's public
 *  frontend API. No key is needed. The browser can't call that API directly
 *  (CORS), so it goes through /api/pumpfun/{id}.
 *
 *  The Pump.fun API is unofficial and can change; every field is read
 *  defensively and the base URL is overridable with PUMPFUN_API_BASE_URL.
 * ─────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = (process.env.PUMPFUN_API_BASE_URL || "https://frontend-api-v3.pump.fun").replace(/\/+$/, "");

export interface PumpProfile {
  /** The profile's Solana wallet (base58). */
  address: string;
  /** Pump.fun username, or a shortened address when none is set. */
  username: string;
  bio: string;
  avatar: string;
  followers: number | null;
  following: number | null;
  likesReceived: number | null;
}

export class PumpResolveError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PumpResolveError";
  }
}

/** Strip a leading @, a pasted pump.fun/profile/ URL and surrounding whitespace. */
export function cleanPumpId(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?pump\.fun\/profile\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "");
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Resolve a Pump.fun wallet address or username.
 * Throws PumpResolveError for bad input (400), unknown profile (404),
 * rate limits (429) and upstream failures (502).
 */
export async function resolvePumpProfile(rawId: string): Promise<PumpProfile> {
  const id = cleanPumpId(rawId);
  if (id.length < 2) {
    throw new PumpResolveError("Enter a Pump.fun username or Solana wallet address.", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/users/${encodeURIComponent(id)}`, {
      headers: {
        accept: "application/json",
        origin: "https://pump.fun",
        referer: "https://pump.fun/",
      },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    throw new PumpResolveError("Couldn't reach Pump.fun. Try again.", 502);
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 404 || res.status === 400) {
    throw new PumpResolveError(
      isSolanaAddress(id)
        ? `No Pump.fun profile found for ${id.slice(0, 4)}…${id.slice(-4)}.`
        : `No Pump.fun profile found for @${id}. Try pasting your Solana wallet address instead.`,
      404,
    );
  }
  if (res.status === 429) throw new PumpResolveError("Pump.fun rate limit reached. Try later.", 429);
  if (!res.ok) throw new PumpResolveError(`Pump.fun API error (${res.status}).`, 502);

  let data: Record<string, unknown>;
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new PumpResolveError("Pump.fun returned an unexpected response.", 502);
  }

  const address = str(data.address) || (isSolanaAddress(id) ? id : "");
  if (!isSolanaAddress(address)) {
    throw new PumpResolveError(`No Pump.fun profile found for @${id}.`, 404);
  }
  const avatar = str(data.profile_image);

  return {
    address,
    username: str(data.username).trim() || `${address.slice(0, 4)}…${address.slice(-4)}`,
    bio: str(data.bio),
    avatar: /^https?:\/\//.test(avatar) ? avatar : "",
    followers: num(data.followers),
    following: num(data.following),
    likesReceived: num(data.likes_received),
  };
}
