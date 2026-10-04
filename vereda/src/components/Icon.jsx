// Ícones originais em traço simples (24×24). Decorativos por padrão (aria-hidden).
const P = {
  home: <><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></>,
  map: <><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="6" r="2.2" /><path d="M8 17c6 0 2-6 8-6" strokeDasharray="2 2.5" /><path d="M16.5 8 13 11" strokeDasharray="2 2.5" /></>,
  review: <><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4v4.5h-4.5" /><path d="M12 8.5V12l2.5 1.6" /></>,
  book: <><path d="M5 5.5c2.5-1 5-1 7 .8v13c-2-1.6-4.5-1.6-7-.8z" /><path d="M19 5.5c-2.5-1-5-1-7 .8v13c2-1.6 4.5-1.6 7-.8z" /></>,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 19.5c1.2-3.6 4-5 7-5s5.8 1.4 7 5" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: <><rect x="6" y="10.5" width="12" height="9" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  star: <path d="m12 4.5 2.3 4.7 5.2.8-3.8 3.6.9 5.1L12 16.3l-4.6 2.4.9-5.1L4.5 10l5.2-.8z" />,
  flame: <path d="M12 20c-3.6 0-6-2.4-6-5.6 0-3.5 3-5.2 3.4-8.4 2 1.2 3 3 3 4.6.9-.6 1.5-1.6 1.6-2.8 2 1.6 4 4 4 6.6 0 3.2-2.4 5.6-6 5.6z" />,
  sun: <><circle cx="12" cy="12" r="3.8" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" /></>,
  leaf: <><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19 13 11" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.2" /></>,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  up: <path d="m6.5 14.5 5.5-5.5 5.5 5.5" />,
  down: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  trash: <><path d="M5 7h14" /><path d="M9.5 7V5h5v2" /><path d="M7 7l.8 12h8.4L17 7" /></>,
  edit: <><path d="M5 19l1-4 9.5-9.5 3 3L9 18z" /><path d="M13.5 7.5l3 3" /></>,
  search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4.5 4.5" /></>,
  bookmark: <path d="M7 4.5h10v15l-5-3.6-5 3.6z" />,
  sound: <><path d="M5 10v4h3l4 3.5v-11L8 10z" /><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M17.8 7.3a6.5 6.5 0 0 1 0 9.4" /></>,
  bell: <><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z" /><path d="M10 20h4" /></>,
  eye: <><path d="M3 12s3.3-6 9-6 9 6 9 6-3.3 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.6" /></>,
  logout: <><path d="M14 5H6.5v14H14" /><path d="M11 12h9M17 9l3 3-3 3" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.3M12 18.2v2.3M3.5 12h2.3M18.2 12h2.3M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" /></>,
  shield: <path d="M12 4 5.5 6.5v5c0 4 2.8 7 6.5 8.5 3.7-1.5 6.5-4.5 6.5-8.5v-5z" />,
  calendar: <><rect x="4.5" y="6" width="15" height="13.5" rx="2.5" /><path d="M4.5 10h15M8.5 4v4M15.5 4v4" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="M12 4.5 20 19H4z" /><path d="M12 10v4M12 16.5h.01" /></>,
  books: <><path d="M5 5h3.5v14H5zM9.5 5H13v14H9.5z" /><path d="m14.5 6.2 3.3-.9 2.7 13.3-3.3.8z" /></>,
  milestone: <><path d="M6 20V4" /><path d="M6 5h10l-2 3 2 3H6" /></>,
  step: <><path d="M8 18.5c-2 0-3-1.5-2.6-3.8L6.6 9c.4-2 3.6-2 3.9.2l.6 4.7c.3 2.6-1 4.6-3.1 4.6z" /><path d="M16 15c2 0 3-1.5 2.6-3.8L17.4 5.5c-.4-2-3.6-2-3.9.2l-.6 4.7c-.3 2.6 1 4.6 3.1 4.6z" /></>,
  seed: <><path d="M12 20v-7" /><path d="M12 13c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5zM12 15c0-3-2.2-5-5.5-5 0 3 2.2 5 5.5 5z" /></>,
  tent: <path d="M3.5 19 12 5l8.5 14zM12 5v14M9 19l3-5 3 5" />,
  mountain: <path d="M3 19 9.5 8l3.5 6 2.2-3.5L21 19z" />,
  crown: <path d="M4.5 17.5 3.5 8l5 4 3.5-6 3.5 6 5-4-1 9.5z" />,
  path: <path d="M7 20c0-5 10-4 10-9S9 7 9 4" strokeDasharray="2.5 2.5" />,
  house: <><path d="M4.5 11 12 5l7.5 6v8.5h-15z" /><path d="M10 19.5v-4.5h4v4.5" /></>,
  heart: <path d="M12 19s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 1.8C19 14.7 12 19 12 19z" />,
  download: <><path d="M12 4.5v10M8 11l4 4 4-4" /><path d="M5 19.5h14" /></>,
};

export const UNIT_ICONS = { livro: 'book', semente: 'seed', tenda: 'tent', monte: 'mountain', coroa: 'crown', caminho: 'path', sol: 'sun', casa: 'house', folha: 'leaf' };
export const ACHIEVEMENT_ICONS = { passo: 'step', estrela: 'star', livros: 'books', marco: 'milestone', alvo: 'target', folha: 'leaf', chama: 'flame', sol: 'sun' };

export default function Icon({ name, size = 22, label, strokeWidth = 1.9, style, className }) {
  const shape = P[name] || P.info;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={style}
      className={className}
    >
      {shape}
    </svg>
  );
}
