# Generates 4 NOIR homepage mockups into web.html
coins = [("Alice","ALICE","solana","fomo","$84.2K","+212%"),("degen.eth","DEGEN","robinhood","fomo","$41.9K","+96%"),("satoshi","SATO","solana","pumpfun","$27.4K","+64%"),
         ("moonboy","MOON","robinhood","fomo","$12.1K","+31%"),("vibes","VIBE","solana","pumpfun","$8.7K","+18%"),("whale","WHALE","robinhood","fomo","$5.3K","+9%")]
logo = {"solana":"solana.jpg","robinhood":"robinhood.png","fomo":"fomo.jpg","pumpfun":"pumpfun.jpg"}
grads = ["#8fd3ff,#c79bff","#ff9ad5,#ffcf8f","#14f195,#9945ff","#ffd36e,#ff6e9c","#6ee7ff,#6e8bff","#c6ff6e,#26c6a0"]

def cards(style):
    out=[]
    for i,(n,t,ch,src,mc,ch24) in enumerate(coins):
        out.append(style(i,n,t,ch,src,mc,ch24))
    return "\n".join(out)

css = """
*{margin:0;box-sizing:border-box}body{background:#000}
.page{width:1440px;padding-bottom:90px;position:relative;overflow:hidden;font-family:Inter,sans-serif}
img.l{border-radius:50%;object-fit:cover}
"""

# ── A: Noir Holo ──
def holo_card(i,n,t,ch,src,mc,c):
    return f"""<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:22px;backdrop-filter:blur(10px)">
 <div style="display:flex;align-items:center;gap:14px"><div style="width:58px;height:58px;border-radius:16px;background:linear-gradient(135deg,{grads[i]});display:flex;align-items:center;justify-content:center;font:800 22px 'Inter Display';color:#0a0a12">{t[0]}</div>
 <div style="flex:1"><div style="font:700 18px Inter;color:#fff">{n}</div><div style="font:600 13px 'JetBrains Mono';color:#b9a8ff">${t}</div></div>
 <img class=l src="{logo[ch]}" style="width:26px;height:26px"></div>
 <div style="display:flex;justify-content:space-between;margin-top:18px;font:500 13px Inter;color:rgba(255,255,255,.5)"><span style="display:flex;align-items:center;gap:6px"><img class=l src="{logo[src]}" style="width:16px;height:16px">@{n.lower()}</span><span>MC <b style="color:#fff">{mc}</b> <b style="color:#7dffb5">{c}</b></span></div></div>"""
