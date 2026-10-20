import random
random.seed(21)
logo={"solana":"solana.jpg","robinhood":"robinhood.png","fomo":"fomo.jpg","pumpfun":"pumpfun.jpg"}
pal=[("#7cf3ff","#a77bff","#ff6fd8"),("#ffb36b","#ff5f9e","#7a5cff"),("#3dffb0","#00b3ff","#7b3fff"),("#fff27a","#ff8a5c","#ff3d7f"),("#9cf","#69f","#c6f"),("#b6ff6b","#2fd6a0","#1e7bff"),("#ff9a9a","#ff4f6d","#7a1fff"),("#a0f","#60f","#0cf")]
coins=[("Alice","ALICE","solana","fomo","84.2K","+212.4%",True),("degen.eth","DEGEN","robinhood","fomo","41.9K","+96.1%",True),("satoshi","SATO","solana","pumpfun","27.4K","+64.8%",True),
       ("moonboy","MOON","robinhood","fomo","12.1K","−8.3%",False),("vibes","VIBE","solana","pumpfun","8.7K","+18.0%",True),("whale","WHALE","robinhood","fomo","5.3K","+9.2%",True),("kira","KIRA","solana","pumpfun","4.1K","−2.1%",False)]
G="#2fe39a"; R="#ff5c6c"

def av(i,s,r="50%"):
    a,b,c=pal[i%len(pal)]
    return f'''<div style="width:{s}px;height:{s}px;border-radius:{r};position:relative;overflow:hidden;flex-shrink:0;background:{c}"><div style="position:absolute;inset:-30%;background:radial-gradient(circle at 30% 30%,{a},transparent 45%),radial-gradient(circle at 75% 70%,{b},transparent 50%)"></div>
<svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%"><circle cx="50" cy="40" r="17" fill="#0005"/><path d="M18 100 C20 72 80 72 82 100Z" fill="#0005"/></svg></div>'''

def spark(w,h,seed,col,up=True):
    random.seed(seed); y=h*.7 if up else h*.3; pts=[]
    for k in range(30):
        y+=random.uniform(-h*.1,h*.07) if up else random.uniform(-h*.07,h*.1); y=max(3,min(h-3,y)); pts.append((k*w/29,y))
    d="M"+" L".join(f"{x:.1f} {y:.1f}" for x,y in pts)
    return f'<svg width="{w}" height="{h}"><path d="{d}" fill="none" stroke="{col}" stroke-width="1.8" stroke-linejoin="round"/></svg>'

def candles(w,h,n,seed):
    random.seed(seed); out=[]; p=40.0; cw=w/n; ys=[]
    data=[]
    for k in range(n):
        o=p; c=o+random.gauss(0.9,3.2); hi=max(o,c)+abs(random.gauss(0,1.6)); lo=min(o,c)-abs(random.gauss(0,1.6)); p=c; data.append((o,c,hi,lo))
    mn=min(d[3] for d in data); mx=max(d[2] for d in data)
    Y=lambda v: h-8-(v-mn)/(mx-mn)*(h-16)
    for k,(o,c,hi,lo) in enumerate(data):
        x=k*cw+cw/2; col=G if c>=o else R
        out.append(f'<line x1="{x:.1f}" x2="{x:.1f}" y1="{Y(hi):.1f}" y2="{Y(lo):.1f}" stroke="{col}" stroke-width="1"/>')
        out.append(f'<rect x="{x-cw*.32:.1f}" y="{min(Y(o),Y(c)):.1f}" width="{cw*.64:.1f}" height="{max(1.5,abs(Y(o)-Y(c))):.1f}" fill="{col}" rx="1"/>')
    vol="".join(f'<rect x="{k*cw+cw*.18:.1f}" y="{h+34-random.uniform(4,30):.1f}" width="{cw*.64:.1f}" height="40" fill="{G if data[k][1]>=data[k][0] else R}" opacity=".28"/>' for k in range(n))
    grid="".join(f'<line x1="0" x2="{w}" y1="{h*t/4:.0f}" y2="{h*t/4:.0f}" stroke="#ffffff0d"/>' for t in range(1,4))
    lastY=Y(data[-1][1])
    return f'''<svg width="{w}" height="{h+34}" style="overflow:visible">{grid}{vol}{"".join(out)}
<line x1="0" x2="{w}" y1="{lastY:.1f}" y2="{lastY:.1f}" stroke="{G}" stroke-dasharray="3 4" opacity=".7"/>
<rect x="{w-64}" y="{lastY-11:.1f}" width="64" height="22" rx="4" fill="{G}"/><text x="{w-32}" y="{lastY+4:.1f}" text-anchor="middle" font-family="JetBrains Mono" font-size="11" font-weight="700" fill="#03130b">0.00842</text></svg>'''

