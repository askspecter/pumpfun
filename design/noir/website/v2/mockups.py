import random, math
random.seed(7)
coins=[("Alice","ALICE","solana","fomo","84.2K","+212%"),("degen.eth","DEGEN","robinhood","fomo","41.9K","+96%"),("satoshi","SATO","solana","pumpfun","27.4K","+64%"),
       ("moonboy","MOON","robinhood","fomo","12.1K","+31%"),("vibes","VIBE","solana","pumpfun","8.7K","+18%"),("whale","WHALE","robinhood","fomo","5.3K","+9%")]
logo={"solana":"solana.jpg","robinhood":"robinhood.png","fomo":"fomo.jpg","pumpfun":"pumpfun.jpg"}
pal=[("#7cf3ff","#a77bff","#ff6fd8"),("#ffb36b","#ff5f9e","#7a5cff"),("#3dffb0","#00b3ff","#7b3fff"),("#fff27a","#ff8a5c","#ff3d7f"),("#9cf","#69f","#c6f"),("#b6ff6b","#2fd6a0","#1e7bff")]

def avatar(i,size,rad="50%"):
    a,b,c=pal[i]
    return f'''<div style="width:{size}px;height:{size}px;border-radius:{rad};position:relative;overflow:hidden;flex-shrink:0;background:{c}">
<div style="position:absolute;inset:-30%;background:radial-gradient(circle at 30% 30%,{a} 0%,transparent 45%),radial-gradient(circle at 75% 70%,{b} 0%,transparent 50%),radial-gradient(circle at 70% 20%,#fff8 0%,transparent 20%)"></div>
<svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%"><circle cx="50" cy="40" r="17" fill="#0006"/><path d="M18 100 C20 72 80 72 82 100Z" fill="#0006"/></svg></div>'''

def spark(w,h,up=True,seed=0,color="#7dffb5"):
    random.seed(seed); pts=[]; y=h*0.75
    for k in range(24):
        y+= random.uniform(-h*.12,h*.08) if up else random.uniform(-h*.08,h*.12)
        y=max(4,min(h-4,y)); pts.append((k*w/23,y))
    d="M"+" L".join(f"{x:.1f} {y:.1f}" for x,y in pts)
    gid=f"sg{seed}"
    return f'''<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{color}" stop-opacity=".35"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></linearGradient></defs>
<path d="{d} L{w} {h} L0 {h}Z" fill="url(#{gid})"/><path d="{d}" fill="none" stroke="{color}" stroke-width="2.2" stroke-linejoin="round"/></svg>'''

grain='''<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:.09;mix-blend-mode:overlay;pointer-events:none;z-index:50"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'''

css='''*{margin:0;box-sizing:border-box}body{background:#000}
.page{width:1440px;position:relative;overflow:hidden;font-family:Inter,sans-serif}
img.l{border-radius:50%;object-fit:cover;flex-shrink:0}
.mono{font-family:'JetBrains Mono',monospace}
'''

# ═════════ 1. OBSIDIAN ═════════
def ob_float(i,x,y,rot,scale,z):
    n,t,ch,src,mc,c=coins[i]
    return f'''<div style="position:absolute;left:{x}px;top:{y}px;width:300px;transform:perspective(1200px) rotateY({rot}deg) rotateX(8deg) scale({scale});z-index:{z};
 border-radius:26px;padding:20px;background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.18);
 box-shadow:0 40px 80px -20px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.04) inset,0 30px 120px -40px {pal[i][1]};backdrop-filter:blur(18px)">
 <div style="display:flex;align-items:center;gap:12px">{avatar(i,52)}<div style="flex:1"><div style="font:700 18px Inter;color:#fff">{n}</div><div class=mono style="font-size:13px;color:{pal[i][0]}">${t}</div></div><img class=l src="{logo[ch]}" style="width:24px;height:24px"></div>
 <div style="margin-top:14px">{spark(258,64,True,i+1,pal[i][0])}</div>
 <div style="display:flex;justify-content:space-between;margin-top:6px;font:600 14px Inter;color:rgba(255,255,255,.55)"><span>MC <b style="color:#fff">${mc}</b></span><b style="color:#5dffa8">{c}</b></div></div>'''