A = f"""<div class=page id=p1 style="background:radial-gradient(ellipse 900px 600px at 70% 10%,#2a1f5c 0%,transparent 60%),radial-gradient(ellipse 700px 500px at 10% 30%,#3b1440 0%,transparent 60%),#06060b">
<div style="display:flex;align-items:center;justify-content:space-between;padding:28px 72px">
 <div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#8fd3ff,#c79bff,#ff9ad5);display:flex;align-items:center;justify-content:center;font:900 22px 'Inter Display';color:#06060b">N</div><span style="font:900 24px 'Inter Display';letter-spacing:.12em;color:#fff">NOIR</span></div>
 <div style="display:flex;gap:6px;padding:6px;border:1px solid rgba(255,255,255,.1);border-radius:99px;background:rgba(255,255,255,.04);font:600 15px Inter">
  <span style="padding:10px 20px;border-radius:99px;background:#fff;color:#000">Home</span><span style="padding:10px 18px;color:#c9c3ff">Explore</span><span style="padding:10px 18px;color:#c9c3ff">Leaderboard</span><span style="padding:10px 18px;color:#c9c3ff">Launch</span><span style="padding:10px 18px;color:#c9c3ff">Profile</span></div>
 <div style="display:flex;gap:10px"><span style="padding:12px 20px;border-radius:99px;border:1px solid rgba(255,255,255,.15);color:#fff;font:600 15px Inter">Connect</span><span style="padding:12px 20px;border-radius:99px;background:linear-gradient(90deg,#8fd3ff,#c79bff,#ff9ad5);color:#06060b;font:700 15px Inter">Connect SOL</span></div></div>
<div style="text-align:center;padding-top:90px">
 <div style="display:inline-flex;gap:8px;align-items:center;padding:8px 16px;border-radius:99px;border:1px solid rgba(255,255,255,.12);font:600 13px Inter;letter-spacing:.2em;color:#b9b3e8"><span style="width:8px;height:8px;border-radius:50%;background:#7dffb5;box-shadow:0 0 10px #7dffb5"></span>LIVE ON ROBINHOOD &amp; SOLANA</div>
 <h1 style="margin-top:30px;font:900 88px/1.04 'Inter Display';letter-spacing:-.03em;color:#fff">Tokenize your<br><span style="background:linear-gradient(90deg,#8fd3ff,#c79bff 50%,#ff9ad5);-webkit-background-clip:text;color:transparent">@fomo</span> <span style="font-family:Inter;font-weight:700">&amp;</span> <span style="background:linear-gradient(90deg,#c79bff,#ff9ad5);-webkit-background-clip:text;color:transparent">@Pumpfun</span> profile.</h1>
 <p style="margin:28px auto 0;max-width:640px;font:400 20px/1.6 Inter;color:rgba(255,255,255,.6)">Detect your profile, mint your coin, launch on a bonding curve. Non-custodial: your wallet signs every transaction.</p>
 <div style="display:flex;gap:16px;justify-content:center;margin-top:40px">
  <span style="display:flex;align-items:center;gap:10px;padding:18px 30px;border-radius:99px;background:linear-gradient(90deg,#8fd3ff,#c79bff,#ff9ad5);font:700 17px Inter;color:#06060b;box-shadow:0 20px 60px -15px rgba(199,155,255,.7)"><img class=l src="robinhood.png" style="width:24px;height:24px">Launch on Robinhood</span>
  <span style="display:flex;align-items:center;gap:10px;padding:18px 30px;border-radius:99px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);font:700 17px Inter;color:#fff"><img class=l src="solana.jpg" style="width:24px;height:24px">Launch on Solana</span></div></div>
<div style="display:flex;justify-content:center;gap:60px;margin-top:70px;font:500 15px Inter;color:rgba(255,255,255,.5)">
 <div style="text-align:center"><div style="font:800 34px 'Inter Display';color:#fff">1,284</div>profiles minted</div><div style="text-align:center"><div style="font:800 34px 'Inter Display';color:#fff">$3.1M</div>total volume</div><div style="text-align:center"><div style="font:800 34px 'Inter Display';color:#fff">2</div>chains</div></div>
<div style="padding:70px 72px 0"><div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:22px"><h2 style="font:800 30px 'Inter Display';color:#fff">Trending profiles</h2><span style="font:600 15px Inter;color:#c79bff">View all →</span></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">{cards(holo_card)}</div></div></div>"""

# ── B: Noir Luxe ──
def luxe_card(i,n,t,ch,src,mc,c):
    return f"""<div style="border-top:1px solid #3a3322;padding:26px 0;display:flex;align-items:center;gap:22px">
 <span style="font:italic 400 22px Caladea;color:#8a7a55;width:34px">{i+1:02d}</span>
 <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f6e7c1,#8a6d3b);display:flex;align-items:center;justify-content:center;font:400 24px Caladea;color:#120f08">{t[0]}</div>
 <div style="flex:1"><div style="font:400 26px Caladea;color:#f4ead2">{n}</div><div style="font:500 12px Inter;letter-spacing:.2em;color:#8a7a55;margin-top:4px">${t} · @{n.lower()}</div></div>
 <img class=l src="{logo[ch]}" style="width:24px;height:24px;filter:grayscale(.3)">
 <div style="text-align:right;width:150px"><div style="font:400 24px Caladea;color:#f4ead2">{mc}</div><div style="font:500 13px Inter;color:#cdb98d">{c}</div></div></div>"""
