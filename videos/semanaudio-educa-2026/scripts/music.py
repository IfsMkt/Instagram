"""Trilha original sintetizada para o Reels SemanÁudio + Educa Áudio.

120 BPM  -> 1 tempo = 0,5 s = 15 frames a 30 fps.
Os cortes de cena (5, 10, 16, 23, 27 s) caem em tempos fortes, então
impactos e risers ficam sincronizados com a edição.

Uso:  python3 scripts/music.py   (gera public/audio/trilha.wav)
"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
DUR = 32.0
BPM = 120
BEAT = 60 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def env(n, a=0.005, d=0.2, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, t - a) / max(d, 1e-4))
    return e


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    f = freq * (1 + detune)
    return 2 * ((t * f) % 1) - 1


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


# ---------- instrumentos ----------
def kick(big=False):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * env(n, 0.001, 0.32 if big else 0.22, 5)
    click = hp(rng.standard_normal(n), 2000) * env(n, 0.0005, 0.01, 6) * 0.3
    return np.tanh((s + click) * 1.6)


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    return hp(rng.standard_normal(n), 7000) * env(n, 0.001, 0.12 if open_ else 0.03, 5) * 0.35


def clap():
    n = int(0.3 * SR)
    x = bp(rng.standard_normal(n), 900, 3500)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR)
        e[i:] += env(n - i, 0.001, 0.02 if k < 2 else 0.12, 5) * (0.6 if k < 2 else 1)
    return x * e * 0.6


def impact(dur=2.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 70 * np.exp(-t * 6)) / SR) * env(n, 0.002, dur * 0.5, 3)
    noise = lp(rng.standard_normal(n), 3000) * env(n, 0.001, 0.6, 4) * 0.5
    metal = bp(rng.standard_normal(n), 2500, 6000) * env(n, 0.001, 1.0, 3) * 0.2
    return np.tanh((boom * 1.4 + noise + metal) * 1.2)


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    # filtro varrendo de 300 Hz a 9 kHz em blocos
    blocks = 40
    for b in range(blocks):
        a, z = b * n // blocks, (b + 1) * n // blocks
        fc = 300 * (30 ** (b / blocks))
        out[a:z] = bp(x, fc * 0.6, min(fc * 1.6, 20000))[a:z]
    tone = saw(1, n) * 0
    f = 110 * 2 ** (3 * t / dur)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    g = (t / dur) ** 2
    return (out * 0.5 + tone) * g


def whoosh(dur=0.7, reverse=False):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 400, 5000)
    e = np.sin(np.pi * t / dur) ** 2
    if reverse:
        e = (t / dur) ** 3
    return x * e * 0.45


def bass_note(m, dur):
    n = int(dur * SR)
    f = note(m)
    s = saw(f, n) + saw(f, n, 0.004) + np.sin(2 * np.pi * f / 2 * np.arange(n) / SR) * 1.2
    s = lp(s, 380, 2)
    return np.tanh(s * env(n, 0.004, dur * 0.9, 2.5) * 1.3) * 0.5


def pad(ms, dur):
    n = int(dur * SR)
    s = np.zeros(n)
    for m in ms:
        for d in (-0.006, 0, 0.007):
            s += saw(note(m), n, d)
    s = lp(s / (len(ms) * 3), 1400, 2)
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return s * e * 0.55


def pluck(m, dur=0.22):
    n = int(dur * SR)
    s = saw(note(m), n) * 0.6 + np.sin(2 * np.pi * note(m) * np.arange(n) / SR)
    return lp(s, 2600) * env(n, 0.002, 0.12, 5) * 0.28


# ---------- arranjo ----------
# progressão em Mi menor (escura, "palco"): Em - C - D - Bm, 1 compasso (2 s) cada
prog = [[52, 55, 59], [48, 52, 55], [50, 54, 57], [47, 50, 54]]
roots = [40, 36, 38, 35]

beats = int(DUR / BEAT)
for b in range(beats):
    t = b * BEAT
    bar = int(t // 2)
    sec = t
    # kick: tudo menos as "respirações" antes dos drops e o final
    breath = (9.0 <= sec < 10) or (15.0 <= sec < 16) or (22.0 <= sec < 23) or sec >= 30.5
    if not breath:
        add(kick(), t, 0.95)
        if b % 2 == 1 and sec > 1.9:
            add(clap(), t, 0.55, 0.1)
    if sec < 30.5:
        add(hat(), t + BEAT / 2, 0.5, 0.35)
        if sec >= 10:
            add(hat(), t + BEAT / 4, 0.25, -0.35)
            add(hat(), t + 3 * BEAT / 4, 0.25, -0.35)

# baixo em colcheias
for k in range(int(30 / (BEAT / 2))):
    t = k * BEAT / 2
    if (9.0 <= t < 10) or (15.0 <= t < 16) or (22.0 <= t < 23):
        continue
    bar = int(t // 2) % 4
    m = roots[bar] + (12 if k % 4 == 3 else 0)
    add(bass_note(m, BEAT / 2 * 0.95), t, 0.8)

# pads
for bar in range(16):
    t = bar * 2.0
    ch = prog[bar % 4]
    add(pad(ch, 2.05), t, 0.55 if t < 10 else 0.7)

# arpejo a partir do 15% (energia)
for k in range(int((30 - 10) / (BEAT / 2))):
    t = 10 + k * BEAT / 2
    bar = int(t // 2) % 4
    ch = prog[bar] + [prog[bar][0] + 12]
    add(pluck(ch[k % 4] + 12), t, 0.9, 0.5 if k % 2 else -0.5)

# acorde final sustentado
add(pad([52, 59, 64, 67], 4.0), 28.0, 0.9)
add(pad([40, 47], 4.0), 28.0, 0.6)

# FX sincronizados com os cortes
for t in (0.0, 10.0, 16.0, 18.5, 23.0, 27.0):
    add(impact(2.4 if t in (10.0, 18.5) else 1.6), t, 1.0 if t in (10.0, 18.5) else 0.7)
add(kick(True), 10.0, 1.0)
add(kick(True), 18.5, 1.0)
add(riser(2.0), 8.0, 0.9)
add(riser(1.0), 15.0, 0.7)
add(riser(2.5), 16.0, 0.6)   # build de "E TEM MAIS" até o reveal dos cupons
add(riser(1.0), 22.0, 0.6)
for t, rev in ((2.2, False), (4.6, True), (12.0, False), (24.5, False), (26.6, True), (29.0, False)):
    add(whoosh(0.6, rev), t, 0.8, 0.3)

# ---------- master ----------
mix = np.stack([L, R], 1)
mix = hp(mix.T, 28).T
# fade-out final
fo = int(1.2 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.4) / np.tanh(1.4) * 0.89
out = os.path.join(os.path.dirname(__file__), "..", "public", "audio", "trilha.wav")
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok", out, mix.shape[0] / SR, "s")
