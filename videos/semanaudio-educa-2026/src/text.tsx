import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_DISPLAY, FONT_TEXT} from './theme';

type Style = React.CSSProperties;

/** Palavras que sobem de dentro de uma máscara, uma a uma. */
export const WordsUp: React.FC<{
  text: string;
  at: number;
  size: number;
  color?: string;
  highlight?: string[];
  stagger?: number;
  font?: string;
  weight?: number;
  lineHeight?: number;
  style?: Style;
  exitAt?: number;
}> = ({
  text,
  at,
  size,
  color = C.white,
  highlight = [],
  stagger = 3,
  font = FONT_DISPLAY,
  weight = 400,
  lineHeight = 0.95,
  style,
  exitAt,
}) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  const exit = exitAt !== undefined ? interpolate(f, [exitAt, exitAt + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)}) : 0;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: `0 ${size * 0.22}px`,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight,
        color,
        textAlign: 'center',
        letterSpacing: font === FONT_DISPLAY ? size * 0.01 : -size * 0.02,
        opacity: 1 - exit,
        transform: `translateY(${-exit * 60}px)`,
        filter: exit > 0 ? `blur(${exit * 12}px)` : undefined,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = interpolate(f, [at + i * stagger, at + i * stagger + 9], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const hl = highlight.includes(w.replace(/[!?,.]/g, ''));
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingTop: size * 0.06, paddingBottom: size * 0.02}}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - p) * 110}%)`,
                color: hl ? C.orange : undefined,
                textShadow: hl ? `0 0 ${size * 0.35}px rgba(245,130,32,0.65)` : '0 6px 30px rgba(0,0,0,0.6)',
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Texto que "bate" na tela vindo de grande para o tamanho final. */
export const Slam: React.FC<{
  children: React.ReactNode;
  at: number;
  from?: number;
  style?: Style;
}> = ({children, at, from = 2.2, style}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 13, stiffness: 180, mass: 0.7}});
  const scale = interpolate(s, [0, 1], [from, 1]);
  const op = interpolate(f, [at, at + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const blur = interpolate(f, [at, at + 7], [16, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{transform: `scale(${scale})`, opacity: op, filter: `blur(${blur}px)`, ...style}}>{children}</div>
  );
};

/** Faixa/tag laranja estilo "selo" (inspirada no "SALVADOR - BA" do logo oficial). */
export const Tag: React.FC<{children: React.ReactNode; at: number; size?: number; style?: Style; dark?: boolean}> = ({
  children,
  at,
  size = 46,
  style,
  dark,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <div
      style={{
        display: 'inline-block',
        clipPath: `polygon(0 0, ${p * 100}% 0, ${p * 100 - 3}% 100%, 0 100%)`,
        background: dark ? 'rgba(0,0,0,0.75)' : `linear-gradient(90deg, ${C.orangeDeep}, ${C.orange})`,
        border: dark ? `3px solid ${C.orange}` : undefined,
        color: C.white,
        fontFamily: FONT_TEXT,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: size * 0.04,
        padding: `${size * 0.3}px ${size * 0.8}px ${size * 0.3}px ${size * 0.6}px`,
        transform: 'skewX(-8deg)',
        ...style,
      }}
    >
      <div style={{transform: 'skewX(8deg)'}}>{children}</div>
    </div>
  );
};

/** Logomarca oficial da SemanÁudio 2026 (arquivo baixado do site oficial). */
export const SemanaudioLogo: React.FC<{width: number; style?: Style}> = ({width, style}) => (
  <Img src={staticFile('brand/semanaudio-2026-logo.png')} style={{width, height: 'auto', ...style}} />
);

/**
 * Logomarca oficial do Educa Áudio.
 * O arquivo oficial NÃO pôde ser baixado automaticamente (o site bloqueia
 * acesso automatizado). Coloque o arquivo em public/brand/educa-audio-logo.png
 * e passe `educaLogo="brand/educa-audio-logo.png"` nas props da composição.
 * Até lá, aparece um espaço reservado claramente identificado — nunca um
 * logotipo inventado.
 */
export const EducaLogo: React.FC<{src: string | null; width: number; style?: Style}> = ({src, width, style}) => {
  if (src) {
    return <Img src={staticFile(src)} style={{width, height: 'auto', ...style}} />;
  }
  return (
    <div
      style={{
        width,
        height: width * 0.36,
        border: `4px dashed ${C.orange}`,
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        color: C.white,
        fontFamily: FONT_TEXT,
        ...style,
      }}
    >
      <div style={{fontWeight: 900, fontSize: width * 0.1, letterSpacing: 2}}>EDUCA ÁUDIO</div>
      <div style={{fontWeight: 700, fontSize: width * 0.042, color: C.orange, marginTop: 6, letterSpacing: 3}}>
        [ INSERIR LOGO OFICIAL ]
      </div>
    </div>
  );
};
