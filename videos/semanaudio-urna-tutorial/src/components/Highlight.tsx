import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Box} from '../edit';
import {C} from '../theme';
import {mapBox, Zoom} from './Footage';

/** Destaque da área de interação: cantoneiras laranja + pulso de luz. */
export const Highlight: React.FC<{box: Box; z: Zoom; at?: number}> = ({box, z, at = 12}) => {
  const f = useCurrentFrame();
  const r = mapBox(box, z);
  const p = interpolate(f, [at, at + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (p <= 0) return null;
  const pulse = 0.5 + 0.5 * Math.sin((f - at) / 5);
  const pad = 14 + (1 - p) * 40;
  const L = Math.min(70, r.width / 3, r.height / 3);
  const corner = (s: React.CSSProperties): React.CSSProperties => ({position: 'absolute', width: L, height: L, borderColor: C.orange, borderStyle: 'solid', borderWidth: 0, ...s});
  return (
    <div style={{position: 'absolute', left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2, opacity: p}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 22,
          boxShadow: `0 0 ${30 + 30 * pulse}px rgba(245,130,32,${0.35 + 0.3 * pulse}), inset 0 0 ${20 + 20 * pulse}px rgba(245,130,32,0.25)`,
          border: `2px solid rgba(245,130,32,0.45)`,
        }}
      />
      <div style={corner({left: 0, top: 0, borderLeftWidth: 8, borderTopWidth: 8, borderTopLeftRadius: 22})} />
      <div style={corner({right: 0, top: 0, borderRightWidth: 8, borderTopWidth: 8, borderTopRightRadius: 22})} />
      <div style={corner({left: 0, bottom: 0, borderLeftWidth: 8, borderBottomWidth: 8, borderBottomLeftRadius: 22})} />
      <div style={corner({right: 0, bottom: 0, borderRightWidth: 8, borderBottomWidth: 8, borderBottomRightRadius: 22})} />
    </div>
  );
};
