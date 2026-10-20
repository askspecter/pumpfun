import { chromium } from "playwright";
const [out, fps, dur] = [process.argv[2], 30, 22];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto("file://" + process.cwd() + "/promo.html"); await p.waitForTimeout(800);
for (let f = 0; f < fps * dur; f++) {
  await p.evaluate((t) => window.render(t), f / fps);
  await p.screenshot({ path: `${out}/f${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 92 });
}
await b.close();