B = f"""<div class=page id=p2 style="background:#080706">
<div style="display:flex;align-items:center;justify-content:space-between;padding:34px 80px;border-bottom:1px solid #2a2418">
 <span style="font:400 30px Caladea;letter-spacing:.35em;color:#e9d7a8">NOIR</span>
 <div style="display:flex;gap:44px;font:500 14px Inter;letter-spacing:.18em;color:#a8987a"><span style="color:#f4ead2">HOME</span><span>EXPLORE</span><span>LEADERBOARD</span><span>LAUNCH</span><span>PROFILE</span></div>
 <span style="padding:13px 26px;border:1px solid #cdb98d;color:#e9d7a8;font:500 14px Inter;letter-spacing:.18em">CONNECT</span></div>
<div style="display:grid;grid-template-columns:1.15fr .85fr;gap:60px;padding:100px 80px 0">
 <div><div style="font:500 13px Inter;letter-spacing:.35em;color:#8a7a55">— THE PROFILE MINT</div>
 <h1 style="margin-top:28px;font:400 92px/1.04 Caladea;color:#f4ead2">Tokenize your<br><i style="color:#e2c98f">@fomo</i> &amp; <i style="color:#e2c98f">@Pumpfun</i><br>profile.</h1>
 <p style="margin-top:30px;max-width:520px;font:400 19px/1.7 Inter;color:#a8987a">Your name, your avatar, your lore — minted as a coin on Robinhood Chain or Solana. Elegant, simple, non-custodial.</p>
 <div style="display:flex;gap:16px;margin-top:44px"><span style="display:flex;align-items:center;gap:10px;padding:18px 30px;background:linear-gradient(180deg,#f6e7c1,#c9a866);color:#120f08;font:600 15px Inter;letter-spacing:.12em"><img class=l src="robinhood.png" style="width:22px;height:22px">LAUNCH ON ROBINHOOD</span><span style="display:flex;align-items:center;gap:10px;padding:18px 30px;border:1px solid #cdb98d;color:#e9d7a8;font:600 15px Inter;letter-spacing:.12em"><img class=l src="solana.jpg" style="width:22px;height:22px">LAUNCH ON SOLANA</span></div></div>
 <div style="position:relative;height:480px;border:1px solid #3a3322;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%,#2a2214,#080706 70%)">
  <div style="width:250px;height:340px;border:1px solid #cdb98d;padding:22px;background:#0e0c09;box-shadow:0 40px 90px -20px rgba(226,201,143,.25)">
   <div style="height:190px;background:linear-gradient(135deg,#f6e7c1,#8a6d3b);display:flex;align-items:center;justify-content:center;font:400 96px Caladea;color:#120f08">A</div>
   <div style="margin-top:16px;font:400 26px Caladea;color:#f4ead2">Alice</div><div style="font:500 12px Inter;letter-spacing:.2em;color:#8a7a55;margin-top:4px">$ALICE · MINTED</div>
   <div style="margin-top:14px;display:flex;justify-content:space-between;font:500 13px Inter;color:#cdb98d"><span>MC $84.2K</span><span>+212%</span></div></div>
  <span style="position:absolute;bottom:18px;font:italic 400 16px Caladea;color:#8a7a55">your profile, minted</span></div></div>
<div style="padding:90px 80px 0"><div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:10px"><h2 style="font:400 40px Caladea;color:#f4ead2">The Collection</h2><span style="font:500 13px Inter;letter-spacing:.2em;color:#cdb98d">VIEW ALL →</span></div>
{cards(luxe_card)}</div></div>"""

# ── C: Noir Split (mono / brutalist) ──
def split_card(i,n,t,ch,src,mc,c):
    dark = i%2==0
    bg,fg,sub = ("#000","#fff","#888") if dark else ("#fff","#000","#666")
    return f"""<div style="background:{bg};color:{fg};border:2px solid #000;padding:26px;height:200px;display:flex;flex-direction:column;justify-content:space-between">
 <div style="display:flex;justify-content:space-between;align-items:start"><div><div style="font:900 34px 'Inter Display';letter-spacing:-.02em">${t}</div><div style="font:600 14px 'JetBrains Mono';color:{sub};margin-top:6px">@{n.lower()}</div></div><img class=l src="{logo[ch]}" style="width:30px;height:30px;filter:grayscale(1)"></div>
 <div style="display:flex;justify-content:space-between;font:700 16px 'JetBrains Mono'"><span>MC {mc}</span><span>{c}</span></div></div>"""
