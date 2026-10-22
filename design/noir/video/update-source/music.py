# Soundtrack for the NOIR update film (52s), synthesized and synced to film.html cues.
# Usage: python3 music.py out.wav
import numpy as np, wave, sys
SR = 44100; DUR = 52.0; N = int(SR * DUR)
rng = np.random.default_rng(11)
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

# ── 0 · tension: drone + clock ticks + "Not yet." glitch ──
tt = tt_of(3.4); drone = (np.sin(2 * np.pi * note(33) * tt) + 0.5 * np.sin(2 * np.pi * note(45) * 1.003 * tt)) * env(len(tt), 1.0, 0.1)
add(drone, 0, 0.16)
for k in range(7): add(click(1100), 0.3 + k * 0.45, 0.22, pan=0.4 * (-1) ** k)
add(riser(2.2), 1.15, 0.22)
for g in np.arange(2.4, 3.3, 0.09): add(rng.standard_normal(int(.03 * SR)) * np.exp(-np.arange(int(.03 * SR)) / SR * 120), g, 0.18, pan=rng.uniform(-.6, .6))

# ── "Now." impact, bloom, title ──
add(boom(), 3.35, 0.9); add(bell(81, 3), 3.4, 0.16); add(bell(88, 2.5), 3.45, 0.08, pan=0.3)
add(pad([57, 64, 69, 72], 3.0), 3.4, 0.9)
add(whoosh(1.2), 5.2, 0.45)
add(pad([53, 60, 65, 69], 4.6), 5.8, 1.0)
add(bell(76, 2.8), 6.8, 0.15); add(bell(83, 2.2), 7.0, 0.1, pan=-.3)
add(riser(1.0) * 0.6, 7.6, 0.18)  # shimmer under the light sweep
add(riser(2.2), 7.9, 0.32)

# ── beat: 10.2 → 46.4 at 120 BPM ──
BPM = 120; beat = 60 / BPM; start, stop = 10.2, 46.4
add(boom(1.6), start, 0.7)
chords = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]]
roots = [33, 29, 36, 31]
bar = 4 * beat
c = 0; b0 = start
while b0 < stop - 0.1:
    add(pad(chords[c % 4], bar + 0.4, 1.0), b0, 0.55)
    tt = tt_of(bar); r = note(roots[c % 4] + 12)
    bass = np.sin(2 * np.pi * r * tt) * 0.8 + 0.25 * np.sign(np.sin(2 * np.pi * r * tt)) * 0.3
    pump = 0.35 + 0.65 * np.minimum(1, ((tt % beat) / 0.12))  # sidechain feel
    add(bass * pump * env(len(tt), 0.01, 0.05), b0, 0.32)
    c += 1; b0 += bar
k = 0; b = start
while b < stop:
    lvl = min(1, (b - start) / 1.5)
    add(kick(), b, 0.6 * lvl)
    if k % 4 in (1, 3): add(snare(), b, 0.28 * lvl, pan=0.05)
    add(hat(), b + beat / 2, 0.45 * lvl, pan=0.3)
    if k % 2 == 0: add(hat(.03), b + beat * 0.75, 0.25 * lvl, pan=-0.3)
    k += 1; b += beat

# ── cue sounds ──
for w in (10.0, 22.0, 26.8, 30.8, 36.0, 40.2): add(whoosh(1.0), w - 0.4, 0.5, pan=rng.uniform(-.4, .4))
for i, x in enumerate(np.arange(12.6, 14.6, 0.08)): add(click(2200 + 40 * i), x, 0.06, pan=0.2)          # stats count-up
for i in range(6): add(bell(72 + [0, 3, 7, 10, 12, 15][i], 1.2), 18.9 + i * 0.22, 0.07, pan=(i - 2.5) / 4)  # race arpeggio
add(boom(2.2), 22.7, 0.8); add(bell(84, 2.6), 23.2, 0.2); add(bell(91, 2), 23.25, 0.1, pan=.3)        # verified stamp
add(click(1500), 28.3, 0.25); add(click(1500), 29.5, 0.25)
for i in range(5): add(click(1300 + i * 150), 32.6 + i * 0.55, 0.3, pan=(i - 2) / 3)                   # stock flips
add(bell(79, 1.6), 32.0, 0.12)
add(click(), 38.5, 0.4); add(bell(86, 1.4), 38.6, 0.1)                                               # studio tap
for i, x in enumerate(np.arange(41.8, 44.0, 0.07)): add(click(2600 + 25 * i), x, 0.045, pan=-.2)     # bank counters
add(click(), 44.4, 0.4); add(bell(88, 1.4), 44.9, 0.16); add(bell(93, 1.6), 45.05, 0.14, pan=.3)   # claim cha-ching
add(riser(1.6), 44.8, 0.45)

# ── outro: thesis + logo ──
add(boom(3), 46.5, 0.6)
add(pad([45, 52, 57, 60, 64], 6.0), 46.4, 1.1)
add(bell(76, 2.6), 46.9, 0.12); add(bell(79, 2.6), 47.6, 0.12)
add(whoosh(1.0), 49.1, 0.4)
add(boom(3), 49.6, 0.8); add(bell(81, 3), 49.6, 0.2); add(bell(88, 3), 49.7, 0.12, pan=-.3)

# ── master ──
fade = np.ones(N); fade[:int(.3 * SR)] = np.linspace(0, 1, int(.3 * SR)); fade[int(50.6 * SR):] = np.linspace(1, 0, N - int(50.6 * SR))
out *= fade[:, None]; out = np.tanh(out * 1.4) / np.tanh(1.4); out *= 0.89 / np.max(np.abs(out))
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
print("ok")
