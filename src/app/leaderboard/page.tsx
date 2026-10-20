"use client";

import { TopProfiles } from "@/components/home/TopProfiles";
import { useTopProfiles } from "@/components/home/useTopProfiles";

export default function LeaderboardPage() {
  const profiles = useTopProfiles();
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:pt-20">
      <TopProfiles
        profiles={profiles}
        limit={50}
        title="Leaderboard"
        subtitle="The most-followed real profiles on fomo.family and Pump.fun, live. Tokenize any profile in one click."
      />
    </div>
  );
}
