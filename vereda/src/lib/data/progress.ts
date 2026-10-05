import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { computeTrackState, nextAction, type NextAction, type TrackState, type UserTrackState } from "@/lib/domain/progress";
import { computeStreak, dailyGoalInfo, type DailyGoalInfo, type StreakInfo } from "@/lib/domain/streak";
import { addDays, localDate, safeTimeZone } from "@/lib/domain/dates";
import { levelForXp, type LevelInfo } from "@/lib/domain/rules";
import { ACHIEVEMENTS, newlyEarned, type AchievementDef, type AchievementStats } from "@/lib/domain/achievements";
import { getTrackStructure, listTracks, type ContentMode, type TrackStructure } from "./content";
import type { Profile } from "@/lib/types";

export type Scope = "live" | "preview";

export function scopeFor(mode: ContentMode): Scope {
  return mode === "preview" ? "preview" : "live";
}

/** Estado da pessoa numa trilha (consultas sempre filtradas pelo próprio usuário). */
export async function loadUserTrackState(userId: string, structure: TrackStructure, scope: Scope): Promise<UserTrackState> {
  const db = adminClient();
  const lessonIds = structure.units.flatMap((u) => u.items.map((i) => i.lessonId));
  if (lessonIds.length === 0) return { completed: new Set(), unlocked: new Set(), inProgress: new Map() };

  const [completions, unlocks, attempts] = await Promise.all([
    db.from("lesson_completions").select("lesson_id").eq("user_id", userId).eq("scope", scope).in("lesson_id", lessonIds),
    db.from("lesson_unlocks").select("lesson_id").eq("user_id", userId).eq("scope", scope).eq("track_id", structure.track.id),
    db
      .from("lesson_attempts")
      .select("id, lesson_id, current_step, updated_at")
      .eq("user_id", userId)
      .eq("scope", scope)
      .eq("status", "in_progress")
      .in("lesson_id", lessonIds),
  ]);
  for (const r of [completions, unlocks, attempts]) {
    if (r.error) throw new Error(`Não foi possível carregar seu progresso: ${r.error.message}`);
  }
  return {
    completed: new Set((completions.data ?? []).map((r: { lesson_id: string }) => r.lesson_id)),
    unlocked: new Set((unlocks.data ?? []).map((r: { lesson_id: string }) => r.lesson_id)),
    inProgress: new Map(
      (attempts.data ?? []).map((r: { id: string; lesson_id: string; current_step: number; updated_at: string }) => [
        r.lesson_id,
        { attemptId: r.id, step: r.current_step, updatedAt: r.updated_at },
      ]),
    ),
  };
}

export type TrackView = {
  structure: TrackStructure;
  userState: UserTrackState;
  state: TrackState;
  action: NextAction;
};

export async function getTrackView(userId: string, slugOrId: string, mode: ContentMode): Promise<TrackView | null> {
  const structure = await getTrackStructure(slugOrId, mode);
  if (!structure) return null;
  const userState = await loadUserTrackState(userId, structure, scopeFor(mode));
  const state = computeTrackState(structure.units, userState);
  return { structure, userState, state, action: nextAction(state, userState) };
}

/** Trilha ativa da pessoa; se não houver (ou não estiver publicada), a jornada geral. */
export async function getActiveTrackView(userId: string, profile: Profile): Promise<TrackView | null> {
  if (profile.active_track_id) {
    const view = await getTrackView(userId, profile.active_track_id, "public");
    if (view && view.structure.units.length > 0) return view;
  }
  const tracks = await listTracks("public");
  for (const t of tracks) {
    const view = await getTrackView(userId, t.id, "public");
    if (view && view.structure.units.length > 0) return view;
  }
  return null;
}

/** URL para abrir um item da trilha (respeita o modo prévia). */
export function lessonHref(lessonId: string, trackSlug: string, mode: ContentMode = "public"): string {
  const params = new URLSearchParams({ trilha: trackSlug });
  if (mode === "preview") params.set("previa", "1");
  return `/licao/${lessonId}?${params.toString()}`;
}

// ---------------------------------------------------------------------
// Estatísticas e gamificação
// ---------------------------------------------------------------------
export type Stats = {
  today: string;
  totalXp: number;
  level: LevelInfo;
  streak: StreakInfo;
  goal: DailyGoalInfo;
  xpToday: number;
  lessonsCompleted: number;
  /** Últimos 35 dias (5 semanas), do mais antigo ao mais recente. */
  calendar: { date: string; minutes: number; goalMet: boolean }[];
  earned: { id: string; earnedAt: string }[];
};

