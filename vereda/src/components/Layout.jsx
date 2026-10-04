import { NavLink, Outlet } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useApp } from '../state/AppState.jsx';

const ITEMS = [
  ['/', 'Início', 'home'],
  ['/jornada', 'Jornada', 'map'],
  ['/revisao', 'Revisão', 'review'],
  ['/caderno', 'Caderno', 'book'],
  ['/perfil', 'Perfil', 'user'],
];

export function BottomNav() {
  const { dueItems } = useApp();
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <ul>
        {ITEMS.map(([to, label, icon]) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'}>
              <span className="nav-icon">
                <Icon name={icon} />
              </span>
              <span>
                {label}
                {to === '/revisao' && dueItems?.length > 0 && <span className="sr-only"> ({dueItems.length} para revisar)</span>}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DemoBanner() {
  const { backend } = useApp();
  if (backend.mode !== 'local') return null;
  return (
    <div className="demo-banner">
      Modo de demonstração local{backend.demoPreview ? ' · conteúdo em rascunho, aguardando revisão editorial' : ''}
    </div>
  );
}

export default function MainLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <DemoBanner />
      <main id="conteudo" className="page" tabIndex={-1}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
