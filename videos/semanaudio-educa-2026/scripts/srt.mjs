// Gera out/semanaudio-educa-2026-reels.srt a partir de src/captions.ts
import {readFileSync, writeFileSync} from 'node:fs';
const src = readFileSync(new URL('../src/captions.ts', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('export const CUES'));
const cues = [...block.matchAll(/\{from: (\d+), to: (\d+), text: '([^']+)'\}/g)].map((m) => ({from: +m[1], to: +m[2], text: m[3]}));
const ts = (fr) => {
  const ms = Math.round((fr / 30) * 1000);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const out = cues.map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)}\n${c.text}\n`).join('\n');
writeFileSync(new URL('../out/semanaudio-educa-2026-reels.srt', import.meta.url), out);
console.log(`${cues.length} legendas`);
