import React from 'react';
import {AbsoluteFill, Audio, Sequence, Series, staticFile} from 'remotion';
import {STEPS} from '../edit';
import {Footage, FootagePlaceholder} from '../components/Footage';
import {Highlight} from '../components/Highlight';
import {ResultSeal, StepBadge} from '../components/StepBadge';
import {Title} from '../components/Title';
import {segFrames, stepFrames} from '../timeline';
import {C, FONT_TEXT, SAFE} from '../theme';

/**
 * CENA 3 — Passo a passo real, montado a partir de src/edit.ts.
 * Cada passo: ação (zoom + destaque) -> resultado, com selo PASSO 0N.
 */
export const Steps: React.FC = () => {
  if (!STEPS.length) return <StepsPending />;
  return (
    <Series>
      {STEPS.map((step, i) => (
        <Series.Sequence key={i} durationInFrames={stepFrames[i]} name={`Passo ${i + 1}`}>
          <Series>
            {step.segments.map((seg, k) => (
              <Series.Sequence key={k} durationInFrames={segFrames(seg)}>
                <Footage seg={seg}>{(z) => (seg.focus ? <Highlight box={seg.focus} z={z} /> : null)}</Footage>
                {seg.result ? <ResultSeal /> : null}
              </Series.Sequence>
            ))}
          </Series>
          <StepBadge index={i} total={STEPS.length} title={step.title} highlight={step.highlight} note={step.note} />
          <Sequence durationInFrames={10}>
            <Audio src={staticFile('audio/pop.wav')} volume={0.45} />
          </Sequence>
        </Series.Sequence>
      ))}
    </Series>
  );
};

/** Enquanto a gravação não for analisada: nenhum passo é inventado. */
const StepsPending: React.FC = () => (
  <AbsoluteFill style={{background: C.black}}>
    <FootagePlaceholder label="PASSO A PASSO REAL" />
    <div style={{position: 'absolute', top: SAFE.top - 40, left: 0, right: 0}}>
      <Title text="PASSO A PASSO DA URNA" size={110} highlight={['URNA']} at={2} />
    </div>
    <div style={{position: 'absolute', top: SAFE.bottom + 60, left: 120, right: 120, textAlign: 'center', fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 34, color: C.grey}}>
      Os passos (PASSO 01, 02…) serão definidos a partir da análise da gravação original.
    </div>
  </AbsoluteFill>
);
