import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame, Easing} from 'remotion';
import {beatPulse, C, H, W} from './theme';

/** Foto com movimento de câmera (Ken Burns) e tratamento laranja/preto. */
export const KenBurns: React.FC<{
  src: string;
  dur: number;
  from?: number;
  to?: number;
  x?: [number, number];
  y?: [number, number];
  brightness?: number;
  rotate?: number;
  vignette?: number;
}> = ({src, dur, from = 1.15, to = 1.35, x = [0, 0], y = [0, 0], brightness = 1, rotate = 0, vignette = 0.85}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [0, 1], {extrapolateRight: 'clamp'});
  const s = interpolate(p, [0, 1], [from, to]);
  const tx = interpolate(p, [0, 1], x);
  const ty = interpolate(p, [0, 1], y);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{
          position: 'absolute',
          height: H,
          width: 'auto',
          left: '50%',
          top: 0,
          transform: `translateX(-50%) translate(${tx}px, ${ty}px) scale(${s}) rotate(${rotate}deg)`,
          filter: `brightness(${brightness}) contrast(1.15) saturate(1.2)`,
        }}
      />
      {/* tint laranja e vinheta */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(245,130,32,0.10) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,${vignette}) 100%)`,
          mixBlendMode: 'normal',
        }}
      />
    </AbsoluteFill>
  );
};

/** Feixes de luz de palco varrendo a cena. */
export const StageBeams: React.FC<{count?: number; intensity?: number; seed?: string}> = ({
  count = 5,
  intensity = 1,
  seed = 'beams',
}) => {
  const f = useCurrentFrame();
  const pulse = beatPulse(f, 8);
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {new Array(count).fill(0).map((_, i) => {
        const baseX = (i + 0.5) * (W / count);
        const phase = random(`${seed}${i}`) * Math.PI * 2;
        const angle = Math.sin(f / 28 + phase) * 22;
        const op = (0.22 + 0.25 * pulse) * intensity * (0.6 + 0.4 * random(`${seed}o${i}`));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: baseX - 160,
              top: -120,
              width: 320,
              height: H * 1.1,
              transformOrigin: '50% 0%',
              transform: `rotate(${angle}deg)`,
              background: `linear-gradient(180deg, rgba(255,170,90,${op}) 0%, rgba(245,130,32,${op * 0.5}) 35%, rgba(245,130,32,0) 85%)`,
              clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)',
              filter: 'blur(14px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Barras de onda sonora reativas à batida. */
export const Waveform: React.FC<{
  y: number;
  height?: number;
  bars?: number;
  opacity?: number;
  mirrored?: boolean;
  color?: string;
}> = ({y, height = 240, bars = 64, opacity = 1, mirrored = true, color = C.orange}) => {
  const f = useCurrentFrame();
  const pulse = beatPulse(f, 5);
  const gap = 4;
  const bw = (W - 80) / bars - gap;
  return (
    <div style={{position: 'absolute', left: 40, top: y - height / 2, width: W - 80, height, opacity}}>
      {new Array(bars).fill(0).map((_, i) => {
        const c = i / (bars - 1) - 0.5;
        const shape = Math.exp(-c * c * 9);
        const n =
          0.5 +
          0.5 *
            Math.sin(f * 0.35 + i * 0.7 + random(`w${i}`) * 6) *
            Math.cos(f * 0.13 + i * 0.31);
        const h = Math.max(6, height * shape * (0.25 + 0.5 * n + 0.35 * pulse));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * (bw + gap),
              top: mirrored ? height / 2 - h / 2 : height - h,
              width: bw,
              height: h,
              borderRadius: bw / 2,
              background: color,
              boxShadow: `0 0 18px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
};

/** Partículas/faíscas subindo. */
export const Particles: React.FC<{count?: number; seed?: string; speed?: number; burstAt?: number}> = ({
  count = 70,
  seed = 'p',
  speed = 1,
  burstAt,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}${k}${i}`);
        const life = 60 + r('l') * 90;
        const t = ((f * speed + r('t') * life) % life) / life;
        let x = r('x') * W + Math.sin(f / 20 + r('s') * 6) * 30;
        let y = H * (1.05 - t * (0.6 + r('h') * 0.6));
        let size = 3 + r('z') * 9;
        let op = Math.sin(t * Math.PI) * (0.4 + r('o') * 0.6);
        if (burstAt !== undefined && f >= burstAt) {
          const bt = f - burstAt;
          const ang = r('a') * Math.PI * 2;
          const v = 10 + r('v') * 34;
          const bx = W / 2 + Math.cos(ang) * v * bt * Math.exp(-bt / 40);
          const by = H * 0.42 + Math.sin(ang) * v * bt * Math.exp(-bt / 40) + bt * bt * 0.05;
          const bop = interpolate(bt, [0, 50], [1, 0], {extrapolateRight: 'clamp'});
          if (bop > 0) {
            x = bx;
            y = by;
            size *= 1.4;
            op = Math.max(op, bop);
          }
        }
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: i % 4 === 0 ? '#FFE2C2' : C.orange,
              opacity: op,
              boxShadow: `0 0 ${size * 2.5}px ${C.orange}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Grade tecnológica em perspectiva (piso de palco). */
export const TechGrid: React.FC<{opacity?: number}> = ({opacity = 0.35}) => {
  const f = useCurrentFrame();
  const off = (f * 4) % 120;
  return (
    <AbsoluteFill style={{perspective: 900, opacity, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: -W,
          width: W * 3,
          top: H * 0.62,
          height: H,
          transform: 'rotateX(72deg)',
          transformOrigin: '50% 0%',
          backgroundImage: `linear-gradient(rgba(245,130,32,0.7) 2px, transparent 2px), linear-gradient(90deg, rgba(245,130,32,0.7) 2px, transparent 2px)`,
          backgroundSize: '120px 120px',
          backgroundPosition: `0 ${off}px`,
          maskImage: 'linear-gradient(180deg, transparent 0%, black 30%, black 60%, transparent 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Flash branco/laranja de transição. */
export const Flash: React.FC<{at: number; dur?: number; color?: string; peak?: number}> = ({
  at,
  dur = 10,
  color = '#FFD3A6',
  peak = 0.9,
}) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [at - 2, at, at + dur], [0, peak, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  if (op <= 0) return null;
  return <AbsoluteFill style={{background: color, opacity: op, mixBlendMode: 'screen'}} />;
};

/** Linhas de scan + grão para acabamento premium. */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 4px)',
          backgroundPosition: `0 ${(f * 2) % 4}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Tremor de câmera no impacto. */
export const useShake = (at: number, amount = 18, dur = 14) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > dur) return 'translate(0px,0px)';
  const k = (1 - t / dur) * amount;
  return `translate(${Math.sin(t * 2.7) * k}px, ${Math.cos(t * 3.3) * k}px)`;
};
