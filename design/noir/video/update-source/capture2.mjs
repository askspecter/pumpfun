import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { mock, EVM } from "./mocks.mjs";
import fs from "fs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const boxes = {};
const shot = (p, n) => p.screenshot({ path: `shots2/${n}.png`, fullPage: true });
async function box(p, n, sel) { const e = await p.$(sel); const r = await e.boundingBox(); boxes[n] = { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, top: r.y, left: r.x }; }
const dot = (label) => `<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:9px;background:#2fe39a"></span>${label}</span>`;
fs.mkdirSync("shots2", { recursive: true });

const ROUND = 86400000, round = Math.floor(Date.now() / ROUND);
const base = { round, endsAt: (round + 1) * ROUND, locked: false, mc: 7680, tally: { up: 31, down: 12 }, mine: null, stats: { points: 120, calls: 14, wins: 12 }, last: { round: round - 1, endMc: 6900, winners: 18, players: 27 } };
const REPLIES = [
  "I'm Nova's AI twin: a simulation built from public profile info, not the real Nova. Think of me as the vibe of $NOVATRADES, minus the sleep schedule.",
  "Hot take: attention is the only asset that compounds while you sleep. Everyone's farming it. Almost nobody is pricing it. (I'm an AI. Not financial advice.)",
];

const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await mock(p);
await p.route("**/api/predict?**", (r) => r.fulfill({ json: base }));
let release = null, n = 0;
await p.route("**/api/twin", async (r) => { await new Promise((res) => (release = res)); r.fulfill({ json: { reply: REPLIES[n++] } }); });
await p.goto("http://localhost:3123/launch/" + EVM, { waitUntil: "networkidle" }).catch(() => {}); await p.waitForTimeout(2500);
await p.evaluate((html) => { for (const el of document.querySelectorAll("header button")) if (/Connect wallet/.test(el.innerText) && el.getBoundingClientRect().width > 0) el.innerHTML = html; }, dot("0x8f3a…21cd"));

// predict card: show the Up/Down buttons a connected wallet would see
const predictSel = "section:has(h2:text-is('Predict'))";
const twinSel = "section:has(h2:has-text('AI Twin'))";
async function predictAction(html) {
  await p.evaluate(({ sel, html }) => {
    const sec = [...document.querySelectorAll("section")].find((s) => s.querySelector("h2")?.textContent === "Predict");
    let area = sec.querySelector("#pAct");
    if (!area) { const btn = [...sec.querySelectorAll("button")].find((x) => /Connect/.test(x.innerText)); area = btn.closest("div.mt-4") || btn.parentElement; area.id = "pAct"; }
    area.innerHTML = html;
    const e = sec.querySelector("p.text-red-600"); if (e) e.remove();
  }, { sel: predictSel, html });
}
const BTNS = (upTxt = "▲ Up") => `<div class="grid grid-cols-2 gap-2"><button id="pUp" class="rounded-xl bg-up py-3 text-sm font-bold text-[#03130b]">${upTxt}</button><button class="rounded-xl bg-down py-3 text-sm font-bold text-white">▼ Down</button></div>`;
await predictAction(BTNS());
await shot(p, "a0");
await box(p, "twin", twinSel); await box(p, "predict", predictSel); await box(p, "input", `${twinSel} input`); await box(p, "send", `${twinSel} button[type=submit]`); await box(p, "pUp", "#pUp");

// AI Twin conversation
await p.fill(`${twinSel} input`, "Who are you?"); await shot(p, "a1");
await p.click(`${twinSel} button[type=submit]`); await p.waitForTimeout(400); await shot(p, "a2");
release(); await p.waitForTimeout(500); await shot(p, "a3");
await p.fill(`${twinSel} input`, "Give me a hot take"); await shot(p, "a4");
await p.click(`${twinSel} button[type=submit]`); await p.waitForTimeout(400); await shot(p, "a5");
release(); await p.waitForTimeout(500); await shot(p, "a6");
await box(p, "twin2", twinSel);

