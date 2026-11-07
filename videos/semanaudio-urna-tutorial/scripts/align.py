"""Mede o atraso (s) do arquivo B em relação ao A pela correlação do áudio.
Uso: python3 scripts/align.py leve.mov original.mov  -> imprime o deslocamento"""
import subprocess, sys
import numpy as np

SR = 4000

def pcm(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-t', '60', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, '<i2').astype(np.float32)
    x = np.abs(x)  # envelope: robusto a diferenças de codec
    k = int(SR * 0.01)
    x = np.convolve(x, np.ones(k) / k, 'same')
    return (x - x.mean()) / (x.std() + 1e-9)

a, b = pcm(sys.argv[1]), pcm(sys.argv[2])
n = 1 << int(np.ceil(np.log2(len(a) + len(b))))
c = np.fft.irfft(np.fft.rfft(b, n) * np.conj(np.fft.rfft(a, n)), n)
lag = int(np.argmax(c))
if lag > n // 2:
    lag -= n
print(round(lag / SR, 3))
