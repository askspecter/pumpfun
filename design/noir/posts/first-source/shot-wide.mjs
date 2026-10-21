import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await p.goto("file://" + process.argv[2] + "/mystery-wide.html"); await p.waitForTimeout(600);
await (await p.$("#W")).screenshot({ path: `${process.argv[2]}/noir-mystery-macro-wide.png` });
await b.close();