C = f"""<div class=page id=p3 style="background:#fff">
<div style="display:grid;grid-template-columns:1fr 1fr;height:760px">
 <div style="background:#000;color:#fff;padding:34px 64px;display:flex;flex-direction:column">
  <div style="display:flex;justify-content:space-between;align-items:center"><span style="font:900 28px 'Inter Display';letter-spacing:-.02em">NOIR.</span><div style="display:flex;gap:26px;font:600 15px 'JetBrains Mono'"><span style="text-decoration:underline">HOME</span><span>EXPLORE</span><span>RANKS</span></div></div>
  <div style="margin-top:auto;margin-bottom:auto"><div style="font:700 15px 'JetBrains Mono';color:#888">[01] SOURCE</div>
  <div style="font:900 150px/.9 'Inter Display';letter-spacing:-.05em;margin-top:18px">@FOMO</div>
  <p style="margin-top:26px;font:500 19px/1.6 Inter;color:#aaa;max-width:440px">Mint your fomo.family profile on Pons v2. Creator fees route to your profile wallet.</p>
  <span style="display:inline-flex;align-items:center;gap:10px;margin-top:34px;padding:18px 28px;background:#fff;color:#000;font:800 16px 'JetBrains Mono'"><img class=l src="robinhood.png" style="width:22px;height:22px">LAUNCH ON ROBINHOOD →</span></div></div>
 <div style="background:#fff;color:#000;padding:34px 64px;display:flex;flex-direction:column">
  <div style="display:flex;justify-content:flex-end;gap:12px;font:700 15px 'JetBrains Mono'"><span style="padding:12px 18px;border:2px solid #000">CONNECT</span><span style="padding:12px 18px;background:#000;color:#fff">CONNECT SOL</span></div>
  <div style="margin-top:auto;margin-bottom:auto"><div style="font:700 15px 'JetBrains Mono';color:#888">[02] SOURCE</div>
  <div style="font:900 150px/.9 'Inter Display';letter-spacing:-.05em;margin-top:18px">@PUMP</div>
  <p style="margin-top:26px;font:500 19px/1.6 Inter;color:#555;max-width:440px">Mint your Pump.fun profile straight onto the Pump.fun curve on Solana.</p>
  <span style="display:inline-flex;align-items:center;gap:10px;margin-top:34px;padding:18px 28px;background:#000;color:#fff;font:800 16px 'JetBrains Mono'"><img class=l src="solana.jpg" style="width:22px;height:22px">LAUNCH ON SOLANA →</span></div></div></div>
<div style="background:#000;color:#fff;font:800 22px 'JetBrains Mono';padding:16px 0;white-space:nowrap;overflow:hidden">$ALICE +212% &nbsp;■&nbsp; $DEGEN +96% &nbsp;■&nbsp; $SATO +64% &nbsp;■&nbsp; $MOON +31% &nbsp;■&nbsp; $VIBE +18% &nbsp;■&nbsp; $WHALE +9% &nbsp;■&nbsp; $ALICE +212% &nbsp;■&nbsp; $DEGEN +96%</div>
<div style="padding:54px 64px 0"><div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:24px"><h2 style="font:900 54px 'Inter Display';letter-spacing:-.03em">TOKENIZE YOUR PROFILE.</h2><span style="font:700 15px 'JetBrains Mono'">ALL →</span></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0">{cards(split_card)}</div></div></div>"""

# ── D: Noir Terminal ──
def term_card(i,n,t,ch,src,mc,c):
    return f"""<div style="border:1px solid #1f2a24;background:#0a0f0c;padding:18px 20px;font-family:'JetBrains Mono'">
 <div style="display:flex;justify-content:space-between;color:#4d6b5a;font-size:12px"><span>#{i+1:03d}</span><span style="display:flex;align-items:center;gap:6px"><img class=l src="{logo[ch]}" style="width:16px;height:16px">{ch.upper()}</span></div>
 <div style="display:flex;align-items:center;gap:14px;margin-top:12px"><div style="width:48px;height:48px;background:linear-gradient(135deg,{grads[i]});display:flex;align-items:center;justify-content:center;font:800 20px 'JetBrains Mono';color:#000">{t[0]}</div>
 <div><div style="color:#e8fff2;font:700 20px 'JetBrains Mono'">${t}</div><div style="color:#4d6b5a;font-size:13px">@{n.lower()}</div></div>
 <div style="margin-left:auto;text-align:right"><div style="color:#e8fff2;font:700 17px 'JetBrains Mono'">{mc}</div><div style="color:#14f195;font-size:14px">▲ {c}</div></div></div>
 <div style="margin-top:14px;height:6px;background:#132019"><div style="height:6px;width:{90-i*13}%;background:linear-gradient(90deg,#14f195,#9945ff)"></div></div>
 <div style="color:#4d6b5a;font-size:11px;margin-top:6px">bonding curve {90-i*13}%</div></div>"""
