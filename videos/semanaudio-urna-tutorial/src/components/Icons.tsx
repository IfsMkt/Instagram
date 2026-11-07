import React from 'react';
import {C} from '../theme';

/** Ícones simples em SVG (traço branco/laranja), sem marcas de terceiros. */
type P = {size?: number};

export const CoinIcon: React.FC<P> = ({size = 200}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <ellipse cx="50" cy="62" rx="34" ry="12" fill={C.orangeDeep} />
    <rect x="16" y="50" width="68" height="12" fill={C.orangeDeep} />
    <ellipse cx="50" cy="50" rx="34" ry="12" fill={C.orange} />
    <ellipse cx="50" cy="38" rx="34" ry="12" fill={C.orangeDeep} />
    <rect x="16" y="26" width="68" height="12" fill={C.orangeDeep} />
    <ellipse cx="50" cy="26" rx="34" ry="12" fill={C.orangeHot} />
    <ellipse cx="50" cy="26" rx="22" ry="7" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.8" />
  </svg>
);

export const BagIcon: React.FC<P> = ({size = 200}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M34 34 V28 a16 16 0 0 1 32 0 V34" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    <path d="M18 34 H82 L76 88 H24 Z" fill={C.orange} />
    <path d="M18 34 H82 L80 48 H20 Z" fill={C.orangeHot} />
    <text x="50" y="75" textAnchor="middle" fontFamily="Inter" fontWeight="900" fontSize="22" fill="#fff">R$</text>
  </svg>
);

export const TicketIcon: React.FC<P> = ({size = 200}) => (
  <svg width={size} height={size * 0.62} viewBox="0 0 100 62">
    <path
      d="M6 6 H94 V22 a9 9 0 0 0 0 18 V56 H6 V40 a9 9 0 0 0 0 -18 Z"
      fill={C.orange}
      stroke={C.orangeHot}
      strokeWidth="2"
    />
    <line x1="70" y1="10" x2="70" y2="52" stroke="#fff" strokeWidth="2.5" strokeDasharray="4 4" opacity="0.85" />
    <text x="38" y="38" textAnchor="middle" fontFamily="Bebas Neue" fontSize="24" fill="#fff">CUPOM</text>
  </svg>
);

export const PinIcon: React.FC<P> = ({size = 160}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M50 92 C50 92 20 60 20 40 a30 30 0 0 1 60 0 C80 60 50 92 50 92 Z" fill={C.orange} />
    <circle cx="50" cy="40" r="12" fill="#fff" />
  </svg>
);

export const CalendarIcon: React.FC<P> = ({size = 160}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect x="12" y="20" width="76" height="68" rx="10" fill={C.orange} />
    <rect x="12" y="20" width="76" height="20" rx="10" fill={C.orangeDeep} />
    <rect x="28" y="10" width="8" height="20" rx="4" fill="#fff" />
    <rect x="64" y="10" width="8" height="20" rx="4" fill="#fff" />
    <text x="50" y="78" textAnchor="middle" fontFamily="Bebas Neue" fontSize="38" fill="#fff">12/11</text>
  </svg>
);

export const StageIcon: React.FC<P> = ({size = 160}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M10 70 H90 V84 H10 Z" fill={C.orange} />
    <path d="M30 14 L18 70 H42 Z M70 14 L58 70 H82 Z" fill={C.orangeHot} opacity="0.45" />
    <circle cx="30" cy="14" r="6" fill="#fff" />
    <circle cx="70" cy="14" r="6" fill="#fff" />
  </svg>
);
