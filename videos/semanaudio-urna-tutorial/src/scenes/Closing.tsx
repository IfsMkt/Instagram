import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CLOSING} from '../edit';
import {StageLight} from '../components/Backgrounds';
import {EndCard} from '../components/EndCard';
import {Footage} from '../components/Footage';
import {Tag, Title} from '../components/Title';
import {C, H} from '../theme';

/** Foto oficial do evento (site SemanÁudio), usada se não houver CLOSING. */
const EventPhoto: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, dur], [1.05, 1.18]);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile('img/truss-waves.jpg')} style={{position: 'absolute', height: H, left: '50%', transform: `translateX(-50%) scale(${s})`, filter: 'brightness(0.55) contrast(1.1)'}} />
    </AbsoluteFill>
  );
};

/** CENA 5 — Encerramento. */
export const Closing: React.FC<{dur: number}> = ({dur}) => {
  const endAt = dur - 100;
  return (
    <AbsoluteFill style={{background: C.black}}>
      {CLOSING ? <Footage seg={CLOSING} dim={0.3} captions={false} /> : <EventPhoto dur={dur} />}
      <StageLight intensity={0.8} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.75))'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 40, padding: '0 70px'}}>
        <Title text="PARTICIPE E BOA SORTE!" size={170} highlight={['BOA', 'SORTE!']} at={6} exitAt={endAt - 8} />
        <Title text="SEMANÁUDIO 2026" size={90} at={30} exitAt={endAt - 8} />
        <Tag at={44} size={42}>10 A 12 DE NOVEMBRO | SALVADOR – BA</Tag>
      </AbsoluteFill>
      <EndCard at={endAt} />
      <Audio src={staticFile('audio/impacto.wav')} volume={0.4} startFrom={0} />
    </AbsoluteFill>
  );
};
