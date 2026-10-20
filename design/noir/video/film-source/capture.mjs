import { chromium } from "playwright";
const OUT = process.argv[2];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
// Fictional demo profiles (no real people).
const names = [["Nova","novatrades","fomo",412000,128400,true],["Kairo","kairo.sol","pumpfun",286000,null,false],["Mira","mira","fomo",201300,-24100,true],["Atlas","atlasdegen","pumpfun",154800,null,false],["Vela","vela","fomo",133200,56200,true],["Juno","junoxyz","fomo",98100,12300,false],["Orin","orin","pumpfun",77400,null,false],["Lyra","lyra","fomo",54200,8300,false],["Sable","sable","fomo",41700,-1200,false],["Echo","echo","pumpfun",33900,null,false]];
const grads=[["#7cf3ff","#a77bff"],["#ffb36b","#ff5f9e"],["#3dffb0","#00b3ff"],["#fff27a","#ff8a5c"],["#c7cdff","#6e7bff"],["#b6ff6b","#2fd6a0"],["#ff9a9a","#7a1fff"],["#9cf","#c6f"],["#ffd36e","#ff6e9c"],["#6ee7ff","#6e8bff"]];
const av = (i,l) => "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${grads[i][0]}"/><stop offset="1" stop-color="${grads[i][1]}"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="17" fill="#0005"/><path d="M18 100 C20 72 80 72 82 100Z" fill="#0005"/></svg>`).toString("base64");
const profiles = names.map(([d,h,s,f,p,v],i)=>({source:s,handle:h,displayName:d,avatar:av(i),followers:f,verified:v,lookup:h,url:"#",pnlUsd:p}));
const now = Date.now();
const launches = [
 {chain:"solana",token:"Enf7zo1Bw7EcSndus8iKVLwG5ne2eNHzVmuuoFMEF6Vf",name:"Nova",symbol:"NOVA",logo:av(0),handle:"novatrades",source:"fomo",deployer:"x",createdAt:now-4*60e3},
 {chain:"robinhood",token:"0x161A82EE8ce9F83c0aaDB724E244ECa1e187d800",name:"Mira",symbol:"MIRA",logo:av(2),handle:"mira",source:"fomo",deployer:"0x0",createdAt:now-15*60e3},
 {chain:"solana",token:"9k9xVWxw8i8jyEcBJbbA9TTwLqbnj6yRNnRzpzFpyRMC",name:"Kairo",symbol:"KAIRO",logo:av(1),handle:"kairo.sol",source:"pumpfun",deployer:"x",createdAt:now-32*60e3},
];
const mint = "Enf7zo1Bw7EcSndus8iKVLwG5ne2eNHzVmuuoFMEF6Vf";
const coin = { mint, name:"Nova", symbol:"NOVA", logo:av(0), description:"Profile coin of @novatrades on fomo.family.", creator:"7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", handle:"novatrades", source:"fomo", twitter:null, telegram:null, website:null, priceSol:0.0000000312, priceUsd:0.0000058, marketCapSol:31.2, marketCapUsd:5830, complete:false, progress:0.124, curve:{virtualTokenReserves:"1000000000000000", virtualSolReserves:"31000000000", realSolReserves:"1200000000", bondingCurve:"x"} };
async function page(w=1920,h=1080){ const p = await b.newPage({ viewport:{width:w,height:h} });
  await p.route("**/api/top-profiles", r=>r.fulfill({json:{profiles}}));
  await p.route("**/api/launches**", r=> r.request().method()==="GET" ? r.fulfill({json:{items:launches}}) : r.fulfill({json:{ok:true}}));
  await p.route("**/api/pumpfun/prices**", r=>r.fulfill({json:{prices:{[launches[0].token]:{marketCapSol:31.2,marketCapUsd:5830},[launches[2].token]:{marketCapSol:12.4,marketCapUsd:2310}}}}));
  await p.route("**/api/v2/prices**", r=>r.fulfill({json:{prices:{[launches[1].token.toLowerCase()]:{marketCapEth:1.1,marketCapUsd:4120}}}}));
  await p.route("**/api/pumpfun/coin**", r=>r.fulfill({json:coin}));
  await p.route("**/api/fomo/**", r=>r.fulfill({json:{profile:{handle:"novatrades",displayName:"Nova",bio:"Trader. Builder. Early on everything.",avatar:av(0),verified:true,wallets:{evm:"0x8f3a5Bd1c0e9A7a2b4C6d8E0f1a2B3c4D5e621cd",solana:null}}}}));
  await p.route("**/api/v2/launch-options**", r=>r.fulfill({json:{launchFee:"0",canLaunch:true,configs:[{id:"0"}],quoteAssets:[]}}));
  await p.route("https://dexscreener.com/**", r=>r.fulfill({contentType:"text/html",body:"<body style='margin:0;background:#0b0c0f'></body>"}));
  return p; }
// 1) Home full page
let p = await page(); await p.goto("http://localhost:3123/",{waitUntil:"networkidle"}); await p.waitForTimeout(700);
await p.screenshot({path:`${OUT}/home.png`, fullPage:true});
const tp = await p.$("#top-profiles"); const tpBox = await tp.boundingBox(); console.log("topProfiles", JSON.stringify(tpBox));
const tok = await p.$$("text=Tokenize"); const tb = await tok[0].boundingBox(); console.log("tokenizeBtn", JSON.stringify(tb));
await p.close();
// 2) Create page before / after detect
p = await page(); await p.goto("http://localhost:3123/create",{waitUntil:"networkidle"}); await p.waitForTimeout(500);
await p.screenshot({path:`${OUT}/create-0.png`});
const inp = await p.$('input[placeholder="yourname"]'); console.log("handleInput", JSON.stringify(await inp.boundingBox()));
const det = await p.$("text=Detect my fomo.family profile"); console.log("detectBtn", JSON.stringify(await det.boundingBox()));
await inp.fill("novatrades"); await p.screenshot({path:`${OUT}/create-1.png`});
await det.click(); await p.waitForTimeout(800); await p.screenshot({path:`${OUT}/create-2.png`});
const sol = await p.$("button:has-text('Solana')"); console.log("solToggle", JSON.stringify(await sol.boundingBox()));
await sol.click(); await p.waitForTimeout(400); await p.screenshot({path:`${OUT}/create-3.png`});
await p.close();
// 3) Solana coin page
p = await page(); await p.goto("http://localhost:3123/sol/"+mint,{waitUntil:"networkidle"}); await p.waitForTimeout(700);
await p.screenshot({path:`${OUT}/coin.png`});
console.log("iframe", JSON.stringify(await (await p.$("iframe")).boundingBox()));
const amt = await p.$('input[placeholder="0.0"]'); console.log("amount", JSON.stringify(await amt.boundingBox()));
console.log("preset", JSON.stringify(await (await p.$("button:has-text('0.5')")).boundingBox()));
console.log("tradeBtn", JSON.stringify(await (await p.$("button:has-text('Connect Solana wallet') >> nth=-1")).boundingBox()));
console.log("mcStat", JSON.stringify(await (await p.$("text=Market cap")).boundingBox()));
await p.close();
// 4) Leaderboard
p = await page(); await p.goto("http://localhost:3123/leaderboard",{waitUntil:"networkidle"}); await p.waitForTimeout(500);
await p.screenshot({path:`${OUT}/leaderboard.png`}); await p.close();
await b.close();
