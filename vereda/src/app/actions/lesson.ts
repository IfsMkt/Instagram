"use server";

import { z } from "zod";
import { getProfile, getUser, isEditor } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { gradeAnswer, isExerciseType } from "@/lib/domain/exercises";
import { followingItem } from "@/lib/domain/progress";
import { localDate, safeTimeZone } from "@/lib/domain/dates";
import { RULES, xpForFirstCompletion, xpSourceType } from "@/lib/domain/rules";
import { scheduleAfterMistake, scheduleReinforcement } from "@/lib/domain/review";
import { getTrackStructure, loadLessonVersion, resolvePlayableVersion, type ContentMode } from "@/lib/data/content";
import { evaluateAchievements, getStats, getTrackView, lessonHref, scopeFor, type Scope } from "@/lib/data/progress";
import type { ActionResult } from "@/lib/types";

export type AnswerFeedback = {
  exerciseKey: string;
  answer: unknown;
  correct: boolean;
  solution: unknown;
  explanation: string;
  reference: string;
  alreadyAnswered: boolean;
};

export type AttemptState = {
  attemptId: string;
  versionId: string;
  step: number;
  status: "in_progress" | "completed";
  answers: Record<string, AnswerFeedback>;
};

const uuid = z.string().uuid();
const beginSchema = z.object({ lessonId: uuid, trackSlug: z.string().regex(/^[a-z0-9-]+$/).max(80), preview: z.boolean() });

class UserError extends Error {}

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof UserError) return { ok: false, error: err.message };
  console.error("[lesson action]", err);
  return { ok: false, error: "Não conseguimos salvar agora. Verifique sua conexão e tente novamente." };
}

async function requireSessionUser() {
  const user = await getUser();
  if (!user) throw new UserError("Sua sessão terminou. Entre novamente para continuar.");
  return user;
}

async function modeFor(userId: string, preview: boolean): Promise<ContentMode> {
  if (!preview) return "public";
  if (!(await isEditor(userId))) throw new UserError("A prévia é exclusiva da equipe editorial.");
  return "preview";
}

async function answersWithFeedback(attemptId: string, versionId: string, userId: string): Promise<Record<string, AnswerFeedback>> {
  const db = adminClient();
  const { data: rows } = await db
    .from("attempt_answers")
    .select("exercise_key, answer, is_correct")
    .eq("attempt_id", attemptId)
    .eq("user_id", userId);
  const answered = (rows ?? []) as { exercise_key: string; answer: unknown; is_correct: boolean }[];
  if (answered.length === 0) return {};
  const { data: ex } = await db
    .from("exercises")
    .select("key, reference, exercise_solutions(solution, explanation)")
    .eq("lesson_version_id", versionId)
    .in("key", answered.map((a) => a.exercise_key));
  const byKey = new Map(
    ((ex ?? []) as unknown as { key: string; reference: string; exercise_solutions: { solution: unknown; explanation: string } | null }[]).map((e) => [e.key, e]),
  );
  const out: Record<string, AnswerFeedback> = {};
  for (const a of answered) {
    const e = byKey.get(a.exercise_key);
    out[a.exercise_key] = {
      exerciseKey: a.exercise_key,
      answer: a.answer,
      correct: a.is_correct,
      solution: e?.exercise_solutions?.solution ?? null,
      explanation: e?.exercise_solutions?.explanation ?? "",
      reference: e?.reference ?? "",
      alreadyAnswered: true,
    };
  }
  return out;
}

