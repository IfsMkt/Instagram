import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Flash, KenBurns, Particles, StageBeams, TechGrid, useShake, Waveform} from './fx';
import {EducaLogo, SemanaudioLogo, Slam, Tag, WordsUp} from './text';
import {beatPulse, C, FONT_DISPLAY, FONT_TEXT, H, W} from './theme';

const Center: React.FC<{children: React.ReactNode; top: number; style?: React.CSSProperties}> = ({children, top, style}) => (
  <div style={{position: 'absolute', left: 60, right: 60, top, display: 'flex', flexDirection: 'column', alignItems: 'center', ...style}}>
    {children}
  </div>
);

/** Entrada de cena: leve zoom-out + desfoque saindo. */
const SceneIn: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 9], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{transform: `scale(${1.08 - 0.08 * p})`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
};

const Glow: React.FC<{y?: number; size?: number; strength?: number}> = ({y = H * 0.42, size = 1100, strength = 0.55}) => {
  const f = useCurrentFrame();
  const p = beatPulse(f, 7);
  return (
    <div
      style={{
        position: 'absolute',
        left: W / 2 - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(245,130,32,${strength * (0.75 + 0.25 * p)}) 0%, rgba(245,130,32,0.12) 40%, rgba(0,0,0,0) 70%)`,
        filter: 'blur(10px)',
      }}
    />
  );
};

/* ---------------- CENA 1 — GANCHO (0–5s) ---------------- */
export const SceneHook: React.FC = () => {
  const shake = useShake(72, 16, 12);
  return (
    <AbsoluteFill style={{background: C.black}}>
      <KenBurns src="img/console.jpg" dur={150} from={1.05} to={1.22} x={[1050, -650]} y={[0, -40]} brightness={4.2} vignette={0.5} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.85) 100%)'}} />
      <StageBeams count={5} intensity={1.2} seed="hook" />
      <Particles count={40} seed="hk" />
      <Waveform y={1240} height={200} bars={56} opacity={0.85} />
      <div style={{position: 'absolute', top: 230, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <Img src={staticFile('brand/semanaudio-wave.png')} style={{width: 120, filter: 'drop-shadow(0 0 25px rgba(245,130,32,0.8))'}} />
      </div>
      <div style={{position: 'absolute', inset: 0, transform: shake}}>
        <Center top={470}>
          <WordsUp text="VOCÊ TRABALHA" at={4} size={176} exitAt={66} />
          <WordsUp text="COM ÁUDIO?" at={10} size={230} highlight={['ÁUDIO?', 'ÁUDIO']} exitAt={66} />
        </Center>
        <Center top={430}>
          <WordsUp text="ENTÃO ESSA" at={72} size={150} />
          <Slam at={80} from={2.6}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 178,
                color: C.orange,
                lineHeight: 1,
                textShadow: '0 0 60px rgba(245,130,32,0.7)',
              }}
            >
              OPORTUNIDADE
            </div>
          </Slam>
          <WordsUp text="É PRA VOCÊ!" at={92} size={190} />
        </Center>
      </div>
      <Flash at={0} dur={8} peak={0.6} />
      <Flash at={72} dur={6} peak={0.35} />
    </AbsoluteFill>
  );
};

/* ---------------- CENA 2 — APRESENTAÇÃO (5–10s) ---------------- */
export const SceneIntro: React.FC<{educaLogo: string | null}> = ({educaLogo}) => {
  const f = useCurrentFrame();
  const plus = interpolate(f, [16, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <SceneIn>
      <AbsoluteFill style={{background: C.black}}>
        <KenBurns src="img/truss-waves.jpg" dur={150} from={1.0} to={1.18} x={[0, -60]} brightness={1.7} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.85) 100%)'}} />
        <TechGrid opacity={0.45} />
        <Glow y={620} size={1200} strength={0.35} />
        <StageBeams count={4} intensity={0.7} seed="intro" />
        <Center top={330}>
          <Slam at={2} from={1.6}>
            <SemanaudioLogo width={800} />
          </Slam>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 110,
              lineHeight: 1,
              color: C.orange,
              opacity: plus,
              transform: `scale(${0.5 + 0.5 * plus}) rotate(${(1 - plus) * 90}deg)`,
              margin: '4px 0 14px',
              textShadow: '0 0 40px rgba(245,130,32,0.9)',
            }}
          >
            +
          </div>
          <Slam at={22} from={1.6}>
            <EducaLogo src={educaLogo} width={460} />
          </Slam>
        </Center>
        <Center top={980}>
          <WordsUp text="SEMANÁUDIO + EDUCA ÁUDIO" at={44} size={104} highlight={['EDUCA', 'ÁUDIO']} stagger={3} />
          <div style={{height: 26}} />
          <Tag at={66} size={44}>
            CONHECIMENTO QUE TRANSFORMA
          </Tag>
          <div style={{height: 10}} />
          <Tag at={74} size={44} dark>
            SUA CARREIRA!
          </Tag>
        </Center>
        <Flash at={0} dur={8} peak={0.5} />
      </AbsoluteFill>
    </SceneIn>
  );
};

/* ---------------- CENA 3 — DESCONTO (10–16s) ---------------- */
const MeterRing: React.FC<{size: number; y: number}> = ({size, y}) => {
  const f = useCurrentFrame();
  const p = beatPulse(f, 6);
  const ticks = 72;
  const fill = interpolate(f, [0, 22], [0, 15 / 100], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <svg width={size} height={size} style={{position: 'absolute', left: W / 2 - size / 2, top: y - size / 2, transform: `rotate(${f * 0.4}deg)`}}>
      {new Array(ticks).fill(0).map((_, i) => {
        const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
        const r1 = size / 2 - 40;
        const r2 = size / 2 - (i % 6 === 0 ? 4 : 22) + p * 6;
        // acende 15% do anel (o "15%" do desconto)
        const lit = i / ticks < fill;
        return (
          <line
            key={i}
            x1={size / 2 + Math.cos(a) * r1}
            y1={size / 2 + Math.sin(a) * r1}
            x2={size / 2 + Math.cos(a) * r2}
            y2={size / 2 + Math.sin(a) * r2}
            stroke={lit ? C.orange : 'rgba(255,255,255,0.18)'}
            strokeWidth={i % 6 === 0 ? 7 : 4}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

export const SceneDiscount: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shake = useShake(0, 26, 16);
  const count = Math.round(interpolate(f, [0, 12], [0, 15], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)}));
  const s = spring({frame: f, fps, config: {damping: 10, stiffness: 160, mass: 0.8}});
  const breathe = 1 + 0.025 * beatPulse(f, 6);
  return (
    <AbsoluteFill style={{background: C.black}}>
      <AbsoluteFill style={{opacity: 0.55}}>
        <KenBurns src="img/orange-waves.jpg" dur={180} from={1.0} to={1.25} brightness={1.4} />
      </AbsoluteFill>
      <Glow y={760} size={1300} strength={0.6} />
      <StageBeams count={6} intensity={0.9} seed="disc" />
      <Particles count={60} seed="dc" speed={1.4} />
      <MeterRing size={1000} y={760} />
      <div style={{position: 'absolute', inset: 0, transform: shake}}>
        <Center top={250}>
          <Tag at={2} size={40} dark>
            BENEFÍCIO SEMANÁUDIO
          </Tag>
        </Center>
        <Center top={400}>
          <div
            style={{
              transform: `scale(${interpolate(s, [0, 1], [3.2, 1]) * breathe})`,
              fontFamily: FONT_DISPLAY,
              fontSize: 600,
              lineHeight: 0.9,
              background: `linear-gradient(180deg, #FFD2A3 0%, ${C.orangeHot} 30%, ${C.orange} 60%, ${C.orangeDeep} 100%)`,
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              filter: `drop-shadow(0 0 50px rgba(245,130,32,0.75))`,
              letterSpacing: -6,
            }}
          >
            {count}%
          </div>
          <Slam at={12} from={2.4}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 300,
                lineHeight: 0.85,
                color: C.white,
                letterSpacing: 18,
                textShadow: '0 0 40px rgba(255,255,255,0.35)',
                marginTop: -20,
              }}
            >
              OFF
            </div>
          </Slam>
        </Center>
        <Center top={1150}>
          <WordsUp text="EM QUALQUER CURSO" at={30} size={112} />
          <WordsUp text="DO EDUCA ÁUDIO!" at={40} size={112} highlight={['EDUCA', 'ÁUDIO']} />
        </Center>
      </div>
      <Flash at={0} dur={12} peak={1} />
    </AbsoluteFill>
  );
};