def ob_row(i):
    n,t,ch,src,mc,c=coins[i]
    return f'''<div style="display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)">
 <span class=mono style="color:rgba(255,255,255,.3);width:24px;font-size:14px">{i+1:02d}</span>{avatar(i,44)}
 <div style="flex:1"><div style="font:700 17px Inter;color:#fff;display:flex;align-items:center;gap:8px">{n}<img class=l src="{logo[src]}" style="width:16px;height:16px;opacity:.9"></div><div class=mono style="font-size:12px;color:rgba(255,255,255,.4)">${t}</div></div>
 {spark(120,34,True,i+11,pal[i][0])}
 <div style="text-align:right;width:110px"><div style="font:700 17px Inter;color:#fff">${mc}</div><div style="font:600 13px Inter;color:#5dffa8">{c}</div></div>
 <img class=l src="{logo[ch]}" style="width:26px;height:26px"></div>'''

P1=f'''<div class=page id=p1 style="background:#030305;padding-bottom:100px">{grain}
<div style="position:absolute;width:900px;height:900px;left:620px;top:-200px;border-radius:50%;background:radial-gradient(circle,#5b3dff55,transparent 60%);filter:blur(40px)"></div>
<div style="position:absolute;width:700px;height:700px;left:-200px;top:300px;border-radius:50%;background:radial-gradient(circle,#ff3da855,transparent 60%);filter:blur(50px)"></div>
<div style="position:absolute;width:600px;height:600px;left:900px;top:450px;border-radius:50%;background:radial-gradient(circle,#00e1ff40,transparent 60%);filter:blur(50px)"></div>


<div style="position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;margin:24px 40px 0;padding:12px 14px 12px 22px;border-radius:22px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(20px)">
 <div style="display:flex;align-items:center;gap:12px"><div style="width:36px;height:36px;border-radius:11px;background:conic-gradient(from 200deg,#7cf3ff,#a77bff,#ff6fd8,#7cf3ff);display:flex;align-items:center;justify-content:center"><div style="width:30px;height:30px;border-radius:9px;background:#050507;display:flex;align-items:center;justify-content:center;font:900 17px 'Inter Display';color:#fff">N</div></div><span style="font:800 21px 'Inter Display';letter-spacing:.18em;color:#fff">NOIR</span></div>
 <div style="display:flex;gap:4px;font:500 15px Inter;color:rgba(255,255,255,.6)"><span style="padding:9px 16px;border-radius:12px;background:rgba(255,255,255,.08);color:#fff">Home</span><span style="padding:9px 16px">Explore</span><span style="padding:9px 16px">Leaderboard</span><span style="padding:9px 16px">Launch</span><span style="padding:9px 16px">Profile</span></div>
 <div style="display:flex;gap:8px"><span style="display:flex;align-items:center;gap:8px;padding:11px 16px;border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font:600 14px Inter"><img class=l src="robinhood.png" style="width:18px;height:18px">Connect</span><span style="display:flex;align-items:center;gap:8px;padding:11px 16px;border-radius:13px;background:#fff;color:#000;font:700 14px Inter"><img class=l src="solana.jpg" style="width:18px;height:18px">Connect SOL</span></div></div>

<div style="position:relative;z-index:5;display:grid;grid-template-columns:1.05fr .95fr;padding:96px 72px 0">
 <div>
  <div style="display:inline-flex;align-items:center;gap:10px;padding:7px 14px 7px 8px;border-radius:99px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);font:500 14px Inter;color:rgba(255,255,255,.75)"><span style="padding:3px 9px;border-radius:99px;background:linear-gradient(90deg,#7cf3ff,#ff6fd8);color:#000;font:700 12px Inter">NEW</span>Solana launches via Pump.fun are live →</div>
  <h1 style="margin-top:28px;font:800 96px/.98 'Inter Display';letter-spacing:-.045em;color:#fff">Your profile.<br><span style="background:linear-gradient(95deg,#7cf3ff 0%,#a77bff 45%,#ff6fd8 100%);-webkit-background-clip:text;color:transparent">Now a coin.</span></h1>
  <p style="margin-top:28px;max-width:500px;font:400 20px/1.55 Inter;color:rgba(255,255,255,.6)">Tokenize your <b style="color:#fff">@fomo</b> &amp; <b style="color:#fff">@Pumpfun</b> profile in one click. Launch on Robinhood Chain or Solana — your wallet signs, nobody custodies.</p>
  <div style="display:flex;gap:14px;margin-top:40px">
   <span style="display:flex;align-items:center;gap:12px;padding:8px 26px 8px 8px;border-radius:18px;background:#fff;color:#000;font:700 17px Inter;box-shadow:0 20px 60px -10px rgba(167,123,255,.6)"><span style="width:44px;height:44px;border-radius:12px;background:#ccff00;display:flex;align-items:center;justify-content:center"><img src="robinhood.png" style="width:44px;height:44px;border-radius:12px"></span>Launch on Robinhood</span>
   <span style="display:flex;align-items:center;gap:12px;padding:8px 26px 8px 8px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);color:#fff;font:700 17px Inter"><img src="solana.jpg" style="width:44px;height:44px;border-radius:12px">Launch on Solana</span></div>
  <div style="display:flex;align-items:center;gap:14px;margin-top:40px">
   <div style="display:flex">{"".join(f'<div style="margin-left:{0 if k==0 else -12}px;border:3px solid #030305;border-radius:50%">{avatar(k,38)}</div>' for k in range(5))}</div>
   <div style="font:500 15px Inter;color:rgba(255,255,255,.55)"><b style="color:#fff">1,284 profiles</b> already minted<br>$3.1M traded this month</div></div>
 </div>
 <div style="position:relative;height:560px">
  {ob_float(2,250,40,-14,.92,1)}{ob_float(1,10,140,12,.96,2)}{ob_float(0,170,270,-6,1.08,3)}
  <div style="position:absolute;left:20px;top:470px;z-index:4;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:16px;background:rgba(10,10,14,.85);border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 50px -10px #000;font:600 14px Inter;color:#fff"><span style="width:10px;height:10px;border-radius:50%;background:#5dffa8;box-shadow:0 0 12px #5dffa8"></span>@satoshi just minted <span class=mono style="color:#7cf3ff">$SATO</span></div>
 </div></div>

<div style="position:relative;z-index:5;margin:80px 72px 0;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
 {"".join(f'<div style="padding:24px;border-radius:22px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)"><div style="font:500 14px Inter;color:rgba(255,255,255,.5)">{a}</div><div style="margin-top:8px;font:800 38px Inter Display;letter-spacing:-.03em;color:#fff">{b}</div><div style="margin-top:10px">{spark(260,40,True,30+k,cc)}</div></div>' for k,(a,b,cc) in enumerate([("Profiles minted","1,284","#7cf3ff"),("Volume (30d)","$3.1M","#a77bff"),("Creator fees paid","$94.7K","#ff6fd8"),("Graduated","37","#5dffa8")]))}
</div>

<div style="position:relative;z-index:5;margin:72px 72px 0">
 <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px"><h2 style="font:800 36px 'Inter Display';letter-spacing:-.03em;color:#fff">Trending profiles</h2>
 <div style="display:flex;gap:6px;padding:5px;border-radius:14px;background:rgba(255,255,255,.04);font:600 14px Inter;color:rgba(255,255,255,.55)"><span style="padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.1);color:#fff">All</span><span style="padding:8px 14px;display:flex;gap:6px;align-items:center"><img class=l src="robinhood.png" style="width:16px;height:16px">Robinhood</span><span style="padding:8px 14px;display:flex;gap:6px;align-items:center"><img class=l src="solana.jpg" style="width:16px;height:16px">Solana</span></div></div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">{"".join(ob_row(i) for i in range(6))}</div></div></div>'''

