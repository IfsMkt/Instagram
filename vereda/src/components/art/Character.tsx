import type { SVGProps } from "react";
import { COLORS, type ColorKey } from "./palette";

type HairStyle = "short" | "curly" | "bald" | "long" | "wild" | "wrap";
type Beard = "none" | "stubble" | "short" | "full" | "long";
type Prop = "scroll" | "net" | "letter" | "staff" | "flame" | "coal" | "lion";

type Look = {
  skin: string;
  skinShade: string;
  hair: string;
  hairStyle: HairStyle;
  beard: Beard;
  color: ColorKey;
  prop: Prop;
  brows?: "soft" | "bold";
};

/** Visual de cada personagem — todos no mesmo estilo: cabeça redonda, túnica, um objeto marcante. */
export const LOOKS: Record<string, Look> = {
  joao: { skin: "#d39a6a", skinShade: "#b97f52", hair: "#3b2a20", hairStyle: "short", beard: "stubble", color: "blue", prop: "scroll" },
  pedro: { skin: "#b9784b", skinShade: "#9c6139", hair: "#4a4040", hairStyle: "curly", beard: "full", color: "coral", prop: "net", brows: "bold" },
  paulo: { skin: "#c88a5c", skinShade: "#a86f45", hair: "#2f2420", hairStyle: "bald", beard: "short", color: "lilac", prop: "letter" },
  moises: { skin: "#b47a50", skinShade: "#966039", hair: "#efe9e1", hairStyle: "long", beard: "long", color: "yellow", prop: "staff" },
  elias: { skin: "#a86c43", skinShade: "#8b5532", hair: "#2b211d", hairStyle: "wild", beard: "full", color: "orange", prop: "flame", brows: "bold" },
  isaias: { skin: "#c58457", skinShade: "#a56a40", hair: "#3a2c24", hairStyle: "wrap", beard: "short", color: "teal", prop: "coal" },
  daniel: { skin: "#be7f52", skinShade: "#9f6538", hair: "#22191a", hairStyle: "short", beard: "none", color: "indigo", prop: "lion" },
};

type Props = Omit<SVGProps<SVGSVGElement>, "children"> & {
  slug: string;
  size?: number;
  /** Texto alternativo; "" para decorativo. */
  label?: string;
  /** Mostra o círculo colorido de fundo. */
  framed?: boolean;
};

export function Character({ slug, size = 140, label, framed = true, ...rest }: Props) {
  const look = LOOKS[slug];
  if (!look) return null;
  const c = COLORS[look.color];
  const decorative = label === "";
  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={(size * 220) / 200}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : (label ?? `Ilustração artística de ${slug}`)}
      {...rest}
    >
      {framed && <circle cx="100" cy="112" r="94" fill={c.soft} />}
      {framed && <circle cx="100" cy="112" r="94" fill="none" stroke={c.base} strokeOpacity="0.25" strokeWidth="4" />}

      {/* objeto atrás do corpo */}
      {look.prop === "staff" && (
        <g>
          <path d="M156 40 Q150 30 158 24 Q168 20 170 30" stroke="#8a5a32" strokeWidth="8" fill="none" strokeLinecap="round" />
          <rect x="152" y="36" width="9" height="170" rx="4.5" fill="#8a5a32" />
        </g>
      )}

      {/* corpo / túnica */}
      <path d="M46 214 Q48 150 100 146 Q152 150 154 214 Z" fill={c.base} />
      <path d="M100 146 Q78 150 70 214 L58 214 Q60 158 100 146 Z" fill={c.dark} opacity="0.55" />
      <path d="M86 150 L100 176 L114 150 Z" fill={look.skinShade} />
      {/* faixa / cinto */}
      <path d="M58 192 Q100 202 142 192 L143 202 Q100 212 57 202 Z" fill="#fff8ec" opacity="0.85" />

      {/* pescoço e cabeça */}
      <rect x="88" y="128" width="24" height="24" rx="10" fill={look.skinShade} />
      {look.hairStyle === "long" && <path d="M58 92 Q56 150 76 158 L124 158 Q144 150 142 92 Z" fill={look.hair} />}
      <circle cx="100" cy="94" r="44" fill={look.skin} />
      <ellipse cx="57" cy="98" rx="7" ry="10" fill={look.skinShade} />
      <ellipse cx="143" cy="98" rx="7" ry="10" fill={look.skinShade} />

      <Hair style={look.hairStyle} color={look.hair} accent={c.base} />
      <BeardShape beard={look.beard} color={look.hair} />

      {/* rosto */}
      <g>
        {look.brows === "bold" ? (
          <g stroke={look.hair === "#efe9e1" ? "#cfc6bb" : look.hair} strokeWidth="5" strokeLinecap="round">
            <path d="M74 80 L90 78" />
            <path d="M110 78 L126 80" />
          </g>
        ) : (
          <g stroke={look.hair === "#efe9e1" ? "#cfc6bb" : look.hair} strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M75 81 Q82 76 90 80" />
            <path d="M110 80 Q118 76 125 81" />
          </g>
        )}
        <ellipse cx="83" cy="93" rx="6" ry="7" fill="#fff" />
        <ellipse cx="117" cy="93" rx="6" ry="7" fill="#fff" />
        <circle cx="84" cy="94" r="4" fill="#2b2733" />
        <circle cx="118" cy="94" r="4" fill="#2b2733" />
        <circle cx="85.3" cy="92.5" r="1.3" fill="#fff" />
        <circle cx="119.3" cy="92.5" r="1.3" fill="#fff" />
        <circle cx="72" cy="108" r="6" fill="#e9776a" opacity="0.35" />
        <circle cx="128" cy="108" r="6" fill="#e9776a" opacity="0.35" />
        <path d="M97 100 Q100 106 103 100" stroke={look.skinShade} strokeWidth="3" fill="none" strokeLinecap="round" />
        {(look.beard === "none" || look.beard === "stubble") && (
          <path d="M88 114 Q100 124 112 114" stroke="#7a3b2e" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        )}
      </g>

      {/* objeto na frente */}
      <PropShape prop={look.prop} color={c} />
    </svg>
  );
}

