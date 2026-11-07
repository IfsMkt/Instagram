"""Trilha instrumental discreta + efeitos para o tutorial da urna.

Original, sintetizada (sem samples de terceiros). 100 BPM, pad em Lá menor
(Am - F - C - G), pulso de grave suave e chimbal baixo: fica por baixo da
voz sem competir. Gera também os efeitos usados nas transições.

Uso:  python3 scripts/music.py
Saída: public/audio/trilha.wav, whoosh.wav, impacto.wav, pop.wav
"""
import os
import wave
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(2026)


def save(name, L, R=None):
    R = L if R is None else R
    x = np.stack([L, R], 1)
    x = x / max(1e-9, np.abs(x).max()) * 0.89
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def spectral(x, fn):
    """Filtro estático via FFT: fn(freqs) -> ganho."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * fn(f), len(x))


def lowpass(x, fc, order=2):
    return spectral(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))


def highpass(x, fc, order=2):
    return spectral(x, lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1)) ** (2 * order)))


def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    ph = (freq * (1 + detune)) * t + rng.random()
    return 2 * (ph % 1) - 1


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


# ---------------- trilha ----------------
DUR, BPM = 75.0, 100
BEAT = 60 / BPM
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)


def add(sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    s = sig[: N - i] * g
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))


chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
bar = 4 * BEAT
nb = int(bar * SR)
fade = np.minimum(1, np.minimum(np.arange(nb), nb - np.arange(nb)) / (0.35 * SR))
k = 0
t = 0.0
while t < DUR:
    ch = chords[k % 4]
    padL = sum(saw(note(m), nb, -0.004) for m in ch)
    padR = sum(saw(note(m), nb, +0.004) for m in ch)
    add(lowpass(padL, 900) * fade, t, 0.18, -0.6)
    add(lowpass(padR, 900) * fade, t, 0.18, 0.6)
    # grave: colcheias suaves na fundamental
    root = note(ch[0] - 24)
    for b in range(8):
        n8 = int(BEAT / 2 * SR)
        e = np.exp(-np.arange(n8) / SR * 7)
        tt = np.arange(n8) / SR
        add(np.sin(2 * np.pi * root * tt) * e, t + b * BEAT / 2, 0.30)
    k += 1
    t += bar

# pulso (kick macio) e chimbal discreto
nk = int(0.35 * SR)
tk = np.arange(nk) / SR
kick = np.sin(2 * np.pi * (48 + 70 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 9)
nh = int(0.06 * SR)
hat = highpass(rng.standard_normal(nh), 7000) * np.exp(-np.arange(nh) / SR * 60)
b = 0
while b * BEAT < DUR:
    if b >= 8:  # entra depois de 2 compassos
        add(kick, b * BEAT, 0.55)
    add(hat, b * BEAT + BEAT / 2, 0.10, 0.3 if b % 2 else -0.3)
    b += 1

# fade-in/out geral
env = np.ones(N)
fi = int(1.0 * SR)
env[:fi] = np.linspace(0, 1, fi)
L *= env
R *= env
save('trilha.wav', L, R)

# ---------------- efeitos ----------------
# whoosh: ruído com filtro varrendo (aprox. por janelas)
nw = int(0.7 * SR)
noise = rng.standard_normal(nw)
w = np.zeros(nw)
seg = 1024
for i in range(0, nw, seg):
    p = i / nw
    fc = 300 + 5000 * np.sin(np.pi * p) ** 2
    w[i:i + seg] = lowpass(noise[i:i + seg], fc)[: len(w[i:i + seg])]
w *= np.sin(np.pi * np.linspace(0, 1, nw)) ** 2
save('whoosh.wav', w * np.linspace(0.6, 1, nw), w * np.linspace(1, 0.6, nw))

# impacto: sub + estalo filtrado
ni = int(1.2 * SR)
ti = np.arange(ni) / SR
imp = np.sin(2 * np.pi * (40 + 90 * np.exp(-ti * 25)) * ti) * np.exp(-ti * 3.5)
imp += lowpass(rng.standard_normal(ni), 2500) * np.exp(-ti * 18) * 0.5
save('impacto.wav', imp)

# pop: marcador dos PASSOS
npp = int(0.18 * SR)
tp = np.arange(npp) / SR
pop = np.sin(2 * np.pi * (880 + 600 * np.exp(-tp * 40)) * tp) * np.exp(-tp * 28)
save('pop.wav', pop)
print('ok:', os.listdir(OUT))
