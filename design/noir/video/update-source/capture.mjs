// Captures the NOIR update screens (Markets, Verified, Stock-paired, coin page)
// from a local `next start` on :3123, with fictional demo profiles (no real people).
// Usage: node capture.mjs <outDir>   → PNGs at 2x + element boxes on stdout.
import { chromium } from "playwright";
const OUT = process.argv[2] ?? "shots";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());

const grads = [["#7cf3ff","#a77bff"],["#ffb36b","#ff5f9e"],["#3dffb0","#00b3ff"],["#fff27a","#ff8a5c"],["#c7cdff","#6e7bff"],["#b6ff6b","#2fd6a0"],["#ff9a9a","#7a1fff"],["#9cf","#c6f"],["#ffd36e","#ff6e9c"],["#6ee7ff","#6e8bff"]];
const av = (i) => "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${grads[i][0]}"/><stop offset="1" stop-color="${grads[i][1]}"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="17" fill="#0005"/><path d="M18 100 C20 72 80 72 82 100Z" fill="#0005"/></svg>`).toString("base64");

const now = Date.now();
const NVDA = { symbol: "NVDA", name: "NVIDIA", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC" };
const TSLA = { symbol: "TSLA", name: "Tesla", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d" };
const AAPL = { symbol: "AAPL", name: "Apple", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9" };
const hex = (n) => "0x" + String(n).repeat(40).slice(0, 40);
const mk = (i, o) => ({ chain: "robinhood", token: hex(i + 1), name: "", symbol: "", logo: av(i), handle: null, source: "fomo", createdAt: now - (i + 1) * 3600e3, creator: null, feeRecipient: null, pair: null, marketCapUsd: null, progress: null, graduated: false, change24h: null, verified: null, ...o });
const items = [
  mk(0, { name: "Nova", symbol: "NOVA", handle: "novatrades", marketCapUsd: 412800, change24h: 128.4, graduated: true, verified: "verified" }),
  mk(2, { name: "Mira", symbol: "MIRA", handle: "mira", marketCapUsd: 201300, change24h: 46.2, progress: 0.91, verified: "verified", pair: NVDA }),
  mk(1, { chain: "solana", token: "9k9xVWxw8i8jyEcBJbbA9TTwLqbnj6yRNnRzpzFpyRMC", name: "Kairo", symbol: "KAIRO", source: "pumpfun", handle: "kairo.sol", marketCapUsd: 154800, change24h: 22.7, progress: 0.78, verified: "verified" }),
  mk(4, { name: "Vela", symbol: "VELA", handle: "vela", marketCapUsd: 133200, change24h: -6.1, progress: 0.64, verified: "fees", pair: TSLA }),
  mk(3, { chain: "solana", token: "Enf7zo1Bw7EcSndus8iKVLwG5ne2eNHzVmuuoFMEF6Vf", name: "Atlas", symbol: "ATLAS", source: "pumpfun", handle: "atlasdegen", marketCapUsd: 98100, change24h: 12.3, progress: 0.52 }),
  mk(5, { name: "Juno", symbol: "JUNO", handle: "junoxyz", marketCapUsd: 77400, change24h: 8.9, progress: 0.41, pair: AAPL }),
  mk(7, { name: "Lyra", symbol: "LYRA", handle: "lyra", marketCapUsd: 54200, change24h: -2.4, progress: 0.29, verified: "verified" }),
  mk(6, { chain: "solana", token: "4zR9btpYboGqTzVKp39q9g8Z2rxwTnYUvzFdKS8Kpump", name: "Orin", symbol: "ORIN", source: "pumpfun", handle: "orin", marketCapUsd: 41700, change24h: 64.0, progress: 0.18 }),
  mk(8, { name: "Sable", symbol: "SABLE", handle: "sable", marketCapUsd: 33900, change24h: 3.2, progress: 0.11, createdAt: now - 60e3 }),
];
const quoteAssets = [
  { asset: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ether" },
  { asset: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", symbol: "USDG", name: "Global Dollar" },
  { asset: NVDA.address, symbol: "NVDA", name: "NVIDIA" },
  { asset: TSLA.address, symbol: "TSLA", name: "Tesla" },
  { asset: AAPL.address, symbol: "AAPL", name: "Apple" },
  { asset: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3", symbol: "GOOGL", name: "Alphabet Class A" },
  { asset: "0xe93237C50D904957Cf27E7B1133b510C669c2e74", symbol: "MSFT", name: "Microsoft" },
];
const mira = items[1];
const pts = Array.from({ length: 60 }, (_, i) => ({ t: now - (60 - i) * 20 * 60e3, mc: 60000 * Math.exp(i / 60 * 1.2) * (1 + 0.08 * Math.sin(i * 1.7)) }));
pts[pts.length - 1].mc = 201300;

async function page() {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await p.route("**/api/markets", (r) => r.fulfill({ json: { items, updatedAt: now } }));
  await p.route("**/api/launches**", (r) => r.fulfill({ json: { items: [] } }));
  await p.route("**/api/v2/launch-options**", (r) => r.fulfill({ json: { launchFee: "0", canLaunch: true, configs: [{ id: "0" }], quoteAssets } }));
  await p.route("**/api/v2/token/chart**", (r) => r.fulfill({ json: { points: pts } }));
  await p.route("**/api/v2/token?**", (r) => r.fulfill({ json: {
    token: mira.token, name: "Mira", symbol: "MIRA", decimals: 18, logo: av(2), description: "Profile coin of @mira on fomo.family.",
    deployer: "0x8f3a5Bd1c0e9A7a2b4C6d8E0f1a2B3c4D5e621cd", curveAddress: "0x7a1c2e3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c", pairToken: NVDA.address,
    phase: 0, phaseLabel: "Curve", creatorFeeRecipient: "0x8f3a5Bd1c0e9A7a2b4C6d8E0f1a2B3c4D5e621cd",
    priceEth: null, marketCapEth: null, priceUsd: 0.0002, marketCapUsd: 201300, totalSupply: "1000000000000000000000000000", dex: null,
    curve: { quoteReserve: "1", tokenReserve: "1", sellableTokens: "1", feeBps: "100", creatorTaxBps: "0", progress: 0.91, graduated: false, readyToGraduate: false } } }));
  await p.route("**/api/token/**/comments", (r) => r.fulfill({ json: { comments: [], storage: true } }));
  return p;
}
const box = async (p, sel, name) => console.log(name, JSON.stringify(await (await p.$(sel))?.boundingBox()));

// 1) Markets
let p = await page();
await p.goto("http://localhost:3123/markets", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelectorAll(".marquee-track").forEach((el) => (el.style.animation = "none")));
await p.screenshot({ path: `${OUT}/markets.png` });
await p.screenshot({ path: `${OUT}/markets-full.png`, fullPage: true });
await box(p, ".marquee-mask", "ticker");
await box(p, "text=Graduation race", "raceTitle");
await box(p, "ol", "raceList");
await box(p, "text=Stock-paired profiles", "stocksTitle");
await box(p, "ul.divide-y", "table");
await box(p, "text=Verified creators", "verifiedStat");
await box(p, "button:has-text('Verified')", "verifiedTab");
// Verified tab
await p.click("button:has-text('Verified') >> nth=0");
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/markets-verified.png` });
await p.close();

// 2) Studio: one-tap stock pair
p = await page();
await p.goto("http://localhost:3123/create", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.fill('input[placeholder="Your profile coin"]', "Mira");
await p.fill('input[placeholder="TICKER"]', "MIRA");
await p.fill('input[placeholder="Who is this profile?"]', "Trader. Builder. Early on everything.");
await p.evaluate(() => window.scrollTo(0, 260));
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/create-eth.png` });
await box(p, "button[title='Pair with NVIDIA']", "nvdaChip");
await p.click("button[title='Pair with NVIDIA']");
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/create-nvda.png` });
await p.close();

// 3) Coin page: verified + NVDA pair
p = await page();
await p.goto(`http://localhost:3123/launch/${mira.token}`, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/coin.png` });
await box(p, "h1", "coinTitle");
await p.close();
await b.close();