# ═════════ 2. CHROME ═════════
chrome="background:linear-gradient(180deg,#ffffff 0%,#d9dde6 28%,#7d8496 50%,#f3f5fa 52%,#a9b0c2 75%,#eef1f7 100%);-webkit-background-clip:text;color:transparent"
def coin3d(size,letter,i):
    a,b,c=pal[i]
    return f'''<div style="width:{size}px;height:{size}px;border-radius:50%;position:relative;background:conic-gradient(from 120deg,#f5f7fb,#8d95a8,#ffffff,#5d6475,#e8ebf2,#9aa2b4,#f5f7fb);box-shadow:0 50px 100px -20px rgba(0,0,0,.9),0 0 120px -10px {b}88">
 <div style="position:absolute;inset:{size*.06}px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#2a2d36,#07080b 70%);box-shadow:inset 0 0 0 2px #ffffff22,inset 0 20px 40px #ffffff10"></div>
 <div style="position:absolute;inset:{size*.13}px;border-radius:50%;border:1px dashed #ffffff30"></div>
 <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 {size*.48}px 'Inter Display';{chrome}">{letter}</div>
 <div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(130deg,#ffffff40 0%,transparent 35%)"></div></div>'''
def ch_card(i):
    n,t,ch,src,mc,c=coins[i]
    return f'''<div style="border-radius:28px;padding:1px;background:linear-gradient(140deg,#ffffff55,#ffffff08 40%,{pal[i][1]}66)">
 <div style="border-radius:27px;padding:24px;background:linear-gradient(180deg,#121319,#08090c);height:100%">
  <div style="display:flex;justify-content:space-between;align-items:center"><img class=l src="{logo[ch]}" style="width:26px;height:26px"><span class=mono style="font-size:12px;padding:5px 10px;border-radius:99px;background:#ffffff0c;color:#9aa2b4">@{n.lower()}</span></div>
  <div style="display:flex;justify-content:center;margin:22px 0">{avatar(i,96)}</div>
  <div style="text-align:center;font:800 26px 'Inter Display';letter-spacing:-.02em;{chrome}">${t}</div>
  <div style="text-align:center;font:500 14px Inter;color:#6f7686;margin-top:4px">{n}</div>
  <div style="margin-top:18px">{spark(250,48,True,40+i,pal[i][0])}</div>
  <div style="display:flex;justify-content:space-between;margin-top:10px;font:600 14px Inter;color:#9aa2b4"><span>MC <b style="color:#fff">${mc}</b></span><b style="color:#5dffa8">{c}</b></div></div></div>'''
