import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COIN, COUPON, PAL, Sprite, TROPHY} from './pixel';
import {H, PIXEL_FONT, PX, W} from './theme';

const shadow = (n = PX / 2) => `${n}px ${n}px 0 #14101c`;

/** Borda pixelada de caixa (estilo RPG). */
export const pixelFrame = (bg = '#10131f'): React.CSSProperties => ({
  background: bg,
  boxShadow: [
    `0 0 0 ${PX / 2}px #ffffff`,
    `0 0 0 ${PX}px #14101c`,
    `${PX}px ${PX}px 0 ${PX}px rgba(0,0,0,0.6)`,
    `inset 0 -${PX / 2}px 0 #23284a`,
  ].join(','),
});

/* Botão "A" de controle */
const ButtonA: React.FC<{pressed: boolean}> = ({pressed}) => (
  <div
    style={{
      width: 74,
      height: 74,
      borderRadius: '50%',
      background: pressed ? PAL.o : PAL.R,
      boxShadow: pressed ? `0 2px 0 #5a120f, 0 0 0 5px #14101c` : `0 8px 0 #5a120f, 0 0 0 5px #14101c`,
      transform: `translateY(${pressed ? 6 : 0}px)`,
      color: '#fff',
      fontFamily: PIXEL_FONT,
      fontSize: 30,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    A
  </div>
);

const Cursor: React.FC = () => <Sprite rows={['K....', 'OK...', 'OOK..', 'OOOK.', 'OOK..', 'OK...', 'K....']} px={6} />;

/** Caixa de diálogo com texto digitado e opção a confirmar. */
export const Dialog: React.FC<{
  start: number;
  end: number;
  press: number;
  title: string;
  icon?: React.ReactNode;
  lines: string[];
  option: string;
  result?: string;
  top?: number;
}> = ({start, end, press, title, icon, lines, option, result, top = 380}) => {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  // abre/fecha em "degraus" (animação pixelada)
  const open = Math.min(1, Math.floor((f - start) / 2) / 4);
  const close = Math.min(1, Math.max(0, Math.floor((end - f) / 2) / 4));
  const k = Math.min(open, close);
  const chars = Math.max(0, Math.floor((f - start - 8) * 1.6));
  let used = 0;
  const pressed = f >= press && f < press + 6;
  const done = f >= press;
  const blink = Math.floor(f / 8) % 2 === 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        width: W - 140,
        top,
        transform: `scaleY(${k})`,
        transformOrigin: '50% 50%',
        ...pixelFrame(),
        padding: '40px 44px 40px',
        color: '#fff',
        fontFamily: PIXEL_FONT,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 30}}>
        {icon}
        <div style={{fontSize: 38, color: PAL.O, textShadow: shadow(4), lineHeight: 1.3}}>{title}</div>
      </div>
      {lines.map((line, i) => {
        const vis = line.slice(0, Math.max(0, chars - used));
        used += line.length;
        return (
          <div key={i} style={{fontSize: 30, lineHeight: 1.6, minHeight: 48, textShadow: shadow(3)}}>
            {vis}
          </div>
        );
      })}
      <div style={{height: 26}} />
      {done && result ? (
        <div style={{fontSize: 32, color: PAL.Y, textShadow: shadow(3), lineHeight: 1.5, opacity: Math.floor(f / 4) % 2 || f > press + 16 ? 1 : 0.4}}>
          {result}
        </div>
      ) : (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: chars > used ? 1 : 0}}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '16px 18px',
              background: pressed ? PAL.O : 'transparent',
              fontSize: 30,
              color: pressed ? '#14101c' : '#fff',
              textShadow: pressed ? 'none' : shadow(3),
            }}
          >
            <div style={{opacity: blink || pressed ? 1 : 0}}>
              <Cursor />
            </div>
            {option}
          </div>
          <ButtonA pressed={pressed} />
        </div>
      )}
    </div>
  );
};

