// Captures the GitHub launch flow in the studio from a local `next start` on
// :3123, with a fictional GitHub user (no real person). Usage: node capture.mjs shots
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const OUT = process.argv[2] ?? "shots";
const avatar = "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cf3ff"/><stop offset="1" stop-color="#a77bff"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="17" fill="#0005"/><path d="M18 100 C20 72 80 72 82 100Z" fill="#0005"/></svg>`).toString("base64");
const profile = { login: "novabuilds", displayName: "Nova Builds", bio: "Shipping open source. wallet: 0x8f3a5bd1c0e9a7a2b4c6d8e0f1a2b3c4d5e621cd", avatar, url: "https://github.com/novabuilds", followers: 12800, publicRepos: 64, website: "https://novabuilds.dev", twitter: "https://x.com/novabuilds", wallets: { evm: "0x8F3a5bd1C0e9A7A2b4C6d8E0F1A2b3C4d5e621cD", solana: null } };

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await p.route("**/api/v2/launch-options**", (r) => r.fulfill({ json: { launchFee: "0", canLaunch: true, configs: [{ id: "0" }], quoteAssets: [] } }));
await p.route("**/api/github/profile/**", async (r) => { await new Promise((x) => setTimeout(x, 300)); r.fulfill({ json: { profile } }); });
const box = async (sel, name) => console.log(name, JSON.stringify(await (await p.$(sel))?.boundingBox()));
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` });

await p.goto("http://localhost:3123/create", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.evaluate(() => window.scrollTo(0, 120)); await p.waitForTimeout(200);
await shot("s0-fomo");
await box("button:has-text('GitHub') >> nth=0", "ghTab");
await p.click("button:has-text('GitHub') >> nth=0"); await p.waitForTimeout(300);
await p.mouse.move(5, 5);
await shot("s1-github");
await box('input[placeholder="octocat"]', "input");
await box("button:has-text('Detect my GitHub profile')", "detect");
await p.fill('input[placeholder="octocat"]', "novabuilds");
await p.click("button:has-text('Detect my GitHub profile')"); await p.waitForTimeout(1200);
await p.mouse.move(5, 5);
await shot("s2-detected");
await box("text=Creator fees route", "feeLine");
await box("text=Verified when you launch", "verifiedTip");
await box('input[placeholder="Your profile coin"]', "coinName");
await box('input[placeholder="TICKER"]', "ticker");
await box("text=Launch model", "summary");
await b.close();
