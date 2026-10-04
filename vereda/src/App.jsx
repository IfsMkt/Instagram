import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppState.jsx';
import MainLayout from './components/Layout.jsx';
import { ErrorState, Loading } from './components/ui.jsx';
import Welcome from './pages/Welcome.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Home from './pages/Home.jsx';
import Journey from './pages/Journey.jsx';
import Review from './pages/Review.jsx';
import Notebook from './pages/Notebook.jsx';
import Profile from './pages/Profile.jsx';
import { LessonRoute, TrialRoute } from './pages/lesson/LessonRoutes.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import LessonEditor from './pages/admin/LessonEditor.jsx';
import AdminPreview from './pages/admin/AdminPreview.jsx';

function RequireAuth({ children }) {
  const { session, user, profile, reloadSession } = useApp();
  const location = useLocation();
  if (session.status === 'loading') return <Loading />;
  if (session.status === 'error') return <ErrorState error={session.error} onRetry={reloadSession} />;
  if (!user) return <Navigate to="/bem-vindo" replace state={{ from: location.pathname }} />;
  if (!profile) return <Navigate to="/bem-vindo" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { isAdmin } = useApp();
  return (
    <RequireAuth>
      {isAdmin ? (
        children
      ) : (
        <div className="page no-nav">
          <ErrorState title="Área restrita" error={{ message: 'Esta área é exclusiva para a equipe editorial.' }} />
        </div>
      )}
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/bem-vindo" element={<Welcome />} />
          <Route path="/entrar" element={<AuthPage />} />
          <Route path="/experimentar" element={<TrialRoute />} />
          <Route path="/licao/:id" element={<RequireAuth><LessonRoute /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminHome /></RequireAdmin>} />
          <Route path="/admin/licao/:id" element={<RequireAdmin><LessonEditor /></RequireAdmin>} />
          <Route path="/admin/licao/:id/previa" element={<RequireAdmin><AdminPreview /></RequireAdmin>} />
          <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
            <Route index element={<Home />} />
            <Route path="jornada" element={<Journey />} />
            <Route path="revisao" element={<Review />} />
            <Route path="caderno" element={<Notebook />} />
            <Route path="perfil" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
