import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Finish} from './components/Backgrounds';
import {OrangeTransition} from './components/Transition';
import {loadFonts} from './fonts';
import {Closing} from './scenes/Closing';
import {Coupons} from './scenes/Coupons';
import {Info} from './scenes/Info';
import {Opening} from './scenes/Opening';
import {Steps} from './scenes/Steps';
import {SOURCE} from './edit';
import {C} from './theme';
import {CUTS, T, TOTAL} from './timeline';

loadFonts();

/** Trilha discreta; abaixa mais durante a demonstração (onde está a voz). */
const Music: React.FC = () => {
  const f = useCurrentFrame();
  const inSteps = f >= T.steps.from && f < T.steps.from + T.steps.dur;
  const base = inSteps && SOURCE ? 0.12 : 0.32;
  const fade = interpolate(f, [TOTAL - 45, TOTAL], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <Audio src={staticFile('audio/trilha.wav')} volume={base * fade} />;
};

export const UrnaTutorial: React.FC = () => (
  <AbsoluteFill style={{background: C.black}}>
    <Sequence from={T.opening.from} durationInFrames={T.opening.dur} name="1 · Abertura">
      <Opening />
    </Sequence>
    <Sequence from={T.coupons.from} durationInFrames={T.coupons.dur} name="2 · Cupons">
      <Coupons />
    </Sequence>
    <Sequence from={T.steps.from} durationInFrames={T.steps.dur} name="3 · Passo a passo">
      <Steps />
    </Sequence>
    <Sequence from={T.info.from} durationInFrames={T.info.dur} name="4 · Informações">
      <Info dur={T.info.dur} />
    </Sequence>
    <Sequence from={T.closing.from} durationInFrames={T.closing.dur} name="5 · Encerramento">
      <Closing dur={T.closing.dur} />
    </Sequence>
    <Finish />
    {CUTS.map((c) => (
      <OrangeTransition key={c} at={c} />
    ))}
    <Music />
  </AbsoluteFill>
);
