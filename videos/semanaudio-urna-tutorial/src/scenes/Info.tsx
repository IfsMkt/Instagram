import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Backdrop, DotGrid, Waveform} from '../components/Backgrounds';
import {CalendarIcon, PinIcon} from '../components/Icons';
import {Slam, Tag, Title} from '../components/Title';
import {OrangeTransition} from '../components/Transition';
import {C, FONT_TEXT} from '../theme';

const Panel: React.FC<{kicker: string; icon: React.ReactNode; title: string; hl: string[]; place: string}> = ({kicker, icon, title, hl, place}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 34, padding: '0 70px'}}>
    <div style={{fontFamily: FONT_TEXT, fontWeight: 800, fontSize: 36, letterSpacing: 8, color: C.orange}}>{kicker}</div>
    <Slam at={2}>{icon}</Slam>
    <Title text={title} size={136} highlight={hl} at={8} style={{maxWidth: 940}} />
    <Tag at={34} size={56}>{place}</Tag>
    <Sequence from={34}><Audio src={staticFile('audio/pop.wav')} volume={0.45} /></Sequence>
  </AbsoluteFill>
);

/** CENA 4 — Informações importantes. */
export const Info: React.FC<{dur: number}> = ({dur}) => {
  const half = Math.round(dur / 2);
  return (
    <AbsoluteFill style={{background: C.black}}>
      <Backdrop glowY={0.45} />
      <DotGrid opacity={0.3} />
      <Waveform y={1650} height={140} opacity={0.35} />
      <Sequence durationInFrames={half} name="Central de troca">
        <Panel kicker="ONDE TROCAR" icon={<PinIcon size={170} />} title="CENTRAL DE TROCA DE CUPONS" hl={['CUPONS']} place="PAVILHÃO SUBWOOFER" />
      </Sequence>
      <Sequence from={half} name="Sorteio">
        <Panel kicker="QUANDO É O SORTEIO" icon={<CalendarIcon size={170} />} title="SORTEIO: | 12/11, ÀS 17H" hl={['12/11,', '17H']} place="PALCO LUZBEL" />
      </Sequence>
      <OrangeTransition at={half} />
    </AbsoluteFill>
  );
};
