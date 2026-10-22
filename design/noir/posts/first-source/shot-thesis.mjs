import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await p.goto("file://" + process.argv[2] + "/thesis.html"); await p.waitForTimeout(600);
for (const [id, n] of [["A", "split"], ["B", "stacked"]]) await (await p.$("#" + id)).screenshot({ path: `${process.argv[2]}/noir-thesis-${n}.png` });
await b.close();
