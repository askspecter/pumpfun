import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { mock, EVM, MINT } from "./mocks.mjs";
import fs from "fs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const boxes = {};
const W = 1920, H = 1080;
async function newPage() { const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 }); await mock(p); return p; }
const shot = (p, n) => p.screenshot({ path: `shots/${n}.png`, fullPage: true });
async function box(p, n, sel) { const e = await p.$(sel); const r = await e.boundingBox(); boxes[n] = { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; }
const dot = (label) => `<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:9px;background:#2fe39a"></span>${label}</span>`;
async function connected(p, label) {
  await p.evaluate((html) => {
    for (const el of document.querySelectorAll("header button"))
      if (/Connect wallet/.test(el.innerText) && el.getBoundingClientRect().width > 0) el.innerHTML = html;
  }, dot(label));
}
async function action(p, html) {
  await p.evaluate((html) => {
    let area = document.getElementById("actionArea");
    if (!area) {
      const btns = [...document.querySelectorAll("main button")].filter((x) => /Launch profile|Connect|Launch on Pump|Select Wallet/i.test(x.innerText) && x.getBoundingClientRect().width > 300);
      const btn = btns.pop();
      area = btn.closest(".space-y-2") || btn.parentElement;
      area.id = "actionArea";
    }
    area.innerHTML = html;
  }, html);
}
const btn = (txt, spin) => `<button class="btn-brand w-full">${spin ? '<span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black"></span>' : ""}${txt}</button>`;
async function modal(p, o) {
  await p.evaluate(({ chain, action, fee, unit }) => {
    const m = document.createElement("div");
    m.id = "wmodal";
    m.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center";
    m.innerHTML = `<div style="width:400px;border-radius:24px;background:#121316;border:1px solid rgba(255,255,255,.1);box-shadow:0 50px 120px -20px #000;padding:26px;font-family:Inter;color:#fff">
<div style="display:flex;align-items:center;justify-content:space-between"><div style="font:600 12px Inter;color:#8a8f98;letter-spacing:.14em">CONFIRM TRANSACTION</div><div style="font:500 12px Inter;color:#c7cbd3;padding:4px 10px;border:1px solid rgba(255,255,255,.12);border-radius:99px">${chain}</div></div>
<div style="margin-top:22px;font:600 28px Inter;letter-spacing:-.02em">${action}</div>
<div style="margin-top:6px;font:400 14px Inter;color:#8a8f98">usenoir.app</div>
<div style="margin-top:22px;border-radius:16px;background:rgba(255,255,255,.04);padding:14px 16px;font:400 14px Inter;color:#a1a6af;display:grid;gap:10px">
<div style="display:flex;justify-content:space-between"><span>Network fee</span><span style="color:#fff;font-family:monospace">${fee} ${unit}</span></div>
<div style="display:flex;justify-content:space-between"><span>Signed by</span><span style="color:#fff">Your wallet</span></div></div>
<div style="margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:10px"><div style="text-align:center;padding:13px;border-radius:14px;border:1px solid rgba(255,255,255,.12);font:600 15px Inter">Reject</div><div id="wconfirm" style="text-align:center;padding:13px;border-radius:14px;background:#fff;color:#000;font:600 15px Inter">Confirm</div></div></div>`;
    document.body.appendChild(m);
  }, o);
}
async function type(p, sel, word, prefix) {
  const ks = [...new Set([2, 4, 6, 8, word.length].filter((k) => k <= word.length))];
  for (const k of ks) { await p.fill(sel, word.slice(0, k)); await p.waitForTimeout(80); await shot(p, `${prefix}-t${k}`); }
  return ks;
}
const steps = {};

// ═══ ROBINHOOD ═══
let p = await newPage();
await p.goto("http://localhost:3123/create", { waitUntil: "networkidle" }).catch(() => {}); await p.waitForTimeout(900);
await connected(p, "0x8f3a…21cd");
await shot(p, "r0");
await box(p, "handle", 'input[placeholder="yourname"]'); await box(p, "detect", "text=Detect my fomo.family profile");
steps.r = await type(p, 'input[placeholder="yourname"]', "novatrades", "r1");
await p.click("text=Detect my fomo.family profile"); await p.waitForTimeout(900);
await action(p, btn("Launch profile")); await shot(p, "r2");
await box(p, "rLaunch", "#actionArea button");
await box(p, "rBuy", 'input[placeholder="0.0"]');
await p.fill('input[placeholder="0.0"]', "0.05"); await p.waitForTimeout(100); await shot(p, "r3");
await action(p, btn("Sign in your wallet…", true)); await modal(p, { chain: "Robinhood Chain", action: "Launch $NOVATRADES", fee: "0.00012", unit: "ETH" }); await shot(p, "r4");
await box(p, "rConfirm", "#wconfirm");
await p.evaluate(() => document.getElementById("wmodal").remove());
await action(p, btn("Confirming on Robinhood Chain…", true)); await shot(p, "r5");
await action(p, `<a class="btn-brand w-full">✓ Profile launched. View on explorer</a><a class="btn-ghost w-full" style="margin-top:8px">Open your profile coin →</a>`); await shot(p, "r6");
await box(p, "rOpen", "#actionArea a:nth-child(2)");
await p.close();
p = await newPage(); await p.goto("http://localhost:3123/launch/" + EVM, { waitUntil: "networkidle" }).catch(() => {}); await p.waitForTimeout(2500); await connected(p, "0x8f3a…21cd"); await shot(p, "r7");
await p.close();

// ═══ SOLANA ═══
p = await newPage();
await p.goto("http://localhost:3123/create", { waitUntil: "networkidle" }).catch(() => {}); await p.waitForTimeout(900);
await connected(p, "0x8f3a…21cd");
await p.evaluate((html) => { for (const el of document.querySelectorAll("header button")) if (el.innerText.trim() === "Solana") el.innerHTML = html; }, dot("7xKX…sAsU"));
await box(p, "pumpTab", "button:has-text('@Pumpfun')");
await shot(p, "s0");
await p.click("button:has-text('@Pumpfun')"); await p.waitForTimeout(500);
await action(p, btn("Launch on Pump.fun"));
await shot(p, "s1");
const hs = 'input[placeholder^="yourname"]'; await box(p, "sHandle", hs);
steps.s = await type(p, hs, "kairo", "s2");
await box(p, "sDetect", "main button:has-text('Detect')");
await p.click("main button:has-text('Detect')"); await p.waitForTimeout(900);
await action(p, btn("Launch on Pump.fun")); await shot(p, "s3");
await box(p, "sLaunch", "#actionArea button");
await action(p, btn("Sign in your wallet…", true)); await modal(p, { chain: "Solana", action: "Launch $KAIRO", fee: "0.000085", unit: "SOL" }); await shot(p, "s4");
await box(p, "sConfirm", "#wconfirm");
await p.evaluate(() => document.getElementById("wmodal").remove());
await action(p, btn("Confirming on Solana…", true)); await shot(p, "s5");
await action(p, `<a class="btn-brand w-full">✓ Profile launched. Open your coin →</a><a class="btn-ghost w-full" style="margin-top:8px">View transaction →</a>`); await shot(p, "s6");
await box(p, "sOpen", "#actionArea a:nth-child(1)");
await p.close();
p = await newPage(); await p.goto("http://localhost:3123/sol/" + MINT, { waitUntil: "networkidle" }).catch(() => {}); await p.waitForTimeout(1500); await connected(p, "0x8f3a…21cd");
await p.evaluate((html) => { for (const el of document.querySelectorAll("header button")) if (el.innerText.trim() === "Solana") el.innerHTML = html; }, dot("7xKX…sAsU"));
await box(p, "sAmt", 'input[placeholder="0.0"]');
await p.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((x) => /Connect Solana wallet/.test(x.innerText)); b.outerHTML = '<button id="sBuyBtn" class="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold bg-up text-[#03130b]">Buy $KAIRO</button>'; });
await shot(p, "s7");
await p.fill('input[placeholder="0.0"]', "0.5"); await p.waitForTimeout(100); await shot(p, "s8");
await box(p, "sBuy", "#sBuyBtn");
await p.close();
fs.writeFileSync("boxes.json", JSON.stringify({ boxes, steps }, null, 1));
await b.close();
