import React from 'react';
import {Composition} from 'remotion';
import {UrnaTutorial} from './Video';
import {FPS, H, W} from './theme';
import {TOTAL} from './timeline';

export const RemotionRoot: React.FC = () => (
  <Composition id="UrnaTutorial" component={UrnaTutorial} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);