export async function getStats(userId: string, profile: Profile, now = new Date()): Promise<Stats> {
  const db = adminClient();
  const tz = safeTimeZone(profile.timezone);
  const today = localDate(now, tz);
  const since = addDays(today, -400);

  const [xp, days, completions, achievements] = await Promise.all([
    db.from("xp_events").select("amount, local_date").eq("user_id", userId),
    db.from("activity_days").select("local_date, minutes, xp").eq("user_id", userId).gte("local_date", since),
    db.from("lesson_completions").select("lesson_id", { count: "exact", head: true }).eq("user_id", userId).eq("scope", "live"),
    db.from("user_achievements").select("achievement_id, earned_at").eq("user_id", userId),
  ]);
  for (const r of [xp, days, completions, achievements]) {
    if (r.error) throw new Error(`Não foi possível carregar suas estatísticas: ${r.error.message}`);
  }

  const xpRows = (xp.data ?? []) as { amount: number; local_date: string }[];
  const totalXp = xpRows.reduce((n, r) => n + r.amount, 0);
  const xpToday = xpRows.filter((r) => r.local_date === today).reduce((n, r) => n + r.amount, 0);
  const dayRows = ((days.data ?? []) as { local_date: string; minutes: number }[]).map((d) => ({ date: d.local_date, minutes: d.minutes }));
  const byDate = new Map(dayRows.map((d) => [d.date, d.minutes]));
  const minutesToday = byDate.get(today) ?? 0;

  const calendar = Array.from({ length: 35 }, (_, i) => {
    const date = addDays(today, i - 34);
    const minutes = byDate.get(date) ?? 0;
    return { date, minutes, goalMet: minutes >= profile.daily_goal_minutes };
  });

  return {
    today,
    totalXp,
    level: levelForXp(totalXp),
    streak: computeStreak(dayRows, today),
    goal: dailyGoalInfo(profile.daily_goal_minutes, minutesToday),
    xpToday,
    lessonsCompleted: completions.count ?? 0,
    calendar,
    earned: ((achievements.data ?? []) as { achievement_id: string; earned_at: string }[]).map((a) => ({ id: a.achievement_id, earnedAt: a.earned_at })),
  };
}

/** Calcula e registra conquistas novas (idempotente: chave primária no banco). */
export async function evaluateAchievements(userId: string, profile: Profile): Promise<AchievementDef[]> {
  const db = adminClient();
  const stats = await getStats(userId, profile);

  const [completionsRes, tracksStartedRes, reviewRes, notesRes] = await Promise.all([
    db.from("lesson_completions").select("lesson_id").eq("user_id", userId).eq("scope", "live"),
    db.from("track_progress").select("track_id", { count: "exact", head: true }).eq("user_id", userId).eq("scope", "live"),
    db.from("review_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_correct", true),
    db.from("notes").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  const completed = new Set(((completionsRes.data ?? []) as { lesson_id: string }[]).map((r) => r.lesson_id));

  // Unidades e trilhas concluídas, considerando apenas o conteúdo publicado.
  const tracks = await listTracks("public");
  let unitsCompleted = 0;
  let tracksCompleted = 0;
  for (const t of tracks) {
    const s = await getTrackStructure(t.id, "public");
    if (!s || s.units.length === 0) continue;
    let all = true;
    for (const u of s.units) {
      const done = u.items.every((i) => completed.has(i.lessonId));
      if (done) unitsCompleted++;
      else all = false;
    }
    if (all) tracksCompleted++;
  }

  const achievementStats: AchievementStats = {
    lessonsCompleted: completed.size,
    unitsCompleted,
    tracksCompleted,
    tracksStarted: tracksStartedRes.count ?? 0,
    currentStreak: stats.streak.current,
    reviewCorrect: reviewRes.count ?? 0,
    notesCount: notesRes.count ?? 0,
    dailyGoalMetDays: stats.calendar.some((d) => d.goalMet) || stats.goal.met ? 1 : 0,
  };
  const already = new Set(stats.earned.map((e) => e.id));
  const fresh = newlyEarned(achievementStats, already);
  if (fresh.length === 0) return [];
  const { data } = await db
    .from("user_achievements")
    .upsert(
      fresh.map((a) => ({ user_id: userId, achievement_id: a.id })),
      { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
    )
    .select("achievement_id");
  const inserted = new Set(((data ?? []) as { achievement_id: string }[]).map((r) => r.achievement_id));
  return fresh.filter((a) => inserted.has(a.id));
}

export { ACHIEVEMENTS };

export type TrackCard = {
  id: string;
  slug: string;
  kind: "general" | "character";
  title: string;
  subtitle: string;
  description: string;
  color: string;
  scene: string;
  character: { slug: string; name: string; title: string; tagline: string } | null;
  units: { title: string; lessons: string[] }[];
  completed: number;
  total: number;
  started: boolean;
};

/** Cartões das jornadas publicadas, com prévia da trilha e progresso da pessoa. */
export async function getTrackCards(userId: string): Promise<TrackCard[]> {
  const tracks = await listTracks("public");
  const db = adminClient();
  const { data: started } = await db.from("track_progress").select("track_id").eq("user_id", userId).eq("scope", "live");
  const startedSet = new Set(((started ?? []) as { track_id: string }[]).map((r) => r.track_id));
  const cards: TrackCard[] = [];
  for (const t of tracks) {
    const view = await getTrackView(userId, t.id, "public");
    if (!view || view.structure.units.length === 0) continue;
    cards.push({
      id: t.id,
      slug: t.slug,
      kind: t.kind,
      title: t.title,
      subtitle: t.subtitle,
      description: t.description,
      color: t.color,
      scene: t.scene,
      character: t.character
        ? { slug: t.character.slug, name: t.character.name, title: t.character.title, tagline: t.character.tagline }
        : null,
      units: view.structure.units.map((u) => ({
        title: u.title,
        lessons: u.items.filter((i) => i.kind === "lesson").slice(0, 3).map((i) => i.title),
      })),
      completed: view.state.completedCount,
      total: view.state.total,
      started: startedSet.has(t.id),
    });
  }
  return cards;
}