/* ---------------- CENA 4 — PREMIAÇÃO (16–23s) ---------------- */
const Coupon: React.FC<{w: number; label?: boolean}> = ({w, label = true}) => {
  const h = w * 0.48;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 18,
        background: `linear-gradient(135deg, ${C.orangeHot}, ${C.orange} 50%, ${C.orangeDeep})`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(245,130,32,0.4)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        WebkitMaskImage: `radial-gradient(circle at 0 50%, transparent ${h * 0.14}px, black ${h * 0.14 + 1}px), radial-gradient(circle at 100% 50%, transparent ${h * 0.14}px, black ${h * 0.14 + 1}px)`,
        WebkitMaskComposite: 'source-in',
      }}
    >
      <div style={{flex: 1, paddingLeft: w * 0.1, color: C.white, fontFamily: FONT_TEXT, opacity: label ? 1 : 0}}>
        <div style={{fontWeight: 700, fontSize: w * 0.055, letterSpacing: 3, opacity: 0.85}}>CUPOM</div>
        <div style={{fontFamily: FONT_DISPLAY, fontSize: w * 0.15, lineHeight: 1}}>ACESSO TOTAL</div>
      </div>
      <div style={{width: 0, height: '78%', borderLeft: '4px dashed rgba(0,0,0,0.35)', marginRight: w * 0.2}} />
    </div>
  );
};

