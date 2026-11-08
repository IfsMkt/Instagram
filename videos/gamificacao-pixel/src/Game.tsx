import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {loadFonts} from './fonts';
import {
  CHEST_CLOSED,
  CHEST_OPEN,
  COIN,
  COUPON,
  HEADPHONES,
  HERO_JUMP,
  HERO_STAND,
  HERO_WALK,
  ICON_BAG,
  ICON_TARGET,
  NOTE_BLOCK,
  NOTE_BLOCK_USED,
  PAL,
  ROAD_CASE,
  Sprite,
  TROPHY,
} from './pixel';
import {H, PIXEL_FONT, PX, TL, W} from './theme';
import {Banner, Dialog, HUD, PixelWipe, PopText, pixelFrame} from './ui';
import {Background, Central, Ground, Shop} from './world';

loadFonts();

const G = TL.G;
const snap = (v: number, s = PX) => Math.round(v / s) * s;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ------------------ movimento do personagem ------------------ */
const charX = (f: number) =>
  interpolate(
    f,
    TL.charX.map((k) => k[0]),
    TL.charX.map((k) => k[1]),
    clamp,
  );
const jumpAt = (f: number) => TL.jumps.find(([s, d]) => f >= s && f <= s + d);
const jumpY = (f: number) => {
  const j = jumpAt(f);
  if (!j) return 0;
  const p = (f - j[0]) / j[1];
  return snap(4 * j[2] * p * (1 - p));
};
const moving = (f: number) => Math.abs(charX(f + 1) - charX(f)) > 0.5;

/* ------------------ economia (HUD) ------------------ */
const coinsAt = (f: number) => {
  let c = 0;
  TL.missionCoins.forEach(([, t]) => f >= t && (c += 100));
  if (f >= TL.missionBonus) c += 100;
  TL.block.coins.forEach((t) => f >= t && (c += 100));
  if (f >= TL.drain[0]) c = Math.round(interpolate(f, TL.drain, [c, 0], clamp) / 10) * 10;
  return c;
};
const couponsAt = (f: number) => (f >= TL.couponGet[1] && f < TL.couponToChest[0] ? 1 : 0);
const prizesAt = (f: number) => (f >= TL.chestOpen + 12 ? 1 : 0);

/* ------------------ peças ------------------ */
const SpinCoin: React.FC<{x: number; y: number; px?: number; phase?: number}> = ({x, y, px = 8, phase = 0}) => {
  const f = useCurrentFrame();
  const sx = [1, 0.75, 0.35, 0.75][Math.floor((f + phase) / 5) % 4];
  const w = 10 * px;
  const h = 11 * px;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2 + (Math.floor((f + phase) / 10) % 2) * PX / 2, transform: `scaleX(${sx})`}}>
      <Sprite rows={COIN} px={px} />
    </div>
  );
};

const Sparkle: React.FC<{at: number; x: number; y: number}> = ({at, x, y}) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > 14) return null;
  const d = snap(t * 7, PX / 2);
  const s = PX;
  return (
    <>
      {[
        [d, 0],
        [-d, 0],
        [0, d],
        [0, -d],
        [d * 0.7, d * 0.7],
        [-d * 0.7, d * 0.7],
        [d * 0.7, -d * 0.7],
        [-d * 0.7, -d * 0.7],
      ].map(([dx, dy], i) => (
        <div key={i} style={{position: 'absolute', left: x + dx - s / 2, top: y + dy - s / 2, width: s, height: s, background: i % 2 ? PAL.Y : '#fff', opacity: t > 10 ? 0.5 : 1}} />
      ))}
    </>
  );
};

const Hero: React.FC<{x: number; f: number}> = ({x, f}) => {
  const jy = jumpY(f);
  let rows = HERO_STAND;
  if (jumpAt(f)) rows = HERO_JUMP;
  else if (moving(f)) rows = Math.floor(f / 5) % 2 ? HERO_WALK : HERO_STAND;
  const bob = !jumpAt(f) && !moving(f) && Math.floor(f / 15) % 2 ? PX / 2 : 0;
  return (
    <div style={{position: 'absolute', left: x, top: G - 20 * PX - jy + bob}}>
      <Sprite rows={rows} px={PX} />
    </div>
  );
};

