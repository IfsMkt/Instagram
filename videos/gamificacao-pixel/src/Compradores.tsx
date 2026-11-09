import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import T from './compradores.json';
import {loadFonts} from './fonts';
import {Flyer, Sparkle, SpinCoin} from './Game';
import {COUPON, HERO_JUMP, HERO_STAND, HERO_WALK, ICON_BAG, PAL, Sprite} from './pixel';
import {PIXEL_FONT, PX, W} from './theme';
import {Banner, Dialog, PixelWipe, PopText, pixelFrame} from './ui';
import {Background, Central, Ground} from './world';

loadFonts();

const G = T.G;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const snap = (v: number, s = PX) => Math.round(v / s) * s;

/* ---------------- níveis ---------------- */
type Tier = {name: string; main: string; dark: string; light: string; ribbon: string; text: string};
export const TIERS: Tier[] = [
  {name: 'BRONZE', main: '#cd7f32', dark: '#7a4416', light: '#f0b27a', ribbon: '#8a2b1e', text: '#f0a060'},
  {name: 'PRATA', main: '#c8cdd8', dark: '#7d8396', light: '#ffffff', ribbon: '#2f4a8a', text: '#e4e8f2'},
  {name: 'OURO', main: '#ffcc33', dark: '#b07a10', light: '#fff2a8', ribbon: '#b0221c', text: '#ffd23f'},
  {name: 'PLATINUM', main: '#F58220', dark: '#a84a08', light: '#ffe3c4', ribbon: '#14101c', text: '#ff9a42'},
];

const MEDAL_ROWS = [
  '..KKKK....KKKK..',
  '..KRRK....KRRK..',
  '...KRRK..KRRK...',
  '...KRRK..KRRK...',
  '....KRRKKRRK....',
  '.....KRRRRK.....',
  '....KKKKKKKK....',
  '...KZZAAAAAaK...',
  '..KZAAAAAAAAaK..',
  '..KZAAWAAAAAaK..',
  '.KZAAWAZAAAAAaK.',
  '.KAAAAZZZAAAAaK.',
  '.KAAAAAZAAAAAaK.',
  '.KAAAAZAZAAAaaK.',
  '..KAAAAAAAAAaK..',
  '..KaAAAAAAAaaK..',
  '...KaaaaaaaaK...',
  '....KKKKKKKK....',
];
const PIN_ROWS = ['..KKKK..', '.KZAAaK.', 'KZAWAAaK', 'KAAZAAaK', 'KAZZZAaK', 'KAAZAaaK', '.KaaaaK.', '..KKKK..'];