P2=f'''<div class=page id=p2 style="background:radial-gradient(ellipse 1200px 700px at 50% 0%,#1b1d26 0%,#050506 60%);padding-bottom:100px">{grain}
<div style="position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:30px 72px">
 <span style="font:900 30px 'Inter Display';letter-spacing:.3em;{chrome}">NOIR</span>
 <div style="display:flex;gap:38px;font:500 15px Inter;color:#8a91a3"><span style="color:#fff">Home</span><span>Explore</span><span>Leaderboard</span><span>Launch</span><span>Profile</span></div>
 <div style="display:flex;gap:10px"><span style="padding:12px 20px;border-radius:99px;border:1px solid #ffffff25;color:#fff;font:600 14px Inter">Connect</span><span style="padding:12px 20px;border-radius:99px;background:linear-gradient(180deg,#fff,#c9ced9);color:#000;font:700 14px Inter;box-shadow:0 0 0 1px #fff inset,0 10px 30px -8px #fff6">Connect SOL</span></div></div>
<div style="position:relative;z-index:5;text-align:center;padding-top:70px">
 <div style="display:flex;justify-content:center;gap:-20px;position:relative;height:300px">
  <div style="position:absolute;left:300px;top:80px;transform:rotate(-18deg) scale(.7);opacity:.9">{coin3d(220,"F",0)}</div>
  <div style="position:absolute;left:600px;top:0">{coin3d(260,"N",1)}</div>
  <div style="position:absolute;left:920px;top:80px;transform:rotate(18deg) scale(.7);opacity:.9">{coin3d(220,"P",2)}</div></div>
 <h1 style="margin-top:50px;font:900 128px/.92 'Inter Display';letter-spacing:-.055em;{chrome}">MINT YOURSELF</h1>
 <p style="margin:28px auto 0;max-width:620px;font:400 21px/1.55 Inter;color:#8a91a3">Tokenize your <span style="color:#fff">@fomo</span> &amp; <span style="color:#fff">@Pumpfun</span> profile. One click to a bonding curve on Robinhood or Solana.</p>
 <div style="display:flex;justify-content:center;gap:14px;margin-top:40px">
  <span style="display:flex;align-items:center;gap:12px;padding:17px 30px;border-radius:99px;background:linear-gradient(180deg,#fff,#c3c8d4);color:#000;font:700 17px Inter;box-shadow:0 0 0 1px #fff inset,0 20px 60px -15px #ffffff90"><img class=l src="robinhood.png" style="width:26px;height:26px">Launch on Robinhood</span>
  <span style="display:flex;align-items:center;gap:12px;padding:17px 30px;border-radius:99px;background:#ffffff08;border:1px solid #ffffff30;color:#fff;font:700 17px Inter"><img class=l src="solana.jpg" style="width:26px;height:26px">Launch on Solana</span></div></div>
<div style="position:relative;z-index:5;margin-top:90px;border-top:1px solid #ffffff12;border-bottom:1px solid #ffffff12;padding:22px 0;white-space:nowrap;overflow:hidden;font:700 20px 'Inter Display';letter-spacing:.08em;color:#6f7686">
 {"&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;".join(f'<span style="color:#fff">${c[1]}</span> <span style="color:#5dffa8">{c[5]}</span>' for c in coins*2)}</div>
<div style="position:relative;z-index:5;padding:70px 72px 0">
 <div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:28px"><h2 style="font:900 48px 'Inter Display';letter-spacing:-.04em;{chrome}">THE VAULT</h2><span style="font:600 15px Inter;color:#8a91a3">View all profiles →</span></div>
 <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px">{"".join(ch_card(i) for i in range(4))}</div></div></div>'''

