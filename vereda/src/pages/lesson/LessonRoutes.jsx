import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import LessonPlayer from './LessonPlayer.jsx';
import { ErrorState, Loading } from '../../components/ui.jsx';
import { MascotSays } from '../../components/Mascot.jsx';
import { backend } from '../../api/backend.js';
import { useApp } from '../../state/AppState.jsx';

function useLoad(fn, deps) {
  const [state, setState] = useState({ status: 'loading' });
  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', data: await fn() });
    } catch (error) {
      setState({ status: 'error', error });
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [load]);
  return [state, load];
}

/** Lição de um usuário autenticado. */
export function LessonRoute() {
  const { id } = useParams();
  const app = useApp();
  const [state, reload] = useLoad(() => backend.fn('content', { lesson_id: id }), [id]);

  if (state.status === 'loading' || app.data.status === 'loading' || app.data.status === 'idle') return <Loading label="Preparando a lição…" />;
  if (state.status === 'error') return <div className="page no-nav"><ErrorState error={state.error} onRetry={reload} /></div>;
  if (app.data.status === 'error') return <div className="page no-nav"><ErrorState error={app.data.error} onRetry={app.reloadData} /></div>;

  const item = app.journey?.flatMap((u) => u.lessons).find((i) => i.lesson.id === id);
  if (item && item.state === 'bloqueada')
    return (
      <div className="page no-nav stack">
        <MascotSays mood="pensativa">Esta etapa ainda está bloqueada. Conclua a etapa anterior para chegar aqui.</MascotSays>
        <Link className="btn btn-primary btn-block" to="/jornada">
          Ver a jornada
        </Link>
      </div>
    );
  const { lesson, unit, exercises } = state.data;
  return <LessonPlayer key={lesson.id} lesson={lesson} unit={unit} exercises={exercises} mode="user" />;
}

/** Primeira lição para visitantes (sem conta). */
export function TrialRoute() {
  const app = useApp();
  const [state, reload] = useLoad(() => backend.fn('trial-lesson'), []);
  if (app.session.status === 'loading') return <Loading />;
  if (app.user && app.profile) return <Navigate to="/" replace />;
  if (state.status === 'loading') return <Loading label="Preparando a primeira lição…" />;
  if (state.status === 'error')
    return (
      <div className="page no-nav">
        <ErrorState error={state.error} onRetry={reload} title="A primeira lição ainda não está disponível" />
      </div>
    );
  const { lesson, unit, exercises } = state.data;
  return <LessonPlayer lesson={lesson} unit={unit} exercises={exercises} mode="guest" exitTo="/bem-vindo" />;
}
