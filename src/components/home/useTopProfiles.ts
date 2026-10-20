"use client";

import { useEffect, useState } from "react";
import type { TopProfile } from "./types";

/** Loads /api/top-profiles once. null while loading; [] if unavailable. */
export function useTopProfiles(): TopProfile[] | null {
  const [profiles, setProfiles] = useState<TopProfile[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/top-profiles")
      .then((r) => r.json())
      .then((d) => !cancelled && setProfiles(Array.isArray(d.profiles) ? d.profiles : []))
      .catch(() => !cancelled && setProfiles([]));
    return () => {
      cancelled = true;
    };
  }, []);
  return profiles;
}