D = f"""<div class=page id=p4 style="background:#050807;background-image:linear-gradient(rgba(20,241,149,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(20,241,149,.05) 1px,transparent 1px);background-size:48px 48px;font-family:'JetBrains Mono'">
<div style="display:flex;align-items:center;justify-content:space-between;padding:22px 56px;border-bottom:1px solid #1f2a24;background:rgba(5,8,7,.9)">
 <span style="font:800 24px 'JetBrains Mono';background:linear-gradient(90deg,#14f195,#9945ff);-webkit-background-clip:text;color:transparent">$NOIR</span>
 <div style="display:flex;gap:30px;font:500 15px 'JetBrains Mono';color:#4d6b5a"><span style="color:#14f195">./home</span><span>./explore</span><span>./ranks</span><span>./launch</span><span>./profile</span></div>
 <div style="display:flex;gap:10px;font:700 14px 'JetBrains Mono'"><span style="padding:11px 16px;border:1px solid #14f195;color:#14f195">[connect]</span><span style="padding:11px 16px;background:#14f195;color:#000">[connect sol]</span></div></div>
<div style="display:grid;grid-template-columns:1.1fr .9fr;gap:40px;padding:80px 56px 0">
 <div><div style="color:#14f195;font-size:15px">noir@mainnet:~$ tokenize --profile</div>
 <h1 style="margin-top:22px;font:800 76px/1.08 'JetBrains Mono';color:#e8fff2;letter-spacing:-.03em">Tokenize your<br><span style="color:#14f195">@fomo</span> &amp; <span style="color:#b98aff">@Pumpfun</span><br>profile<span style="display:inline-block;width:34px;height:64px;background:#14f195;margin-left:8px;vertical-align:-8px"></span></h1>
 <p style="margin-top:26px;max-width:560px;font:400 17px/1.7 'JetBrains Mono';color:#7f9a8b">&gt; detect profile → mint coin → bonding curve<br>&gt; robinhood (pons v2) | solana (pump.fun)<br>&gt; non-custodial. your keys, your coin.</p>
 <div style="display:flex;gap:14px;margin-top:36px"><span style="display:flex;align-items:center;gap:10px;padding:17px 24px;background:#14f195;color:#000;font:800 16px 'JetBrains Mono'"><img class=l src="robinhood.png" style="width:22px;height:22px">launch --robinhood</span><span style="display:flex;align-items:center;gap:10px;padding:17px 24px;background:#9945ff;color:#fff;font:800 16px 'JetBrains Mono'"><img class=l src="solana.jpg" style="width:22px;height:22px">launch --solana</span></div></div>
 <div style="border:1px solid #1f2a24;background:#0a0f0c">
  <div style="display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid #1f2a24"><span style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></span><span style="width:12px;height:12px;border-radius:50%;background:#febc2e"></span><span style="width:12px;height:12px;border-radius:50%;background:#28c840"></span><span style="margin-left:10px;color:#4d6b5a;font-size:13px">live_launches.log</span></div>
  <div style="padding:18px 20px;font:500 14px/2 'JetBrains Mono';color:#7f9a8b">
   <div><span style="color:#4d6b5a">12:04:11</span> <span style="color:#14f195">MINT</span> $ALICE  solana   @alice</div>
   <div><span style="color:#4d6b5a">12:03:52</span> <span style="color:#b98aff">BUY </span> $DEGEN  0.42 ETH</div>
   <div><span style="color:#4d6b5a">12:03:40</span> <span style="color:#14f195">MINT</span> $SATO   solana   @satoshi</div>
   <div><span style="color:#4d6b5a">12:03:18</span> <span style="color:#b98aff">BUY </span> $MOON   1.20 SOL</div>
   <div><span style="color:#4d6b5a">12:02:57</span> <span style="color:#ffcf6e">GRAD</span> $VIBE   → pumpswap</div>
   <div><span style="color:#4d6b5a">12:02:31</span> <span style="color:#14f195">MINT</span> $WHALE  robinhood @whale</div>
   <div><span style="color:#4d6b5a">12:02:09</span> <span style="color:#b98aff">BUY </span> $ALICE  3.50 SOL</div></div></div></div>
<div style="padding:70px 56px 0"><div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:20px"><h2 style="font:800 26px 'JetBrains Mono';color:#e8fff2">&gt; trending_profiles</h2><span style="color:#14f195;font-size:15px">ls --all →</span></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">{cards(term_card)}</div></div></div>"""

open("web.html","w").write(f"<!doctype html><html><head><meta charset=utf-8><style>{css}</style></head><body>{A}{B}{C}{D}</body></html>")