/** Abre (ou retoma) a tentativa de uma lição, validando publicação e desbloqueio. */
export async function beginAttempt(input: { lessonId: string; trackSlug: string; preview: boolean }): Promise<ActionResult<AttemptState>> {
  try {
    const parsed = beginSchema.safeParse(input);
    if (!parsed.success) throw new UserError("Lição inválida.");
    const { lessonId, trackSlug, preview } = parsed.data;
    const user = await requireSessionUser();
    const mode = await modeFor(user.id, preview);
    const scope: Scope = scopeFor(mode);

    const view = await getTrackView(user.id, trackSlug, mode);
    const item = view?.state.items.find((i) => i.lessonId === lessonId);
    if (!view || !item) throw new UserError("Esta lição não está disponível nesta jornada.");
    if (item.status === "locked") throw new UserError("Esta etapa ainda está bloqueada. Conclua a anterior para liberar.");

    const db = adminClient();
    const findOpen = async () =>
      (
        await db
          .from("lesson_attempts")
          .select("id, current_step, lesson_version_id, status")
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId)
          .eq("scope", scope)
          .eq("status", "in_progress")
          .maybeSingle()
      ).data as { id: string; current_step: number; lesson_version_id: string; status: "in_progress" } | null;

    type OpenAttempt = { id: string; current_step: number; lesson_version_id: string; status: "in_progress" };
    let attempt: OpenAttempt | null = await findOpen();
    if (!attempt) {
      const versionId = await resolvePlayableVersion(lessonId, mode);
      if (!versionId) throw new UserError("Esta lição ainda não foi publicada.");
      const { data, error } = await db
        .from("lesson_attempts")
        .insert({ user_id: user.id, lesson_id: lessonId, lesson_version_id: versionId, track_id: view.structure.track.id, scope })
        .select("id, current_step, lesson_version_id, status")
        .single();
      if (error) {
        // Duas abas ao mesmo tempo: a restrição única garante uma só tentativa aberta.
        if (error.code === "23505") attempt = await findOpen();
        else throw error;
      } else attempt = data as OpenAttempt;
    }
    if (!attempt) throw new UserError("Não foi possível abrir a lição.");

    await db
      .from("track_progress")
      .upsert({ user_id: user.id, track_id: view.structure.track.id, scope, last_opened_at: new Date().toISOString() }, { onConflict: "user_id,track_id,scope" });

    return {
      ok: true,
      data: {
        attemptId: attempt.id,
        versionId: attempt.lesson_version_id,
        step: attempt.current_step,
        status: attempt.status,
        answers: await answersWithFeedback(attempt.id, attempt.lesson_version_id, user.id),
      },
    };
  } catch (err) {
    return fail(err);
  }
}

const stepSchema = z.object({ attemptId: uuid, step: z.number().int().min(0).max(500) });

export async function saveStep(input: { attemptId: string; step: number }): Promise<ActionResult<{ step: number }>> {
  try {
    const parsed = stepSchema.safeParse(input);
    if (!parsed.success) throw new UserError("Etapa inválida.");
    const user = await requireSessionUser();
    const { data, error } = await adminClient().rpc("save_attempt_step", {
      p_user: user.id,
      p_attempt: parsed.data.attemptId,
      p_step: parsed.data.step,
    });
    if (error) throw error;
    return { ok: true, data: { step: (data as number | null) ?? parsed.data.step } };
  } catch (err) {
    return fail(err);
  }
}

const answerSchema = z.object({ attemptId: uuid, exerciseKey: z.string().regex(/^[a-z0-9:-]+$/).max(120), answer: z.unknown() });

/** Corrige no servidor e registra a resposta (uma única vez por exercício). */
export async function submitAnswer(input: { attemptId: string; exerciseKey: string; answer: unknown }): Promise<ActionResult<AnswerFeedback>> {
  try {
    const parsed = answerSchema.safeParse(input);
    if (!parsed.success) throw new UserError("Resposta inválida.");
    const { attemptId, exerciseKey, answer } = parsed.data;
    const user = await requireSessionUser();
    const db = adminClient();

    const { data: attempt } = await db
      .from("lesson_attempts")
      .select("id, lesson_id, lesson_version_id, scope, status")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!attempt) throw new UserError("Tentativa não encontrada.");

    const { data: ex } = await db
      .from("exercises")
      .select("key, type, data, reference, exercise_solutions(solution, explanation)")
      .eq("lesson_version_id", attempt.lesson_version_id)
      .eq("key", exerciseKey)
      .maybeSingle();
    const exercise = ex as unknown as {
      key: string;
      type: string;
      data: unknown;
      reference: string;
      exercise_solutions: { solution: unknown; explanation: string } | null;
    } | null;
    if (!exercise || !exercise.exercise_solutions || !isExerciseType(exercise.type)) throw new UserError("Exercício não encontrado.");

    const graded = gradeAnswer(exercise.type, exercise.data, exercise.exercise_solutions.solution, answer);
    if (!graded.valid) throw new UserError(graded.error);

    const { data: recorded, error } = await db.rpc("record_attempt_answer", {
      p_user: user.id,
      p_attempt: attemptId,
      p_key: exerciseKey,
      p_answer: graded.normalized,
      p_correct: graded.correct,
    });
    if (error) {
      if (error.message.includes("attempt_closed")) throw new UserError("Esta lição já foi concluída.");
      throw error;
    }
    const row = (Array.isArray(recorded) ? recorded[0] : recorded) as { inserted: boolean; is_correct: boolean; answer: unknown };

    if (row.inserted && !row.is_correct && attempt.scope === "live") {
      const profile = await getProfile(user.id);
      const today = localDate(new Date(), safeTimeZone(profile?.timezone));
      const sched = scheduleAfterMistake(today);
      await db.rpc("schedule_review_mistake", { p_user: user.id, p_lesson: attempt.lesson_id, p_key: exerciseKey, p_due: sched.dueOn });
    }

    return {
      ok: true,
      data: {
        exerciseKey,
        answer: row.answer,
        correct: row.is_correct,
        solution: exercise.exercise_solutions.solution,
        explanation: exercise.exercise_solutions.explanation,
        reference: exercise.reference,
        alreadyAnswered: !row.inserted,
      },
    };
  } catch (err) {
    return fail(err);
  }
}