export const ScenePrize: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const REVEAL = 75; // 18,5 s — impacto da trilha
  const shake = useShake(REVEAL, 30, 18);
  const sweep = interpolate(f, [0, 22], [-W, W * 1.4], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const s = spring({frame: f - REVEAL, fps, config: {damping: 11, stiffness: 150, mass: 0.9}});
  const build = interpolate(f, [10, REVEAL], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.black}}>
      <AbsoluteFill style={{opacity: 0.45}}>
        <KenBurns src="img/truss-waves.jpg" dur={210} from={1.3} to={1.0} brightness={1.3} />
      </AbsoluteFill>
      <Glow y={820} size={900 + 600 * build + 200 * (f > REVEAL ? 1 : 0)} strength={0.3 + 0.35 * build} />
      <StageBeams count={6} intensity={0.6 + 0.8 * build} seed="prize" />
      <Particles count={110} seed="pz" speed={1 + build} burstAt={REVEAL} />
      {/* faixa de luz laranja de transição */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: sweep,
          width: 420,
          height: H,
          background: 'linear-gradient(90deg, rgba(245,130,32,0) 0%, rgba(255,190,120,0.9) 50%, rgba(245,130,32,0) 100%)',
          transform: 'skewX(-14deg)',
          filter: 'blur(30px)',
          mixBlendMode: 'screen',
        }}
      />
      {/* E TEM MAIS! */}
      <Center top={640}>
        <Slam at={4} from={2.4}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 250,
              lineHeight: 0.9,
              color: C.white,
              textAlign: 'center',
              transform: `scale(${1 + build * 0.12})`,
              opacity: interpolate(f, [REVEAL - 8, REVEAL - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              textShadow: '0 0 50px rgba(245,130,32,0.8)',
            }}
          >
            E TEM <span style={{color: C.orange}}>MAIS!</span>
          </div>
        </Slam>
      </Center>
      {/* Reveal */}
      {f >= REVEAL - 1 ? (
        <div style={{position: 'absolute', inset: 0, transform: shake}}>
          {/* leque com 10 cupons */}
          <div style={{position: 'absolute', left: W / 2, top: 1130}}>
            {new Array(10).fill(0).map((_, i) => {
              const ang = -45 + i * 10;
              const d = spring({frame: f - REVEAL - 4 - i * 2, fps, config: {damping: 14, stiffness: 120}});
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: -125,
                    top: -60,
                    transformOrigin: '50% 460px',
                    transform: `rotate(${ang * d}deg) translateY(${(1 - d) * 300}px)`,
                    opacity: d,
                  }}
                >
                  <Coupon w={250} label={i === 9} />
                </div>
              );
            })}
          </div>
          <Center top={250}>
            <Tag at={REVEAL + 6} size={42} dark>
              PREMIAÇÃO
            </Tag>
          </Center>
          <Center top={330}>
            <div
              style={{
                transform: `scale(${interpolate(s, [0, 1], [3.5, 1]) * (1 + 0.03 * beatPulse(f, 6))})`,
                fontFamily: FONT_DISPLAY,
                fontSize: 520,
                lineHeight: 0.85,
                background: `linear-gradient(180deg, #FFD2A3 0%, ${C.orangeHot} 30%, ${C.orange} 60%, ${C.orangeDeep} 100%)`,
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 0 60px rgba(245,130,32,0.85))',
              }}
            >
              10
            </div>
            <Slam at={REVEAL + 8} from={1.8}>
              <div style={{fontFamily: FONT_DISPLAY, fontSize: 150, color: C.white, lineHeight: 0.95, textAlign: 'center'}}>CUPONS</div>
            </Slam>
            <WordsUp text="DE ACESSO TOTAL" at={REVEAL + 16} size={104} highlight={['ACESSO', 'TOTAL']} />
          </Center>
          <Center top={1290}>
            <Tag at={REVEAL + 34} size={58}>
              PARA SORTEIO!
            </Tag>
          </Center>
        </div>
      ) : null}
      <Flash at={0} dur={10} peak={0.7} color="#FFB070" />
      <Flash at={REVEAL} dur={14} peak={1} />
    </AbsoluteFill>
  );
};

