import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {PAL} from './pixel';
import {PX, PIXEL_FONT} from './theme';

/* ---------- utilitários de SVG em "pixels de arte" ---------- */
const svgUri = (w: number, h: number, body: string) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'>${body}</svg>`,
  )}")`;
const r = (x: number, y: number, w: number, h: number, c: string) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='${c}'/>`;

/* Piso do palco (tile 16×16 em pixels de arte) */
const GROUND_TILE = svgUri(
  16,
  16,
  [
    r(0, 0, 16, 16, '#2a1a12'),
    r(0, 0, 16, 2, PAL.O),
    r(0, 2, 16, 1, PAL.o),
    r(0, 3, 16, 1, '#14100c'),
    r(0, 9, 16, 1, '#1a110b'),
    r(7, 4, 1, 5, '#1a110b'),
    r(0, 10, 1, 6, '#1a110b'),
    r(15, 10, 1, 6, '#1a110b'),
    r(3, 6, 1, 1, '#4a3020'),
    r(11, 13, 1, 1, '#4a3020'),
  ].join(''),
);

/* Cidade ao fundo (gerada uma vez, determinística) */
const SKYLINE = (() => {
  const W = 160;
  const H = 70;
  let body = '';
  let x = 0;
  let i = 0;
  while (x < W) {
    const bw = 8 + Math.floor(random(`bw${i}`) * 12);
    const bh = 18 + Math.floor(random(`bh${i}`) * 46);
    const col = i % 2 ? '#1c1532' : '#231a3d';
    body += r(x, H - bh, bw, bh, col);
    for (let wy = H - bh + 3; wy < H - 3; wy += 4) {
      for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
        if (random(`w${i}-${wx}-${wy}`) > 0.72) body += r(wx, wy, 1, 2, random(`c${wx}${wy}`) > 0.5 ? '#ffb066' : '#5a4a8a');
      }
    }
    x += bw + 1;
    i++;
  }
  return {uri: svgUri(W, H, body), w: W, h: H};
})();

/* Estruturas de palco: torres de treliça + line arrays + caixas */
const STAGE = (() => {
  const W = 110;
  const H = 90;
  let b = '';
  const truss = (x: number, y: number, w: number, h: number) => {
    b += r(x, y, w, 1, '#6d7290') + r(x, y + h - 1, w, 1, '#6d7290');
    for (let k = 0; k < w; k += 4) b += r(x + k, y, 1, h, '#4a4f6a');
    for (let k = 0; k < w - 2; k += 4) b += r(x + k + 1, y + 1, 1, 1, '#8a8ea6') + r(x + k + 2, y + 2, 1, 1, '#8a8ea6');
  };
  const tower = (x: number) => {
    b += r(x, 6, 1, H - 6, '#6d7290') + r(x + 4, 6, 1, H - 6, '#6d7290');
    for (let k = 8; k < H; k += 4) b += r(x + 1, k, 3, 1, '#4a4f6a');
  };
  truss(0, 6, W, 4);
  tower(6);
  tower(W - 11);
  // line arrays pendurados
  const array = (x: number) => {
    b += r(x + 4, 10, 1, 4, '#4a4f6a');
    for (let k = 0; k < 7; k++) {
      const yy = 14 + k * 4;
      const inset = Math.max(0, k - 4);
      b += r(x + inset, yy, 10 - inset, 3, '#1b1d2b') + r(x + inset, yy + 3, 10 - inset, 1, '#0d0e16');
      b += r(x + inset + 1, yy + 1, 8 - inset, 1, '#2f3248');
    }
  };
  array(22);
  array(W - 34);
  // spots
  for (let k = 0; k < 5; k++) b += r(32 + k * 10, 10, 3, 2, '#ffd23f');
  // caixas de subwoofer no chão
  for (let k = 0; k < 3; k++) {
    b += r(14 + k * 12, H - 10, 11, 10, '#1b1d2b') + r(16 + k * 12, H - 8, 7, 6, '#2f3248') + r(18 + k * 12, H - 6, 3, 2, '#0d0e16');
    b += r(W - 50 + k * 12, H - 10, 11, 10, '#1b1d2b') + r(W - 48 + k * 12, H - 8, 7, 6, '#2f3248') + r(W - 46 + k * 12, H - 6, 3, 2, '#0d0e16');
  }
  return {uri: svgUri(W, H, b), w: W, h: H};
})();

export const Background: React.FC<{camX: number; G: number}> = ({camX, G}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {/* céu */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #07060f 0%, #120c24 45%, #2a1430 72%, #5a2412 100%)'}} />
      {/* estrelas */}
      {new Array(70).fill(0).map((_, i) => {
        const x = ((random(`sx${i}`) * 1400 - camX * 0.05) % 1400 + 1400) % 1400 - 160;
        const y = random(`sy${i}`) * (G - 520);
        const on = Math.sin(f / 6 + random(`st${i}`) * 20) > -0.3;
        const s = random(`ss${i}`) > 0.85 ? PX : PX / 2;
        return <div key={i} style={{position: 'absolute', left: Math.round(x / 5) * 5, top: Math.round(y / 5) * 5, width: s, height: s, background: on ? '#fff3e0' : '#5a4a8a'}} />;
      })}
      {/* lua pixel */}
      <div style={{position: 'absolute', left: 880 - camX * 0.03, top: G - 770, width: PX * 9, height: PX * 9, background: '#ffe0b8', boxShadow: `0 0 0 ${PX}px #ffb066, 0 0 120px 40px rgba(245,130,32,0.25)`}} />
      {/* cidade */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: G - SKYLINE.h * PX + 40,
          height: SKYLINE.h * PX,
          backgroundImage: SKYLINE.uri,
          backgroundSize: `${SKYLINE.w * PX}px ${SKYLINE.h * PX}px`,
          backgroundRepeat: 'repeat-x',
          backgroundPositionX: -camX * 0.2,
          opacity: 0.9,
        }}
      />
      {/* brilho laranja do evento no horizonte */}
      <div style={{position: 'absolute', left: 0, right: 0, top: G - 380, height: 380, background: 'linear-gradient(180deg, rgba(245,130,32,0) 0%, rgba(245,130,32,0.28) 100%)'}} />
      {/* estruturas de palco */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: G - STAGE.h * PX,
          height: STAGE.h * PX,
          backgroundImage: STAGE.uri,
          backgroundSize: `${STAGE.w * PX}px ${STAGE.h * PX}px`,
          backgroundRepeat: 'repeat-x',
          backgroundPositionX: -camX * 0.5 + 200,
          opacity: 0.85,
        }}
      />
    </AbsoluteFill>
  );
};

