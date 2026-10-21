import numpy as np, wave, sys
SR=44100; DUR=62.0; N=int(SR*DUR); t=np.arange(N)/SR
rng=np.random.default_rng(7)
out=np.zeros((N,2))
def add(sig,start,gain=1.0,pan=0.0):
    i=int(start*SR); j=min(N,i+len(sig)); 
    if i>=N: return
    l=np.sqrt(0.5*(1-pan)); r=np.sqrt(0.5*(1+pan))
    out[i:j,0]+=sig[:j-i]*gain*l; out[i:j,1]+=sig[:j-i]*gain*r
def lp(x,a):  # one-pole low-pass
    y=np.empty_like(x); acc=0.0
    for k in range(len(x)): acc+= a*(x[k]-acc); y[k]=acc
    return y
def env(n,att,rel):
    e=np.ones(n); a=int(att*SR); r=int(rel*SR)
    if a>0: e[:a]=np.linspace(0,1,a)
    if r>0: e[-r:]*=np.linspace(1,0,r)
    return e
note=lambda m: 440*2**((m-69)/12)
# ── pad: Am F C G, 5s each, soft detuned sines ──
chords=[[57,60,64],[53,57,60],[48,55,64],[55,59,62]]
for c in range(int(DUR/5)+1):
    st=c*5.0; n=int(5.6*SR); tt=np.arange(n)/SR; sig=np.zeros(n)
    for m in chords[c%4]:
        for det,amp in ((0,1),(0.07,0.5),(-0.06,0.5),(12,0.18)):
            f=note(m+det) if det==12 else note(m)*(1+det/100)
            sig+=amp*np.sin(2*np.pi*f*tt+rng.random()*6)
    sig*=env(n,1.4,1.6)*(0.6+0.4*np.sin(2*np.pi*0.2*tt))
    add(sig/9,st,0.55)
# ── sub bass + drums during the walkthrough (9 → 56.5) ──
BPM=96; beat=60/BPM
def kick():
    n=int(.32*SR); tt=np.arange(n)/SR; f=45+80*np.exp(-tt*28)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*9)
def hat():
    n=int(.07*SR); x=rng.standard_normal(n); x=x-lp(x,0.35); return x*np.exp(-np.arange(n)/SR*55)*0.35
def click():
    n=int(.05*SR); tt=np.arange(n)/SR; return (np.sin(2*np.pi*1800*tt)+0.5*np.sin(2*np.pi*3200*tt))*np.exp(-tt*90)
roots={0:45,1:41,2:36,3:43}
b=8.0
while b<50.6:
    k=int((b-8)/beat)
    level=min(1,(b-8)/2.5)
    add(kick(),b,0.55*level)
    add(hat(),b+beat/2,0.5*level,pan=0.3*((k%2)*2-1))
    if k%2==0:
        n=int(beat*2*SR); tt=np.arange(n)/SR; m=roots[int(b//5)%4]
        add(np.sin(2*np.pi*note(m)*tt)*env(n,.02,.3)*0.5,b,0.5*level)
    b+=beat
# ── transitions: whooshes (filtered noise swell) ──
def whoosh(d=1.0):
    n=int(d*SR); x=rng.standard_normal(n); x=lp(x,0.08); e=np.sin(np.pi*np.linspace(0,1,n))**2; return x*e*1.6
for w in (5.3,8.0,23.1,29.1,32.0,44.0,50.9,55.3): add(whoosh(1.0),w-0.5,0.5,pan=rng.uniform(-.4,.4))
for c in (10.0,12.55,16.0,17.9,19.7,22.8,33.2,34.3,36.3,39.1,40.85,43.75,45.8,47.4): add(click(),c,0.35)
# ── bells: logo reveal + buy confirmation + outro ──
def bell(m,d=2.5):
    n=int(d*SR); tt=np.arange(n)/SR; f=note(m)
    return (np.sin(2*np.pi*f*tt)+0.4*np.sin(2*np.pi*2.76*f*tt)+0.2*np.sin(2*np.pi*5.4*f*tt))*np.exp(-tt*2.2)
add(bell(76),0.6,0.22); add(bell(81),1.4,0.16); add(bell(88,1.4),21.2,0.12); add(bell(88,1.4),42.2,0.12); add(bell(84),55.6,0.2); add(bell(79),56.2,0.14)
# ── riser into the chain reveal, impact on it ──
n=int(2.2*SR); tt=np.arange(n)/SR; x=rng.standard_normal(n); x=x-lp(x,0.2)
add(x*np.linspace(0,1,n)**2*0.35,48.6,0.6)
add(kick()*1.4,50.9,0.9)
# ── master: fade in/out, soft clip ──
fade=np.ones(N); fade[:int(.8*SR)]=np.linspace(0,1,int(.8*SR)); fade[int(59.6*SR):]=np.linspace(1,0,N-int(59.6*SR))
out*=fade[:,None]; out=np.tanh(out*1.3)/np.tanh(1.3); out*=0.85/np.max(np.abs(out))
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype('<i2').tobytes())
print("ok")