/** Medalha desenhada com as cores do nível (SVG direto, sem depender da paleta global). */
const TierSprite: React.FC<{rows: string[]; tier: Tier; px: number; style?: React.CSSProperties}> = ({rows, tier, px, style}) => {
  const map: Record<string, string> = {K: PAL.K, W: '#ffffff', A: tier.main, a: tier.dark, Z: tier.light, R: tier.ribbon};
  const w = Math.max(...rows.map((r) => r.length));
  return (
    <svg width={w * px} height={rows.length * px} viewBox={`0 0 ${w} ${rows.length}`} shapeRendering="crispEdges" style={{display: 'block', ...style}}>
      {rows.map((row, y) =>
        row.split('').map((ch, x) => (map[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={map[ch]} /> : null)),
      )}
    </svg>
  );
};
export const Medal: React.FC<{tier: number; px: number; style?: React.CSSProperties}> = ({tier, px, style}) => (
  <TierSprite rows={MEDAL_ROWS} tier={TIERS[tier]} px={px} style={style} />
);
const Pin: React.FC<{tier: number; px: number}> = ({tier, px}) => <TierSprite rows={PIN_ROWS} tier={TIERS[tier]} px={px} />;

const RECEIPT = [
  'KKKKKKKKKK',
  'KWWWWWWWWK',
  'KWKKKKKWWK',
  'KWWWWWWWWK',
  'KWwwwwwwWK',
  'KWwwwwwWWK',
  'KWwwwwwwWK',
  'KWWWWWWWWK',
  'KWOOOOOOWK',
  'KWWWWWWWWK',
  'KWKWKWKWKK',
  '.K.K.K.K..',
];

/* produtos dos expositores */
const PRODUCTS: string[][] = [
  // caixa de som
  ['KKKKKKKK', 'KMMMMMMK', 'KMmmmmMK', 'KMmKKmMK', 'KMmKKmMK', 'KMmmmmMK', 'KMMMMMMK', 'KMmmmmMK', 'KMmKKmMK', 'KMmmmmMK', 'KKKKKKKK'],
  // mesa de som
  ['..............', 'KKKKKKKKKKKKKK', 'KMhMhMhMhMhMCK', 'KMMMMMMMMMMMMK', 'KMOMMOMMOMMOMK', 'KMKMMKMMKMMKMK', 'KMKMMKMMKMMKMK', 'KMMMMMMMMMMMMK', 'KKKKKKKKKKKKKK'],
  // microfone
  ['..KKK..', '.KhhhK.', 'KhHhHhK', 'KHhHhHK', 'KhHhHhK', '.KhhhK.', '..KMK..', '..KMK..', '..KMK..', '..KMK..', '.KKMKK.', 'KMMMMMK', 'KKKKKKK'],
  // line array
  ['KKKKKKKKKK', 'KMMMMMMMMK', 'KKKKKKKKKK', '.KMMMMMMMK', '.KKKKKKKKK', '..KMMMMMMK', '..KKKKKKKK', '...KMMMMMK', '...KKKKKKK'],
];

/** Estande de expositor (36×34 px de arte). */
const Stand: React.FC<{i: number; active: boolean}> = ({i, active}) => {
  const w = 36;
  const h = 34;
  const R: React.FC<{x: number; y: number; w: number; h: number; c: string}> = ({x, y, w: ww, h: hh, c}) => <rect x={x} y={y} width={ww} height={hh} fill={c} />;
  return (
    <div style={{position: 'relative', width: w * PX, height: h * PX}}>
      <svg width={w * PX} height={h * PX} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" style={{display: 'block'}}>
        {/* painel de fundo */}
        <R x={1} y={0} w={34} h={22} c={PAL.K} />
        <R x={2} y={1} w={32} h={20} c={active ? '#2c2f45' : '#1f2133'} />
        <R x={2} y={1} w={32} h={6} c={PAL.O} />
        <R x={2} y={7} w={32} h={1} c={PAL.o} />
        {/* spots */}
        <R x={6} y={8} w={2} h={1} c={PAL.Y} />
        <R x={17} y={8} w={2} h={1} c={PAL.Y} />
        <R x={28} y={8} w={2} h={1} c={PAL.Y} />
        {/* balcão */}
        <R x={0} y={22} w={36} h={12} c={PAL.K} />
        <R x={1} y={23} w={34} h={11} c="#3a2a20" />
        <R x={1} y={23} w={34} h={2} c={PAL.O} />
        <R x={3} y={27} w={30} h={1} c="#2a1c14" />
        <R x={3} y={30} w={30} h={1} c="#2a1c14" />
      </svg>
      <div style={{position: 'absolute', top: 1.4 * PX, width: w * PX, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 26, color: '#14101c'}}>EXPOSITOR</div>
      <div style={{position: 'absolute', left: 0, width: w * PX, top: 22 * PX, transform: 'translateY(-100%)', display: 'flex', justifyContent: 'center'}}>
        <Sprite rows={PRODUCTS[i]} px={PX} />
      </div>
    </div>
  );
};

/* ---------------- movimento ---------------- */
const charX = (f: number) => interpolate(f, T.charX.map((k) => k[0]), T.charX.map((k) => k[1]), clamp);
const jumpAt = (f: number) => T.jumps.find(([s, d]) => f >= s && f <= s + d);
const jumpY = (f: number) => {
  const j = jumpAt(f);
  if (!j) return 0;
  const p = (f - j[0]) / j[1];
  return snap(4 * j[2] * p * (1 - p));
};
const moving = (f: number) => Math.abs(charX(f + 1) - charX(f)) > 0.5;
const tierAt = (f: number) => T.unlock.filter((u) => f >= u).length - 1; // -1 = nenhum
const couponsAt = (f: number) => T.buy.reduce((s, b, i) => (f >= b + 8 ? s + T.couponGain[i] : s), 0);
const xpAt = (f: number) => {
  let x = 0;
  T.buy.forEach((b, i) => {
    x += interpolate(f, [b + 2, T.unlock[i]], [0, 0.25], clamp);
  });
  return x;
};

const Hero: React.FC<{x: number; f: number; pinTier: number | null}> = ({x, f, pinTier}) => {
  const jy = jumpY(f);
  let rows = HERO_STAND;
  if (jumpAt(f)) rows = HERO_JUMP;
  else if (moving(f)) rows = Math.floor(f / 5) % 2 ? HERO_WALK : HERO_STAND;
  const bob = !jumpAt(f) && !moving(f) && Math.floor(f / 15) % 2 ? PX / 2 : 0;
  return (
    <div style={{position: 'absolute', left: x, top: G - 20 * PX - jy + bob}}>
      <Sprite rows={rows} px={PX} />
      {pinTier !== null ? (
        <div style={{position: 'absolute', left: 4 * PX, top: 12 * PX}}>
          <Pin tier={pinTier} px={PX / 2} />
        </div>
      ) : null}
    </div>
  );
};

/* ---------------- HUD ---------------- */
const HUD: React.FC<{f: number}> = ({f}) => {
  const tier = tierAt(f);
  const xp = xpAt(f);
  const cp = couponsAt(f);
  const bumpC = T.buy.some((b) => f >= b + 8 && f < b + 14);
  const bumpT = T.unlock.some((u) => f >= u && f < u + 8);
  return (
    <div style={{position: 'absolute', left: 60, width: W - 120, top: 170, ...pixelFrame('rgba(16,19,31,0.92)'), padding: '24px 30px 28px', fontFamily: PIXEL_FONT, color: '#fff'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 64, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${bumpT ? -8 : 0}px)`}}>
            {tier >= 0 ? <Medal tier={tier} px={4} /> : <div style={{width: 40, height: 40, border: '4px dashed #555a78'}} />}
          </div>
          <div>
            <div style={{fontSize: 18, color: PAL.P, marginBottom: 10}}>NÍVEL</div>
            <div style={{fontSize: 32, color: tier >= 0 ? TIERS[tier].text : '#8a8ea6', textShadow: '3px 3px 0 #14101c'}}>{tier >= 0 ? TIERS[tier].name : '---'}</div>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <div style={{transform: `translateY(${bumpC ? -8 : 0}px)`}}>
            <Sprite rows={COUPON} px={5} />
          </div>
          <div>
            <div style={{fontSize: 18, color: PAL.P, marginBottom: 10}}>CUPONS</div>
            <div style={{fontSize: 32, color: bumpC ? PAL.Y : '#fff', textShadow: '3px 3px 0 #14101c'}}>x{cp}</div>
          </div>
        </div>
      </div>
      {/* barra de compras */}
      <div style={{fontSize: 16, color: PAL.P, margin: '22px 0 10px'}}>COMPRAS</div>
      <div style={{position: 'relative', height: 34, background: '#07060f', boxShadow: '0 0 0 4px #ffffff, 0 0 0 8px #14101c'}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${snap(xp * 100, 2.5)}%`,
            background: `repeating-linear-gradient(90deg, ${PAL.O} 0 20px, ${PAL.P} 20px 24px)`,
          }}
        />
        {TIERS.map((t, i) => (
          <div key={i} style={{position: 'absolute', left: `${(i + 1) * 25}%`, top: -6, width: 6, marginLeft: -6, height: 46, background: tier >= i ? t.main : '#555a78'}} />
        ))}
      </div>
    </div>
  );
};