export const Ground: React.FC<{camX: number; G: number}> = ({camX, G}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: G,
      bottom: 0,
      backgroundImage: GROUND_TILE,
      backgroundSize: `${16 * PX}px ${16 * PX}px`,
      backgroundPositionX: -camX,
    }}
  />
);

/* ---------- construções ---------- */
const Box: React.FC<{w: number; h: number; children: React.ReactNode}> = ({w, h, children}) => (
  <svg width={w * PX} height={h * PX} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" style={{display: 'block'}}>
    {children}
  </svg>
);
const Rc: React.FC<{x: number; y: number; w: number; h: number; c: string}> = ({x, y, w, h, c}) => (
  <rect x={x} y={y} width={w} height={h} fill={c} />
);

const Bricks: React.FC<{x: number; y: number; w: number; h: number; a: string; b: string}> = ({x, y, w, h, a, b}) => (
  <>
    <Rc x={x} y={y} w={w} h={h} c={a} />
    {new Array(Math.floor(h / 3)).fill(0).map((_, row) => (
      <React.Fragment key={row}>
        <Rc x={x} y={y + row * 3 + 2} w={w} h={1} c={b} />
        {new Array(Math.ceil(w / 6)).fill(0).map((__, k) => (
          <Rc key={k} x={x + k * 6 + (row % 2 ? 3 : 0)} y={y + row * 3} w={1} h={2} c={b} />
        ))}
      </React.Fragment>
    ))}
  </>
);

const Label: React.FC<{text: string; top: number; size: number; color?: string; width: number}> = ({text, top, size, color = '#fff', width}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      width,
      top,
      textAlign: 'center',
      fontFamily: PIXEL_FONT,
      fontSize: size,
      color,
      lineHeight: 1.25,
      textShadow: `${PX / 2}px ${PX / 2}px 0 #14101c`,
    }}
  >
    {text}
  </div>
);

