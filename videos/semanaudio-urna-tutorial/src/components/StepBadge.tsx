import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_DISPLAY, FONT_TEXT, SAFE} from '../theme';
import {Tag, Title} from './Title';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Cabeçalho do passo: selo "PASSO 0N", instrução curta e progresso. */
export const StepBadge: React.FC<{
  index: number;
  total: number;
  title: string;
  highlight?: string[];
  note?: string;
}> = ({index, total, title, highlight, note}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 15, stiffness: 160}});
  const bg = interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: SAFE.top - 60, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: 0,
          right: 0,
          height: 620,
          background: `linear-gradient(180deg, rgba(0,0,0,${0.92 * bg}) 0%, rgba(0,0,0,${0.7 * bg}) 55%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: 'relative',
          transform: `scale(${s}) skewX(-8deg)`,
          background: `linear-gradient(90deg, ${C.orangeDeep}, ${C.orange})`,
          padding: '6px 34px 2px',
          boxShadow: '0 10px 40px rgba(245,130,32,0.45)',
        }}
      >
        <div style={{transform: 'skewX(8deg)', fontFamily: FONT_DISPLAY, fontSize: 76, color: C.white, letterSpacing: 4, lineHeight: 1}}>
          PASSO {pad2(index + 1)}
        </div>
      </div>
      <div style={{position: 'relative', display: 'flex', gap: 10, marginTop: 18}}>
        {new Array(total).fill(0).map((_, i) => (
          <div key={i} style={{width: i === index ? 46 : 14, height: 8, borderRadius: 4, background: i <= index ? C.orange : 'rgba(255,255,255,0.3)'}} />
        ))}
      </div>
      <Title text={title} at={6} size={92} highlight={highlight} style={{position: 'relative', marginTop: 22, maxWidth: 960}} />
      {note ? (
        <div style={{position: 'relative', marginTop: 10, fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 36, color: C.grey, opacity: interpolate(f, [14, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          {note}
        </div>
      ) : null}
    </div>
  );
};

/** Selo exibido no trecho que mostra o resultado da ação. */
export const ResultSeal: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 200}});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: SAFE.bottom - 120, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          transform: `scale(${s})`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'rgba(10,8,6,0.88)',
          border: `3px solid ${C.orange}`,
          borderRadius: 60,
          padding: '14px 34px',
          fontFamily: FONT_TEXT,
          fontWeight: 900,
          fontSize: 40,
          letterSpacing: 3,
          color: C.white,
        }}
      >
        <svg width="44" height="44" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill={C.orange} />
          <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        RESULTADO
      </div>
    </div>
  );
};

/** Etiqueta do trecho (ex.: "CATEGORIA 2/5"). */
export const SegLabel: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: SAFE.bottom - 110, display: 'flex', justifyContent: 'center'}}>
    <Tag at={0} size={40} dark>{text}</Tag>
  </div>
);