// Predict: sign, then the placed call
await predictAction(BTNS(`<span style="display:inline-flex;align-items:center;gap:8px"><span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black"></span>Sign in wallet…</span>`));
await p.evaluate(() => {
  const m = document.createElement("div"); m.id = "wmodal";
  m.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center";
  m.innerHTML = `<div style="width:420px;border-radius:24px;background:#121316;border:1px solid rgba(255,255,255,.1);box-shadow:0 50px 120px -20px #000;padding:26px;font-family:Inter;color:#fff">
<div style="display:flex;align-items:center;justify-content:space-between"><div style="font:600 12px Inter;color:#8a8f98;letter-spacing:.14em">SIGNATURE REQUEST</div><div style="font:500 12px Inter;color:#c7cbd3;padding:4px 10px;border:1px solid rgba(255,255,255,.12);border-radius:99px">No gas</div></div>
<div style="margin-top:20px;font:400 14px Inter;color:#8a8f98">usenoir.app wants you to sign:</div>
<pre style="margin-top:12px;border-radius:16px;background:rgba(255,255,255,.04);padding:16px;font:500 13px/1.6 'JetBrains Mono',monospace;color:#e9ebef;white-space:pre-wrap">NOIR Predict

Coin: robinhood:0x7a3c…1b9c
Round: today
Call: UP

Points only. No funds move.</pre>
<div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px"><div style="text-align:center;padding:13px;border-radius:14px;border:1px solid rgba(255,255,255,.12);font:600 15px Inter">Cancel</div><div id="wconfirm" style="text-align:center;padding:13px;border-radius:14px;background:#fff;color:#000;font:600 15px Inter">Sign</div></div></div>`;
  document.body.appendChild(m);
});
await shot(p, "p1"); await box(p, "sign", "#wconfirm");
await p.evaluate(() => document.getElementById("wmodal").remove());
await p.evaluate(() => {
  const sec = [...document.querySelectorAll("section")].find((s) => s.querySelector("h2")?.textContent === "Predict");
  const spans = [...sec.querySelectorAll("span")]; const up = spans.find((s) => /^▲ Up \d+/.test(s.textContent)); if (up) up.textContent = "▲ Up 32";
  const bar = sec.querySelector(".bg-up.transition-all"); if (bar) bar.style.width = "73%";
});
await predictAction(`<div class="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm"><div class="flex items-center justify-between"><span class="text-zinc-500">Your call</span><span class="font-semibold text-up">▲ Up</span></div><div class="mt-1 flex items-center justify-between text-xs text-zinc-500"><span>from $7.7K</span><span class="text-zinc-500">just placed</span></div></div>`);
await shot(p, "p2");
await p.evaluate(() => { const sec = [...document.querySelectorAll("section")].find((s) => s.querySelector("h2")?.textContent === "Predict"); const mc = [...sec.querySelectorAll("div")].find((d) => d.textContent === "$7.7K" && d.className.includes("font-mono")); if (mc) mc.textContent = "$9.4K"; });
await predictAction(`<div class="rounded-xl border border-[#2fe39a]/30 bg-[#2fe39a]/[0.06] p-3 text-sm"><div class="flex items-center justify-between"><span class="text-zinc-500">Your call</span><span class="font-semibold text-up">▲ Up</span></div><div class="mt-1 flex items-center justify-between text-xs text-zinc-500"><span>from $7.7K</span><span class="text-up">winning right now</span></div></div>`);
await shot(p, "p3");
await p.close();

// leaderboard
const q = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await mock(q);
const P = ["0x8f3a5bd1c0e9a7a2b4c6d8e0f1a2b3c4d5e621cd", "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", "0x91ab3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", "0x2cd4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0", "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f", "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b", "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH"];
const pts = [410, 360, 290, 250, 210, 180, 150, 120];
await q.route("**/api/predict/leaderboard", (r) => r.fulfill({ json: { players: P.map((player, i) => ({ player, points: pts[i], calls: Math.round(pts[i] / 10 / (0.62 + (i % 3) * 0.07)), wins: pts[i] / 10 })) } }));
await q.goto("http://localhost:3123/leaderboard", { waitUntil: "networkidle" }).catch(() => {}); await q.waitForTimeout(1500);
await q.evaluate((html) => { for (const el of document.querySelectorAll("header button")) if (/Connect wallet/.test(el.innerText) && el.getBoundingClientRect().width > 0) el.innerHTML = html; }, dot("0x8f3a…21cd"));
await q.screenshot({ path: "shots2/lb.png", fullPage: true });
await box(q, "lb", "#predictors");
fs.writeFileSync("boxes2.json", JSON.stringify(boxes, null, 1));
await b.close();
