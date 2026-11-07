// Render final: só roda com o ARQUIVO ORIGINAL preparado por prep-source.sh.
//   node scripts/render-final.mjs            -> 1080x1920 (formato pedido)
//   node scripts/render-final.mjs --nativo   -> resolução nativa do original, se for maior
//                                               (ex.: 4K -> 2160x3840). Nunca amplia.
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';

const meta = readFileSync('src/source-meta.ts', 'utf8');
const num = (k) => Number(meta.match(new RegExp(`${k}: ([\\d.]+)`))[1]);
const isOriginal = /isOriginal: true/.test(meta);
if (!isOriginal || !existsSync('public/source/urna.mp4')) {
  console.error('BLOQUEADO: a fonte não é o arquivo original em alta qualidade.\nRode: bash scripts/prep-source.sh <arquivo-original>');
  process.exit(1);
}
const w = num('width');
const h = num('height');
let scale = 1;
let out = 'out/semanaudio-2026-tutorial-urna.mp4';
if (process.argv.includes('--nativo')) {
  // maior escala inteira/meia que não ultrapassa a resolução do original
  const max = Math.min(w / 1080, h / 1920);
  scale = Math.floor(max * 2) / 2;
  if (scale <= 1) {
    console.log(`Original ${w}x${h}: a resolução nativa não é maior que 1080x1920; renderizando em 1080x1920.`);
    scale = 1;
  } else {
    out = `out/semanaudio-2026-tutorial-urna-${1080 * scale}x${1920 * scale}.mp4`;
  }
}
console.log(`Fonte: ${w}x${h} (original) -> saída ${1080 * scale}x${1920 * scale}`);
const args = [
  'remotion', 'render', 'src/index.ts', 'UrnaTutorial', out,
  '--codec=h264', '--crf=12', '--x264-preset=slow', '--pixel-format=yuv420p', '--color-space=bt709',
  '--image-format=png', '--audio-codec=aac', '--audio-bitrate=320k', `--scale=${scale}`,
];
execFileSync('npx', args, {stdio: 'inherit'});
console.log('Pronto:', out);