/** Cupom voando entre dois pontos de tela. */
const Flyer: React.FC<{from: [number, number]; to: [number, number]; t0: number; t1: number; children: React.ReactNode}> = ({from, to, t0, t1, children}) => {
  const f = useCurrentFrame();
  if (f < t0 || f > t1) return null;
  const p = (f - t0) / (t1 - t0);
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p - Math.sin(p * Math.PI) * 220;
  return <div style={{position: 'absolute', left: snap(x, 5), top: snap(y, 5), transform: 'translate(-50%,-50%)'}}>{children}</div>;
};

/* ================= TELA DE TÍTULO ================= */
const Title: React.FC = () => {
  const f = useCurrentFrame();
  const press = TL.title.press;
  const blink = f < press ? Math.floor(f / 10) % 2 === 0 : Math.floor(f / 2) % 2 === 0;
  const drop = [0, 0, 1, 1, 1, 1].map((v) => v);
  void drop;
  const titleY = f < 14 ? snap(interpolate(f, [0, 14], [-300, 0])) : 0;
  return (
    <AbsoluteFill>
      <Background camX={f * 2} G={G} />
      <Ground camX={f * 2} G={G} />
      <div style={{position: 'absolute', top: 330 + titleY, width: W, textAlign: 'center', fontFamily: PIXEL_FONT}}>
        <div style={{fontSize: 46, color: '#fff', textShadow: `6px 6px 0 #14101c`, letterSpacing: 4}}>MISSÃO</div>
        <div style={{fontSize: 92, color: PAL.O, marginTop: 30, textShadow: `10px 10px 0 #14101c, 0 0 60px rgba(245,130,32,0.7)`}}>SEMANÁUDIO</div>
        <div style={{display: 'inline-block', marginTop: 46, padding: '18px 28px', ...pixelFrame(PAL.O), color: '#14101c', fontSize: 30}}>O JOGO DAS MOEDAS</div>
      </div>
      <div style={{position: 'absolute', left: W / 2 - 80, top: G - 200 - (Math.floor(f / 8) % 2) * PX}}>
        <Sprite rows={Math.floor(f / 8) % 2 ? HERO_JUMP : HERO_STAND} px={PX} />
      </div>
      <SpinCoin x={W / 2 - 230} y={G - 120} />
      <SpinCoin x={W / 2 + 230} y={G - 120} phase={7} />
      <div style={{position: 'absolute', top: 820, width: W, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 38, color: f >= press ? PAL.Y : '#fff', opacity: blink ? 1 : 0, textShadow: `5px 5px 0 #14101c`}}>
        APERTE START
      </div>
      <div style={{position: 'absolute', top: 920, width: W, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 22, color: PAL.P}}>1 JOGADOR · SEMANÁUDIO 2026</div>
    </AbsoluteFill>
  );
};

