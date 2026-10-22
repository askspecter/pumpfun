# Soundtrack for the NOIR GitHub film (38s), synthesized and synced to film.html cues.
# Usage: python3 music.py out.wav
import numpy as np, wave, sys
SR = 44100; DUR = 38.0; N = int(SR * DUR)
rng = np.random.default_rng(31)
out = np.zeros((N, 2))

def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N or j <= i: return
    l = np.sqrt(0.5 * (1 - pan)); r = np.sqrt(0.5 * (1 + pan))
    out[i:j, 0] += sig[:j - i] * gain * l; out[i:j, 1] += sig[:j - i] * gain * r

def lp(x, a):  # one-pole low-pass (vectorised via cumulative filter on chunks)
    y = np.empty_like(x); acc = 0.0
    for k in range(len(x)): acc += a * (x[k] - acc); y[k] = acc
    return y

def env(n, att, rel):
    e = np.ones(n); a = int(att * SR); r = int(rel * SR)
    if a > 0: e[:a] = np.linspace(0, 1, a)
    if r > 0: e[-r:] *= np.linspace(1, 0, r)
    return e

note = lambda m: 440 * 2 ** ((m - 69) / 12)
tt_of = lambda d: np.arange(int(d * SR)) / SR

def pad(chord, d, amp=1.0):
    tt = tt_of(d); sig = np.zeros(len(tt))
    for m in chord:
        for det, a in ((0, 1), (0.08, 0.5), (-0.07, 0.5)):
            sig += a * np.sin(2 * np.pi * note(m) * (1 + det / 100) * tt + rng.random() * 6)
    return sig * env(len(tt), min(1.2, d / 3), min(1.4, d / 3)) / (3 * len(chord)) * amp

def kick(p=1.0):
    tt = tt_of(.4); f = 42 + 90 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 8) * p

def snare():
    tt = tt_of(.25); x = rng.standard_normal(len(tt)); x = x - lp(x, 0.25)
    return (x * 0.6 + 0.5 * np.sin(2 * np.pi * 190 * tt)) * np.exp(-tt * 16)

def hat(d=.06):
    tt = tt_of(d); x = rng.standard_normal(len(tt)); x = x - lp(x, 0.4)
    return x * np.exp(-tt * 60) * 0.35

def click(f=1800):
    tt = tt_of(.05); return (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 1.8 * tt)) * np.exp(-tt * 90)

def bell(m, d=2.5):
    tt = tt_of(d); f = note(m)
    return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * 2.76 * f * tt) + 0.2 * np.sin(2 * np.pi * 5.4 * f * tt)) * np.exp(-tt * 2.2)

def whoosh(d=1.0):
    x = rng.standard_normal(int(d * SR)); x = lp(x, 0.08); return x * np.sin(np.pi * np.linspace(0, 1, len(x))) ** 2 * 1.6

def boom(d=2.5):
    tt = tt_of(d); f = 30 + 60 * np.exp(-tt * 6)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.6)
    x = rng.standard_normal(len(tt)); x = lp(x, 0.05) * np.exp(-tt * 3) * 3
    return body + x

def riser(d):
    x = rng.standard_normal(int(d * SR)); x = x - lp(x, 0.15)
    return x * np.linspace(0, 1, len(x)) ** 2.2

def key(f=1.0):
    """A mechanical keystroke: short click plus a soft low thock."""
    tt = tt_of(.07); x = rng.standard_normal(len(tt)); x = x - lp(x, 0.3)
    return (x * 0.5 * np.exp(-tt * 120) + np.sin(2 * np.pi * 180 * f * tt) * np.exp(-tt * 60)) * 0.8

def typing(text_len, start, cps, gain=0.3):
    for i in range(text_len): add(key(1 + 0.08 * rng.standard_normal()), start + i / cps + rng.uniform(-.01, .01), gain, pan=rng.uniform(-.3, .3))

