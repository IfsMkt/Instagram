import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_DISPLAY, FONT_TEXT} from '../theme';

type Style = React.CSSProperties;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Título: palavras sobem de uma máscara, uma a uma; destaques em laranja. */
export const Title: React.FC<{
  text: string;
  at?: number;
  size: number;
  highlight?: string[];
  stagger?: number;
  font?: string;
  weight?: number;
  color?: string;
  exitAt?: number;
  style?: Style;
}> = ({text, at = 0, size, highlight = [], stagger = 3, font = FONT_DISPLAY, weight = 400, color = C.white, exitAt, style}) => {
  const f = useCurrentFrame();
  const exit = exitAt === undefined ? 0 : interpolate(f, [exitAt, exitAt + 8], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const norm = (w: string) => w.replace(/[!?,.:]/g, '').toUpperCase();
  const hl = highlight.map(norm);
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: `0 ${size * 0.22}px`,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 0.98,
        color,
        textAlign: 'center',
        letterSpacing: font === FONT_DISPLAY ? size * 0.01 : -size * 0.02,
        opacity: 1 - exit,
        transform: `translateY(${-exit * 50}px)`,
        filter: exit > 0 ? `blur(${exit * 10}px)` : undefined,
        ...style,
      }}
    >
      {text.split(' ').map((w, i) => {
        if (w === '|') return <div key={i} style={{flexBasis: '100%', height: 0}} />;
        const p = interpolate(f, [at + i * stagger, at + i * stagger + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
        const isHl = hl.includes(norm(w));
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingTop: size * 0.06, paddingBottom: size * 0.02}}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - p) * 110}%)`,
                color: isHl ? C.orange : undefined,
                textShadow: isHl ? `0 0 ${size * 0.3}px rgba(245,130,32,0.55)` : '0 6px 30px rgba(0,0,0,0.75)',
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Entrada com impacto (escala + desfoque). */
export const Slam: React.FC<{children: React.ReactNode; at?: number; from?: number; style?: Style}> = ({children, at = 0, from = 1.8, style}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 14, stiffness: 170, mass: 0.7}});
  return (
    <div
      style={{
        transform: `scale(${interpolate(s, [0, 1], [from, 1])})`,
        opacity: interpolate(f, [at, at + 4], [0, 1], clamp),
        filter: `blur(${interpolate(f, [at, at + 7], [14, 0], clamp)}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Faixa laranja inclinada (mesmo desenho do "SALVADOR - BA" do logo). */
export const Tag: React.FC<{children: React.ReactNode; at?: number; size?: number; dark?: boolean; style?: Style}> = ({
  children,
  at = 0,
  size = 44,
  dark,
  style,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <div
      style={{
        display: 'inline-block',
        clipPath: `polygon(0 0, ${p * 100}% 0, ${p * 100 - 3}% 100%, 0 100%)`,
        background: dark ? 'rgba(10,8,6,0.85)' : `linear-gradient(90deg, ${C.orangeDeep}, ${C.orange})`,
        border: dark ? `3px solid ${C.orange}` : undefined,
        color: C.white,
        fontFamily: FONT_TEXT,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: size * 0.04,
        padding: `${size * 0.28}px ${size * 0.75}px ${size * 0.28}px ${size * 0.6}px`,
        transform: 'skewX(-8deg)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <div style={{transform: 'skewX(8deg)'}}>{children}</div>
    </div>
  );
};

/** Logo oficial SemanÁudio 2026 (arquivo do site oficial; nunca recriado). */
export const Logo: React.FC<{width: number; style?: Style}> = ({width, style}) => (
  <Img src={staticFile('brand/semanaudio-2026-logo.png')} style={{width, height: 'auto', ...style}} />
);
