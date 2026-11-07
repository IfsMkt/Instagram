import React from 'react';
import {Composition} from 'remotion';
import {PromoVideo, VideoProps} from './Video';
import {FPS, H, TOTAL, W} from './theme';

const defaults: VideoProps = {
  educaLogo: null, // ex.: 'brand/educa-audio-logo.png'
  narration: null, // ex.: 'audio/narracao.mp3'
  showCaptions: true,
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="SemanaudioEducaReels"
    component={PromoVideo}
    durationInFrames={TOTAL}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={defaults}
  />
);
