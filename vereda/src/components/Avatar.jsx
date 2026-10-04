// Avatares originais simples (formas e cores da identidade do Vereda).
import Icon from './Icon.jsx';

export const AVATARS = {
  ovelha: { bg: '#e5eee6', fg: '#3f604e', icon: null, label: 'Ovelhinha' },
  folha: { bg: '#e5eee6', fg: '#3f604e', icon: 'leaf', label: 'Folha' },
  sol: { bg: '#f8edcf', fg: '#7a5a12', icon: 'sun', label: 'Sol' },
  livro: { bg: '#f4efe3', fg: '#2c3133', icon: 'book', label: 'Livro' },
  estrela: { bg: '#f8edcf', fg: '#7a5a12', icon: 'star', label: 'Estrela' },
  semente: { bg: '#e5eee6', fg: '#2f4a3b', icon: 'seed', label: 'Semente' },
  monte: { bg: '#e7ecf3', fg: '#2c4568', icon: 'mountain', label: 'Monte' },
  caminho: { bg: '#f3ebe1', fg: '#6b4a2b', icon: 'path', label: 'Caminho' },
};

function SheepFace({ size }) {
  return (
    <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 40 40" aria-hidden="true">
      <g fill="#fffdf8" stroke="#d9d1bd" strokeWidth="1">
        <circle cx="13" cy="15" r="7" />
        <circle cx="20" cy="11" r="8" />
        <circle cx="27" cy="15" r="7" />
      </g>
      <ellipse cx="20" cy="23" rx="8" ry="10" fill="#3a4043" />
      <circle cx="16.8" cy="22" r="1.7" fill="#fffdf8" />
      <circle cx="23.2" cy="22" r="1.7" fill="#fffdf8" />
      <path d="M17.5 27q2.5 2 5 0" stroke="#fffdf8" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Avatar({ id = 'ovelha', size = 56, name }) {
  const a = AVATARS[id] || AVATARS.ovelha;
  return (
    <span className="avatar" style={{ width: size, height: size, background: a.bg, color: a.fg }} role="img" aria-label={name ? `Avatar de ${name}` : `Avatar: ${a.label}`}>
      {a.icon ? <Icon name={a.icon} size={size * 0.5} /> : <SheepFace size={size} />}
    </span>
  );
}
