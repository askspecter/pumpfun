/**
 * Shared HTTP access to Pump.fun's public (unofficial) frontend API.
 *
 * Pump.fun sits behind Cloudflare, which tends to reject bare server requests
 * (Node's default user agent, no browser headers). We send the headers the
 * pump.fun web app itself sends, and fall back across known API hosts when one
 * refuses. PUMPFUN_API_BASE_URL, if set, is tried first.
 */

const DEFAULT_BASES = ["https://frontend-api-v3.pump.fun", "https://frontend-api.pump.fun"];

export const PUMP_BASES: string[] = [
  ...(process.env.PUMPFUN_API_BASE_URL ? [process.env.PUMPFUN_API_BASE_URL.replace(/\/+$/, "")] : []),
  ...DEFAULT_BASES,
].filter((b, i, all) => all.indexOf(b) === i);

export const PUMP_HEADERS: Record<string, string> = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  origin: "https://pump.fun",
  referer: "https://pump.fun/",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
};

/** One upstream attempt, for the diagnostics in /api/top-profiles?debug=1. */
export interface PumpAttempt {
  url: string;
  status: number | "network-error";
}

/**
 * GET `path` from the first Pump.fun API host that answers with something
 * other than a Cloudflare-style refusal (403/429/5xx/network error). 404s are
 * returned as-is: they mean "not found", not "blocked".
 */
export async function pumpGet(path: string, log?: PumpAttempt[]): Promise<Response | null> {
  let last: Response | null = null;
  for (const base of PUMP_BASES) {
    const url = `${base}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch(url, { headers: PUMP_HEADERS, signal: controller.signal, cache: "no-store" });
      log?.push({ url, status: res.status });
      if (res.ok || res.status === 404 || res.status === 400) return res;
      last = res;
    } catch {
      log?.push({ url, status: "network-error" });
    } finally {
      clearTimeout(timeout);
    }
  }
  return last;
}
