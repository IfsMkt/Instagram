import React from 'react';
import {Composition} from 'remotion';
import {Compradores} from './Compradores';
import CT from './compradores.json';
import {Game} from './Game';
import {H, TL, W} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="GamificacaoPixel" component={Game} durationInFrames={TL.total} fps={TL.fps} width={W} height={H} />
    <Composition id="GrandesCompradores" component={Compradores} durationInFrames={CT.total} fps={CT.fps} width={W} height={H} />
  </>
);
