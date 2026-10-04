// Lume — a ovelhinha que acompanha a jornada. Ilustração original em SVG.
export default function Mascot({ size = 84, mood = 'calma', title = 'Lume, a ovelhinha do Vereda' }) {
  const happy = mood === 'feliz';
  const thinking = mood === 'pensativa';
  return (
    <svg className="mascot" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={title}>
      <g className="bob">
        {/* sombra */}
        <ellipse cx="60" cy="110" rx="30" ry="5" fill="#2c3133" opacity="0.08" />
        {/* patas */}
        <rect x="44" y="88" width="8" height="18" rx="4" fill="#3a4043" />
        <rect x="68" y="88" width="8" height="18" rx="4" fill="#3a4043" />
        {/* corpo de lã */}
        <g fill="#fffdf8" stroke="#e3dccb" strokeWidth="2">
          <circle cx="36" cy="66" r="17" />
          <circle cx="84" cy="66" r="17" />
          <circle cx="48" cy="52" r="17" />
          <circle cx="72" cy="52" r="17" />
          <circle cx="60" cy="46" r="16" />
          <circle cx="46" cy="80" r="16" />
          <circle cx="74" cy="80" r="16" />
          <circle cx="60" cy="74" r="20" />
        </g>
        {/* lenço sálvia */}
        <path d="M43 84c10 6 24 6 34 0l-2 7c-9 4-21 4-30 0z" fill="#8fae96" />
        <path d="M70 88l6 10-9-3z" fill="#4f7360" />
        {/* orelhas */}
        <ellipse cx="38" cy="50" rx="10" ry="5.5" transform="rotate(-25 38 50)" fill="#3a4043" />
        <ellipse cx="82" cy="50" rx="10" ry="5.5" transform="rotate(25 82 50)" fill="#3a4043" />
        <ellipse cx="39" cy="50" rx="5" ry="2.4" transform="rotate(-25 39 50)" fill="#e8b7a6" />
        <ellipse cx="81" cy="50" rx="5" ry="2.4" transform="rotate(25 81 50)" fill="#e8b7a6" />
        {/* rosto */}
        <ellipse cx="60" cy="60" rx="17" ry="20" fill="#3a4043" />
        {/* topete */}
        <g fill="#fffdf8" stroke="#e3dccb" strokeWidth="1.5">
          <circle cx="52" cy="40" r="7" />
          <circle cx="60" cy="37" r="8" />
          <circle cx="68" cy="40" r="7" />
        </g>
        {/* olhos */}
        {happy ? (
          <g stroke="#fffdf8" strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M50 58q3.5-4 7 0" />
            <path d="M63 58q3.5-4 7 0" />
          </g>
        ) : (
          <g fill="#fffdf8">
            <circle cx="53.5" cy="57.5" r="3.6" />
            <circle cx="66.5" cy="57.5" r="3.6" />
            <circle cx={thinking ? 55 : 54.5} cy={thinking ? 56 : 58.5} r="1.6" fill="#2c3133" />
            <circle cx={thinking ? 68 : 67.5} cy={thinking ? 56 : 58.5} r="1.6" fill="#2c3133" />
          </g>
        )}
        {/* bochechas e sorriso */}
        <circle cx="49" cy="66" r="2.8" fill="#e8a99a" opacity="0.7" />
        <circle cx="71" cy="66" r="2.8" fill="#e8a99a" opacity="0.7" />
        <path d={happy ? 'M54 68q6 6 12 0' : thinking ? 'M56 70h8' : 'M55 69q5 3.5 10 0'} stroke="#fffdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        {/* folhinha dourada */}
        <path d="M74 34c4-7 11-8 15-6-2 6-8 9-15 6z" fill="#ecc970" stroke="#c9962e" strokeWidth="1" />
      </g>
    </svg>
  );
}

export function MascotSays({ children, mood, size = 72 }) {
  return (
    <div className="mascot-row">
      <Mascot size={size} mood={mood} />
      <div className="bubble" role="status">
        {children}
      </div>
    </div>
  );
}