/** Texto que salta no meio da tela (MISSÃO COMPLETA! etc.). */
export const Banner: React.FC<{start: number; end: number; text: string; sub?: string; top?: number; color?: string; size?: number}> = ({
  start,
  end,
  text,
  sub,
  top = 520,
  color = PAL.Y,
  size = 64,
}) => {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  const t = f - start;
  const steps = [0.2, 0.6, 1.25, 1.1, 0.95, 1];
  const s = t < steps.length * 2 ? steps[Math.floor(t / 2)] : 1;
  const out = f > end - 6 ? Math.floor((end - f) / 2) / 3 : 1;
  return (
    <div style={{position: 'absolute', left: 0, width: W, top, textAlign: 'center', transform: `scale(${s * out})`, fontFamily: PIXEL_FONT}}>
      <div style={{fontSize: size, color, lineHeight: 1.3, textShadow: `${PX * 0.8}px ${PX * 0.8}px 0 #14101c, 0 0 40px rgba(245,130,32,0.6)`}}>{text}</div>
      {sub ? <div style={{fontSize: 30, color: '#fff', marginTop: 18, textShadow: shadow(4)}}>{sub}</div> : null}
    </div>
  );
};

/** "+100" que sobe e some. */
export const PopText: React.FC<{at: number; x: number; y: number; text: string; color?: string}> = ({at, x, y, text, color = PAL.Y}) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > 36) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 150,
        width: 300,
        textAlign: 'center',
        top: y - Math.floor(t * 2.5 / 5) * 5,
        fontFamily: PIXEL_FONT,
        fontSize: 36,
        color,
        opacity: t > 28 ? 0 : 1,
        textShadow: shadow(5),
      }}
    >
      {text}
    </div>
  );
};

const Counter: React.FC<{icon: React.ReactNode; label: string; value: string; bumpAt: number[]}> = ({icon, label, value, bumpAt}) => {
  const f = useCurrentFrame();
  const bump = bumpAt.some((b) => f >= b && f < b + 6);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
      <div style={{transform: `translateY(${bump ? -8 : 0}px)`}}>{icon}</div>
      <div>
        <div style={{fontSize: 18, color: PAL.P, marginBottom: 10}}>{label}</div>
        <div style={{fontSize: 34, color: bump ? PAL.Y : '#fff', textShadow: shadow(3)}}>{value}</div>
      </div>
    </div>
  );
};

export const HUD: React.FC<{coins: number; coupons: number; prizes: number; bumps: {coin: number[]; coupon: number[]; prize: number[]}}> = ({
  coins,
  coupons,
  prizes,
  bumps,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 60,
      width: W - 120,
      top: 175,
      ...pixelFrame('rgba(16,19,31,0.92)'),
      padding: '24px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: PIXEL_FONT,
      color: '#fff',
    }}
  >
    <Counter icon={<Sprite rows={COIN} px={6} />} label="MOEDAS" value={String(coins).padStart(4, '0')} bumpAt={bumps.coin} />
    <Counter icon={<Sprite rows={COUPON} px={5} />} label="CUPONS" value={`x${coupons}`} bumpAt={bumps.coupon} />
    <Counter icon={<Sprite rows={TROPHY} px={4} />} label="PRÊMIO" value={`x${prizes}`} bumpAt={bumps.prize} />
  </div>
);

/** Transição em blocos de pixel. */
export const PixelWipe: React.FC<{at: number; dur?: number; color?: string}> = ({at, dur = 22, color = '#07060f'}) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > dur) return null;
  const S = 90;
  const cols = Math.ceil(W / S);
  const rows = Math.ceil(H / S);
  const half = dur / 2;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = (x + y) / (cols + rows);
      const inP = interpolate(t, [d * half * 0.8, d * half * 0.8 + 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const outP = interpolate(t, [half + d * half * 0.8, half + d * half * 0.8 + 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const s = inP * (1 - outP);
      if (s <= 0) continue;
      cells.push(
        <div key={`${x}-${y}`} style={{position: 'absolute', left: x * S + (S * (1 - s)) / 2, top: y * S + (S * (1 - s)) / 2, width: S * s + 1, height: S * s + 1, background: color}} />,
      );
    }
  }
  return <>{cells}</>;
};