# ── A · git intro ──
tt = tt_of(5.2); add((np.sin(2 * np.pi * note(33) * tt) + 0.4 * np.sin(2 * np.pi * note(40) * tt)) * env(len(tt), 0.8, 0.4), 0, 0.14)
typing(23, 0.5, 15, 0.3)
add(key(0.7), 2.2, 0.5)
typing(8, 2.4, 12, 0.3)
add(key(0.7), 3.2, 0.6); add(boom(1.2), 3.2, 0.3)
add(click(1500), 3.3, 0.18); add(bell(79, 1.6), 3.9, 0.12)
add(riser(1.4), 3.7, 0.25)

# ── B · title ──
add(boom(), 5.0, 0.85); add(bell(76, 3), 5.05, 0.16); add(bell(83, 2.4), 5.1, 0.08, pan=0.3)
add(whoosh(0.8), 4.9, 0.35, pan=-0.5); add(whoosh(0.8), 5.15, 0.35, pan=0.5)
add(pad([52, 59, 64, 67], 4.6), 5.0, 1.0)
add(riser(2.0), 7.3, 0.3)

# ── beat: 9.4 → 30.6 at 122 BPM ──
BPM = 122; beat = 60 / BPM; start, stop = 9.4, 30.6
add(boom(1.6), start, 0.7)
chords = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]]
roots = [33, 29, 36, 31]
bar = 4 * beat
c = 0; b0 = start
while b0 < stop - 0.1:
    add(pad(chords[c % 4], bar + 0.4, 1.0), b0, 0.5)
    tt = tt_of(bar); r = note(roots[c % 4] + 12)
    bass = np.sin(2 * np.pi * r * tt) * 0.8 + 0.08 * np.sign(np.sin(2 * np.pi * r * tt))
    pump = 0.35 + 0.65 * np.minimum(1, ((tt % beat) / 0.12))
    add(bass * pump * env(len(tt), 0.01, 0.05), b0, 0.32)
    c += 1; b0 += bar
k = 0; b = start
while b < stop:
    lvl = min(1, (b - start) / 1.5)
    add(kick(), b, 0.6 * lvl)
    if k % 4 in (1, 3): add(snare(), b, 0.26 * lvl)
    add(hat(), b + beat / 2, 0.42 * lvl, pan=0.3)
    k += 1; b += beat

# ── cues ──
for w in (9.2, 19.0, 25.0, 30.0, 33.2): add(whoosh(1.0), w - 0.4, 0.5, pan=rng.uniform(-.4, .4))
add(click(1900), 11.55, 0.4); add(key(), 11.55, 0.3)            # GitHub tab
typing(10, 12.8, 9, 0.3)                                       # novabuilds
add(click(1700), 14.6, 0.4); add(key(0.8), 14.6, 0.3)          # Detect
add(bell(84, 1.8), 15.0, 0.14); add(bell(91, 1.4), 15.08, 0.08, pan=.3)
add(bell(79, 1.2), 16.6, 0.08); add(bell(83, 1.2), 17.3, 0.08)
typing(11, 20.4, 14, 0.26)                                     # address in bio
add(click(2200), 21.3, 0.2)
add(boom(2.2), 22.0, 0.75); add(bell(84, 2.6), 22.4, 0.2); add(bell(91, 2), 22.45, 0.1, pan=.3)
add(bell(81, 1.4), 26.1, 0.1); add(bell(86, 1.4), 28.8, 0.1)
add(bell(76, 1.4), 30.4, 0.1, pan=-0.5); add(bell(83, 1.4), 30.75, 0.1, pan=0.5)

# ── outro ──
add(pad([45, 52, 57, 60, 64], 5.0), 30.6, 0.9)
add(boom(3), 35.4, 0.8); add(bell(81, 3), 35.4, 0.2); add(bell(88, 3), 35.5, 0.12, pan=-.3)

# ── master ──
fade = np.ones(N); fade[:int(.2 * SR)] = np.linspace(0, 1, int(.2 * SR)); fade[int(36.6 * SR):] = np.linspace(1, 0, N - int(36.6 * SR))
out *= fade[:, None]; out = np.tanh(out * 1.4) / np.tanh(1.4); out *= 0.89 / np.max(np.abs(out))
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
print("ok")