function Hair({ style, color, accent }: { style: HairStyle; color: string; accent: string }) {
  switch (style) {
    case "short":
      return <path d="M56 90 Q54 50 100 48 Q146 50 144 90 Q136 70 116 66 Q100 74 80 66 Q62 72 56 90 Z" fill={color} />;
    case "curly":
      return (
        <g fill={color}>
          {[62, 74, 88, 102, 116, 130, 140].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 58 : 64} r="13" />
          ))}
          <circle cx="58" cy="80" r="10" />
          <circle cx="142" cy="80" r="10" />
        </g>
      );
    case "bald":
      return (
        <g fill={color}>
          <path d="M56 96 Q54 76 64 70 Q66 88 62 100 Z" />
          <path d="M144 96 Q146 76 136 70 Q134 88 138 100 Z" />
        </g>
      );
    case "long":
      return <path d="M56 96 Q50 50 100 46 Q150 50 144 96 Q140 68 118 62 Q100 70 82 62 Q60 68 56 96 Z" fill={color} />;
    case "wild":
      return (
        <g fill={color}>
          <path d="M50 98 Q40 66 58 52 Q62 34 84 40 Q96 26 112 38 Q134 30 140 50 Q160 62 150 98 Q142 72 120 66 Q100 74 80 66 Q58 72 50 98 Z" />
        </g>
      );
    case "wrap":
      return (
        <g>
          <path d="M54 92 Q50 48 100 44 Q150 48 146 92 Q140 66 100 64 Q60 66 54 92 Z" fill="#fff8ec" />
          <path d="M56 80 Q100 60 144 80" stroke={accent} strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M60 68 Q100 50 140 68" stroke="#eadfca" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

function BeardShape({ beard, color }: { beard: Beard; color: string }) {
  switch (beard) {
    case "none":
      return null;
    case "stubble":
      return <path d="M66 104 Q70 134 100 138 Q130 134 134 104 Q126 126 100 128 Q74 126 66 104 Z" fill={color} opacity="0.25" />;
    case "short":
      return (
        <g fill={color}>
          <path d="M62 100 Q64 138 100 142 Q136 138 138 100 Q130 124 112 120 Q100 126 88 120 Q70 124 62 100 Z" />
          <path d="M86 112 Q100 106 114 112 Q100 116 86 112 Z" />
        </g>
      );
    case "full":
      return (
        <g fill={color}>
          <path d="M58 96 Q56 150 100 152 Q144 150 142 96 Q134 122 114 118 Q100 126 86 118 Q66 122 58 96 Z" />
          <path d="M84 112 Q100 104 116 112 Q100 118 84 112 Z" />
          <path d="M90 124 Q100 130 110 124 Q100 134 90 124 Z" fill="#7a3b2e" />
        </g>
      );
    case "long":
      return (
        <g fill={color}>
          <path d="M58 96 Q54 168 100 182 Q146 168 142 96 Q134 122 114 118 Q100 126 86 118 Q66 122 58 96 Z" />
          <path d="M82 112 Q100 102 118 112 Q100 120 82 112 Z" />
          <path d="M90 124 Q100 130 110 124 Q100 134 90 124 Z" fill="#7a3b2e" />
        </g>
      );
  }
}

function PropShape({ prop, color }: { prop: Prop; color: { base: string; dark: string; soft: string } }) {
  switch (prop) {
    case "scroll":
      return (
        <g transform="translate(118 160) rotate(-12)">
          <rect x="0" y="0" width="46" height="36" rx="4" fill="#fff4dc" stroke="#d9b98a" strokeWidth="3" />
          <rect x="-5" y="-4" width="10" height="44" rx="5" fill="#c9965e" />
          <rect x="41" y="-4" width="10" height="44" rx="5" fill="#c9965e" />
          <path d="M10 12 H36 M10 20 H32 M10 28 H34" stroke="#c4a77c" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "net":
      return (
        <g>
          <path d="M120 150 Q170 160 176 210 L130 214 Q126 180 120 150 Z" fill="none" stroke="#c9a46a" strokeWidth="3" />
          <path d="M126 162 L170 178 M128 178 L174 194 M130 194 L175 206 M140 158 L134 212 M156 166 L152 212" stroke="#c9a46a" strokeWidth="2.5" />
          <g transform="translate(134 186)">
            <path d="M0 8 Q14 -6 30 8 Q14 22 0 8 Z" fill="#7cc4e4" />
            <path d="M30 8 L40 0 L40 16 Z" fill="#7cc4e4" />
            <circle cx="8" cy="7" r="2" fill="#2b2733" />
          </g>
        </g>
      );
    case "letter":
      return (
        <g>
          <path d="M140 150 Q168 168 166 206" stroke="#8a5a32" strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="140" y="186" width="44" height="30" rx="8" fill="#a9733f" />
          <g transform="translate(60 170) rotate(-8)">
            <rect x="0" y="0" width="40" height="28" rx="3" fill="#fffdf8" stroke="#d9c7a6" strokeWidth="2.5" />
            <path d="M0 2 L20 16 L40 2" stroke="#d9c7a6" strokeWidth="2.5" fill="none" />
            <circle cx="20" cy="17" r="4" fill={color.dark} />
          </g>
        </g>
      );
    case "staff":
      return null;
    case "flame":
      return (
        <g transform="translate(140 150)">
          <path d="M18 0 Q34 18 28 34 Q24 46 14 46 Q2 46 0 32 Q-2 20 10 12 Q8 24 16 26 Q20 14 18 0 Z" fill="#ee8636" />
          <path d="M16 18 Q24 28 20 38 Q16 44 11 40 Q6 34 12 26 Q14 32 17 30 Q18 24 16 18 Z" fill="#f3bd3c" />
        </g>
      );
    case "coal":
      return (
        <g transform="translate(118 160) rotate(-10)">
          <rect x="0" y="0" width="44" height="34" rx="4" fill="#fff4dc" stroke="#d9b98a" strokeWidth="3" />
          <path d="M8 12 H34 M8 20 H30" stroke="#c4a77c" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="36" cy="-2" r="9" fill="#ee8636" />
          <circle cx="36" cy="-2" r="4" fill="#f3bd3c" />
        </g>
      );
    case "lion":
      return (
        <g transform="translate(118 150)">
          <circle cx="34" cy="34" r="30" fill="#d9822b" />
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <circle key={i} cx={34 + Math.cos(a) * 26} cy={34 + Math.sin(a) * 26} r="10" fill="#c46f1f" />;
          })}
          <circle cx="34" cy="36" r="20" fill="#f3bd3c" />
          <circle cx="27" cy="32" r="3" fill="#2b2733" />
          <circle cx="41" cy="32" r="3" fill="#2b2733" />
          <ellipse cx="34" cy="40" rx="5" ry="3.5" fill="#7a3b2e" />
          <path d="M28 46 Q34 50 40 46" stroke="#7a3b2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}
