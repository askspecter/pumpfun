import { getAddress } from "viem";
import { isSolanaAddress } from "@/lib/solana";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  GitHub profile resolution (server-side only).
 *
 *  Resolves a GitHub username to its public profile (name, avatar, bio,
 *  followers) via GitHub's REST API. No key is needed; set GITHUB_TOKEN to
 *  raise the rate limit from 60 to 5,000 requests an hour.
 *
 *  GitHub has no wallets, so a profile proves its wallets by listing them in
 *  its bio (only the account owner can edit it). Those addresses are the
 *  profile's wallets for creator fees and Verified badges.
 * ─────────────────────────────────────────────────────────────────────────
 */

const API = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/+$/, "");

export interface GithubProfile {
  login: string;
  displayName: string;
  bio: string;
  avatar: string;
  url: string;
  followers: number | null;
  publicRepos: number | null;
  /** Blog / website link on the profile, if any. */
  website: string;
  /** X username on the profile, if any. */
  twitter: string;
  /** Wallets the owner listed in their bio. */
  wallets: { evm: string | null; solana: string | null };
}

/** KV key for a cached GitHub profile (the profile route and verification share it). */
export const githubCacheKey = (login: string) => `github:profile:${login.toLowerCase()}`;

export class GithubResolveError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GithubResolveError";
  }
}

/** Strip @, a pasted github.com/ URL and whitespace. */
export function cleanGithubLogin(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "");
}

/** GitHub usernames: 1–39 chars, letters, digits and single hyphens, no leading hyphen. */
export function isGithubLogin(login: string): boolean {
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(login);
}

/** The first EVM and Solana addresses written in a bio. */
export function walletsInBio(bio: string): { evm: string | null; solana: string | null } {
  // Any 40-hex address counts (bios often hold all-lowercase or loosely cased
  // addresses); it is normalized to its checksummed form.
  const hex = (bio.match(/0x[a-fA-F0-9]{40}(?![a-fA-F0-9])/g) ?? [])[0];
  const evm = hex ? getAddress(hex.toLowerCase()) : null;
  const solana = (bio.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g) ?? []).find((a) => isSolanaAddress(a)) ?? null;
  return { evm, solana };
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Normalize a GitHub /users/{login} response. */
export function toGithubProfile(data: Record<string, unknown>): GithubProfile {
  const login = str(data.login);
  const bio = str(data.bio).trim();
  const blog = str(data.blog).trim();
  return {
    login,
    displayName: str(data.name).trim() || login,
    bio,
    avatar: /^https:\/\//.test(str(data.avatar_url)) ? str(data.avatar_url) : "",
    url: str(data.html_url) || `https://github.com/${login}`,
    followers: num(data.followers),
    publicRepos: num(data.public_repos),
    website: blog ? (/^https?:\/\//i.test(blog) ? blog : `https://${blog}`) : "",
    twitter: str(data.twitter_username) ? `https://x.com/${str(data.twitter_username)}` : "",
    wallets: walletsInBio(bio),
  };
}

/**
 * Resolve a GitHub username. Throws GithubResolveError for bad input (400),
 * unknown user (404), rate limits (429) and upstream failures (502).
 */
export async function resolveGithubProfile(raw: string): Promise<GithubProfile> {
  const login = cleanGithubLogin(raw);
  if (!isGithubLogin(login)) throw new GithubResolveError("Enter a valid GitHub username.", 400);

  const token = process.env.GITHUB_TOKEN?.trim();
  let res: Response;
  try {
    res = await fetch(`${API}/users/${encodeURIComponent(login)}`, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "NOIR (usenoir.app)",
        "x-github-api-version": "2022-11-28",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new GithubResolveError("Couldn't reach GitHub. Try again.", 502);
  }

  if (res.status === 404) throw new GithubResolveError(`No GitHub user @${login}.`, 404);
  if (res.status === 403 || res.status === 429) throw new GithubResolveError("GitHub rate limit reached. Try again in a few minutes.", 429);
  if (!res.ok) throw new GithubResolveError(`GitHub API error (${res.status}).`, 502);

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || typeof data.login !== "string") throw new GithubResolveError("GitHub returned an unexpected response.", 502);
  return toGithubProfile(data);
}
