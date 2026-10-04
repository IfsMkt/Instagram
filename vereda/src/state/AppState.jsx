import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { backend } from '../api/backend.js';
import { buildJourney, dailyGoalXp, displayStreak, isDue, levelFor, localDate } from '../../base44/shared/engine.js';
import { playSound } from '../lib/sound.js';

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState({ status: 'loading', user: null, profile: null, error: null });
  const [data, setData] = useState({ status: 'idle', error: null });
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  const loadSession = useCallback(async () => {
    try {
      const user = await backend.auth.me();
      const profile = user ? (await backend.entities.Profile.list())[0] || null : null;
      setSession({ status: 'ready', user, profile, error: null });
      return { user, profile };
    } catch (error) {
      setSession({ status: 'error', user: null, profile: null, error });
      return {};
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const loadData = useCallback(async () => {
    if (!session.user) return;
    setData((d) => ({ ...d, status: d.status === 'ready' ? 'refreshing' : 'loading', error: null }));
    try {
      const e = backend.entities;
      const [content, stats, progress, achievements, activity, reviewItems] = await Promise.all([
        backend.fn('content'),
        e.UserStats.list(),
        e.LessonProgress.list(),
        e.UserAchievement.list(),
        e.DailyActivity.list('-local_date', 400),
        e.ReviewItem.list(),
      ]);
      setData({ status: 'ready', error: null, content, stats: stats[0] || null, progress, achievements, activity, reviewItems });
    } catch (error) {
      setData((d) => ({ ...d, status: 'error', error }));
    }
  }, [session.user]);

  useEffect(() => {
    if (session.user && session.profile) loadData();
    else setData({ status: 'idle', error: null });
  }, [session.user, session.profile?.id, loadData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preferência de animações reduzidas.
  useEffect(() => {
    document.documentElement.dataset.motion = session.profile?.reduced_motion ? 'reduce' : 'full';
  }, [session.profile?.reduced_motion]);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      const p = session.profile;
      const next = await backend.entities.Profile.update(p.id, patch);
      setSession((s) => ({ ...s, profile: next }));
      return next;
    },
    [session.profile]
  );

  const derived = useMemo(() => {
    const profile = session.profile;
    const tz = profile?.timezone;
    const today = localDate(new Date(), tz);
    if (data.status !== 'ready' && data.status !== 'refreshing') return { today };
    const completedIds = data.progress.filter((p) => p.completed).map((p) => p.lesson_id);
    const journey = buildJourney(data.content.units, data.content.lessons, completedIds);
    let nextLesson = null;
    for (const u of journey) for (const i of u.lessons) if (!nextLesson && i.state === 'disponivel') nextLesson = i.lesson;
    const currentUnit = journey.find((u) => !u.comingSoon && !u.completed) || journey.filter((u) => !u.comingSoon).at(-1) || null;
    const todayActivity = data.activity.find((a) => a.local_date === today) || null;
    const goalXp = dailyGoalXp(profile?.daily_minutes);
    const dueItems = data.reviewItems.filter((i) => isDue(i, today));
    const streak = displayStreak(data.stats, today);
    const level = levelFor(data.stats?.total_xp || 0);
    return { today, journey, nextLesson, currentUnit, todayActivity, goalXp, xpToday: todayActivity?.xp || 0, dueItems, streak, level, completedIds };
  }, [session.profile, data]);

  const value = {
    backend,
    session,
    user: session.user,
    profile: session.profile,
    isAdmin: session.user?.role === 'admin',
    data,
    ...derived,
    reloadSession: loadSession,
    reloadData: loadData,
    updateProfile,
    setProfile: (profile) => setSession((s) => ({ ...s, profile })),
    toast: showToast,
    sound: (kind) => playSound(kind, session.profile ? session.profile.sound_on !== false : true),
  };

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="toast-area" aria-live="polite" role="status">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </AppCtx.Provider>
  );
}

export function useApp() {
  return useContext(AppCtx);
}