/* ---------------- CENA 5 — PRAZO (23–27s) ---------------- */
export const SceneDeadline: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const STAMP = 46;
  const stamp = spring({frame: f - STAMP, fps, config: {damping: 9, stiffness: 200, mass: 0.6}});
  const shake = useShake(STAMP, 14, 10);
  return (
    <SceneIn>
      <AbsoluteFill style={{background: C.black}}>
        <KenBurns src="img/console.jpg" dur={120} from={1.15} to={1.25} x={[-700, -900]} y={[0, 0]} brightness={2.2} />
        <AbsoluteFill style={{background: 'rgba(0,0,0,0.55)'}} />
        <TechGrid opacity={0.3} />
        <Glow y={900} size={1100} strength={0.3} />
        <div style={{position: 'absolute', inset: 0, transform: shake}}>
          <Center top={300}>
            <Tag at={2} size={44}>
              OFERTA ESPECIAL
            </Tag>
            <div style={{height: 20}} />
            <WordsUp text="SEMANÁUDIO 2026" at={6} size={150} highlight={['2026']} />
          </Center>
          {/* bloco de datas */}
          <Center top={720}>
            <Slam at={18} from={1.5}>
              <div
                style={{
                  border: `5px solid ${C.orange}`,
                  borderRadius: 28,
                  padding: '30px 60px 20px',
                  background: 'rgba(0,0,0,0.6)',
                  textAlign: 'center',
                  boxShadow: '0 0 60px rgba(245,130,32,0.35)',
                }}
              >
                <div style={{fontFamily: FONT_TEXT, fontWeight: 800, fontSize: 40, color: C.orange, letterSpacing: 8}}>EVENTO</div>
                <div style={{fontFamily: FONT_DISPLAY, fontSize: 170, color: C.white, lineHeight: 1}}>10 A 12</div>
                <div style={{fontFamily: FONT_DISPLAY, fontSize: 96, color: C.white, lineHeight: 1, letterSpacing: 6}}>DE NOVEMBRO</div>
              </div>
            </Slam>
          </Center>
          {/* carimbo da prorrogação */}
          <Center top={1150}>
            <div
              style={{
                transform: `scale(${interpolate(stamp, [0, 1], [2.6, 1])}) rotate(-4deg)`,
                opacity: interpolate(f, [STAMP, STAMP + 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                background: C.orange,
                color: C.white,
                padding: '22px 44px',
                borderRadius: 14,
                textAlign: 'center',
                boxShadow: '0 0 80px rgba(245,130,32,0.7)',
              }}
            >
              <div style={{fontFamily: FONT_DISPLAY, fontSize: 104, lineHeight: 1}}>PRORROGADA ATÉ 13/11</div>
              <div style={{fontFamily: FONT_TEXT, fontWeight: 900, fontSize: 64, lineHeight: 1.1}}>ÀS 23H59!</div>
            </div>
          </Center>
        </div>
        <Flash at={STAMP} dur={8} peak={0.45} />
      </AbsoluteFill>
    </SceneIn>
  );
};

/* ---------------- CENA 6 — ENCERRAMENTO (27–32s) ---------------- */
export const SceneClose: React.FC<{educaLogo: string | null}> = ({educaLogo}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [128, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.black}}>
      <AbsoluteFill style={{opacity: 0.6}}>
        <KenBurns src="img/orange-waves.jpg" dur={150} from={1.1} to={1.3} brightness={1.2} />
      </AbsoluteFill>
      <Glow y={640} size={1200} strength={0.35} />
      <StageBeams count={5} intensity={0.7} seed="close" />
      <Particles count={50} seed="cl" />
      <Center top={290}>
        <Slam at={2} from={1.5}>
          <SemanaudioLogo width={900} />
        </Slam>
        <div style={{height: 40}} />
        <div style={{fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 34, color: C.grey, letterSpacing: 8, opacity: interpolate(f, [14, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          EM PARCERIA COM
        </div>
        <div style={{height: 20}} />
        <Slam at={16} from={1.5}>
          <EducaLogo src={educaLogo} width={480} />
        </Slam>
      </Center>
      <Center top={1020}>
        <WordsUp text="SEMANÁUDIO 2026" at={30} size={120} highlight={['2026']} />
        <div style={{height: 14}} />
        <WordsUp text="CONHECIMENTO, TECNOLOGIA E OPORTUNIDADES!" at={40} size={50} font={FONT_TEXT} weight={800} lineHeight={1.15} stagger={2} highlight={['OPORTUNIDADES']} />
        <div style={{height: 34}} />
        <Tag at={60} size={42} style={{whiteSpace: 'nowrap'}}>
          SAIBA MAIS DURANTE O EVENTO!
        </Tag>
      </Center>
      <Waveform y={1600} height={150} bars={60} opacity={0.5} />
      <Flash at={0} dur={10} peak={0.6} />
      <AbsoluteFill style={{background: C.black, opacity: out}} />
    </AbsoluteFill>
  );
};
