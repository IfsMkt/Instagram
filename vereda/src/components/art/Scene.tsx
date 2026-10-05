import type { SVGProps } from "react";

export type SceneKind =
  | "garden"
  | "desert"
  | "river"
  | "sea"
  | "mountain"
  | "city"
  | "palace"
  | "road"
  | "village"
  | "temple";

type Props = Omit<SVGProps<SVGSVGElement>, "children"> & { kind: string; className?: string };

/**
 * Cenários ilustrados (faixas horizontais) — montanhas, rios, barcos, jardins,
 * deserto e cidades. Sempre decorativos.
 */
export function Scene({ kind, className, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 400 150"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
      focusable="false"
      {...rest}
    >
      <SceneBody kind={kind as SceneKind} />
    </svg>
  );
}

function Sky({ top, bottom }: { top: string; bottom: string }) {
  const id = `sky-${top.slice(1)}-${bottom.slice(1)}`;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="150" fill={`url(#${id})`} />
    </>
  );
}

function Sun({ x = 320, y = 38, r = 18, color = "#f3bd3c" }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 10} fill={color} opacity="0.25" />
      <circle cx={x} cy={y} r={r} fill={color} />
    </g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fffdf8" opacity="0.9">
      <ellipse cx="0" cy="0" rx="22" ry="9" />
      <ellipse cx="14" cy="-6" rx="14" ry="10" />
      <ellipse cx="-10" cy="-4" rx="11" ry="8" />
    </g>
  );
}

function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 Q4 -24 2 -48" stroke="#8a5a32" strokeWidth="5" fill="none" strokeLinecap="round" />
      <g fill="#3f9e4d">
        <path d="M2 -48 Q-20 -54 -30 -40 Q-14 -48 2 -46 Z" />
        <path d="M2 -48 Q24 -56 34 -42 Q18 -50 2 -46 Z" />
        <path d="M2 -48 Q-8 -66 -22 -66 Q-8 -58 1 -47 Z" />
        <path d="M2 -48 Q14 -68 28 -64 Q14 -58 3 -47 Z" />
      </g>
    </g>
  );
}

function Boat({ x, y, color = "#ec6f5a", s = 1 }: { x: number; y: number; color?: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-26 0 L26 0 L18 12 L-18 12 Z" fill="#8a5a32" />
      <rect x="-1.5" y="-34" width="3" height="34" fill="#6b4425" />
      <path d="M2 -32 L24 -4 L2 -4 Z" fill={color} />
      <path d="M-2 -28 L-18 -4 L-2 -4 Z" fill="#fff8ec" />
    </g>
  );
}

