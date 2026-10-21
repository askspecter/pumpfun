import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
const p = await b.newPage({ viewport: { width: 2000, height: 1000 }, deviceScaleFactor: 1.25 });
await p.goto("file://" + process.cwd() + "/art.html"); await p.waitForTimeout(700);
const names = { cA: "cover-A-chrome", cB: "cover-B-minimal", cC: "cover-C-lineart", s1: "1-attention", s2: "2-fees", s3: "3-market", s4: "4-closing" };
for (const [id, n] of Object.entries(names)) await (await p.$("#" + id)).screenshot({ path: `${process.argv[2]}/noir-article-${n}.png` });
await b.close();
