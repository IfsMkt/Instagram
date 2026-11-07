#!/usr/bin/env bash
# Limpeza da voz original (sem alterar o conteúdo da fala):
# passa-altas 80 Hz (ronco/vento), redução de ruído FFT, de-esser leve,
# compressão suave e normalização para -16 LUFS (padrão de redes sociais).
# Saída: public/audio/voz.wav (mesma linha do tempo da gravação original).
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -hide_banner -loglevel error -y -i public/source/urna.mp4 -vn \
  -af "highpass=f=80,lowpass=f=12000,afftdn=nr=14:nf=-30:tn=1,deesser=i=0.3,acompressor=threshold=-20dB:ratio=3:attack=10:release=150,loudnorm=I=-16:TP=-1.5:LRA=9" \
  -ar 48000 -ac 2 public/audio/voz.wav
echo "public/audio/voz.wav pronto"
