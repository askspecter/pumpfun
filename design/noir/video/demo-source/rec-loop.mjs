import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const fps = 30;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto("file://" + process.cwd() + "/loop.html"); await p.waitForTimeout(2000);
const dur = await p.evaluate(() => window.DURATION);
for (let f = 0; f < fps * dur; f++) {
  await p.evaluate((t) => window.render(t), f / fps);
  await p.screenshot({ path: `frames-loop/f${String(f).padStart(5, "0")}.jpg`, type: "jpeg", quality: 90 });
}
await b.close();
console.log("done");
