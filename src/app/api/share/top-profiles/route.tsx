import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/share/top-profiles
 * A 1600×900 share card of the most-followed real profiles on fomo.family and
 * Pump.fun (top 5 each), built live from /api/top-profiles. Open it, save the
 * PNG, post it. ?demo=1 renders fictional placeholder profiles for previews.
 */

interface Row {
  source: "fomo" | "pumpfun";
  handle: string;
  displayName: string;
  avatar: string | null;
  followers: number | null;
  verified: boolean;
}

const GRADS = [
  ["#7cf3ff", "#a77bff"],
  ["#ffb36b", "#ff5f9e"],
  ["#3dffb0", "#00b3ff"],
  ["#fff27a", "#ff8a5c"],
  ["#c7cdff", "#6e7bff"],
];

const DEMO: Row[] = [
  ["Nova", "novatrades", "fomo", 412000, true],
  ["Mira", "mira", "fomo", 201300, true],
  ["Vela", "vela", "fomo", 133200, true],
  ["Juno", "junoxyz", "fomo", 98100, false],
  ["Lyra", "lyra", "fomo", 54200, false],
  ["Kairo", "kairo.sol", "pumpfun", 86000, false],
  ["Atlas", "atlasdegen", "pumpfun", 54800, false],
  ["Orin", "orin", "pumpfun", 37400, false],
  ["Echo", "echo", "pumpfun", 23900, false],
  ["Sable", "sable", "pumpfun", 11700, false],
].map(([displayName, handle, source, followers, verified]) => ({
  displayName: displayName as string,
  handle: handle as string,
  source: source as Row["source"],
  followers: followers as number,
  verified: verified as boolean,
  avatar: null,
}));

