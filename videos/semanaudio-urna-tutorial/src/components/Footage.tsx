import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {Box, Segment, SOURCE, SPEECH, VOICE} from '../edit';
import {segFrames} from '../timeline';
import {C, FONT_TEXT, FPS, H, W} from '../theme';
import {Caption} from './Caption';

export type Zoom = {s: number; tx: number; ty: number};

/** Zoom máximo: a gravação é 480×854; acima disso a imagem começa a perder nitidez. */
const MAX_ZOOM = 1.6;

/** Zoom suave: começa no quadro inteiro e aproxima da área `zoom` em ~1 s. */
export const useZoom = (seg: Segment | null): Zoom => {
  const f = useCurrentFrame();
  if (!seg?.zoom) return {s: 1, tx: 0, ty: 0};
  const dur = segFrames(seg);
  const z = seg.zoom;
  const target = Math.min(MAX_ZOOM, 1 / z.w, 1 / z.h);
  const p = interpolate(f, [4, Math.min(34, dur * 0.5)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const s = interpolate(p, [0, 1], [1, Math.max(1, target)]);
  const cx = interpolate(p, [0, 1], [0.5, z.x + z.w / 2]) * W;
  const cy = interpolate(p, [0, 1], [0.5, z.y + z.h / 2]) * H;
  // centraliza a área sem mostrar bordas vazias
  const tx = Math.min(0, Math.max(W - s * W, W / 2 - s * cx));
  const ty = Math.min(0, Math.max(H - s * H, H / 2 - s * cy));
  return {s, tx, ty};
};

/** Converte uma Box do quadro original para pixels na tela com o zoom aplicado. */
export const mapBox = (b: Box, z: Zoom) => ({
  left: z.tx + b.x * W * z.s,
  top: z.ty + b.y * H * z.s,
  width: b.w * W * z.s,
  height: b.h * H * z.s,
});

/** Trecho da gravação original com zoom, voz limpa e legenda da fala. */
export const Footage: React.FC<{
  seg: Segment;
  dim?: number;
  captions?: boolean;
  children?: (z: Zoom) => React.ReactNode;
}> = ({seg, dim = 0, captions = true, children}) => {
  const f = useCurrentFrame();
  const z = useZoom(seg);
  const speed = seg.speed ?? 1;
  const startFrom = Math.round(seg.in * FPS);
  // em câmera lenta o Remotion conta endAt em quadros de saída
  const endAt = speed < 1 ? startFrom + Math.ceil(((seg.out - seg.in) * FPS) / speed) : Math.round(seg.out * FPS);
  if (!SOURCE) return <FootagePlaceholder />;
  const t = seg.in + (f / FPS) * speed;
  const cue = speed === 1 ? SPEECH.find((c) => t >= c.in && t < c.out) : undefined;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: C.black}}>
      <AbsoluteFill style={{transformOrigin: '0 0', transform: `translate(${z.tx}px, ${z.ty}px) scale(${z.s})`}}>
        <OffthreadVideo
          src={staticFile(SOURCE)}
          startFrom={startFrom}
          endAt={endAt}
          playbackRate={speed}
          muted={!!VOICE || speed !== 1}
          style={{width: W, height: H, objectFit: 'cover'}}
        />
      </AbsoluteFill>
      {VOICE && speed === 1 ? <Audio src={staticFile(VOICE)} startFrom={startFrom} endAt={endAt} /> : null}
      {dim > 0 ? <AbsoluteFill style={{background: `rgba(0,0,0,${dim})`}} /> : null}
      {children?.(z)}
      {captions && cue ? <Caption text={cue.text} /> : null}
    </AbsoluteFill>
  );
};

/** Exibido só enquanto a gravação original não foi carregada. Não simula a urna. */
export const FootagePlaceholder: React.FC<{label?: string}> = ({label = 'IMAGEM REAL DA URNA'}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: '#0B0907'}}>
    <div
      style={{
        width: 820,
        height: 1240,
        border: `4px dashed ${C.orange}`,
        borderRadius: 36,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 60,
        gap: 18,
        color: C.white,
        fontFamily: FONT_TEXT,
        textAlign: 'center',
        background: 'rgba(245,130,32,0.05)',
      }}
    >
      <div style={{fontWeight: 900, fontSize: 44, letterSpacing: 3}}>[ {label} ]</div>
      <div style={{fontWeight: 500, fontSize: 30, color: C.grey, maxWidth: 640}}>
        gravação original pendente
        <br />
        copy_780C9D0A-…mp4
      </div>
    </div>
  </AbsoluteFill>
);
