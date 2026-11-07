import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';

const DUR = 16;

/** Varredura laranja diagonal que cobre o corte entre cenas (+ whoosh). */
const Wipe: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, DUR], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const x = interpolate(p, [0, 1], [-W * 2.1, W * 2.1]);
  const bar = (w: number, color: string, off: number) => (
    <div style={{position: 'absolute', top: -H * 0.25, left: W / 2 - w / 2 + x + off, width: w, height: H * 1.5, background: color, transform: 'rotate(18deg)'}} />
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {bar(W * 1.7, C.orange, 0)}
      {bar(120, C.orangeHot, -W * 1.05)}
      {bar(60, C.orangeDeep, W * 1.0)}
    </AbsoluteFill>
  );
};

/** Coloque uma por corte: `at` = frame do corte (a cobertura total acontece nele). */
export const OrangeTransition: React.FC<{at: number}> = ({at}) => (
  <Sequence from={at - DUR / 2} durationInFrames={DUR} name="transição">
    <Wipe />
    <Audio src={staticFile('audio/whoosh.wav')} volume={0.45} />
  </Sequence>
);