function compact(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/** Inline an avatar as a data URL; only PNG/JPEG (what the renderer supports). */
async function inline(url: string | null): Promise<string | null> {
  if (!url || !/^https?:\/\//.test(url)) return url?.startsWith("data:image/") ? url : null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(png|jpe?g)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 1_500_000) return null;
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function asset(origin: string, path: string): Promise<string | null> {
  return inline(`${origin}${path}`).catch(() => null);
}

function Avatar({ src, name, i }: { src: string | null; name: string; i: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={56} height={56} style={{ borderRadius: 999, objectFit: "cover", border: "2px solid rgba(255,255,255,0.12)" }} />
  ) : (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${GRADS[i % 5][0]}, ${GRADS[i % 5][1]})`,
        color: "#08090a",
        fontSize: 28,
        fontWeight: 600,
      }}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

function Column({ title, logo, rows }: { title: string; logo: string | null; rows: (Row & { img: string | null })[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "24px 30px", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(180deg,#101115,#0a0b0d)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={40} height={40} style={{ borderRadius: 11 }} />
        )}
        <div style={{ fontSize: 30, fontWeight: 600, color: "#fff", letterSpacing: -0.5 }}>{title}</div>
        <div style={{ marginLeft: "auto", fontSize: 18, color: "#6b707a" }}>followers</div>
      </div>
      {rows.length === 0 ? (
        <div style={{ display: "flex", padding: "40px 0", fontSize: 22, color: "#6b707a" }}>Unavailable right now</div>
      ) : (
        rows.map((r, i) => (
          <div key={r.handle} style={{ display: "flex", alignItems: "center", gap: 18, padding: "9px 0", borderTop: i ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ display: "flex", width: 30, fontSize: 22, color: "#50545c", fontFamily: "monospace" }}>{String(i + 1)}</div>
            <Avatar src={r.img} name={r.displayName} i={i} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 27, fontWeight: 600, color: "#fff" }}>
                <span>{r.displayName.slice(0, 22)}</span>
                {r.verified ? (
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#c7cdff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </div>
              <div style={{ display: "flex", fontSize: 19, color: "#6b707a" }}>{`@${r.handle.slice(0, 26)}`}</div>
            </div>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#fff" }}>{compact(r.followers)}</div>
          </div>
        ))
      )}
    </div>
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  let rows: Row[] = DEMO;
  if (url.searchParams.get("demo") !== "1") {
    try {
      const res = await fetch(`${origin}/api/top-profiles`, { cache: "no-store", signal: AbortSignal.timeout(25000) });
      rows = ((await res.json()) as { profiles?: Row[] }).profiles ?? [];
    } catch {
      rows = [];
    }
  }

  const pick = (s: Row["source"]) => rows.filter((r) => r.source === s).slice(0, 5);
  const [fomo, pump] = [pick("fomo"), pick("pumpfun")];
  // Inter (OFL) served from /fonts so the card renders with real weights.
  const font = (file: string) =>
    fetch(`${origin}/fonts/${file}`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);
  const [regular, semibold, display] = await Promise.all([
    font("Inter-Regular.otf"),
    font("Inter-SemiBold.otf"),
    font("InterDisplay-Bold.otf"),
  ]);
  const fonts = [
    regular && { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    semibold && { name: "Inter", data: semibold, weight: 600 as const, style: "normal" as const },
    display && { name: "Inter Display", data: display, weight: 700 as const, style: "normal" as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" }[];

  const [fomoImgs, pumpImgs, logo, fomoLogo, pumpLogo, rh, sol] = await Promise.all([
    Promise.all(fomo.map((r) => inline(r.avatar))),
    Promise.all(pump.map((r) => inline(r.avatar))),
    asset(origin, "/noir-logo-128.png"),
    asset(origin, "/brands/fomo.jpg"),
    asset(origin, "/brands/pumpfun.jpg"),
    asset(origin, "/brands/robinhood.png"),
    asset(origin, "/brands/solana.jpg"),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "56px 70px", background: "#060607", position: "relative", fontFamily: "Inter" }}>
        <div style={{ position: "absolute", left: 300, top: -420, width: 1000, height: 700, borderRadius: 999, background: "radial-gradient(circle, rgba(199,205,255,0.20), transparent 65%)", display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={46} height={46} style={{ borderRadius: 12 }} />
          )}
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: 9, color: "#eef0f3" }}>NOIR</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 20, color: "#8a8f98" }}>
            <div style={{ width: 10, height: 10, borderRadius: 99, background: "#2fe39a", display: "flex" }} />
            Live ranking
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 64, lineHeight: 1.15, flexShrink: 0, fontFamily: "Inter Display", fontWeight: 700, letterSpacing: -2.5, color: "#fff" }}>
          Top profiles on @fomo &amp; @Pumpfun
        </div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 25, color: "#8a8f98", flexShrink: 0 }}>The most-followed creators right now. Tokenize any of them on NOIR.</div>

        <div style={{ display: "flex", gap: 28, marginTop: 32, flexShrink: 0 }}>
          <Column title="fomo.family" logo={fomoLogo} rows={fomo.map((r, i) => ({ ...r, img: fomoImgs[i] }))} />
          <Column title="Pump.fun" logo={pumpLogo} rows={pump.map((r, i) => ({ ...r, img: pumpImgs[i] }))} />
        </div>

        <div style={{ display: "flex", alignItems: "center", marginTop: "auto", fontSize: 21, color: "#6b707a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {rh && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rh} width={28} height={28} style={{ borderRadius: 8 }} />
            )}
            {sol && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sol} width={28} height={28} style={{ borderRadius: 8 }} />
            )}
            <span style={{ marginLeft: 6 }}>Launch on Robinhood Chain or Solana</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 22 }}>
            <span>Ranked by followers · public data, not endorsements</span>
            <span style={{ color: "#fff", fontWeight: 600 }}>usenoir.app</span>
          </div>
        </div>
      </div>
    ),
    { width: 1600, height: 900, fonts, headers: { "cache-control": "public, max-age=600, s-maxage=600" } },
  );
}
