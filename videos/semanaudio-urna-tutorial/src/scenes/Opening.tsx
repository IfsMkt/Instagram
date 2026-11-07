import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {OPENING} from '../edit';
import {Backdrop, StageLight} from '../components/Backgrounds';
import {Footage, FootagePlaceholder} from '../components/Footage';
import {Title} from '../components/Title';
import {C} from '../theme';

/** CENA 1 — Abertura (0–4 s): enquadramento real da urna + pergunta. */
export const Opening: React.FC = () => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [0, 3, 14], [0, 0.55, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.black}}>
      {OPENING ? <Footage seg={OPENING} dim={0.4} captions={false} /> : <FootagePlaceholder />}
      <Backdrop glowY={0.4} glow={0.9} />
      <StageLight intensity={1.1} />
      <AbsoluteFill style={{background: C.orangeHot, opacity: flash, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{justifyContent: 'center', padding: '0 70px'}}>
        <Title text="JÁ SABE COMO PARTICIPAR DO SORTEIO?" at={3} size={150} highlight={['SORTEIO?']} exitAt={56} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', padding: '0 70px'}}>
        <Title text="APRENDA A USAR A URNA DA SEMANÁUDIO!" at={62} size={150} highlight={['URNA']} />
      </AbsoluteFill>
      <Audio src={staticFile('audio/impacto.wav')} volume={0.7} />
    </AbsoluteFill>
  );
};