css='''*{margin:0;box-sizing:border-box}body{background:#000}
.page{width:1440px;position:relative;overflow:hidden;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
img.l{border-radius:50%;object-fit:cover;flex-shrink:0}.m{font-family:'JetBrains Mono',monospace}
.t2{color:#8a8f98}.t3{color:#5c616b}
'''

# ── product UI (trading terminal) ──
def ui_row(i):
    n,t,ch,src,mc,c,up=coins[i]
    return f'''<div style="display:grid;grid-template-columns:1fr 64px 72px;align-items:center;padding:9px 12px;{'background:#ffffff08;' if i==0 else ''}border-radius:8px">
<div style="display:flex;align-items:center;gap:10px">{av(i,26)}<div><div style="font:600 13px Inter;color:#eceef2">${t}</div><div class=t3 style="font:500 11px Inter">@{n.lower()}</div></div></div>
<div class=m style="font-size:12px;color:#eceef2;text-align:right">${mc}</div><div class=m style="font-size:12px;text-align:right;color:{G if up else R}">{c}</div></div>'''

UI=f'''<div style="width:1240px;border-radius:18px;background:#0b0c0f;border:1px solid #ffffff14;overflow:hidden;box-shadow:0 0 0 1px #000,0 80px 160px -40px #000">
<div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #ffffff0d;background:#0e0f13">
 <span style="width:11px;height:11px;border-radius:50%;background:#ff5f57"></span><span style="width:11px;height:11px;border-radius:50%;background:#febc2e"></span><span style="width:11px;height:11px;border-radius:50%;background:#28c840"></span>
 <div style="margin:0 auto;padding:5px 80px;border-radius:7px;background:#ffffff08;font:500 12px Inter;color:#8a8f98">noir.app/alice</div></div>
<div style="display:grid;grid-template-columns:300px 1fr 290px;height:610px">
 <div style="border-right:1px solid #ffffff0d;padding:14px 8px">
  <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:#ffffff08;font:500 12px Inter;color:#5c616b;margin:0 6px 12px">⌕ Search profiles…<span class=m style="margin-left:auto;padding:1px 6px;border-radius:4px;border:1px solid #ffffff14;font-size:10px">⌘K</span></div>
  <div class=t3 style="font:600 10px Inter;letter-spacing:.12em;padding:4px 14px 8px">TRENDING</div>
  {"".join(ui_row(i) for i in range(7))}</div>
 <div style="padding:18px 22px">
  <div style="display:flex;align-items:center;gap:14px">{av(0,46,"12px")}
   <div><div style="display:flex;align-items:center;gap:8px;font:700 19px Inter;color:#fff">Alice <span class=m style="font:500 13px 'JetBrains Mono';color:#8a8f98">$ALICE</span><img class=l src="solana.jpg" style="width:16px;height:16px"></div>
   <div style="display:flex;align-items:center;gap:6px;font:500 12px Inter;color:#8a8f98"><img class=l src="fomo.jpg" style="width:14px;height:14px">@alice · fomo.family · 2,431 holders</div></div>
   <div style="margin-left:auto;text-align:right"><div class=m style="font:700 26px 'JetBrains Mono';color:#fff;letter-spacing:-.02em">$84,219</div><div class=m style="font-size:13px;color:{G}">▲ 212.4% · 24h</div></div></div>
  <div style="display:flex;gap:4px;margin-top:16px;font:600 11px Inter;color:#5c616b">{"".join(f'<span style="padding:5px 10px;border-radius:6px;{"background:#ffffff10;color:#fff" if x=="1H" else ""}">{x}</span>' for x in ["5M","15M","1H","4H","1D","ALL"])}
   <span style="margin-left:auto;padding:5px 10px;border-radius:6px;background:#ffffff08">Bonding curve <b style="color:#fff">78%</b></span></div>
  <div style="margin-top:14px">{candles(590,330,54,5)}</div>
  <div style="margin-top:14px;height:6px;border-radius:9px;background:#ffffff0a"><div style="height:6px;width:78%;border-radius:9px;background:linear-gradient(90deg,#2fe39a,#7cf3ff)"></div></div>
  <div style="display:flex;justify-content:space-between;margin-top:6px;font:500 11px Inter;color:#5c616b"><span>Graduates to PumpSwap at 100%</span><span class=m>64.1 / 82.0 SOL</span></div></div>
 <div style="border-left:1px solid #ffffff0d;padding:18px">
  <div style="display:grid;grid-template-columns:1fr 1fr;padding:3px;border-radius:9px;background:#ffffff08;font:600 13px Inter"><span style="text-align:center;padding:8px;border-radius:7px;background:{G};color:#03130b">Buy</span><span style="text-align:center;padding:8px;color:#8a8f98">Sell</span></div>
  <div class=t3 style="font:500 11px Inter;margin-top:16px">Amount</div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;padding:12px 14px;border-radius:10px;background:#ffffff06;border:1px solid #ffffff14"><span class=m style="font:600 20px 'JetBrains Mono';color:#fff">2.50</span><span style="display:flex;align-items:center;gap:6px;font:600 13px Inter;color:#fff"><img class=l src="solana.jpg" style="width:18px;height:18px">SOL</span></div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px">{"".join(f'<span class=m style="text-align:center;padding:6px 0;border-radius:6px;background:#ffffff08;font-size:11px;color:#8a8f98">{x}</span>' for x in ["0.1","0.5","1","Max"])}</div>
  <div style="margin-top:14px;font:500 12px Inter;line-height:2" class=t2><div style="display:flex;justify-content:space-between"><span>You receive</span><span class=m style="color:#fff">296,812 ALICE</span></div><div style="display:flex;justify-content:space-between"><span>Price impact</span><span class=m>0.84%</span></div><div style="display:flex;justify-content:space-between"><span>Creator fee</span><span class=m>1.0%</span></div></div>
  <div style="margin-top:12px;text-align:center;padding:13px;border-radius:10px;background:{G};color:#03130b;font:700 14px Inter">Buy $ALICE</div>
  <div class=t3 style="font:600 10px Inter;letter-spacing:.12em;margin-top:22px">LIVE TRADES</div>
  {"".join(f'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:9px;font:500 12px Inter"><span style="display:flex;align-items:center;gap:7px">{av(k+2,18)}<span class=t2>{w}</span></span><span class=m style="color:{G if b else R}">{"+" if b else "−"}{a} SOL</span></div>' for k,(w,a,b) in enumerate([("7xKX…9fQa","3.20",True),("Bq4m…Lr2c","0.85",True),("9pZt…Wk1d","1.40",False),("Fh2s…Qe8n","0.25",True),("2Lmv…Tz7p","5.00",True)]))}
 </div></div></div>'''