# ═════════ 3. NOIR CINEMA ═════════
def wanted(i,rot):
    n,t,ch,src,mc,c=coins[i]
    return f'''<div style="width:270px;transform:rotate({rot}deg);background:#0d0d0d;border:1px solid #2a2a2a;padding:16px;box-shadow:0 40px 80px -10px #000">
 <div style="filter:grayscale(1) contrast(1.3)">{avatar(i,238,"2px")}</div>
 <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:14px"><span style="font:900 30px 'Inter Display';letter-spacing:-.02em;color:#fff">${t}</span><span style="font:700 15px 'JetBrains Mono';color:#fff">▲ {c}</span></div>
 <div style="display:flex;justify-content:space-between;margin-top:4px;font:500 13px 'JetBrains Mono';color:#777"><span>@{n.lower()}</span><span>MC ${mc}</span></div></div>'''
def cin_row(i):
    n,t,ch,src,mc,c=coins[i]
    return f'''<div style="display:grid;grid-template-columns:70px 1fr 160px 160px 120px;align-items:center;padding:22px 0;border-top:1px solid #222">
 <span style="font:900 34px 'Inter Display';color:#333">{i+1:02d}</span>
 <div style="display:flex;align-items:center;gap:16px"><div style="filter:grayscale(1) contrast(1.2)">{avatar(i,50,"4px")}</div><div><div style="font:800 22px 'Inter Display';color:#fff">${t}</div><div class=mono style="font-size:13px;color:#666">@{n.lower()}</div></div></div>
 <div style="display:flex;align-items:center;gap:8px;font:600 14px Inter;color:#888"><img class=l src="{logo[ch]}" style="width:22px;height:22px">{"Solana" if ch=="solana" else "Robinhood"}</div>
 <div style="filter:grayscale(1) brightness(1.4)">{spark(140,36,True,60+i,"#ffffff")}</div>
 <div style="text-align:right"><div style="font:800 20px Inter;color:#fff">${mc}</div><div class=mono style="font-size:14px;color:#aaa">▲ {c}</div></div></div>'''