/** Loja (48×40 px de arte) */
export const Shop: React.FC<{glow?: number}> = ({glow = 0}) => {
  const w = 48;
  const h = 40;
  return (
    <div style={{position: 'relative', width: w * PX, height: h * PX}}>
      <Box w={w} h={h}>
        {/* placa */}
        <Rc x={6} y={0} w={36} h={9} c={PAL.K} />
        <Rc x={7} y={1} w={34} h={7} c={glow > 0.5 ? '#3a2a10' : '#1b1d2b'} />
        <Rc x={7} y={1} w={34} h={1} c={PAL.O} />
        {/* toldo */}
        {new Array(12).fill(0).map((_, k) => (
          <Rc key={k} x={k * 4} y={9} w={4} h={6} c={k % 2 ? PAL.W : PAL.O} />
        ))}
        {new Array(12).fill(0).map((_, k) => (
          <Rc key={`b${k}`} x={k * 4 + 1} y={15} w={2} h={1} c={k % 2 ? PAL.W : PAL.O} />
        ))}
        <Rc x={0} y={9} w={48} h={1} c={PAL.K} />
        {/* parede */}
        <Bricks x={1} y={16} w={46} h={24} a="#5a2e1a" b="#3d1d10" />
        <Rc x={0} y={16} w={1} h={24} c={PAL.K} />
        <Rc x={47} y={16} w={1} h={24} c={PAL.K} />
        {/* vitrine */}
        <Rc x={4} y={19} w={22} h={15} c={PAL.K} />
        <Rc x={5} y={20} w={20} h={13} c="#123a52" />
        <Rc x={5} y={20} w={20} h={2} c="#1f5f80" />
        {/* produtos na vitrine: caixas de som e mic */}
        <Rc x={7} y={25} w={5} h={8} c="#1b1d2b" />
        <Rc x={8} y={27} w={3} h={3} c="#4a4d5e" />
        <Rc x={14} y={23} w={4} h={10} c="#1b1d2b" />
        <Rc x={15} y={25} w={2} h={2} c="#4a4d5e" />
        <Rc x={15} y={29} w={2} h={2} c="#4a4d5e" />
        <Rc x={20} y={26} w={3} h={2} c={PAL.h} />
        <Rc x={21} y={28} w={1} h={5} c={PAL.h} />
        <Rc x={6} y={20} w={1} h={6} c="#5fb4d8" />
        {/* porta */}
        <Rc x={30} y={20} w={13} h={20} c={PAL.K} />
        <Rc x={31} y={21} w={11} h={19} c={PAL.N} />
        <Rc x={32} y={22} w={9} h={7} c="#123a52" />
        <Rc x={39} y={31} w={1} h={2} c={PAL.Y} />
      </Box>
      <Label text="LOJA" top={1.6 * PX} size={44} color={glow > 0.5 ? PAL.Y : PAL.P} width={w * PX} />
    </div>
  );
};

/** Central de troca (56×50 px de arte) */
export const Central: React.FC<{lit?: number}> = ({lit = 0}) => {
  const w = 56;
  const h = 50;
  return (
    <div style={{position: 'relative', width: w * PX, height: h * PX}}>
      <Box w={w} h={h}>
        <Rc x={2} y={0} w={52} h={14} c={PAL.K} />
        <Rc x={3} y={1} w={50} h={12} c="#1b1d2b" />
        <Rc x={3} y={1} w={50} h={1} c={PAL.O} />
        <Rc x={3} y={12} w={50} h={1} c={PAL.o} />
        {/* lâmpadas da placa */}
        {new Array(13).fill(0).map((_, k) => (
          <Rc key={k} x={4 + k * 4} y={13} w={2} h={1} c={(k + Math.floor(lit * 8)) % 2 ? PAL.Y : PAL.y} />
        ))}
        {/* corpo */}
        <Rc x={0} y={14} w={56} h={36} c={PAL.K} />
        <Rc x={1} y={15} w={54} h={35} c="#2c2f45" />
        {new Array(9).fill(0).map((_, k) => (
          <Rc key={`p${k}`} x={1 + k * 6} y={15} w={1} h={35} c="#24263a" />
        ))}
        <Rc x={1} y={15} w={54} h={2} c={PAL.O} />
        {/* guichê */}
        <Rc x={10} y={20} w={36} h={18} c={PAL.K} />
        <Rc x={11} y={21} w={34} h={16} c={lit > 0 ? '#1f5f80' : '#123a52'} />
        <Rc x={11} y={21} w={34} h={3} c="#2a7aa0" />
        {/* atendente (silhueta) */}
        <Rc x={25} y={26} w={6} h={5} c="#0d0e16" />
        <Rc x={23} y={31} w={10} h={6} c="#0d0e16" />
        <Rc x={8} y={37} w={40} h={3} c={PAL.O} />
        <Rc x={8} y={40} w={40} h={1} c={PAL.o} />
        {/* ícones moeda → cupom nas laterais */}
        <Rc x={3} y={24} w={5} h={5} c={PAL.Y} />
        <Rc x={4} y={25} w={3} h={3} c={PAL.y} />
        <Rc x={48} y={24} w={6} h={4} c={PAL.O} />
        <Rc x={50} y={25} w={2} h={2} c={PAL.W} />
        {/* base */}
        <Rc x={1} y={44} w={54} h={6} c="#1b1d2b" />
        <Rc x={20} y={41} w={16} h={9} c="#0d0e16" />
      </Box>
      <Label text="CENTRAL" top={2.2 * PX} size={40} color={PAL.P} width={w * PX} />
      <Label text="DE TROCA" top={7.3 * PX} size={34} width={w * PX} />
    </div>
  );
};
