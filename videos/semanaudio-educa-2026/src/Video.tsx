import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CUES} from './captions';
import {Finish} from './fx';
import {loadFonts} from './fonts';
import {SceneClose, SceneDeadline, SceneDiscount, SceneHook, SceneIntro, ScenePrize} from './scenes';
import {C, FONT_TEXT, SCENES, TOTAL} from './theme';

loadFonts();

export type VideoProps = {
  /** Caminho (em public/) da logo oficial do Educa Áudio. null = espaço reservado. */
  educaLogo: string | null;
  /** Caminho (em public/) da locução gravada. null = vídeo só com trilha. */
  narration: string | null;
  /** Legendas queimadas da narração. */
  showCaptions: boolean;
};

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const cue = CUES.find((c) => f >= c.from && f < c.to);
  if (!cue) return null;
  const op = interpolate(f, [cue.from, cue.from + 4, cue.to - 3, cue.to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        right: 90,
        top: 1430,
        display: 'flex',
        justifyContent: 'center',
        opacity: op,
      }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.72)',
          borderLeft: `6px solid ${C.orange}`,
          borderRadius: 12,
          padding: '14px 26px',
          color: C.white,
          fontFamily: FONT_TEXT,
          fontWeight: 700,
          fontSize: 40,
          lineHeight: 1.25,
          textAlign: 'center',
          maxWidth: 900,
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};

export const PromoVideo: React.FC<VideoProps> = ({educaLogo, narration, showCaptions}) => {
  const f = useCurrentFrame();
  // trilha abaixa (ducking) quando houver locução
  const musicVol = narration ? 0.32 : 0.9;
  const fadeOut = interpolate(f, [TOTAL - 30, TOTAL], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.black}}>
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.dur} name="1 · Gancho">
        <SceneHook />
      </Sequence>
      <Sequence from={SCENES.intro.from} durationInFrames={SCENES.intro.dur} name="2 · Apresentação">
        <SceneIntro educaLogo={educaLogo} />
      </Sequence>
      <Sequence from={SCENES.discount.from} durationInFrames={SCENES.discount.dur} name="3 · 15% OFF">
        <SceneDiscount />
      </Sequence>
      <Sequence from={SCENES.prize.from} durationInFrames={SCENES.prize.dur} name="4 · 10 Cupons">
        <ScenePrize />
      </Sequence>
      <Sequence from={SCENES.deadline.from} durationInFrames={SCENES.deadline.dur} name="5 · Prazo">
        <SceneDeadline />
      </Sequence>
      <Sequence from={SCENES.close.from} durationInFrames={SCENES.close.dur} name="6 · Encerramento">
        <SceneClose educaLogo={educaLogo} />
      </Sequence>
      <Finish />
      {showCaptions ? <Captions /> : null}
      <Audio src={staticFile('audio/trilha.wav')} volume={() => musicVol * fadeOut} />
      {narration ? <Audio src={staticFile(narration)} volume={1} /> : null}
    </AbsoluteFill>
  );
};
