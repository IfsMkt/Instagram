import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';

/** 100 BPM = 18 frames por tempo, igual à trilha. */
export const BEAT = 18;
export const beatPulse = (f: number, decay = 6) => Math.exp(-(f % BEAT) / decay);

/** Fundo preto/grafite com brilho laranja suave. */
export const Backdrop: React.FC<{glowY?: number; glow?: number}> = ({glowY = 0.42, glow = 1}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 80% 45% at 50% ${glowY * 100}%, rgba(245,130,32,${0.22 * glow}) 0%, rgba(34,29,24,0.9) 45%, ${C.black} 100%)`,
    }}
  />
);

/** Malha pontilhada (elemento gráfico da identidade). */
export const DotGrid: React.FC<{opacity?: number; drift?: number; size?: number}> = ({opacity = 0.35, drift = 0.6, size = 34}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage: `radial-gradient(circle, rgba(245,130,32,0.9) 2.2px, transparent 2.6px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `0 ${(f * drift) % size}px`,
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 85%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 85%)',
      }}
    />
  );
};

/** Barras de onda sonora no ritmo da trilha. */
export const Waveform: React.FC<{y: number; height?: number; bars?: number; opacity?: number; color?: string}> = ({
  y,
  height = 200,
  bars = 56,
  opacity = 1,
  color = C.orange,
}) => {
  const f = useCurrentFrame();
  const pulse = beatPulse(f, 5);
  const gap = 5;
  const bw = (W - 80) / bars - gap;
  return (
    <div style={{position: 'absolute', left: 40, top: y - height / 2, width: W - 80, height, opacity}}>
      {new Array(bars).fill(0).map((_, i) => {
        const c = i / (bars - 1) - 0.5;
        const shape = Math.exp(-c * c * 9);
        const n = 0.5 + 0.5 * Math.sin(f * 0.3 + i * 0.7 + random(`w${i}`) * 6) * Math.cos(f * 0.11 + i * 0.31);
        const h = Math.max(6, height * shape * (0.25 + 0.5 * n + 0.25 * pulse));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * (bw + gap),
              top: height / 2 - h / 2,
              width: bw,
              height: h,
              borderRadius: bw / 2,
              background: color,
              boxShadow: `0 0 14px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
};

/** Feixes de luz laranja (iluminação de palco) para a abertura. */
export const StageLight: React.FC<{intensity?: number}> = ({intensity = 1}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {[0, 1, 2, 3].map((i) => {
        const angle = Math.sin(f / 26 + i * 1.7) * 18 + (i - 1.5) * 10;
        const op = (0.18 + 0.15 * beatPulse(f, 8)) * intensity;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (i + 0.5) * (W / 4) - 170,
              top: -140,
              width: 340,
              height: H * 1.1,
              transformOrigin: '50% 0%',
              transform: `rotate(${angle}deg)`,
              background: `linear-gradient(180deg, rgba(255,170,90,${op}) 0%, rgba(245,130,32,${op * 0.45}) 40%, transparent 85%)`,
              clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)',
              filter: 'blur(16px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Vinheta + linhas finas para acabamento. */
export const Finish: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(0,0,0,0.6) 100%)'}} />
);
