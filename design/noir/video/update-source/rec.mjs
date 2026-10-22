// Renders film.html frame by frame. Usage: node rec.mjs <framesDir> [worker] [workers]
import { chromium } from "playwright";
const fps = 30, [out = "frames", w = "0", n = "1"] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto("file://" + process.cwd() + "/film.html"); await p.waitForTimeout(1000);
const dur = await p.evaluate(() => window.DURATION);
for (let f = Number(w); f < fps * dur; f += Number(n)) {
  await p.evaluate((t) => window.render(t), f / fps);
  await p.screenshot({ path: `${out}/f${String(f).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 });
}
await b.close();
