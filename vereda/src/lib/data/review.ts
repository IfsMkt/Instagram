import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import type { PublicExercise } from "@/lib/domain/exercises";

export async function countDueReviews(userId: string, today: string): Promise<number> {
  const { count } = await adminClient()
    .from("review_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("due_on", "is", null)
    .lte("due_on", today);
  return count ?? 0;
}


export type ReviewItemView = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  exerciseKey: string;
  prompt: string;
  stage: number;
  dueOn: string | null;
  origin: "mistake" | "scheduled";
  timesWrong: number;
  timesCorrect: number;
};

type ItemRow = {
  id: string;
  lesson_id: string;
  exercise_key: string;
  stage: number;
  due_on: string | null;
  origin: "mistake" | "scheduled";
  times_wrong: number;
  times_correct: number;
};

/** Exercícios publicados atuais por (lição, chave) — sem gabarito. */
async function publishedExercises(lessonIds: string[]): Promise<Map<string, { lessonTitle: string; exercise: PublicExercise }>> {
  const out = new Map<string, { lessonTitle: string; exercise: PublicExercise }>();
  if (lessonIds.length === 0) return out;
  const { data } = await adminClient()
    .from("lesson_versions")
    .select("lesson_id, title, exercises(key, type, prompt, data, reference)")
    .eq("status", "published")
    .in("lesson_id", lessonIds);
  for (const v of (data ?? []) as unknown as { lesson_id: string; title: string; exercises: PublicExercise[] }[]) {
    for (const e of v.exercises) out.set(`${v.lesson_id}|${e.key}`, { lessonTitle: v.title, exercise: e });
  }
  return out;
}

export async function getReviewOverview(userId: string, today: string) {
  const { data } = await adminClient()
    .from("review_items")
    .select("id, lesson_id, exercise_key, stage, due_on, origin, times_wrong, times_correct")
    .eq("user_id", userId)
    .order("due_on", { ascending: true, nullsFirst: false });
  const rows = (data ?? []) as ItemRow[];
  const lookup = await publishedExercises(Array.from(new Set(rows.map((r) => r.lesson_id))));
  const items: ReviewItemView[] = rows.flatMap((r) => {
    const found = lookup.get(`${r.lesson_id}|${r.exercise_key}`);
    if (!found) return [];
    return [
      {
        id: r.id,
        lessonId: r.lesson_id,
        lessonTitle: found.lessonTitle,
        exerciseKey: r.exercise_key,
        prompt: found.exercise.prompt,
        stage: r.stage,
        dueOn: r.due_on,
        origin: r.origin,
        timesWrong: r.times_wrong,
        timesCorrect: r.times_correct,
      },
    ];
  });
  return {
    due: items.filter((i) => i.dueOn !== null && i.dueOn <= today),
    upcoming: items.filter((i) => i.dueOn !== null && i.dueOn > today),
    mastered: items.filter((i) => i.dueOn === null).length,
    mistakes: items.filter((i) => i.timesWrong > 0 && i.dueOn !== null),
  };
}

export type SessionItem = { id: string; lessonTitle: string; stage: number; exercise: PublicExercise };

/** Itens para uma sessão de revisão (somente vencidos e com conteúdo publicado). */
export async function getReviewSession(userId: string, today: string, size: number): Promise<SessionItem[]> {
  const { data } = await adminClient()
    .from("review_items")
    .select("id, lesson_id, exercise_key, stage, due_on")
    .eq("user_id", userId)
    .not("due_on", "is", null)
    .lte("due_on", today)
    .order("due_on", { ascending: true })
    .limit(size * 3);
  const rows = (data ?? []) as ItemRow[];
  const lookup = await publishedExercises(Array.from(new Set(rows.map((r) => r.lesson_id))));
  const items: SessionItem[] = [];
  for (const r of rows) {
    const found = lookup.get(`${r.lesson_id}|${r.exercise_key}`);
    if (!found) continue;
    items.push({ id: r.id, lessonTitle: found.lessonTitle, stage: r.stage, exercise: found.exercise });
    if (items.length >= size) break;
  }
  return items;
}
