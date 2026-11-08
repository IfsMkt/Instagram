import React, {useMemo} from 'react';

/** Paleta única do jogo (laranja oficial da SemanÁudio #F58220 como cor-chave). */
export const PAL: Record<string, string> = {
  K: '#14101c', // contorno
  O: '#F58220', // laranja SemanÁudio
  o: '#b8520c', // laranja escuro
  P: '#ffb066', // laranja claro
  W: '#ffffff',
  w: '#c9cbe0',
  S: '#f2b48a', // pele
  s: '#c98a63',
  B: '#22263d', // camiseta
  b: '#151829',
  L: '#3a62b8', // jeans
  l: '#28448a',
  H: '#4a4d5e', // fone
  h: '#8a8ea6',
  Y: '#ffd23f', // ouro
  y: '#e09a1a',
  G: '#9a5a0a',
  N: '#7a4a24', // madeira/couro
  n: '#4f2d14',
  R: '#e8423a', // vermelho
  r: '#9e2420',
  C: '#46d2ff', // ciano (tela/brilho)
  c: '#1f7fa8',
  M: '#2c2f45', // metal escuro
  m: '#555a78',
  V: '#8b5cf6',
};

type Rect = {x: number; y: number; w: number; c: string};

const toRects = (rows: string[]): {rects: Rect[]; w: number; h: number} => {
  const w = Math.max(...rows.map((r) => r.length));
  const rects: Rect[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      rects.push({x, y, w: run, c: PAL[ch] ?? '#ff00ff'});
      x += run;
    }
  });
  return {rects, w, h: rows.length};
};

