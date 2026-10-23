// Captures NOIR Terminal states from a local `next start` on :3123 with
// fictional demo profiles (no real people). Usage: node capture.mjs shots
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const OUT = process.argv[2] ?? "shots";
const now = Date.now();
const grads = [["#7cf3ff","#a77bff"],["#ffb36b","#ff5f9e"],["#3dffb0","#00b3ff"],["#fff27a","#ff8a5c"],["#c7cdff","#6e7bff"],["#b6ff6b","#2fd6a0"],["#ff9a9a","#7a1fff"],["#9cf","#c6f"]];
const av = (i) => "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${grads[i][0]}"/><stop offset="1" stop-color="${grads[i][1]}"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="17" fill="#0005"/><path d="M18 100 C20 72 80 72 82 100Z" fill="#0005"/></svg>`).toString("base64");
const NVDA = { symbol: "NVDA", name: "NVIDIA", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC" };
const TSLA = { symbol: "TSLA", name: "Tesla", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d" };
const hex = (n) => "0x" + String(n).repeat(40).slice(0, 40);
const mk = (i, o) => ({ chain: "robinhood", token: hex(i + 1), logo: av(i), source: "fomo", createdAt: now - (i + 1) * 3600e3, creator: null, feeRecipient: null, pair: null, progress: null, graduated: false, verified: null, ...o });
const items = [
  mk(0, { name: "Nova", symbol: "NOVA", handle: "novatrades", marketCapUsd: 412800, change24h: 128.4, progress: 0.66, verified: "verified" }),
  mk(2, { name: "Mira", symbol: "MIRA", handle: "mira", marketCapUsd: 201300, change24h: 46.2, progress: 0.91, verified: "verified", pair: NVDA }),
  mk(1, { name: "Kairo", symbol: "KAIRO", handle: "kairo", marketCapUsd: 154800, change24h: 22.7, progress: 0.78, verified: "verified" }),
  mk(4, { name: "Vela", symbol: "VELA", handle: "vela", marketCapUsd: 133200, change24h: -6.1, progress: 0.64, verified: "fees", pair: TSLA }),
  mk(3, { name: "Atlas", symbol: "ATLAS", handle: "atlasdegen", marketCapUsd: 98100, change24h: 12.3, progress: 0.52 }),
  mk(5, { name: "Juno", symbol: "JUNO", handle: "junoxyz", marketCapUsd: 77400, change24h: 8.9, progress: 0.41 }),
  mk(7, { name: "Lyra", symbol: "LYRA", handle: "lyra", marketCapUsd: 54200, change24h: -2.4, progress: 0.29, verified: "verified" }),
  mk(6, { name: "Orin", symbol: "ORIN", handle: "orin", marketCapUsd: 41700, change24h: 64.0, progress: 0.18 }),
];
const series = (seed, up) => Array.from({ length: 60 }, (_, i) => ({ t: now - (60 - i) * 20 * 60e3, mc: 40000 * Math.exp((i / 60) * up) * (1 + 0.07 * Math.sin(i * 1.3 + seed)) }));
const detail = (it) => ({ token: it.token, name: it.name, symbol: it.symbol, decimals: 18, logo: it.logo, description: "", deployer: "0x8f3a5Bd1c0e9A7a2b4C6d8E0f1a2B3c4D5e621cd", curveAddress: "0x7a1c2e3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c", pairToken: it.pair?.address ?? "0x0000000000000000000000000000000000000000", phase: 0, phaseLabel: "Curve", creatorFeeRecipient: "0x8f3a5Bd1c0e9A7a2b4C6d8E0f1a2B3c4D5e621cd", priceEth: 1e-7, marketCapEth: 100, priceUsd: 1e-4, marketCapUsd: it.marketCapUsd, totalSupply: "1", dex: null, curve: { quoteReserve: "1000000000000000000", tokenReserve: "1000000000000000000000000", sellableTokens: "800000000000000000000000", feeBps: "100", creatorTaxBps: "0", progress: it.progress, graduated: false, readyToGraduate: false } });

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await p.route("**/api/markets", (r) => r.fulfill({ json: { items, updatedAt: now } }));
await p.route("**/api/v2/token/chart**", (r) => { const a = new URL(r.request().url()).searchParams.get("address"); const i = items.findIndex((x) => x.token === a); r.fulfill({ json: { points: series(i, 1.2 + (i % 3) * 0.3) } }); });
await p.route("**/api/v2/token?**", (r) => { const a = new URL(r.request().url()).searchParams.get("address"); r.fulfill({ json: detail(items.find((i) => i.token === a)) }); });
const box = async (sel, name) => console.log(name, JSON.stringify(await (await p.$(sel))?.boundingBox()));
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` });

await p.goto("http://localhost:3123/terminal", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await shot("t0-nova");
await box("form input", "cmdInput"); await box("aside ul", "list"); await box('input[placeholder="0.0"]', "amount"); await box("section .card", "header");
await box("aside.order-2", "tradeCol");
for (const [i, n] of [[1, "t1-mira"], [2, "t2-kairo"]]) { await p.keyboard.press("j"); await p.waitForTimeout(1300); await shot(n); }
await p.keyboard.press("k"); await p.keyboard.press("k"); await p.waitForTimeout(1300);
// command: buy $kairo 0.05 (typed animation is drawn in the film; capture the result)
await p.keyboard.press("/"); await p.keyboard.type("buy $kairo 0.05"); await p.keyboard.press("Enter"); await p.waitForTimeout(1500);
await p.keyboard.press("Escape"); await p.mouse.move(5, 5);
await shot("t3-buy");
await box("form + div", "log");
// sell side + 50% preset via hotkeys
await p.keyboard.press("s"); await p.waitForTimeout(300); await shot("t4-sell");
// help panel
await p.keyboard.press("?"); await p.waitForTimeout(400); await shot("t5-help");
await box("text=Hotkeys", "hotkeysTitle");
await b.close();
