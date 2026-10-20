import { getKv } from "@/lib/kv";
import {
  cleanHandle,
  fetchLeaderboard,
  fomoConfigured,
  resolveFomoProfile,
  type FomoProfile,
  type LeaderboardWindow,
} from "./resolve";

/**
 * Most-followed fomo.family profiles (server-side only).
 *
 * The FOMO leaderboard ranks by PnL, so any single window misses big accounts
 * that didn't trade much lately. We merge every window (24h, 7d, 30d, all
 * time) into one pool, add featured handles (FEATURED_FOMO_HANDLES), and rank
 * by followers.
 *
 * Featured handles go through handle→wallet resolution, which the FOMO free
 * tier meters (25/month), so each one is cached for 7 days.
 */

export interface FomoTopRow {
  handle: string;
  displayName: string;
  avatar: string | null;
  followers: number | null;
  verified: boolean;
  /** Realized PnL over 30d when the trader is on that board. */
  pnlUsd: number | null;
}

const WINDOWS: LeaderboardWindow[] = ["30d", "all", "7d", "24h"];
const DEFAULT_FEATURED = ["ogle", "unipics"];
const FEATURED_TTL = 60 * 60 * 24 * 7;

export function featuredFomoHandles(): string[] {
  const env = (process.env.FEATURED_FOMO_HANDLES ?? "")
    .split(",")
    .map((h) => cleanHandle(h))
    .filter((h) => h.length >= 2);
  return Array.from(new Set([...DEFAULT_FEATURED, ...env].map((h) => h.toLowerCase())));
}

async function featuredProfile(handle: string): Promise<FomoProfile | null> {
  const kv = getKv();
  const key = `fomo:featured:${handle}`;
  if (kv) {
    const cached = await kv.get<FomoProfile>(key).catch(() => null);
    if (cached) return cached;
  }
  if (!fomoConfigured()) return null;
  try {
    const p = await resolveFomoProfile(handle);
    if (kv) await kv.set(key, p, { ex: FEATURED_TTL }).catch(() => {});
    return p;
  } catch {
    return null;
  }
}

export async function fetchTopFomoProfiles(limit = 20): Promise<FomoTopRow[]> {
  const boards = await Promise.allSettled(WINDOWS.map((w) => fetchLeaderboard(w, 100)));
  const byHandle = new Map<string, FomoTopRow>();

  boards.forEach((b, i) => {
    if (b.status !== "fulfilled") return;
    for (const t of b.value.traders) {
      if (!t.handle) continue;
      const k = t.handle.toLowerCase();
      const prev = byHandle.get(k);
      byHandle.set(k, {
        handle: t.handle,
        displayName: t.displayName || t.handle,
        avatar: prev?.avatar ?? t.avatar,
        followers: Math.max(prev?.followers ?? 0, t.followers ?? 0) || (prev?.followers ?? t.followers),
        verified: Boolean(prev?.verified || t.verified),
        // PnL comes from the 30d board (first in WINDOWS) when present.
        pnlUsd: prev ? prev.pnlUsd : WINDOWS[i] === "30d" ? t.pnlUsd : null,
      });
    }
  });

  if (boards.every((b) => b.status === "rejected")) {
    throw (boards[0] as PromiseRejectedResult).reason;
  }

  const featured = await Promise.all(featuredFomoHandles().map(featuredProfile));
  for (const p of featured) {
    if (!p) continue;
    const k = p.handle.toLowerCase();
    const prev = byHandle.get(k);
    byHandle.set(k, {
      handle: p.handle,
      displayName: p.displayName || p.handle,
      avatar: p.avatar || prev?.avatar || null,
      followers: Math.max(prev?.followers ?? 0, p.followers ?? 0) || null,
      verified: Boolean(prev?.verified || p.verified),
      pnlUsd: prev?.pnlUsd ?? null,
    });
  }

  return Array.from(byHandle.values())
    .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))
    .slice(0, limit);
}
