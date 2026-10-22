"use client";

import { useEffect, useState } from "react";

const WATCH_KEY = "noir.watchlist";

/** Watchlist kept in this browser (best-effort: storage can be unavailable). Shared by Markets and Terminal. */
export function useWatchlist() {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(WATCH_KEY) ?? "[]");
      if (Array.isArray(raw)) setList(raw.filter((x): x is string => typeof x === "string"));
    } catch {
      // storage unavailable
    }
  }, []);
  const toggle = (token: string) =>
    setList((prev) => {
      const next = prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token];
      try {
        localStorage.setItem(WATCH_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable
      }
      return next;
    });
  return { list, toggle };
}
