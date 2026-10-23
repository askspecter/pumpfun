"use client";

import { useEffect, useState } from "react";

interface Player {
  player: string;
  points: number;
  calls: number;
  wins: number;
}

const short = (a: string) => `${a.slice(0, a.startsWith("0x") ? 6 : 4)}…${a.slice(-4)}`;

/** Top NOIR Predict players by points. */
export function PredictLeaderboard() {
  const [players, setPlayers] = useState<Player[] | null>(null);

  useEffect(() => {
    fetch("/api/predict/leaderboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { players?: Player[] }) => setPlayers(d.players ?? []))
      .catch(() => setPlayers([]));
  }, []);

  return (
    <section id="predictors" className="mt-16 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Top predictors</h2>
          <p className="mt-1 text-sm text-zinc-500">Call any coin&apos;s market cap up or down each day. +10 points for every right call.</p>
        </div>
        <span className="chip">points · no funds</span>
      </div>

      <div className="card mt-5 divide-y divide-white/[0.05] p-0">
        {players === null ? (
          <div className="h-40 animate-pulse" />
        ) : players.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">No settled calls yet. Open any coin and make the first call.</p>
        ) : (
          players.map((p, i) => (
            <div key={p.player} className="flex items-center gap-4 px-5 py-3 text-sm">
              <span className="w-6 font-mono text-zinc-500">{i + 1}</span>
              <span className="flex-1 font-mono text-zinc-900">{short(p.player)}</span>
              <span className="hidden text-zinc-500 sm:inline">
                {p.wins}/{p.calls} right{p.calls > 0 ? ` · ${Math.round((p.wins / p.calls) * 100)}%` : ""}
              </span>
              <span className="w-24 text-right font-mono font-semibold text-zinc-900">{p.points} pts</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
