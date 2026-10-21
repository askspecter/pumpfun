import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1600, height: 1600 } });
await p.goto("file://" + process.argv[2] + "/next.html"); await p.waitForTimeout(600);
for (const [id, n] of [["A","square-soon"],["B","square-logo"],["C","wide"]]) await (await p.$("#"+id)).screenshot({ path: `${process.argv[2]}/noir-next-${n}.png` });
await b.close();
