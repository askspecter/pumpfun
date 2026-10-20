import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
await p.goto("file://" + process.cwd() + "/card.html"); await p.waitForTimeout(500);
await (await p.$("#c")).screenshot({ path: process.argv[2] });
await b.close();