P3=f'''<div class=page id=p3 style="background:#000;padding-bottom:100px">{grain.replace('opacity:.09','opacity:.16')}
<div style="position:absolute;left:520px;top:-120px;width:900px;height:1100px;background:conic-gradient(from 180deg at 50% 0%,transparent 160deg,#ffffff1c 175deg,#ffffff2a 180deg,#ffffff1c 185deg,transparent 200deg);filter:blur(8px)"></div>
<div style="position:absolute;left:0;right:0;top:0;height:900px;background:repeating-linear-gradient(0deg,#ffffff03 0 2px,transparent 2px 6px)"></div>
<div style="position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:30px 64px;border-bottom:1px solid #1d1d1d">
 <div style="display:flex;align-items:center;gap:14px"><span style="width:12px;height:12px;background:#ff2e3f;border-radius:50%;box-shadow:0 0 18px #ff2e3f"></span><span style="font:900 26px 'Inter Display';letter-spacing:.42em;color:#fff">NOIR</span></div>
 <div style="display:flex;gap:40px;font:600 13px 'JetBrains Mono';letter-spacing:.2em;color:#666"><span style="color:#fff">HOME</span><span>EXPLORE</span><span>LEADERBOARD</span><span>LAUNCH</span><span>PROFILE</span></div>
 <span style="padding:13px 22px;background:#fff;color:#000;font:800 13px 'JetBrains Mono';letter-spacing:.15em">CONNECT WALLET</span></div>
<div style="position:relative;z-index:5;display:grid;grid-template-columns:1.1fr .9fr;padding:80px 64px 0">
 <div>
  <div class=mono style="font-size:14px;letter-spacing:.3em;color:#ff2e3f">● CASE FILE Nº 001 — THE PROFILE</div>
  <h1 style="margin-top:26px;font:900 120px/.88 'Inter Display';letter-spacing:-.055em;color:#fff">EVERY<br>PROFILE<br><span style="color:transparent;-webkit-text-stroke:2px #fff">HAS A</span><br>PRICE.</h1>
  <p style="margin-top:30px;max-width:470px;font:400 19px/1.6 Inter;color:#888">Tokenize your <span style="color:#fff">@fomo</span> &amp; <span style="color:#fff">@Pumpfun</span> profile. Launch on Robinhood Chain or Solana. No custody, no middleman — just you and the curve.</p>
  <div style="display:flex;gap:0;margin-top:40px">
   <span style="display:flex;align-items:center;gap:12px;padding:20px 28px;background:#fff;color:#000;font:800 15px 'JetBrains Mono';letter-spacing:.08em"><img class=l src="robinhood.png" style="width:24px;height:24px">LAUNCH · ROBINHOOD</span>
   <span style="display:flex;align-items:center;gap:12px;padding:20px 28px;border:1px solid #fff;color:#fff;font:800 15px 'JetBrains Mono';letter-spacing:.08em"><img class=l src="solana.jpg" style="width:24px;height:24px">LAUNCH · SOLANA</span></div></div>
 <div style="position:relative;height:640px">
  <div style="position:absolute;left:190px;top:10px">{wanted(1,7)}</div>
  <div style="position:absolute;left:20px;top:140px;z-index:2">{wanted(0,-6)}</div>
  <div style="position:absolute;left:250px;top:330px;z-index:3;transform:scale(.85)">{wanted(2,4)}</div>
  <div class=mono style="position:absolute;left:0;top:-30px;font-size:12px;letter-spacing:.3em;color:#555">EXHIBIT A–C · LIVE ON-CHAIN</div></div></div>
<div style="position:relative;z-index:5;margin:90px 64px 0">
 <div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:10px"><h2 style="font:900 56px 'Inter Display';letter-spacing:-.045em;color:#fff">MOST WANTED</h2><span class=mono style="font-size:13px;letter-spacing:.2em;color:#ff2e3f">VIEW ALL FILES →</span></div>
 {"".join(cin_row(i) for i in range(6))}</div></div>'''

open("v2.html","w").write(f"<!doctype html><html><head><meta charset=utf-8><style>{css}</style></head><body>{P1}{P2}{P3}</body></html>")