export type CompletionResult = {
  xpAwarded: number;
  firstCompletion: boolean;
  correct: number;
  total: number;
  achievements: { id: string; title: string; description: string; color: string; icon: string }[];
  streak: number;
  goalMet: boolean;
  next: { href: string; title: string; unitChanged: boolean } | null;
  trackDone: boolean;
  trackSlug: string | null;
};

/** Conclui a lição: idempotente, libera a próxima etapa e concede XP só na primeira vez. */
export async function completeAttempt(input: { attemptId: string }): Promise<ActionResult<CompletionResult>> {
  try {
    const attemptId = uuid.parse(input.attemptId);
    const user = await requireSessionUser();
    const profile = await getProfile(user.id);
    if (!profile) throw new UserError("Perfil não encontrado.");
    const db = adminClient();

    const { data: attempt } = await db
      .from("lesson_attempts")
      .select("id, lesson_id, lesson_version_id, track_id, scope, status, correct_count, answered_count")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!attempt) throw new UserError("Tentativa não encontrada.");

    const lesson = await loadLessonVersion(attempt.lesson_version_id);
    if (!lesson) throw new UserError("Lição não encontrada.");
    if (attempt.status === "in_progress" && attempt.answered_count < lesson.exercises.length) {
      throw new UserError("Responda todas as questões antes de concluir.");
    }

    const scope = attempt.scope as Scope;
    const mode: ContentMode = scope === "preview" ? "preview" : "public";
    const structure = attempt.track_id ? await getTrackStructure(attempt.track_id, mode) : null;
    const following = structure ? followingItem(structure.units, attempt.lesson_id) : null;

    const today = localDate(new Date(), safeTimeZone(profile.timezone));
    const { data: result, error } = await db.rpc("finalize_lesson_attempt", {
      p_user: user.id,
      p_attempt: attemptId,
      p_local_date: today,
      p_xp_type: xpSourceType(lesson.kind),
      p_xp: xpForFirstCompletion(lesson.kind),
      p_minutes: RULES.lessonMinutes,
      p_track: attempt.track_id,
      p_next_lesson: following?.lessonId ?? null,
    });
    if (error) throw error;
    const fin = result as { newly_completed: boolean; first_completion: boolean; xp_awarded: number };

    let achievements: CompletionResult["achievements"] = [];
    let streak = 0;
    let goalMet = false;
    if (scope === "live") {
      if (fin.newly_completed) {
        // Reforço programado: alguns acertos voltam em 3 dias para fixar.
        const { data: correctRows } = await db
          .from("attempt_answers")
          .select("exercise_key")
          .eq("attempt_id", attemptId)
          .eq("is_correct", true)
          .limit(RULES.scheduledReinforcementsPerLesson);
        const sched = scheduleReinforcement(today);
        const rows = ((correctRows ?? []) as { exercise_key: string }[]).map((r) => ({
          user_id: user.id,
          lesson_id: attempt.lesson_id,
          exercise_key: r.exercise_key,
          origin: "scheduled",
          stage: sched.stage,
          due_on: sched.dueOn,
        }));
        if (rows.length) await db.from("review_items").upsert(rows, { onConflict: "user_id,lesson_id,exercise_key", ignoreDuplicates: true });
      }
      achievements = (await evaluateAchievements(user.id, profile)).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        color: a.color,
        icon: a.icon,
      }));
      const stats = await getStats(user.id, profile);
      streak = stats.streak.current;
      goalMet = stats.goal.met;
    }

    let next: CompletionResult["next"] = null;
    let trackDone = false;
    if (structure) {
      const view = await getTrackView(user.id, structure.track.id, mode);
      if (view) {
        if (view.action.type === "start" || view.action.type === "resume") {
          const item = view.action.item;
          const currentUnit = structure.units.find((u) => u.items.some((i) => i.lessonId === attempt.lesson_id));
          next = { href: lessonHref(item.lessonId, structure.track.slug, mode), title: item.title, unitChanged: currentUnit?.id !== item.unitId };
        } else if (view.action.type === "all_done") trackDone = true;
      }
    }

    return {
      ok: true,
      data: {
        xpAwarded: fin.xp_awarded,
        firstCompletion: fin.first_completion,
        correct: attempt.correct_count,
        total: lesson.exercises.length,
        achievements,
        streak,
        goalMet,
        next,
        trackDone,
        trackSlug: structure?.track.slug ?? null,
      },
    };
  } catch (err) {
    return fail(err);
  }
}
