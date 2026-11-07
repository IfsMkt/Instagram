import React from 'react';
import {C, FONT_TEXT} from '../theme';

/** Legenda da fala original (para quem assiste sem som). */
export const Caption: React.FC<{text: string; top?: number}> = ({text, top = 1340}) => (
  <div style={{position: 'absolute', left: 80, right: 80, top, display: 'flex', justifyContent: 'center'}}>
    <div
      style={{
        background: 'rgba(0,0,0,0.78)',
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
      {text}
    </div>
  </div>
);
