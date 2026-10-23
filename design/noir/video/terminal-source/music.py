# Soundtrack for the NOIR Terminal film (41s), synthesized and synced to film.html cues.
# Usage: python3 music.py out.wav
import numpy as np, wave, sys
SR = 44100; DUR = 41.0; N = int(SR * DUR)
rng = np.random.default_rng(23)
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

# ── A · boot: drone, typing, boot ticks ──
tt = tt_of(5.2); add((np.sin(2 * np.pi * note(33) * tt) + 0.4 * np.sin(2 * np.pi * note(40) * tt)) * env(len(tt), 0.8, 0.4), 0, 0.14)
typing(15, 0.7, 9, 0.32)
add(key(0.7), 2.95, 0.6); add(boom(1.4), 2.95, 0.35)
for i, x in enumerate((3.05, 3.35, 3.65, 3.95)): add(click(1600 + 120 * i), x, 0.18, pan=0.2)
add(bell(84, 1.6), 4.3, 0.12)
add(riser(1.2), 3.8, 0.25)

# ── B · title ──
add(boom(), 5.0, 0.85); add(bell(76, 3), 5.05, 0.16); add(bell(83, 2.4), 5.1, 0.08, pan=0.3)
add(pad([52, 59, 64, 67], 4.4), 5.0, 1.0)
add(riser(1.0) * 0.6, 6.8, 0.2)
add(riser(2.0), 7.0, 0.3)

# ── beat: 9.0 → 32.4 at 124 BPM ──
BPM = 124; beat = 60 / BPM; start, stop = 9.0, 32.4
add(boom(1.6), start, 0.7)
chords = [[52, 55, 59], [48, 52, 55], [43, 47, 50], [50, 54, 57]]
roots = [28, 24, 31, 26]
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
    if k % 2 == 1: add(hat(.03), b + beat * 0.25, 0.2 * lvl, pan=-0.3)
    k += 1; b += beat

# ── cues ──
for w in (8.8, 15.2, 23.4, 28.6, 32.2): add(whoosh(1.0), w - 0.4, 0.5, pan=rng.uniform(-.4, .4))
for x in (11.95, 13.55): add(key(), x, 0.5); add(click(2400), x + 0.05, 0.12)       # J presses
typing(15, 16.5, 11, 0.3)                                                            # buy $kairo 0.05
add(key(0.7), 18.75, 0.65); add(boom(1.2), 18.9, 0.4); add(bell(88, 1.4), 19.0, 0.12)  # Enter → ready
add(bell(81, 1.6), 21.1, 0.1)                                                        # amount ring
scale = [64, 67, 71, 74, 76, 79, 83, 86, 88]
for i, x in enumerate((24.3, 24.75, 25.2, 25.65, 26.1, 26.55, 26.8, 27.05, 27.5)):   # hotkeys
    add(key(), x, 0.45); add(bell(scale[i], 1.1), x + 0.02, 0.09, pan=(i - 4) / 6)

# ── G · you sign + H · outro ──
add(pad([45, 52, 57, 60], 4.4), 32.4, 0.9)
add(click(900), 33.15, 0.35); add(key(0.6), 33.2, 0.4)                               # lock click
add(bell(76, 2.4), 33.6, 0.1)
add(whoosh(1.0), 35.9, 0.4)
add(boom(3), 36.5, 0.8); add(bell(81, 3), 36.5, 0.2); add(bell(88, 3), 36.6, 0.12, pan=-.3)
add(pad([45, 52, 57, 60, 64], 4.5), 36.5, 1.0)

# ── master ──
fade = np.ones(N); fade[:int(.2 * SR)] = np.linspace(0, 1, int(.2 * SR)); fade[int(39.6 * SR):] = np.linspace(1, 0, N - int(39.6 * SR))
out *= fade[:, None]; out = np.tanh(out * 1.4) / np.tanh(1.4); out *= 0.89 / np.max(np.abs(out))
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
print("ok")
