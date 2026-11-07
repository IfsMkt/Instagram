import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT_TEXT} from '../theme';
import {DotGrid, Waveform} from './Backgrounds';
import {Logo} from './Title';

/** Assinatura final: logo oficial sobre fundo preto com ondas. */
export const EndCard: React.FC<{at?: number}> = ({at = 0}) => {
  const f = useCurrentFrame() - at;
  const p = interpolate(f, [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  if (f < 0) return null;
  return (
    <AbsoluteFill style={{background: `rgba(0,0,0,${p})`, alignItems: 'center', justifyContent: 'center'}}>
      <DotGrid opacity={0.25 * p} />
      <Waveform y={1180} height={160} opacity={0.6 * p} />
      <div style={{opacity: p, transform: `scale(${0.9 + 0.1 * p})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
        <Logo width={900} />
        <div style={{fontFamily: FONT_TEXT, fontWeight: 800, fontSize: 38, letterSpacing: 6, color: C.white}}>
          10 A 12 DE NOVEMBRO · SALVADOR – BA
        </div>
      </div>
    </AbsoluteFill>
  );
};
