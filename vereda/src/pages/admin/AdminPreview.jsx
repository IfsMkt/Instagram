import { useParams } from 'react-router-dom';
import LessonPlayer from '../lesson/LessonPlayer.jsx';
import { ErrorState, Loading } from '../../components/ui.jsx';
import { useAdminContent } from './useAdmin.js';

export default function AdminPreview() {
  const { id } = useParams();
  const [state, reload] = useAdminContent();
  if (state.status === 'loading') return <Loading label="Carregando prévia…" />;
  if (state.status === 'error') return <div className="page no-nav"><ErrorState error={state.error} onRetry={reload} /></div>;
  const lesson = state.lessons.find((l) => l.id === id);
  if (!lesson) return <div className="page no-nav"><ErrorState title="Lição não encontrada" error={{ message: 'Ela pode ter sido excluída.' }} /></div>;
  const unit = state.units.find((u) => u.id === lesson.unit_id);
  const exercises = state.exercises.filter((e) => e.lesson_id === id);
  return <LessonPlayer lesson={lesson} unit={unit} exercises={exercises} mode="preview" exitTo={`/admin/licao/${id}`} />;
}