/** Desenha um sprite a partir de linhas de caracteres (1 caractere = 1 pixel). */
export const Sprite: React.FC<{rows: string[]; px: number; flip?: boolean; style?: React.CSSProperties}> = ({
  rows,
  px,
  flip,
  style,
}) => {
  const {rects, w, h} = useMemo(() => toRects(rows), [rows]);
  return (
    <svg
      width={w * px}
      height={h * px}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      style={{display: 'block', transform: flip ? 'scaleX(-1)' : undefined, overflow: 'visible', ...style}}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Personagem: técnico de som com boné laranja e fone de ouvido.       */
/* ------------------------------------------------------------------ */
const HEAD = [
  '....KKKKKKK.....',
  '...KOOOOOOOK....',
  '..KOOOOOPOOOK...',
  '..KOOOOOOOOOKKK.',
  '.KHHKKKKKKKOOOOK',
  '.KhHKSSSSSSKKKK.',
  '.KhHKSSSSKSSK...',
  '.KHHKSSSSKSSK...',
  '..KKSSSSSSSSSK..',
  '...KSSSSSSSKK...',
  '....KKSSSKK.....',
];
const BODY = [
  '...KBBBBBBBK....',
  '..KBBBOOOBBBK...',
  '.KSKBBObOBBKSK..',
  '.KSKBBBBBBBKSK..',
  '..KKLLLLLLLKK...',
];
export const HERO_STAND = [...HEAD, ...BODY, '...KLLLKLLLK....', '...KLLK.KLLK....', '..KWWWK.KWWWK...', '..KKKKK.KKKKK...'];
export const HERO_WALK = [...HEAD, ...BODY, '..KLLLK.KLLLK...', '.KLLK....KLLK...', 'KWWWK....KWWWK..', 'KKKKK....KKKKK..'];
export const HERO_JUMP = [
  ...HEAD.slice(0, 10),
  '....KKSSSKK..KK.',
  '...KBBBBBBBKKSK.',
  '..KBBBOOOBBBSK..',
  '.KSKBBObOBBKK...',
  '.KSKBBBBBBBK....',
  '..KKLLLLLLLKK...',
  '..KLLLKKLLLLK...',
  '..KWWWK.KLLK....',
  '..KKKKK.KWWWK...',
  '........KKKKK...',
];

/* Moeda */
export const COIN = [
  '..KKKKKK..',
  '.KYYYYYYK.',
  'KYYWWYYYyK',
  'KYWYYYYyyK',
  'KYYYGGYYyK',
  'KYYGYYYYyK',
  'KYYYGGYYyK',
  'KYYYYYGYyK',
  'KYyYGGYyyK',
  '.KyyyyyyK.',
  '..KKKKKK..',
];

/* Cupom (ticket) */
export const COUPON = [
  'KKKKKKKKKKKKKKKK',
  'KOOOOOOOOKOOOOOK',
  'OOWWOWWOOKOOYOOO',
  '.OWOOWOWOOOYYYO.',
  '.OWOOWOWOKOOYOO.',
  'OOWWOWWOOKOOOOOO',
  'KOOOOOOOOKOOOOOK',
  'KKKKKKKKKKKKKKKK',
];

/* Bloco musical (dá moedas ao ser batido por baixo) */
export const NOTE_BLOCK = [
  'KKKKKKKKKKKKKKKK',
  'KPPPPPPPPPPPPPPK',
  'KPOOOOOOOOOOOOoK',
  'KPOKOOOOOOOOKOoK',
  'KPOOOOOOWWWOOOoK',
  'KPOOOOOOWOWWOOoK',
  'KPOOOOOOWOOWOOoK',
  'KPOOOOOOWOOOOOoK',
  'KPOOOOOOWOOOOOoK',
  'KPOOOOWWWOOOOOoK',
  'KPOOOWWWWOOOOOoK',
  'KPOOOOWWOOOOOOoK',
  'KPOKOOOOOOOOKOoK',
  'KPOOOOOOOOOOOOoK',
  'KoooooooooooooooK',
  'KKKKKKKKKKKKKKKK',
];
export const NOTE_BLOCK_USED = NOTE_BLOCK.map((r) => r.replace(/[OPo]/g, 'm').replace(/W/g, 'M'));

/* Case de transporte (road case) — obstáculo */
export const ROAD_CASE = [
  'KKKKKKKKKKKKKKKK',
  'KmhhhhhhhhhhhhmK',
  'KhMMMMMMMMMMMMhK',
  'KhMMMMKhhKMMMMhK',
  'KhMMMMKKKKMMMMhK',
  'KhhhhhhhhhhhhhhK',
  'KhMMMMMMMMMMMMhK',
  'KhMMOOOOOOOOMMhK',
  'KhMMMMMMMMMMMMhK',
  'KhMMMMMMMMMMMMhK',
  'KmhhhhhhhhhhhhmK',
  'KKKKKKKKKKKKKKKK',
];

/* Fone de ouvido (item da loja) */
export const HEADPHONES = [
  '...KKKKKK...',
  '..KOOOOOOK..',
  '.KOKKKKKKOK.',
  'KOK......KOK',
  'KOK......KOK',
  'KHK......KHK',
  'KHHK....KHHK',
  'KhHK....KhHK',
  'KhHK....KhHK',
  'KKKK....KKKK',
];

/* Baú */
export const CHEST_CLOSED = [
  '..KKKKKKKKKKKK..',
  '.KNNNNNNNNNNNNK.',
  'KNNNNNNNNNNNNNNK',
  'KnYYYYYYYYYYYYnK',
  'KNNNNNNKKNNNNNNK',
  'KKKKKKKYYKKKKKKK',
  'KNNNNNKYyKNNNNNK',
  'KNNNNNNKKNNNNNNK',
  'KnNNNNNNNNNNNNnK',
  'KYYYYYYYYYYYYYYK',
  'KNNNNNNNNNNNNNNK',
  'KnNNNNNNNNNNNNnK',
  'KnnnnnnnnnnnnnnK',
  'KKKKKKKKKKKKKKKK',
];
export const CHEST_OPEN = [
  '..KKKKKKKKKKKK..',
  '.KNNNNNNNNNNNNK.',
  'KnYYYYYYYYYYYYnK',
  'KKKKKKKKKKKKKKKK',
  'KYYYWYYYYYWYYYYK',
  'KKKKKKKYYKKKKKKK',
  'KNNNNNKYyKNNNNNK',
  'KNNNNNNKKNNNNNNK',
  'KnNNNNNNNNNNNNnK',
  'KYYYYYYYYYYYYYYK',
  'KNNNNNNNNNNNNNNK',
  'KnNNNNNNNNNNNNnK',
  'KnnnnnnnnnnnnnnK',
  'KKKKKKKKKKKKKKKK',
];

/* Troféu (prêmio) */
export const TROPHY = [
  '.KKKKKKKKKKKK.',
  'KKYYYYYYYYYyKK',
  'KYKYYWYYYYYyKY',
  'KYKYWYYYYYYyKY',
  '.KKYYYYYYYYyKK',
  '..KYYYYYYYYyK.',
  '...KYYYYYYyK..',
  '....KYYYyyK...',
  '.....KYyyK....',
  '......KyK.....',
  '.....KYYyK....',
  '...KKKKKKKKK..',
  '...KOOOOOOOK..',
  '...KOWWWWWOK..',
  '...KKKKKKKKK..',
];

/* Ícones pequenos */
export const ICON_STAR = ['...K...', '..KYK..', 'KKKYKKK', 'KYYYYYK', '.KYYYK.', '.KYKYK.', 'KK...KK'];
export const ICON_BAG = ['..KKK..', '.K...K.', 'KKKKKKK', 'KOOOOOK', 'KOOWOOK', 'KOOOOOK', 'KKKKKKK'];
export const ICON_TARGET = ['.KKKKK.', 'KRRRRRK', 'KRWWWRK', 'KRWRWRK', 'KRWWWRK', 'KRRRRRK', '.KKKKK.'];
