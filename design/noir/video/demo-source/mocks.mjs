export const grads=[["#7cf3ff","#a77bff"],["#ffb36b","#ff5f9e"],["#3dffb0","#00b3ff"]];
export const av=(i)=>"data:image/svg+xml;base64,"+Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${grads[i][0]}"/><stop offset="1" stop-color="${grads[i][1]}"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="17" fill="#0005"/><path d="M18 100 C20 72 80 72 82 100Z" fill="#0005"/></svg>`).toString("base64");
export const EVM="0x7a3cd91e4b2f8a6d0c5e1f9b3a7d2c8e4f6a1b9c", MINT="9k9xVWxw8i8jyEcBJbbA9TTwLqbnj6yRNnRzpzFpyRMC";
const now=Date.now();
// chart points for robinhood coin
const pts=[];let mc=2400;for(let i=0;i<90;i++){mc*= i>55?1.035+Math.sin(i)*0.01:1+(Math.sin(i*1.7)*0.02);pts.push({t:now-(90-i)*60e3,mc});}

// a candle chart standing in for the DexScreener embed
let cs="",pr=40,sd=3;const rn=()=>(sd=(sd*16807)%2147483647)/2147483647;const C=[];
for(let i=0;i<70;i++){const up=i>40;const o=pr,c=o+(up?1.5+rn()*3:(rn()-.5)*2.4);C.push([o,c,Math.max(o,c)+rn()*2,Math.min(o,c)-rn()*2,8+rn()*(up?60:22)]);pr=c;}
const mn=Math.min(...C.map(d=>d[3])),mx=Math.max(...C.map(d=>d[2]));const Y=v=>40+400-((v-mn)/(mx-mn))*400;
C.forEach((d,i)=>{const x=20+i*10.6,col=d[1]>=d[0]?"#2fe39a":"#ff5c6c";cs+=`<rect x="${x-3.4}" y="${540-d[4]}" width="6.8" height="${d[4]}" fill="${col}" opacity=".25"/><line x1="${x}" x2="${x}" y1="${Y(d[2])}" y2="${Y(d[3])}" stroke="${col}"/><rect x="${x-3.4}" y="${Math.min(Y(d[0]),Y(d[1]))}" width="6.8" height="${Math.max(2,Math.abs(Y(d[0])-Y(d[1])))}" fill="${col}"/>`;});
let grid="";for(let k=1;k<6;k++)grid+=`<line x1="0" x2="760" y1="${k*90}" y2="${k*90}" stroke="#ffffff0d"/>`;
export const DEX=`<body style="margin:0;background:#0b0c0f;font-family:sans-serif"><div style="padding:10px 14px;color:#8a8f98;font-size:12px">KAIRO/SOL · 1m</div><svg viewBox="0 0 760 560" width="100%" height="92%" preserveAspectRatio="none">${grid}${cs}</svg></body>`;
export async function mock(p){
 await p.route("**/api/top-profiles",r=>r.fulfill({json:{profiles:[]}}));
 await p.route("**/api/launches**",r=>r.fulfill({json:r.request().method()==="GET"?{items:[]}:{ok:true}}));
 await p.route("**/api/fomo/**",r=>r.fulfill({json:{profile:{handle:"novatrades",displayName:"Nova",bio:"Trader. Builder. Early on everything.",avatar:av(0),verified:true,wallets:{evm:"0x8f3a5bd1c0e9a7a2b4c6d8e0f1a2b3c4d5e621cd",solana:null}}}}));
 await p.route("**/api/pumpfun/profile/**",r=>r.fulfill({json:{profile:{address:"7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",username:"kairo",bio:"Degen since day one. Building on Solana.",avatar:av(1)}}}));
 await p.route("**/api/v2/launch-options**",r=>r.fulfill({json:{launchFee:"0",canLaunch:true,configs:[{id:"0"}],quoteAssets:[]}}));
 await p.route("**/api/v2/token/chart**",r=>r.fulfill({json:{points:pts}}));
 await p.route("**/api/v2/token?**",r=>r.fulfill({json:{token:EVM,name:"Nova",symbol:"NOVATRADES",decimals:18,logo:av(0),description:"Trader. Builder. Early on everything.",deployer:"0x8f3a5bd1c0e9a7a2b4c6d8e0f1a2b3c4d5e621cd",curveAddress:"0x51c2a0b7e3d94f8a6b1c5d2e7f0a3b9c4d8e6f21",pairToken:"0x0000000000000000000000000000000000000000",phase:0,phaseLabel:"bonding curve",creatorFeeRecipient:"0x8f3a5bd1c0e9a7a2b4c6d8e0f1a2b3c4d5e621cd",priceEth:0,marketCapEth:4.12,priceUsd:0,marketCapUsd:pts.at(-1).mc,totalSupply:"1000000000000000000000000000",curve:{quoteReserve:"3200000000000000000",tokenReserve:"800000000000000000000000000",sellableTokens:"700000000000000000000000000",feeBps:"100",creatorTaxBps:"100",progress:0.284,graduated:false,readyToGraduate:false}}}));
 await p.route("**/api/token/*/comments**",r=>r.fulfill({json:{comments:[{author:"0x91aB3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B",text:"early on this one 🔥",ts:now-120e3},{author:"0x2cD4e6F8a0B2c4D6e8F0a2B4c6D8e0F2a4B6c8D0",text:"Nova finally tokenized. LFG",ts:now-300e3}],storage:true}}));
 await p.route("**/api/pumpfun/coin**",r=>r.fulfill({json:{mint:MINT,name:"kairo",symbol:"KAIRO",logo:av(1),description:"Degen since day one. Building on Solana.",creator:"7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",handle:"kairo",source:"pumpfun",twitter:null,telegram:null,website:null,priceSol:0.0000000312,priceUsd:0.0000058,marketCapSol:31.2,marketCapUsd:5830,complete:false,progress:0.124,curve:{virtualTokenReserves:"1000000000000000",virtualSolReserves:"31000000000",realSolReserves:"1200000000",bondingCurve:"x"}}}));
 await p.route("**/api/pumpfun/prices**",r=>r.fulfill({json:{prices:{}}}));
 await p.route("**/api/v2/prices**",r=>r.fulfill({json:{prices:{}}}));
 await p.route("https://dexscreener.com/**",r=>r.fulfill({contentType:"text/html; charset=utf-8",body:DEX}));
 await p.route(/rpc|alchemy|helius|walletconnect|web3modal|coinbase/i,r=>r.abort());
}