# ── page ──
def bento(content,col,row,pad="34px"):
    return f'<div style="grid-column:{col};grid-row:{row};border-radius:24px;background:linear-gradient(180deg,#0f1013,#0a0b0d);border:1px solid #ffffff10;padding:{pad};position:relative;overflow:hidden">{content}</div>'

def mkt(i):
    n,t,ch,src,mc,c,up=coins[i]
    return f'''<div style="display:grid;grid-template-columns:40px 1.6fr 1fr 1fr 1fr 150px 110px;align-items:center;padding:16px 8px;border-top:1px solid #ffffff0d">
<span class="m t3" style="font-size:13px">{i+1}</span>
<div style="display:flex;align-items:center;gap:12px">{av(i,36)}<div><div style="font:600 15px Inter;color:#fff;display:flex;align-items:center;gap:6px">{n}<img class=l src="{logo[src]}" style="width:14px;height:14px"></div><div class="m t3" style="font-size:12px">${t}</div></div></div>
<span style="display:flex;align-items:center;gap:7px;font:500 13px Inter" class=t2><img class=l src="{logo[ch]}" style="width:18px;height:18px">{"Solana" if ch=="solana" else "Robinhood"}</span>
<span class=m style="font-size:14px;color:#fff">${mc}</span>
<span class=m style="font-size:14px;color:{G if up else R}">{c}</span>
{spark(130,32,100+i,G if up else R,up)}
<span style="justify-self:end;padding:8px 16px;border-radius:9px;background:#ffffff0c;border:1px solid #ffffff14;font:600 13px Inter;color:#fff">Trade</span></div>'''