/* ---------------- título ---------------- */
const Title: React.FC = () => {
  const f = useCurrentFrame();
  const press = T.title.press;
  const blink = f < press ? Math.floor(f / 10) % 2 === 0 : Math.floor(f / 2) % 2 === 0;
  const titleY = f < 14 ? snap(interpolate(f, [0, 14], [-300, 0])) : 0;
  return (
    <AbsoluteFill>
      <Background camX={f * 2} G={G} />
      <Ground camX={f * 2} G={G} />
      <div style={{position: 'absolute', top: 280 + titleY, width: W, textAlign: 'center', fontFamily: PIXEL_FONT}}>
        <div style={{fontSize: 40, color: '#fff', textShadow: '6px 6px 0 #14101c'}}>PROGRAMA</div>
        <div style={{fontSize: 76, color: PAL.O, marginTop: 30, lineHeight: 1.25, textShadow: '9px 9px 0 #14101c, 0 0 60px rgba(245,130,32,0.7)'}}>
          GRANDES
          <br />
          COMPRADORES
        </div>
        <div style={{display: 'inline-block', marginTop: 40, padding: '18px 28px', ...pixelFrame(PAL.O), color: '#14101c', fontSize: 28}}>SEMANÁUDIO 2026</div>
      </div>
      <div style={{position: 'absolute', top: 840, width: W, display: 'flex', justifyContent: 'center', gap: 36}}>
        {TIERS.map((_, i) => (
          <div key={i} style={{transform: `translateY(${(Math.floor((f + i * 6) / 8) % 2) * -PX}px)`, opacity: f >= 16 + i * 4 ? 1 : 0}}>
            <Medal tier={i} px={8} />
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: W / 2 - 80, top: G - 200}}>
        <Sprite rows={HERO_STAND} px={PX} />
      </div>
      <div style={{position: 'absolute', top: 1080, width: W, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 36, color: f >= press ? PAL.Y : '#fff', opacity: blink ? 1 : 0, textShadow: '5px 5px 0 #14101c'}}>
        APERTE START
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- fase ---------------- */
const Level: React.FC = () => {
  const f = useCurrentFrame();
  const cx = charX(f);
  const camX = Math.max(0, snap(cx - 300, 2));
  const sx = (wx: number) => wx - camX;
  const heroX = cx - camX;
  const heroChest: [number, number] = [heroX + 60, G - 110];
  const windowPt: [number, number] = [sx(T.central) + 28 * PX, G - 50 * PX + 29 * PX];
  const pinTier = f >= T.pin[1] ? 3 : null;
  return (
    <AbsoluteFill>
      <Background camX={camX} G={G} />
      {T.stands.map((x, i) => (
        <div key={i} style={{position: 'absolute', left: sx(x), top: G - 34 * PX}}>
          <Stand i={i} active={f >= T.buy[i] - 10 && f < T.unlock[i] + 40} />
        </div>
      ))}
      <div style={{position: 'absolute', left: sx(T.central), top: G - 50 * PX}}>
        <Central lit={f >= T.dlgCentral[0] ? (f % 16) / 16 : 0} />
      </div>
      <Ground camX={camX} G={G} />

      {/* raios + medalha a cada nível */}
      {T.unlock.map((u, i) => {
        const t = f - u;
        if (t < 0 || t > T.bannerDur) return null;
        const y = snap(interpolate(t, [0, 10], [380, 760], clamp));
        const sxm = [1, 0.7, 0.3, 0.7][Math.floor(t / 4) % 4];
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute',
                left: W / 2 - 500,
                top: 330,
                width: 1000,
                height: 1000,
                background: `repeating-conic-gradient(from ${Math.floor(f / 3) * 6}deg, ${TIERS[i].main}55 0deg 10deg, transparent 10deg 20deg)`,
                WebkitMaskImage: 'radial-gradient(circle, black 0%, black 20%, transparent 60%)',
                maskImage: 'radial-gradient(circle, black 0%, black 20%, transparent 60%)',
              }}
            />
            <div style={{position: 'absolute', left: W / 2 - 8 * 14, top: y, transform: `scaleX(${t > 12 ? 1 : sxm})`}}>
              <Medal tier={i} px={14} />
            </div>
            <Sparkle at={u + 10} x={W / 2} y={900} />
            <Sparkle at={u + 18} x={W / 2 - 200} y={820} />
            <Sparkle at={u + 22} x={W / 2 + 210} y={880} />
          </React.Fragment>
        );
      })}

      <Hero x={heroX} f={f} pinTier={pinTier} />

      {/* compra: sacola + cupons */}
      {T.buy.map((b, i) => {
        const t = f - b;
        if (t < 0 || t > 30) return null;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: heroX + 80 - 50, top: G - 20 * PX - 120 - snap(Math.min(t, 10) * 6)}}>
              <Sprite rows={ICON_BAG} px={14} />
            </div>
          </React.Fragment>
        );
      })}
      {T.buy.map((b, i) => (
        <React.Fragment key={`p${i}`}>
          <Sparkle at={b + 4} x={heroX + 80} y={G - 300} />
          <PopText at={b + 6} x={heroX + 80} y={G - 470} text="COMPRA!" color={PAL.O} />
          <PopText at={b + 10} x={heroX + 300} y={G - 420} text={`+${T.couponGain[i]} CUPONS`} />
        </React.Fragment>
      ))}

      {/* nota fiscal e broche */}
      <Flyer from={heroChest} to={windowPt} t0={T.receipt[0]} t1={T.receipt[1]}>
        <Sprite rows={RECEIPT} px={8} />
      </Flyer>
      <Sparkle at={T.pin[0]} x={windowPt[0]} y={windowPt[1]} />
      <Flyer from={windowPt} to={heroChest} t0={T.pin[0]} t1={T.pin[1]}>
        <Pin tier={3} px={10} />
      </Flyer>
      <Sparkle at={T.pin[1]} x={heroChest[0]} y={heroChest[1]} />

      {/* chuva de cupons do bônus */}
      {f >= T.bonus[0] + 24
        ? new Array(18).fill(0).map((_, i) => {
            const t = f - T.bonus[0] - 24 - random(`cd${i}`) * 30;
            if (t < 0) return null;
            const x = random(`cx${i}`) * (W - 140) + 20;
            const y = snap(330 + t * (14 + random(`cs${i}`) * 8), 5);
            if (y > G) return null;
            return (
              <div key={i} style={{position: 'absolute', left: x, top: y, transform: `rotate(${(Math.floor(t / 6) % 2) * 10 - 5}deg)`}}>
                <Sprite rows={COUPON} px={7} />
              </div>
            );
          })
        : null}

      <HUD f={f} />

      <Banner start={T.intro[0]} end={T.intro[1]} text="SUAS COMPRAS" sub="VALEM MUITO MAIS!" color={PAL.O} size={64} />
      <Dialog
        start={T.dlgIntro[0]}
        end={T.dlgIntro[1]}
        press={T.dlgIntro[2]}
        title="GRANDES COMPRADORES"
        icon={<Medal tier={2} px={3} />}
        lines={['COMPRE NOS EXPOSITORES', 'E CONQUISTE UM DOS', '4 NÍVEIS DE DESTAQUE!']}
        option="COMEÇAR"
        result="BOAS COMPRAS!"
      />
      {T.unlock.map((u, i) => (
        <Banner
          key={i}
          start={u}
          end={u + T.bannerDur}
          text={`NÍVEL ${TIERS[i].name}!`}
          sub={i === 3 ? 'O NÍVEL MÁXIMO!' : 'CONTINUE COMPRANDO...'}
          color={TIERS[i].text}
          size={i === 3 ? 62 : 66}
          top={500}
        />
      ))}
      <Dialog
        start={T.dlgCentral[0]}
        end={T.dlgCentral[1]}
        press={T.dlgCentral[2]}
        title="CENTRAL DE TROCA"
        icon={<Sprite rows={RECEIPT} px={4} />}
        lines={['PAVILHÃO SUBWOOFER.', 'APRESENTE SUA NOTA FISCAL', 'OU PEDIDO DE COMPRA.']}
        option="MOSTRAR NOTA"
        result="VALIDANDO..."
      />
      <Banner start={T.pinBanner[0]} end={T.pinBanner[1]} text="BROCHE" sub="DA SUA CATEGORIA RECEBIDO!" color={TIERS[3].text} size={84} />
      <Banner start={T.bonus[0]} end={T.bonus[0] + 26} text="E TEM MAIS!" color={PAL.Y} size={76} top={560} />
      {f >= T.bonus[0] + 24 && f <= T.bonus[1] ? (
        <div style={{position: 'absolute', left: 70, width: W - 140, top: 470, ...pixelFrame(), padding: '44px 40px', textAlign: 'center', fontFamily: PIXEL_FONT, color: '#fff'}}>
          <div style={{fontSize: 34, lineHeight: 1.6}}>A CADA</div>
          <div style={{fontSize: 64, color: PAL.Y, margin: '14px 0', textShadow: '6px 6px 0 #14101c'}}>R$ 1.000</div>
          <div style={{fontSize: 34, lineHeight: 1.6}}>EM COMPRAS</div>
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, margin: '26px 0'}}>
            <div style={{fontSize: 56, color: PAL.O}}>=</div>
            <Sprite rows={COUPON} px={10} />
            <div style={{fontSize: 48, color: PAL.O}}>1 CUPOM</div>
          </div>
          <div style={{fontSize: 26, color: PAL.P, lineHeight: 1.6}}>PARA CONCORRER AOS SORTEIOS!</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------------- final ---------------- */
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const t = f - T.end;
  return (
    <AbsoluteFill>
      <Background camX={4000 + t * 2} G={G + 300} />
      <AbsoluteFill style={{background: 'rgba(7,6,15,0.55)'}} />
      <div style={{position: 'absolute', top: 230, width: W, textAlign: 'center', fontFamily: PIXEL_FONT}}>
        <div style={{fontSize: 40, color: '#fff', textShadow: '6px 6px 0 #14101c'}}>GRANDES COMPRADORES</div>
        <div style={{fontSize: 24, color: PAL.P, marginTop: 24}}>4 NÍVEIS DE RECONHECIMENTO</div>
      </div>
      <div style={{position: 'absolute', top: 400, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
        {TIERS.map((tier, i) => {
          const on = t >= 6 + i * 7;
          const s = !on ? 0 : [0.4, 1.2, 1][Math.min(2, Math.floor((t - 6 - i * 7) / 2))];
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${s})`}}>
              <div style={{transform: `translateY(${(Math.floor((f + i * 5) / 9) % 2) * -PX / 2}px)`}}>
                <Medal tier={i} px={9} />
              </div>
              {/* pódio */}
              <div style={{width: 190, height: 40 + i * 40, marginTop: 14, background: '#1b1d2b', boxShadow: `inset 0 ${PX}px 0 ${tier.main}, 0 0 0 5px #14101c`}} />
              <div style={{fontFamily: PIXEL_FONT, fontSize: i === 3 ? 22 : 24, color: tier.text, marginTop: 20, textShadow: '3px 3px 0 #14101c'}}>{tier.name}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 920, left: 70, right: 70, textAlign: 'center', fontFamily: PIXEL_FONT, opacity: t >= 36 ? 1 : 0}}>
        <div style={{fontSize: 30, color: '#fff', lineHeight: 1.6, textShadow: '4px 4px 0 #14101c'}}>
          QUANTO MAIS VOCÊ COMPRA,
          <br />
          MAIS VOCÊ SE <span style={{color: PAL.O}}>DESTACA!</span>
        </div>
        <div style={{fontSize: 20, color: PAL.P, lineHeight: 1.7, marginTop: 30}}>
          RETIRE SEU BROCHE NA CENTRAL DE TROCA
          <br />
          DE CUPONS · PAVILHÃO SUBWOOFER
        </div>
      </div>
      <div style={{position: 'absolute', top: 1300, width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: t >= 52 ? 1 : 0}}>
        <Img src={staticFile('brand/semanaudio-2026-logo.png')} style={{width: 600}} />
        <div style={{fontFamily: PIXEL_FONT, fontSize: 19, color: Math.floor(f / 12) % 2 ? PAL.Y : '#fff', marginTop: 34, textAlign: 'center', lineHeight: 1.7}}>
          AQUI, GRANDES NEGÓCIOS
          <br />
          MERECEM RECONHECIMENTO!
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Compradores: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#07060f', overflow: 'hidden'}}>
      {f < T.title.end ? <Title /> : f < T.end ? <Level /> : <EndCard />}
      <PixelWipe at={T.title.end - 12} dur={24} />
      <PixelWipe at={T.end - 12} dur={24} />
      <AbsoluteFill style={{pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, transparent 2px, transparent 5px)'}} />
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.55) 100%)'}} />
      <Audio src={staticFile('audio/compradores.wav')} />
    </AbsoluteFill>
  );
};