/* ================= FASE ================= */
const Level: React.FC = () => {
  const f = useCurrentFrame();
  const cx = charX(f);
  const camX = Math.max(0, snap(cx - 300, 2));
  const sx = (wx: number) => wx - camX;
  const heroX = cx - camX;
  const blockBump = f >= TL.block.hit && f < TL.block.hit + 6 ? -PX * 2 : 0;
  const centralX = 2620;
  const centralTop = G - 50 * PX;
  const windowPt: [number, number] = [sx(centralX) + 28 * PX, centralTop + 29 * PX];
  const chestX = 3500;
  const chestPt: [number, number] = [sx(chestX) + 80, G - 90];
  const hudCoin: [number, number] = [150, 245];
  const hudCoupon: [number, number] = [470, 245];
  const chestOpen = f >= TL.chestOpen;
  return (
    <AbsoluteFill>
      <Background camX={camX} G={G} />

      {/* construções */}
      <div style={{position: 'absolute', left: sx(1650), top: G - 40 * PX}}>
        <Shop glow={f >= TL.dlgShop[2] && f < TL.dlgShop[1] ? 1 : 0} />
      </div>
      <div style={{position: 'absolute', left: sx(centralX), top: centralTop}}>
        <Central lit={f >= TL.dlgCentral[0] ? (f % 16) / 16 : 0} />
      </div>

      {/* raios do prêmio */}
      {chestOpen ? (
        <div
          style={{
            position: 'absolute',
            left: chestPt[0] - 600,
            top: G - 700,
            width: 1200,
            height: 1200,
            background: `repeating-conic-gradient(from ${Math.floor(f / 3) * 6}deg, rgba(255,210,63,0.35) 0deg 10deg, rgba(255,210,63,0) 10deg 20deg)`,
            maskImage: 'radial-gradient(circle, black 0%, black 25%, transparent 60%)',
            WebkitMaskImage: 'radial-gradient(circle, black 0%, black 25%, transparent 60%)',
          }}
        />
      ) : null}

      <Ground camX={camX} G={G} />

      {/* obstáculos: cases de transporte */}
      {TL.missionCoins.map(([wx], i) => (
        <div key={i} style={{position: 'absolute', left: sx(wx) - 80, top: G - 12 * PX}}>
          <Sprite rows={ROAD_CASE} px={PX} />
        </div>
      ))}

      {/* moedas da missão */}
      {TL.missionCoins.map(([wx, t], i) =>
        f < t ? <SpinCoin key={i} x={sx(wx)} y={G - 440} phase={i * 3} /> : null,
      )}
      {TL.missionCoins.map(([wx, t], i) => (
        <React.Fragment key={`fx${i}`}>
          <Sparkle at={t} x={sx(wx)} y={G - 440} />
          <PopText at={t} x={sx(wx)} y={G - 560} text="+100" />
        </React.Fragment>
      ))}

      {/* bloco musical */}
      <div style={{position: 'absolute', left: sx(TL.block.x) - 80, top: G - 20 * PX - 170 - 16 * PX + blockBump}}>
        <Sprite rows={f >= TL.block.hit ? NOTE_BLOCK_USED : NOTE_BLOCK} px={PX} />
      </div>
      {TL.block.coins.map((t, i) => {
        const tt = f - t;
        if (tt < 0 || tt > 22) return null;
        const bx = sx(TL.block.x) + (i - 2) * 50;
        const by = G - 20 * PX - 170 - 16 * PX - 60 - snap(Math.sin((tt / 22) * Math.PI) * 220);
        return (
          <React.Fragment key={i}>
            <SpinCoin x={bx} y={by} px={7} phase={i} />
          </React.Fragment>
        );
      })}
      {TL.block.coins.map((t, i) => (
        <PopText key={`bp${i}`} at={t + 14} x={sx(TL.block.x) + (i - 2) * 60} y={G - 760 - i * 20} text="+100" />
      ))}

      {/* baú */}
      <div style={{position: 'absolute', left: sx(chestX), top: G - 14 * PX}}>
        <Sprite rows={chestOpen ? CHEST_OPEN : CHEST_CLOSED} px={PX} />
      </div>
      {chestOpen ? (
        <div
          style={{
            position: 'absolute',
            left: chestPt[0] - 70,
            top: snap(interpolate(f, [TL.chestOpen, TL.chestOpen + 20], [G - 160, G - 470], clamp)) + (Math.floor(f / 8) % 2) * 5,
          }}
        >
          <Sprite rows={TROPHY} px={PX} />
        </div>
      ) : null}
      <Sparkle at={TL.chestOpen} x={chestPt[0]} y={G - 160} />
      <Sparkle at={TL.chestOpen + 10} x={chestPt[0] - 120} y={G - 380} />
      <Sparkle at={TL.chestOpen + 16} x={chestPt[0] + 130} y={G - 330} />
      {chestOpen
        ? new Array(36).fill(0).map((_, i) => {
            const t = f - TL.chestOpen;
            const ang = random(`cf${i}`) * Math.PI * 2;
            const v = 8 + random(`cv${i}`) * 14;
            const x = chestPt[0] + Math.cos(ang) * v * t;
            const y = G - 200 + Math.sin(ang) * v * t * 0.8 - 18 * t + 0.9 * t * t;
            if (y > G) return null;
            return <div key={i} style={{position: 'absolute', left: snap(x, 5), top: snap(y, 5), width: PX, height: PX, background: [PAL.O, PAL.Y, '#fff', PAL.C, PAL.R][i % 5]}} />;
          })
        : null}

      {/* personagem */}
      <Hero x={heroX} f={f} />

      {/* item comprado */}
      {f >= TL.dlgShop[2] + 4 && f < TL.dlgShop[1] ? (
        <div style={{position: 'absolute', left: heroX + 80 - 60, top: G - 20 * PX - 140 - snap(interpolate(f, [TL.dlgShop[2] + 4, TL.dlgShop[2] + 16], [0, 60], clamp))}}>
          <Sprite rows={HEADPHONES} px={PX} />
        </div>
      ) : null}
      <Sparkle at={TL.dlgShop[2] + 6} x={heroX + 80} y={G - 20 * PX - 120} />

      {/* moedas e cupons voando */}
      {new Array(5).fill(0).map((_, i) => (
        <Flyer key={i} from={hudCoin} to={windowPt} t0={TL.drain[0] + i * 5} t1={TL.drain[0] + i * 5 + 14}>
          <Sprite rows={COIN} px={6} />
        </Flyer>
      ))}
      <Flyer from={windowPt} to={hudCoupon} t0={TL.couponGet[0]} t1={TL.couponGet[1]}>
        <Sprite rows={COUPON} px={9} />
      </Flyer>
      <Sparkle at={TL.couponGet[0]} x={windowPt[0]} y={windowPt[1]} />
      <Flyer from={hudCoupon} to={chestPt} t0={TL.couponToChest[0]} t1={TL.couponToChest[1]}>
        <Sprite rows={COUPON} px={9} />
      </Flyer>

      {/* ---------- interface ---------- */}
      <HUD
        coins={coinsAt(f)}
        coupons={couponsAt(f)}
        prizes={prizesAt(f)}
        bumps={{coin: [...TL.missionCoins.map((c) => c[1]), TL.missionBonus, ...TL.block.coins], coupon: [TL.couponGet[1]], prize: [TL.chestOpen + 12]}}
      />

      <Banner start={TL.levelCard[0]} end={TL.levelCard[1]} text="FASE 1" sub="JUNTE MOEDAS E PRÊMIOS!" color={PAL.O} size={80} />

      <Dialog
        start={TL.dlgMission[0]}
        end={TL.dlgMission[1]}
        press={TL.dlgMission[2]}
        title="NOVA MISSÃO!"
        icon={<Sprite rows={ICON_TARGET} px={7} />}
        lines={['VÁ PULANDO ATÉ', 'A MOEDA.', 'RECOMPENSA: MOEDAS']}
        option="ACEITAR MISSÃO"
        result="MISSÃO ACEITA!"
      />
      <Banner start={TL.missionBonus} end={TL.missionBonus + 46} text="MISSÃO COMPLETA!" sub="+100 MOEDAS DE BÔNUS" size={56} />

      <Dialog
        start={TL.dlgShop[0]}
        end={TL.dlgShop[1]}
        press={TL.dlgShop[2]}
        title="LOJA DO EVENTO"
        icon={<Sprite rows={ICON_BAG} px={7} />}
        lines={['FAÇA SUAS COMPRAS', 'NOS EXPOSITORES.']}
        option="COMPRAR"
        result="COMPRA REALIZADA!"
      />
      <Banner start={TL.bannerShopCoins[0]} end={TL.bannerShopCoins[1]} text="COMPROU?" sub="GANHOU MOEDAS!" size={64} />

      <Dialog
        start={TL.dlgCentral[0]}
        end={TL.dlgCentral[1]}
        press={TL.dlgCentral[2]}
        title="CENTRAL DE TROCA"
        icon={<Sprite rows={COIN} px={5} />}
        lines={['1.000 MOEDAS', '= 1 CUPOM']}
        option="TROCAR MOEDAS"
        result="TROCANDO..."
      />
      <Banner start={TL.couponGet[1]} end={TL.couponGet[1] + 34} text="+1 CUPOM!" sub="CUPOM GARANTIDO" size={72} />

      <Dialog
        start={TL.dlgPrize[0]}
        end={TL.dlgPrize[1]}
        press={TL.dlgPrize[2]}
        title="BAÚ DE PRÊMIOS"
        icon={<Sprite rows={COUPON} px={4} />}
        lines={['TROQUE SEU CUPOM', 'POR UM PRÊMIO.']}
        option="USAR CUPOM"
        result="BOA SORTE!"
      />
      <Banner start={TL.chestOpen + 4} end={TL.end - 2} text="PRÊMIO" sub="DESBLOQUEADO!" size={96} />
    </AbsoluteFill>
  );
};