P=f'''<div class=page id=p1 style="background:#08090a;padding-bottom:120px">
<!-- top beam -->
<div style="position:absolute;left:50%;top:-380px;width:1500px;height:900px;transform:translateX(-50%);background:radial-gradient(ellipse at center,#5d6bff2e 0%,#a77bff14 35%,transparent 65%)"></div>
<div style="position:absolute;left:50%;top:600px;width:1400px;height:420px;transform:translateX(-50%);background:radial-gradient(ellipse at center,#7c8cff4d 0%,transparent 65%);filter:blur(40px)"></div>

<div style="position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:22px 64px;border-bottom:1px solid #ffffff0b">
 <div style="display:flex;align-items:center;gap:10px"><svg width="26" height="26" viewBox="0 0 26 26"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#8a8f98"/></linearGradient></defs><rect width="26" height="26" rx="7" fill="url(#lg)"/><path d="M7.5 19V7h2.6l6.3 8V7H19v12h-2.6l-6.3-8v8z" fill="#08090a"/></svg><span style="font:600 18px Inter;color:#fff;letter-spacing:-.01em">Noir</span></div>
 <div style="display:flex;gap:34px;font:500 14px Inter" class=t2><span style="color:#fff">Markets</span><span>Explore</span><span>Leaderboard</span><span>Launch</span><span>Docs</span></div>
 <div style="display:flex;gap:10px;align-items:center"><span style="font:500 14px Inter" class=t2>Log in</span><span style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:9px;background:#fff;color:#08090a;font:600 14px Inter">Connect wallet</span></div></div>

<div style="position:relative;z-index:5;text-align:center;padding-top:96px">
 <div style="display:inline-flex;align-items:center;gap:10px;padding:6px 14px 6px 6px;border-radius:99px;background:#ffffff08;border:1px solid #ffffff12;font:500 13px Inter" class=t2>
  <span style="display:flex"><img class=l src="robinhood.png" style="width:20px;height:20px;border:2px solid #08090a"><img class=l src="solana.jpg" style="width:20px;height:20px;margin-left:-6px;border:2px solid #08090a"></span>Now live on Robinhood Chain &amp; Solana <span style="color:#fff">→</span></div>
 <h1 style="margin-top:30px;font:600 92px/1.0 'Inter Display';letter-spacing:-.045em;background:linear-gradient(180deg,#ffffff 30%,#ffffff8c);-webkit-background-clip:text;color:transparent">Your profile.<br>Now a market.</h1>
 <p style="margin:26px auto 0;max-width:600px;font:400 19px/1.55 Inter" class=t2>Tokenize your <span style="color:#e6e8ec">@fomo</span> &amp; <span style="color:#e6e8ec">@Pumpfun</span> profile and trade it on a bonding curve. Built for speed. Non-custodial by design.</p>
 <div style="display:flex;justify-content:center;gap:12px;margin-top:38px">
  <span style="display:flex;align-items:center;gap:10px;padding:13px 22px;border-radius:11px;background:#fff;color:#08090a;font:600 15px Inter;box-shadow:0 0 0 1px #fff,0 8px 30px -6px #ffffff55">Launch your profile</span>
  <span style="display:flex;align-items:center;gap:10px;padding:13px 22px;border-radius:11px;background:#ffffff0a;border:1px solid #ffffff1a;color:#fff;font:600 15px Inter">Explore markets <span class=t2>→</span></span></div></div>

<!-- hero product shot -->
<div style="position:relative;z-index:5;margin-top:84px;display:flex;justify-content:center;perspective:2400px">
 <div style="position:absolute;top:-1px;left:50%;transform:translateX(-50%);width:900px;height:2px;background:linear-gradient(90deg,transparent,#c7cdff,transparent);filter:blur(.5px);z-index:6"></div>
 <div style="transform:rotateX(16deg) scale(1.0);transform-origin:top center">{UI}</div>
 <div style="position:absolute;left:-200px;right:-200px;bottom:-140px;height:440px;background:linear-gradient(180deg,transparent 0%,#08090a 60%);z-index:7"></div></div>

<!-- trusted strip -->
<div style="position:relative;z-index:8;margin-top:-10px;display:flex;justify-content:center;gap:70px;align-items:center;font:600 17px Inter" class=t3>
 {"".join(f'<span style="display:flex;align-items:center;gap:10px;filter:grayscale(1);opacity:.75"><img src="{f}" style="width:26px;height:26px;border-radius:7px">{n}</span>' for f,n in [("robinhood.png","Robinhood Chain"),("solana.jpg","Solana"),("fomo.jpg","fomo.family"),("pumpfun.jpg","Pump.fun")])}</div>

<!-- bento -->
<div style="position:relative;z-index:5;margin:130px 64px 0">
 <div style="font:600 54px/1.05 'Inter Display';letter-spacing:-.04em;color:#fff;max-width:760px">Designed for creators.<br><span style="color:#5c616b">Engineered for traders.</span></div>
 <div style="display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:330px 330px;gap:16px;margin-top:46px">
 {bento(f"""<div style="font:600 22px Inter;color:#fff">Detect in one click</div><div class=t2 style="font:400 15px/1.5 Inter;margin-top:8px;max-width:330px">Paste a handle. Name, avatar, bio and wallet are pulled straight from your profile.</div>
  <div style="position:absolute;left:34px;right:34px;bottom:30px;border-radius:14px;background:#08090a;border:1px solid #ffffff14;padding:14px">
   <div style="display:flex;gap:6px;padding:3px;border-radius:9px;background:#ffffff08;font:600 12px Inter;width:max-content"><span style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:7px;background:#ffffff14;color:#fff"><img class=l src="fomo.jpg" style="width:14px;height:14px">@fomo</span><span class=t2 style="display:flex;align-items:center;gap:6px;padding:6px 10px"><img class=l src="pumpfun.jpg" style="width:14px;height:14px">@Pumpfun</span></div>
   <div style="display:flex;align-items:center;gap:12px;margin-top:12px;padding:10px;border-radius:10px;background:#ffffff06">{av(0,40)}<div><div style="font:600 14px Inter;color:#fff">Alice <span style="color:#7cf3ff">✓</span></div><div class=t3 style="font:500 12px Inter">@alice · fees → 0x8f3a…21cd</div></div><span style="margin-left:auto;padding:6px 10px;border-radius:7px;background:#2fe39a22;color:{G};font:600 12px Inter">Detected</span></div></div>""","1 / 4","1")}
 {bento(f"""<div style="font:600 22px Inter;color:#fff">Two chains. One click.</div><div class=t2 style="font:400 15px/1.5 Inter;margin-top:8px">Pons v2 on Robinhood, or Pump.fun on Solana.</div>
  <div style="position:absolute;left:0;right:0;bottom:44px;display:flex;justify-content:center;align-items:center;gap:26px">
   <img src="robinhood.png" style="width:92px;height:92px;border-radius:24px;box-shadow:0 20px 60px -10px #ccff0066">
   <div style="width:60px;height:2px;background:linear-gradient(90deg,#ccff00,#9945ff)"></div>
   <img src="solana.jpg" style="width:92px;height:92px;border-radius:24px;box-shadow:0 20px 60px -10px #9945ff88"></div>""","4 / 7","1")}
 {bento(f"""<div class=t2 style="font:500 14px Inter">Creator fees paid</div><div style="font:600 58px 'Inter Display';letter-spacing:-.04em;color:#fff;margin-top:6px">$94.7K</div>
  <div style="position:absolute;left:0;right:0;bottom:0">{spark(470,150,77,"#a77bff")}</div>""","1 / 3","2")}
 {bento(f"""<div class=t2 style="font:500 14px Inter">Profiles minted</div><div style="font:600 58px 'Inter Display';letter-spacing:-.04em;color:#fff;margin-top:6px">1,284</div>
  <div style="position:absolute;left:34px;bottom:34px;display:flex">{"".join(f'<div style="margin-left:{0 if k==0 else -14}px;border:3px solid #0b0c0e;border-radius:50%">{av(k,52)}</div>' for k in range(7))}</div>""","3 / 5","2")}
 {bento(f"""<div class=t2 style="font:500 14px Inter">Non-custodial</div><div style="font:600 30px/1.15 'Inter Display';letter-spacing:-.03em;color:#fff;margin-top:8px">Your keys.<br>Your coin.</div>
  <svg width="120" height="120" viewBox="0 0 120 120" style="position:absolute;right:30px;bottom:26px"><defs><linearGradient id="sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#5c616b"/></linearGradient></defs><path d="M60 10 L100 26 V58 C100 84 82 102 60 110 C38 102 20 84 20 58 V26Z" fill="none" stroke="url(#sh)" stroke-width="3"/><path d="M42 60 L55 73 L80 46" fill="none" stroke="{G}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>""","5 / 7","2")}
 </div></div>

<!-- markets table -->
<div style="position:relative;z-index:5;margin:120px 64px 0">
 <div style="display:flex;justify-content:space-between;align-items:end">
  <div><div style="font:600 44px 'Inter Display';letter-spacing:-.04em;color:#fff">Top markets</div><div class=t2 style="font:400 16px Inter;margin-top:8px">Live profile coins across Robinhood and Solana.</div></div>
  <div style="display:flex;gap:4px;padding:4px;border-radius:11px;background:#ffffff08;border:1px solid #ffffff0f;font:600 13px Inter" class=t2><span style="padding:8px 14px;border-radius:8px;background:#ffffff12;color:#fff">All</span><span style="padding:8px 14px;display:flex;align-items:center;gap:6px"><img class=l src="robinhood.png" style="width:15px;height:15px">Robinhood</span><span style="padding:8px 14px;display:flex;align-items:center;gap:6px"><img class=l src="solana.jpg" style="width:15px;height:15px">Solana</span></div></div>
 <div style="margin-top:28px;display:grid;grid-template-columns:40px 1.6fr 1fr 1fr 1fr 150px 110px;padding:0 8px 12px;font:500 12px Inter;letter-spacing:.04em" class=t3><span>#</span><span>PROFILE</span><span>CHAIN</span><span>MARKET CAP</span><span>24H</span><span>7D</span><span></span></div>
 {"".join(mkt(i) for i in range(6))}</div>

<!-- final CTA -->
<div style="position:relative;z-index:5;margin:130px 64px 0;border-radius:28px;border:1px solid #ffffff12;padding:80px 0;text-align:center;overflow:hidden;background:radial-gradient(ellipse at 50% 120%,#5d6bff40,transparent 60%),#0b0c0e">
 <div style="font:600 64px/1.02 'Inter Display';letter-spacing:-.045em;background:linear-gradient(180deg,#fff 40%,#ffffff80);-webkit-background-clip:text;color:transparent">Mint your profile<br>in under a minute.</div>
 <div style="display:flex;justify-content:center;gap:12px;margin-top:36px">
  <span style="display:flex;align-items:center;gap:10px;padding:14px 22px;border-radius:11px;background:#fff;color:#08090a;font:600 15px Inter"><img class=l src="robinhood.png" style="width:20px;height:20px">Launch on Robinhood</span>
  <span style="display:flex;align-items:center;gap:10px;padding:14px 22px;border-radius:11px;background:#ffffff0c;border:1px solid #ffffff1a;color:#fff;font:600 15px Inter"><img class=l src="solana.jpg" style="width:20px;height:20px">Launch on Solana</span></div></div>
</div>'''
open("v3.html","w").write(f"<!doctype html><html><head><meta charset=utf-8><style>{css}</style></head><body>{P}</body></html>")
