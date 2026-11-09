"""Trilha 8-bit + efeitos do vídeo Grandes Compradores (sincronizados com src/compradores.json).

150 BPM -> 1 tempo = 0,4 s = 12 frames a 30 fps.
Uso: python3 scripts/compradores_audio.py  (gera public/audio/compradores.wav)
"""
import json
import os

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "..", "src", "compradores.json")))
SR = 44100
FPS = TL["fps"]
DUR = TL["total"] / FPS
N = int(SR * DUR)
BEAT = 60 / 150
rng = np.random.default_rng(3)

music = np.zeros(N)
sfx = np.zeros(N)


def fr(frame):
    return frame / FPS


def put(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    buf[i : i + len(sig)] += sig * g


def hz(n):
    return 440 * 2 ** ((n - 69) / 12)


NAMES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def nn(s):
    """'E5' -> midi; 'F#4' suportado."""
    acc = 1 if "#" in s else 0
    return 12 * (int(s[-1]) + 1) + NAMES[s[0]] + acc


def square(f, d, duty=0.25, vol=1.0, slide=0.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    freq = f * (1 + slide * t / max(d, 1e-3))
    ph = np.cumsum(freq) / SR
    s = np.where((ph % 1) < duty, 1.0, -1.0)
    env = np.minimum(1, t / 0.003) * np.clip(1 - t / d, 0, 1) ** 0.3
    return s * env * vol


def tri(f, d, vol=1.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    s = 2 * np.abs(2 * ((t * f) % 1) - 1) - 1
    s = np.round(s * 8) / 8  # degraus de 4 bits
    env = np.minimum(1, t / 0.003) * np.clip(1 - t / d, 0, 1) ** 0.2
    return s * env * vol


def noise(d, vol=1.0, decay=20.0, period=1):
    n = int(d * SR)
    x = rng.choice([-1.0, 1.0], n // period + 1).repeat(period)[:n]
    t = np.arange(n) / SR
    return x * np.exp(-t * decay) * vol


# ---------------- música ----------------
# progressão original em Dó maior: C - Am - F - G
MEL_A = "E5 G5 C6 G5 A5 G5 E5 D5 | C5 E5 A5 E5 G5 E5 C5 A4 | F5 A5 C6 A5 G5 F5 E5 F5 | G5 B5 D6 B5 A5 G5 F5 D5"
MEL_B = "C6 . G5 E5 C6 . D6 E6 | C6 . A5 E5 A5 . G5 . | A5 C6 F6 C6 A5 G5 F5 A5 | G5 . D6 . B5 . G5 ."
BASS = ["C3", "A2", "F2", "G2"]


def play_bar_melody(bar_str, t0, vol=0.22):
    notes = bar_str.split()
    step = BEAT / 2
    for k, n in enumerate(notes):
        if n == ".":
            continue
        put(music, square(hz(nn(n)), step * 0.9, 0.25, vol), t0 + k * step)
        # eco suave (canal 2)
        put(music, square(hz(nn(n)), step * 0.6, 0.125, vol * 0.25), t0 + k * step + step * 0.75)


def play_bar_rhythm(chord_root, t0, hats=True):
    r = nn(chord_root)
    step = BEAT / 2
    for k in range(8):
        n = r + (12 if k % 2 else 0)
        put(music, tri(hz(n), step * 0.95, 0.45), t0 + k * step)
    if hats:
        for k in range(8):
            put(music, noise(0.05, 0.10 if k % 2 else 0.06, 60, 2), t0 + k * step)
        put(music, noise(0.12, 0.22, 25, 6), t0 + BEAT)  # caixa
        put(music, noise(0.12, 0.22, 25, 6), t0 + 3 * BEAT)
        put(music, tri(60, 0.12, 0.6), t0)  # bumbo
        put(music, tri(60, 0.12, 0.6), t0 + 2 * BEAT)


BAR = 4 * BEAT

title_end = fr(TL["title"]["end"])
end = fr(TL["end"])
# título
t = 0.0
for k, n in enumerate(["G4", "C5", "E5", "G5", "C6", "G5", "E5", "C5"] * 1):
    put(music, square(hz(nn(n)), BEAT / 2 * 0.8, 0.5, 0.15), t + k * BEAT / 2)
play_bar_rhythm("C3", t, hats=False)
# fase: loop A B A B, com uma "subida" de tom a cada nível conquistado
t = title_end
bi = 0
unl = [fr(u) for u in TL["unlock"]]
while t + BAR <= end + 0.01:
    lvl = sum(1 for u in unl if t >= u - 0.05)
    shift = [0, 0, 2, 4, 5][lvl]
    sec = MEL_A if (bi // 4) % 2 == 0 else MEL_B
    q = bi % 4
    notes = " ".join(n if n == "." else f"{n}" for n in sec.split("|")[q].split())
    step = BEAT / 2
    for k, n in enumerate(notes.split()):
        if n != ".":
            put(music, square(hz(nn(n) + shift), step * 0.9, 0.25, 0.2), t + k * step)
    r = nn(BASS[q]) + shift
    for k in range(8):
        put(music, tri(hz(r + (12 if k % 2 else 0)), step * 0.95, 0.45), t + k * step)
    for k in range(8):
        put(music, noise(0.05, 0.10 if k % 2 else 0.06, 60, 2), t + k * step)
    put(music, noise(0.12, 0.22, 25, 6), t + BEAT)
    put(music, noise(0.12, 0.22, 25, 6), t + 3 * BEAT)
    put(music, tri(60, 0.12, 0.6), t)
    put(music, tri(60, 0.12, 0.6), t + 2 * BEAT)
    t += BAR
    bi += 1
# final
t = end
for q in range(3):
    play_bar_melody(MEL_A.split("|")[q], t, 0.15)
    play_bar_rhythm(BASS[q], t)
    t += BAR
for n, v in (("C5", 0.18), ("E5", 0.14), ("G5", 0.14), ("C6", 0.12)):
    put(music, square(hz(nn(n)), 1.0, 0.5, v), t)
put(music, tri(hz(nn("C3")), 1.0, 0.5), t)

# ---------------- efeitos ----------------
def blip_up():
    return np.concatenate([square(hz(nn("C6")), 0.04, 0.5, 0.3), square(hz(nn("G6")), 0.06, 0.5, 0.3)])


def select():
    return np.concatenate([square(hz(nn("E6")), 0.05, 0.5, 0.35), square(hz(nn("A6")), 0.09, 0.5, 0.35)])


def jump():
    return square(hz(nn("C5")), 0.22, 0.5, 0.3, slide=1.6)


def coin():
    return np.concatenate([square(hz(nn("B5")), 0.06, 0.5, 0.32), square(hz(nn("E6")), 0.28, 0.5, 0.32)])


def arp(notes, step=0.06, vol=0.3, last=0.3):
    parts = [square(hz(nn(n)), step, 0.5, vol) for n in notes[:-1]]
    parts.append(square(hz(nn(notes[-1])), last, 0.5, vol))
    return np.concatenate(parts)


def bump():
    return tri(90, 0.12, 0.8) + noise(0.12, 0.2, 40, 8)


def whoosh(d=0.35):
    n = int(d * SR)
    t = np.arange(n) / SR
    x = rng.choice([-1.0, 1.0], n)
    period = (30 * (1 - t / d) + 2).astype(int)
    y = np.array([x[i - i % p] for i, p in enumerate(period)])
    return y * np.sin(np.pi * t / d) * 0.18



for d in (TL["dlgIntro"], TL["dlgCentral"]):
    put(sfx, blip_up(), fr(d[0]))
    for k in range(10):
        put(sfx, square(hz(nn("A5")), 0.015, 0.5, 0.08), fr(d[0] + 9 + k * 3))
    put(sfx, select(), fr(d[2]))
for s, _, _ in TL["jumps"]:
    put(sfx, jump(), fr(s))
for i, b in enumerate(TL["buy"]):
    put(sfx, arp(["G5", "C6", "G5", "C6", "E6"], 0.05, 0.3, 0.25), fr(b))
    put(sfx, noise(0.25, 0.16, 12, 1), fr(b))
    for k in range(TL["couponGain"][i]):
        put(sfx, coin(), fr(b + 8) + k * 0.07, 0.6)
duck_windows = []
for i, u in enumerate(TL["unlock"]):
    base = ["C5", "D5", "E5", "G5"][i]
    notes = [base, "E5", "G5", "C6"] if i < 3 else ["C5", "E5", "G5", "C6", "E6", "G6", "C7"]
    put(sfx, arp(notes, 0.07, 0.3, 0.45), fr(u))
    put(sfx, noise(0.5, 0.18, 6, 3), fr(u))
    duck_windows.append((fr(u), fr(u) + 0.9))
put(sfx, arp(["C5", "G5", "C6"], 0.07, 0.28, 0.3), fr(TL["intro"][0]))
put(sfx, arp(["C5", "E5", "G5", "C6", "E6", "G6", "C7"], 0.04, 0.3, 0.3), fr(TL["title"]["press"]))
put(sfx, whoosh(), fr(TL["receipt"][0]))
put(sfx, arp(["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6", "G6", "C7"], 0.035, 0.28, 0.35), fr(TL["pin"][1]))
put(sfx, arp(["G5", "G5", "C6"], 0.08, 0.3, 0.3), fr(TL["bonus"][0]))
for k in range(8):
    put(sfx, coin(), fr(TL["bonus"][0] + 24) + k * 0.18, 0.5)
put(sfx, blip_up(), fr(TL["bonus"][0] + 86))
for k in range(4):
    put(sfx, coin(), fr(TL["bonus"][0] + 92) + k * 0.12, 0.6)
for c in TL["checks"]:
    put(sfx, select(), fr(c), 0.8)
put(sfx, whoosh(0.5), fr(TL["title"]["end"] - 12))
put(sfx, whoosh(0.5), fr(TL["end"] - 12))

t = np.arange(N) / SR
duck = np.ones(N)
for a, b in duck_windows:
    duck[(t > a) & (t < b)] = 0.35
mix = music * duck * 0.9 + sfx
fo = int(0.6 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)
mix = mix / np.max(np.abs(mix)) * 0.92
stereo = np.stack([mix, np.roll(mix, int(0.008 * SR)) * 0.9 + mix * 0.1], 1)
stereo = stereo / np.max(np.abs(stereo)) * 0.92
out = os.path.join(HERE, "..", "public", "audio", "compradores.wav")
wavfile.write(out, SR, (stereo * 32767).astype(np.int16))
print("ok", round(N / SR, 2), "s")
