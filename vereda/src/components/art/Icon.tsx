import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "map"
  | "review"
  | "notebook"
  | "profile"
  | "lock"
  | "check"
  | "star"
  | "flame"
  | "target"
  | "book"
  | "play"
  | "arrow-right"
  | "arrow-left"
  | "close"
  | "eye"
  | "eye-off"
  | "heart"
  | "bookmark"
  | "pen"
  | "trash"
  | "search"
  | "compass"
  | "spark"
  | "flag"
  | "footprint"
  | "mountain"
  | "settings"
  | "logout"
  | "up"
  | "down"
  | "refresh"
  | "sound"
  | "shield"
  | "plus"
  | "info"
  | "x-circle"
  | "check-circle";

type Props = Omit<SVGProps<SVGSVGElement>, "children"> & { name: IconName; size?: number; label?: string };

/** Ícones desenhados para o Vereda: traço arredondado e cantos suaves. */
export function Icon({ name, size = 24, label, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M6 9.5V19a1.5 1.5 0 0 0 1.5 1.5h3V15h3v5.5h3A1.5 1.5 0 0 0 18 19V9.5" />
    </>
  ),
  map: (
    <>
      <path d="M12 21c4-4.5 6-8 6-11a6 6 0 1 0-12 0c0 3 2 6.5 6 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  review: (
    <>
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5" />
      <path d="M20 4v4.5h-4.5" />
      <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5" />
      <path d="M4 20v-4.5h4.5" />
    </>
  ),
  notebook: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M9 3.5v17" />
      <path d="M12 8h4M12 11.5h4" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8.5" r="4" />
      <path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.5v2.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  star: <path d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8Z" />,
  flame: (
    <path d="M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.4-2.4-5.6-3.6-8.8-.3 2-1.4 3.2-2.5 3.7C12.6 6.6 10.8 4.3 9 3c.4 3.4-3.5 6.2-3.5 11.3C5.5 18.2 8.1 21 12 21Z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5C10 5 7.5 4.5 4 4.8v13.7c3.5-.3 6 .2 8 1.7 2-1.5 4.5-2 8-1.7V4.8c-3.5-.3-6 .2-8 1.7Z" />
      <path d="M12 6.5v13.7" />
    </>
  ),
  play: <path d="M8 5.5v13l10-6.5Z" />,
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  "arrow-left": (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.9 5.8A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.2 7.6A16.4 16.4 0 0 0 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.3 3.8-.9" />
      <path d="M9.9 10a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" />,
  bookmark: <path d="M6.5 4h11v16.5L12 16.8l-5.5 3.7Z" />,
  pen: (
    <>
      <path d="M15.5 4.5 19.5 8.5 9 19H5v-4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.5h5V7" />
      <path d="M6.5 7l1 13h9l1-13" />
      <path d="M10 11v5.5M14 11v5.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5Z" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4" />
      <path d="m6 6 2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </>
  ),
  flag: (
    <>
      <path d="M5.5 21V4" />
      <path d="M5.5 4.5h11l-2 4 2 4h-11" />
    </>
  ),
  footprint: (
    <>
      <path d="M8 13.5c-1.8 0-3-1.8-3-4.5S6 4 8 4s3 2.3 3 5-1.2 4.5-3 4.5Z" />
      <path d="M6.5 16.5c0 2 1 3.5 2.5 3.5s2-1.3 1.6-3" />
      <path d="M16 17c1.8 0 3-1.8 3-4.5s-1-5-3-5-3 2.3-3 5" />
    </>
  ),
  mountain: (
    <>
      <path d="M2.5 19.5 9 8l4 7 2.5-4 6 8.5Z" />
      <path d="m7.4 10.8 1.6 1.4 1.6-1.4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M6 12h9" />
    </>
  ),
  up: <path d="m6 14.5 6-6 6 6" />,
  down: <path d="m6 9.5 6 6 6-6" />,
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4h-4" />
    </>
  ),
  sound: (
    <>
      <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3Z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v5.5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6Z" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6v.2" />
    </>
  ),
  "x-circle": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.3 12.3 2.6 2.6 4.9-5.2" />
    </>
  ),
};
