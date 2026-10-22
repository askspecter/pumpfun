import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import {
  cleanGithubLogin,
  githubCacheKey,
  resolveGithubProfile,
  GithubResolveError,
  type GithubProfile,
} from "@/lib/github/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/github/profile/{login}
 * Resolve a GitHub user to its public profile + the wallets listed in its bio.
 * Cached in KV (when configured) so repeat lookups stay inside GitHub's rate limit.
 */
const CACHE_TTL_SECONDS = 60 * 10; // short, so a freshly edited bio shows up soon

export async function GET(_req: Request, { params }: { params: { login: string } }) {
  const login = cleanGithubLogin(decodeURIComponent(params.login ?? ""));
  if (login.length < 1) return NextResponse.json({ error: "Enter a GitHub username." }, { status: 400 });

  const kv = getKv();
  if (kv) {
    const cached = await kv.get<GithubProfile>(githubCacheKey(login)).catch(() => null);
    if (cached) return NextResponse.json({ profile: cached, cached: true });
  }

  try {
    const profile = await resolveGithubProfile(login);
    if (kv) await kv.set(githubCacheKey(login), profile, { ex: CACHE_TTL_SECONDS }).catch(() => {});
    return NextResponse.json({ profile, cached: false });
  } catch (err) {
    if (err instanceof GithubResolveError) return NextResponse.json({ error: err.message }, { status: err.status });
    const message = err instanceof Error ? err.message : "Failed to resolve the profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
