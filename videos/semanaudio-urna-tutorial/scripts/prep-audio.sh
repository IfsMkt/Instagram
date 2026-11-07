#!/usr/bin/env bash
# Limpeza da voz original (sem alterar o conteúdo da fala):
# passa-altas 80 Hz, redução de ruído FFT, de-esser leve, compressão suave
# e normalização -16 LUFS. Saída: public/audio/voz.wav (linha do tempo do arquivo).
# Uso: bash scripts/prep-audio.sh [arquivo]   (padrão: public/source/urna.mp4)
set -euo pipefail
cd "$(dirname "$0")/.."
IN="${1:-public/source/urna.mp4}"
ffmpeg -hide_banner -loglevel error -y -i "$IN" -vn \
  -af "highpass=f=80,lowpass=f=14000,afftdn=nr=14:nf=-30:tn=1,deesser=i=0.3,acompressor=threshold=-20dB:ratio=3:attack=10:release=150,loudnorm=I=-16:TP=-1.5:LRA=9" \
  -ar 48000 -ac 2 -c:a pcm_s24le public/audio/voz.wav
echo "public/audio/voz.wav pronto"
