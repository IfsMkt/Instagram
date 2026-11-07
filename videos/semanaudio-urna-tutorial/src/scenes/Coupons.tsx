import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, DotGrid, Waveform} from '../components/Backgrounds';
import {BagIcon, CoinIcon, TicketIcon} from '../components/Icons';
import {Tag, Title} from '../components/Title';
import {C, FONT_DISPLAY, FONT_TEXT} from '../theme';

const Rule: React.FC<{at: number; icon: React.ReactNode; big: string; small: string}> = ({at, icon, big, small}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 16, stiffness: 150}});
  const eq = interpolate(f, [at + 12, at + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))});
  return (
    <div
      style={{
        width: 960,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '30px 34px',
        background: `linear-gradient(90deg, ${C.graphite2}, rgba(22,19,15,0.92))`,
        borderLeft: `10px solid ${C.orange}`,
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        transform: `translateX(${(1 - s) * 1100}px)`,
      }}
    >
      <div style={{flexShrink: 0}}>{icon}</div>
      <div style={{flex: 1}}>
        <div style={{fontFamily: FONT_DISPLAY, fontSize: 92, color: C.white, lineHeight: 0.95, whiteSpace: 'nowrap'}}>{big}</div>
        <div style={{fontFamily: FONT_TEXT, fontWeight: 800, fontSize: 38, color: C.orange, letterSpacing: 1}}>{small}</div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, transform: `scale(${eq})`}}>
        <div style={{fontFamily: FONT_DISPLAY, fontSize: 110, color: C.orange}}>=</div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <TicketIcon size={150} />
          <div style={{fontFamily: FONT_DISPLAY, fontSize: 58, color: C.white, marginTop: 4}}>1 CUPOM</div>
        </div>
      </div>
    </div>
  );
};

/** CENA 2 — Como conseguir cupons (4–12 s). */
export const Coupons: React.FC = () => (
  <AbsoluteFill style={{background: C.black}}>
    <Backdrop glowY={0.5} />
    <DotGrid opacity={0.3} />
    <Waveform y={1650} height={140} opacity={0.35} />
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 300, gap: 56}}>
      <Title text="COMO CONSEGUIR CUPONS?" size={140} highlight={['CUPONS?']} at={4} style={{maxWidth: 900}} />
      <Rule at={26} icon={<CoinIcon size={150} />} big="1.000 MOEDAS" small="NAS MISSÕES" />
      <Rule at={70} icon={<BagIcon size={150} />} big="R$ 1.000" small="EM COMPRAS" />
      <div style={{marginTop: 20}}>
        <Tag at={120} size={40}>AS DUAS FORMAS SÃO INDEPENDENTES</Tag>
      </div>
    </AbsoluteFill>
    <Sequence from={26}><Audio src={staticFile('audio/pop.wav')} volume={0.5} /></Sequence>
    <Sequence from={70}><Audio src={staticFile('audio/pop.wav')} volume={0.5} /></Sequence>
  </AbsoluteFill>
);
