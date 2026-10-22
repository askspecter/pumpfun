/** Where a profile coin's identity comes from. */
export type ProfileSource = "fomo" | "pumpfun" | "github";

export const PROFILE_SOURCES: ProfileSource[] = ["fomo", "pumpfun", "github"];

export const SOURCE_LABEL: Record<ProfileSource, string> = {
  fomo: "fomo.family",
  pumpfun: "Pump.fun",
  github: "GitHub",
};

/** Parse an untrusted source value; older records without one are fomo.family. */
export function toSource(value: unknown): ProfileSource {
  return value === "pumpfun" || value === "github" ? value : "fomo";
}