function SceneBody({ kind }: { kind: SceneKind }) {
  switch (kind) {
    case "desert":
      return (
        <>
          <Sky top="#fde5d0" bottom="#fdf0c8" />
          <Sun x={300} y={40} r={20} color="#ee8636" />
          <path d="M0 96 Q60 70 130 92 T260 88 T400 92 V150 H0 Z" fill="#f0c98a" />
          <path d="M0 116 Q80 96 160 114 T320 108 T400 112 V150 H0 Z" fill="#e3b06b" />
          <path d="M210 92 L250 52 L290 92 Z" fill="#d8a061" />
          <path d="M250 52 L290 92 L262 92 Z" fill="#c48a4c" />
          <Palm x={70} y={112} s={0.9} />
          <g fill="#c48a4c">
            <ellipse cx="150" cy="126" rx="16" ry="5" />
          </g>
        </>
      );
    case "river":
      return (
        <>
          <Sky top="#dbeafb" bottom="#fff8ec" />
          <Sun x={60} y={36} />
          <path d="M0 80 Q100 60 200 78 T400 72 V150 H0 Z" fill="#9fd08e" />
          <path d="M150 150 Q170 120 220 108 Q280 96 400 100 V128 Q300 118 250 128 Q210 136 205 150 Z" fill="#7cc4e4" />
          <path d="M210 130 Q240 120 280 122" stroke="#fffdf8" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
          <g fill="#3f9e4d">
            {[30, 46, 62].map((x) => (
              <path key={x} d={`M${x} 120 Q${x - 4} 96 ${x} 84 Q${x + 4} 96 ${x} 120`} />
            ))}
          </g>
          <Cloud x={300} y={34} />
        </>
      );
    case "sea":
      return (
        <>
          <Sky top="#cfe6fb" bottom="#fff8ec" />
          <Sun x={330} y={34} />
          <Cloud x={90} y={30} s={1.1} />
          <path d="M0 74 Q50 56 100 70 Q140 60 170 72 V80 H0 Z" fill="#8fbf82" />
          <rect x="0" y="78" width="400" height="72" fill="#5aa9df" />
          <path d="M0 96 Q25 90 50 96 T100 96 T150 96 T200 96 T250 96 T300 96 T350 96 T400 96" stroke="#dbeafb" strokeWidth="3" fill="none" />
          <path d="M0 122 Q25 116 50 122 T100 122 T150 122 T200 122 T250 122 T300 122 T350 122 T400 122" stroke="#dbeafb" strokeWidth="3" fill="none" opacity="0.7" />
          <Boat x={250} y={92} />
          <Boat x={120} y={108} color="#3b82d0" s={0.7} />
        </>
      );
    case "mountain":
      return (
        <>
          <Sky top="#fde2dc" bottom="#fff8ec" />
          <Sun x={90} y={42} color="#ee8636" />
          <path d="M0 120 L80 54 L140 100 L210 30 L290 104 L340 70 L400 110 V150 H0 Z" fill="#9a7fd8" opacity="0.55" />
          <path d="M210 30 L232 50 L218 48 L210 58 L200 46 L188 50 Z" fill="#fffdf8" />
          <path d="M0 128 Q100 100 200 122 T400 118 V150 H0 Z" fill="#8bc47c" />
          <g transform="translate(212 24)">
            <path d="M0 8 Q8 -4 6 -12 Q14 -2 12 8 Z" fill="#ee8636" />
          </g>
          <Cloud x={320} y={40} s={0.9} />
        </>
      );
    case "city":
      return (
        <>
          <Sky top="#d4f0ec" bottom="#fff8ec" />
          <Sun x={340} y={36} />
          <path d="M0 110 Q120 86 240 104 T400 100 V150 H0 Z" fill="#9fd08e" />
          <g fill="#e9d6b4" stroke="#c9ad80" strokeWidth="2">
            <rect x="90" y="70" width="200" height="50" rx="3" />
            <rect x="120" y="50" width="30" height="40" />
            <rect x="230" y="50" width="30" height="40" />
            <rect x="170" y="40" width="40" height="50" />
          </g>
          <g fill="#c9ad80">
            {[96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 272].map((x) => (
              <rect key={x} x={x} y="64" width="8" height="8" />
            ))}
          </g>
          <path d="M180 120 V96 Q190 84 200 96 V120 Z" fill="#8a5a32" />
          <circle cx="190" cy="60" r="7" fill="#2a9d92" />
          <Palm x={60} y={118} s={0.8} />
          <Palm x={330} y={116} s={0.7} />
        </>
      );
    case "palace":
      return (
        <>
          <Sky top="#e1e4f9" bottom="#fff8ec" />
          <g fill="#fffdf8">
            <circle cx="60" cy="30" r="2" />
            <circle cx="120" cy="18" r="1.6" />
            <circle cx="340" cy="26" r="2" />
          </g>
          <circle cx="330" cy="40" r="16" fill="#f3bd3c" opacity="0.8" />
          <path d="M0 116 Q200 100 400 116 V150 H0 Z" fill="#e3b06b" />
          <g fill="#d8a061" stroke="#b9854a" strokeWidth="2">
            <rect x="130" y="96" width="140" height="22" />
            <rect x="150" y="76" width="100" height="22" />
            <rect x="170" y="56" width="60" height="22" />
            <rect x="188" y="40" width="24" height="18" />
          </g>
          <path d="M200 118 V100" stroke="#5a67cf" strokeWidth="8" />
          <g fill="#5a67cf">
            <rect x="60" y="80" width="40" height="38" rx="2" />
            <rect x="300" y="80" width="40" height="38" rx="2" />
          </g>
          <g fill="#f3bd3c">
            {[64, 74, 84, 94, 304, 314, 324, 334].map((x) => (
              <rect key={x} x={x} y="76" width="6" height="6" />
            ))}
          </g>
          <Palm x={40} y={122} s={0.7} />
          <Palm x={370} y={122} s={0.75} />
        </>
      );
    case "road":
      return (
        <>
          <Sky top="#ece4fa" bottom="#fff8ec" />
          <Sun x={70} y={40} />
          <path d="M0 92 Q100 70 200 86 T400 80 V150 H0 Z" fill="#9fd08e" />
          <path d="M150 150 Q190 120 210 100 Q230 88 300 84 L312 88 Q244 94 226 108 Q208 128 196 150 Z" fill="#e9d6b4" />
          <rect x="300" y="60" width="100" height="40" fill="#5aa9df" opacity="0.8" />
          <Boat x={350} y={78} color="#9a7fd8" s={0.6} />
          <g fill="#3f9e4d">
            <circle cx="70" cy="104" r="14" />
            <circle cx="86" cy="100" r="11" />
          </g>
          <Cloud x={250} y={36} />
        </>
      );
    case "village":
      return (
        <>
          <Sky top="#fdf0c8" bottom="#fff8ec" />
          <Sun x={330} y={38} />
          <path d="M0 98 Q100 78 200 94 T400 90 V150 H0 Z" fill="#a8d595" />
          {[
            [70, 86, "#ec6f5a"],
            [130, 92, "#3b82d0"],
            [250, 88, "#9a7fd8"],
          ].map(([x, y, roof]) => (
            <g key={String(x)} transform={`translate(${x} ${y})`}>
              <rect x="-18" y="0" width="36" height="28" fill="#f6ead3" stroke="#d9c7a6" strokeWidth="2" />
              <path d="M-22 2 L0 -16 L22 2 Z" fill={roof as string} />
              <rect x="-5" y="12" width="10" height="16" fill="#8a5a32" />
            </g>
          ))}
          <Palm x={200} y={118} s={0.8} />
          <path d="M0 140 Q200 120 400 140" stroke="#e9d6b4" strokeWidth="10" fill="none" />
        </>
      );
    case "temple":
      return (
        <>
          <Sky top="#fdf0c8" bottom="#fff8ec" />
          <Sun x={200} y={34} r={16} />
          <path d="M0 112 Q200 96 400 112 V150 H0 Z" fill="#a8d595" />
          <g fill="#f6ead3" stroke="#c9ad80" strokeWidth="2">
            <path d="M120 68 L200 40 L280 68 Z" />
            <rect x="130" y="68" width="140" height="48" />
          </g>
          <g fill="#e9d6b4">
            {[142, 168, 194, 220, 246].map((x) => (
              <rect key={x} x={x} y="72" width="12" height="44" />
            ))}
          </g>
        </>
      );
    case "garden":
    default:
      return (
        <>
          <Sky top="#dcf1d6" bottom="#fff8ec" />
          <Sun x={70} y={36} />
          <Cloud x={300} y={30} />
          <path d="M0 96 Q100 70 200 92 T400 86 V150 H0 Z" fill="#8bc47c" />
          <path d="M0 118 Q120 100 240 116 T400 112 V150 H0 Z" fill="#6fb062" />
          <path d="M240 150 Q260 128 300 122 Q350 116 400 120 V136 Q350 132 310 138 Q280 142 272 150 Z" fill="#7cc4e4" />
          {[
            [60, 112],
            [120, 104],
            [180, 110],
          ].map(([x, y]) => (
            <g key={x} transform={`translate(${x} ${y})`}>
              <rect x="-3" y="-2" width="6" height="18" fill="#8a5a32" />
              <circle cx="0" cy="-12" r="16" fill="#3f9e4d" />
              <circle cx="-6" cy="-14" r="3" fill="#ec6f5a" />
              <circle cx="7" cy="-8" r="3" fill="#ec6f5a" />
            </g>
          ))}
          <g fill="#f3bd3c">
            <circle cx="220" cy="126" r="3" />
            <circle cx="232" cy="132" r="3" />
            <circle cx="90" cy="134" r="3" />
          </g>
        </>
      );
  }
}
