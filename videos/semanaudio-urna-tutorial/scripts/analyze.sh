#!/usr/bin/env bash
# Análise da gravação original da urna.
# Uso: bash scripts/analyze.sh caminho/para/copy_780C9D0A-....mp4
#
# Gera em analysis/:
#   probe.json        metadados (duração, resolução, rotação, fps, áudio)
#   scenes.txt        trocas de enquadramento detectadas (tempo em s)
#   silences.txt      trechos sem fala (candidatos a corte)
#   frames/           1 quadro por segundo (t0000.jpg = 0 s, t0001.jpg = 1 s ...)
#   contact-NN.jpg    pranchas 4x5 com 20 s cada, com o tempo marcado
#   audio16k.wav      áudio mono 16 kHz para transcrição
#   transcricao.*     transcrição (se whisper estiver instalado)
# E em public/source/urna.mp4 uma cópia H.264 30 fps CFR usada pelo Remotion.
set -euo pipefail
SRC="${1:?informe o arquivo de vídeo original}"
cd "$(dirname "$0")/.."
A=analysis
mkdir -p "$A/frames" public/source

ffprobe -v error -print_format json -show_format -show_streams "$SRC" > "$A/probe.json"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
echo "Duração: ${DUR}s"

# Proxy de edição: 1080x1920, 30 fps constante, rotação aplicada.
ffmpeg -hide_banner -loglevel error -y -i "$SRC" \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p" \
  -c:v libx264 -crf 16 -preset medium -g 30 -c:a aac -b:a 256k -ar 48000 public/source/urna.mp4

# Quadros a cada 1 s com o tempo gravado.
ffmpeg -hide_banner -loglevel error -y -i public/source/urna.mp4 \
  -vf "fps=1,scale=360:-2,drawtext=text='%{eif\:t\:d}s':x=10:y=10:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6" \
  -start_number 0 "$A/frames/t%04d.jpg"

# Pranchas: 20 quadros (20 s) por imagem.
ffmpeg -hide_banner -loglevel error -y -i public/source/urna.mp4 \
  -vf "fps=1,scale=270:-2,drawtext=text='%{eif\:t\:d}s':x=8:y=8:fontsize=30:fontcolor=white:box=1:boxcolor=black@0.6,tile=5x4:padding=4:color=black" \
  -start_number 1 "$A/contact-%02d.jpg"

# Mudanças de enquadramento.
ffmpeg -hide_banner -i public/source/urna.mp4 -vf "select='gt(scene,0.22)',showinfo" -an -f null - 2>&1 \
  | grep -o 'pts_time:[0-9.]*' | cut -d: -f2 > "$A/scenes.txt" || true

# Silêncios (pausas longas).
ffmpeg -hide_banner -i public/source/urna.mp4 -af "silencedetect=noise=-35dB:d=0.8" -f null - 2>&1 \
  | grep -E 'silence_(start|end)' > "$A/silences.txt" || true

ffmpeg -hide_banner -loglevel error -y -i public/source/urna.mp4 -vn -ac 1 -ar 16000 "$A/audio16k.wav"

if command -v whisper >/dev/null 2>&1; then
  whisper "$A/audio16k.wav" --language pt --model small --output_dir "$A" --output_format all
  for ext in txt srt json vtt tsv; do [ -f "$A/audio16k.$ext" ] && mv "$A/audio16k.$ext" "$A/transcricao.$ext"; done
else
  echo "whisper não instalado: pip install -U openai-whisper  (depois rode este script de novo)"
fi
echo "Análise pronta em $A/"
