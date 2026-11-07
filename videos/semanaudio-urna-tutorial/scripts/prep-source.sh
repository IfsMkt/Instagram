#!/usr/bin/env bash
# Prepara o ARQUIVO ORIGINAL (alta qualidade) como fonte do render final.
#
#   bash scripts/prep-source.sh caminho/do/original.mov
#
# - Recusa arquivos com lado menor < 1080 px (ex.: a versão "leve" de análise).
#   Para uma prévia de teste com arquivo leve: ALLOW_LOWRES=1 bash scripts/prep-source.sh ...
# - Mantém a resolução nativa (nunca amplia), corrige rotação, converte HDR (HLG/PQ
#   do iPhone) para SDR BT.709 e gera um intermediário H.264 quase sem perdas
#   (CRF 10, 8 bits, quadros-chave a cada 1 s) em public/source/urna.mp4.
# - Mede o deslocamento de tempo em relação à versão leve (correlação do áudio),
#   para os tempos de corte de src/edit.ts continuarem certos.
# - Gera src/source-meta.ts e a voz limpa (public/audio/voz.wav) a partir do original.
set -euo pipefail
SRC="${1:?informe o arquivo original}"
cd "$(dirname "$0")/.."
LEVE=source/tutorial_urna_semanAudio_leve.mov
mkdir -p public/source public/audio

read -r W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$SRC" | tr x ' ')
ROT=$(ffprobe -v error -select_streams v:0 -show_entries stream_side_data=rotation -of csv=p=0 "$SRC" | head -1 | tr -d '-' || true)
if [ "${ROT:-0}" = "90" ] || [ "${ROT:-0}" = "270" ]; then t=$W; W=$H; H=$t; fi
TRC=$(ffprobe -v error -select_streams v:0 -show_entries stream=color_transfer -of csv=p=0 "$SRC")
FPSR=$(ffprobe -v error -select_streams v:0 -show_entries stream=avg_frame_rate -of csv=p=0 "$SRC")
FPS=$(python3 -c "from fractions import Fraction as F; print(round(float(F('$FPSR')),3))")
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
SHORT=$(( W < H ? W : H ))
echo "Original: ${W}x${H} · ${FPS} fps · ${DUR}s · transferência: ${TRC:-desconhecida}"

ORIGINAL=true
if [ "$SHORT" -lt 1080 ]; then
  if [ "${ALLOW_LOWRES:-0}" = "1" ]; then
    echo "AVISO: arquivo de baixa resolução, marcado como NÃO original (render final bloqueado)."; ORIGINAL=false
  else
    echo "ERRO: ${W}x${H} é baixa resolução (provavelmente a versão comprimida). Use o arquivo original." >&2; exit 1
  fi
fi

# taxa de quadros: mantém a nativa (arredonda 29,97/59,94 para CFR equivalente)
VF="fps=${FPSR}"
case "$TRC" in
  arib-std-b67|smpte2084)
    echo "HDR detectado: convertendo para SDR BT.709 (tonemap hable)."
    VF="zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,$VF" ;;
  *) VF="$VF,format=yuv420p" ;;
esac

ffmpeg -hide_banner -loglevel error -stats -y -i "$SRC" -vf "$VF" \
  -c:v libx264 -preset slow -crf 10 -tune film -g "$(python3 -c "print(max(1,round($FPS)))")" \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart public/source/urna.mp4

# deslocamento em relação à versão leve (tempos de edit.ts foram medidos nela)
OFFSET=0
if [ -f "$LEVE" ]; then
  OFFSET=$(python3 -I scripts/align.py "$LEVE" "$SRC")
  echo "Deslocamento original − leve: ${OFFSET}s"
fi

cat > src/source-meta.ts <<TS
// Gerado por scripts/prep-source.sh — não editar à mão.
export const SOURCE_META = {
  width: $W,
  height: $H,
  fps: $FPS,
  duration: $DUR,
  /** true só quando a fonte é o arquivo original em alta qualidade */
  isOriginal: $ORIGINAL,
  /** somado aos tempos de edit.ts (medidos na versão leve) */
  offset: $OFFSET,
  file: '$(basename "$SRC")',
};
TS

bash scripts/prep-audio.sh "$SRC"
echo "Pronto: public/source/urna.mp4 (${W}x${H}) · src/source-meta.ts · public/audio/voz.wav"