/* ================= RESUMO FINAL ================= */
const FlowRow: React.FC<{at: number; icon: React.ReactNode; label: string; note?: string; small?: boolean}> = ({at, icon, label, note, small}) => {
  const f = useCurrentFrame();
  if (f < at) return <div style={{height: 140, width: small ? 470 : 760}} />;
  const s = [0.4, 1.15, 1][Math.min(2, Math.floor((f - at) / 2))];
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: small ? 18 : 28, height: 140, width: small ? 470 : 760, transform: `scale(${s})`}}>
      <div style={{width: small ? 80 : 110, display: 'flex', justifyContent: 'center'}}>{icon}</div>
      <div>
        <div style={{fontSize: small ? 40 : 50, color: '#fff', textShadow: '5px 5px 0 #14101c'}}>{label}</div>
        {note ? <div style={{fontSize: 22, color: PAL.P, marginTop: 12}}>{note}</div> : null}
      </div>
    </div>
  );
};
const Arrow: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  return (
    <div style={{height: 56, display: 'flex', justifyContent: 'center', opacity: f >= at ? 1 : 0, transform: `translateY(${(Math.floor(f / 8) % 2) * 5}px)`}}>
      <Sprite rows={['KOOOK', 'KOOOK', 'KOOOK', 'OOOOO', '.OOO.', '..O..']} px={8} />
    </div>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const t = f - TL.end;
  const b = TL.end;
  return (
    <AbsoluteFill>
      <Background camX={3000 + t * 2} G={G + 380} />
      <AbsoluteFill style={{background: 'rgba(7,6,15,0.55)'}} />
      <div style={{position: 'absolute', top: 250, width: W, textAlign: 'center', fontFamily: PIXEL_FONT}}>
        <div style={{fontSize: 56, color: PAL.O, textShadow: '7px 7px 0 #14101c'}}>COMO FUNCIONA?</div>
      </div>
      <div style={{position: 'absolute', left: 0, width: W, top: 390, fontFamily: PIXEL_FONT, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{display: 'flex', gap: 10}}>
          <FlowRow at={b + 6} icon={<Sprite rows={ICON_TARGET} px={9} />} label="MISSÕES" small />
          <FlowRow at={b + 10} icon={<Sprite rows={ICON_BAG} px={9} />} label="COMPRAS" small />
        </div>
        <Arrow at={b + 16} />
        <FlowRow at={b + 20} icon={<Sprite rows={COIN} px={8} />} label="MOEDAS" note="JUNTE AO LONGO DO EVENTO" />
        <Arrow at={b + 28} />
        <FlowRow at={b + 32} icon={<Sprite rows={COUPON} px={6} />} label="CUPONS" note="TROQUE NA CENTRAL DE TROCA" />
        <Arrow at={b + 40} />
        <FlowRow at={b + 44} icon={<Sprite rows={TROPHY} px={6} />} label="PRÊMIOS" note="USE SEUS CUPONS" />
      </div>
      <div style={{position: 'absolute', top: 1360, width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: t >= 60 ? 1 : 0}}>
        <Img src={staticFile('brand/semanaudio-2026-logo.png')} style={{width: 620}} />
        <div style={{fontFamily: PIXEL_FONT, fontSize: 30, color: Math.floor(f / 10) % 2 ? PAL.Y : '#fff', marginTop: 36, textShadow: '4px 4px 0 #14101c'}}>
          PARTICIPE!
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Game: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#07060f', overflow: 'hidden'}}>
      {f < TL.title.end ? <Title /> : f < TL.end ? <Level /> : <EndCard />}
      <PixelWipe at={TL.title.end - 12} dur={24} />
      <PixelWipe at={TL.end - 12} dur={24} />
      {/* scanlines CRT */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, transparent 2px, transparent 5px)',
        }}
      />
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.55) 100%)'}} />
      <Audio src={staticFile('audio/game.wav')} />
    </AbsoluteFill>
  );
};
