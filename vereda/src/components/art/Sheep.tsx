import type { SVGProps } from "react";

export type SheepMood = "happy" | "wave" | "think" | "cheer" | "calm" | "sleepy";

type Props = Omit<SVGProps<SVGSVGElement>, "children"> & {
  mood?: SheepMood;
  size?: number;
  /** Texto alternativo; use "" quando a ovelha for decorativa. */
  label?: string;
};

/**
 * Mel, a ovelhinha anfitriã do Vereda. Ilustração original em SVG.
 * Lã de nuvem, rostinho cor de chocolate e um lenço verde de exploradora.
 */
export function Sheep({ mood = "happy", size = 160, label = "Mel, a ovelhinha", ...rest }: Props) {
  const decorative = label === "";
  const eyesClosed = mood === "cheer" || mood === "calm" || mood === "sleepy";
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      {...rest}
    >
      {/* sombra */}
      <ellipse cx="100" cy="186" rx="52" ry="7" fill="#2b2733" opacity="0.1" />
      {/* perninhas */}
      <g fill="#4a3a34">
        <rect x="70" y="150" width="12" height="30" rx="6" />
        <rect x="118" y="150" width="12" height="30" rx="6" />
      </g>
      {/* corpo de lã */}
      <g fill="#fffaf0" stroke="#e8dcc6" strokeWidth="3">
        <circle cx="62" cy="118" r="26" />
        <circle cx="138" cy="118" r="26" />
        <circle cx="76" cy="146" r="24" />
        <circle cx="124" cy="146" r="24" />
        <circle cx="100" cy="152" r="24" />
        <circle cx="100" cy="112" r="38" />
      </g>
      <g fill="#fffaf0">
        <circle cx="100" cy="128" r="34" />
        <circle cx="74" cy="126" r="20" />
        <circle cx="126" cy="126" r="20" />
      </g>
      {/* braço acenando */}
      {mood === "wave" && (
        <g>
          <path d="M146 112 Q172 92 170 66" stroke="#4a3a34" strokeWidth="11" strokeLinecap="round" fill="none" />
          <circle cx="170" cy="62" r="9" fill="#4a3a34" />
        </g>
      )}
      {mood === "cheer" && (
        <g stroke="#4a3a34" strokeWidth="11" strokeLinecap="round" fill="none">
          <path d="M146 112 Q170 90 172 64" />
          <path d="M54 112 Q30 90 28 64" />
        </g>
      )}
      {/* lenço verde */}
      <path d="M68 104 Q100 122 132 104 L130 116 Q100 134 70 116 Z" fill="#3f9e4d" />
      <path d="M118 112 L134 136 L122 134 L114 120 Z" fill="#2c7a38" />
      {/* topete de lã */}
      <g fill="#fffaf0" stroke="#e8dcc6" strokeWidth="3">
        <circle cx="84" cy="44" r="14" />
        <circle cx="100" cy="38" r="15" />
        <circle cx="116" cy="44" r="14" />
      </g>
      {/* orelhas */}
      <g fill="#4a3a34">
        <ellipse cx="56" cy="68" rx="18" ry="9" transform="rotate(-24 56 68)" />
        <ellipse cx="144" cy="68" rx="18" ry="9" transform="rotate(24 144 68)" />
      </g>
      <g fill="#f4a8a0">
        <ellipse cx="58" cy="68" rx="10" ry="4" transform="rotate(-24 58 68)" />
        <ellipse cx="142" cy="68" rx="10" ry="4" transform="rotate(24 142 68)" />
      </g>
      {/* rosto */}
      <ellipse cx="100" cy="76" rx="38" ry="34" fill="#5a463f" />
      <g fill="#fffaf0">
        <circle cx="86" cy="50" r="10" />
        <circle cx="100" cy="46" r="11" />
        <circle cx="114" cy="50" r="10" />
      </g>
      {/* olhos */}
      {eyesClosed ? (
        <g stroke="#fffaf0" strokeWidth="4" strokeLinecap="round" fill="none">
          {mood === "sleepy" ? (
            <>
              <path d="M78 76 Q86 80 94 76" />
              <path d="M106 76 Q114 80 122 76" />
            </>
          ) : (
            <>
              <path d="M78 78 Q86 68 94 78" />
              <path d="M106 78 Q114 68 122 78" />
            </>
          )}
        </g>
      ) : (
        <g>
          <ellipse cx="86" cy="76" rx="9" ry="10" fill="#fffaf0" />
          <ellipse cx="114" cy="76" rx="9" ry="10" fill="#fffaf0" />
          <circle cx={mood === "think" ? 89 : 87} cy={mood === "think" ? 72 : 77} r="5" fill="#2b2733" />
          <circle cx={mood === "think" ? 117 : 115} cy={mood === "think" ? 72 : 77} r="5" fill="#2b2733" />
          <circle cx={mood === "think" ? 90.5 : 88.5} cy={mood === "think" ? 70.5 : 75} r="1.6" fill="#fff" />
          <circle cx={mood === "think" ? 118.5 : 116.5} cy={mood === "think" ? 70.5 : 75} r="1.6" fill="#fff" />
        </g>
      )}
      {/* bochechas */}
      <circle cx="74" cy="92" r="6" fill="#f08c80" opacity="0.75" />
      <circle cx="126" cy="92" r="6" fill="#f08c80" opacity="0.75" />
      {/* focinho e boca */}
      <ellipse cx="100" cy="92" rx="6" ry="4" fill="#3a2b26" />
      {mood === "think" ? (
        <path d="M94 101 Q100 99 106 101" stroke="#fffaf0" strokeWidth="3" strokeLinecap="round" fill="none" />
      ) : mood === "cheer" || mood === "wave" ? (
        <path d="M90 99 Q100 112 110 99 Z" fill="#f4a8a0" stroke="#fffaf0" strokeWidth="2.5" strokeLinejoin="round" />
      ) : (
        <path d="M92 100 Q100 107 108 100" stroke="#fffaf0" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {/* detalhes de humor */}
      {mood === "think" && (
        <g fill="#9a7fd8">
          <circle cx="150" cy="40" r="5" />
          <circle cx="162" cy="26" r="7" />
          <circle cx="178" cy="12" r="9" />
        </g>
      )}
      {mood === "sleepy" && (
        <text x="146" y="40" fontSize="22" fontWeight="800" fill="#5a67cf" fontFamily="sans-serif">
          z
        </text>
      )}
      {mood === "cheer" && (
        <g fill="#f3bd3c">
          <path d="M30 40 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4z" />
          <path d="M168 34 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" />
        </g>
      )}
    </svg>
  );
}
