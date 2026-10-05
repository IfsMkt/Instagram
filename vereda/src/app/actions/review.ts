"use server";

import { z } from "zod";
import { getProfile, getUser } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { gradeAnswer, isExerciseType } from "@/lib/domain/exercises";
import { describeStage, nextReviewSchedule } from "@/lib/domain/review";
import { localDate, safeTimeZone } from "@/lib/domain/dates";
import { RULES } from "@/lib/domain/rules";
import { evaluateAchievements } from "@/lib/data/progress";
import type { ActionResult } from "@/lib/types";

export type ReviewFeedback = {
  correct: boolean;
  solution: unknown;
  explanation: string;
  reference: string;
  xpAwarded: number;
  nextLabel: string;
  achievements: string[];
};

const schema = z.object({ itemId: z.string().uuid(), requestId: z.string().uuid(), answer: z.unknown() });

/** Resposta na área "Vamos lembrar?": corrigida no servidor, idempotente por requestId. */
export async function submitReviewAnswer(input: { itemId: string; requestId: string; answer: unknown }): Promise<ActionResult<ReviewFeedback>> {
  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Resposta inválida." };
    const user = await getUser();
    if (!user) return { ok: false, error: "Sua sessão terminou. Entre novamente." };
    const profile = await getProfile(user.id);
    if (!profile) return { ok: false, error: "Perfil não encontrado." };
    const db = adminClient();
    const today = localDate(new Date(), safeTimeZone(profile.timezone));

    const { data: item } = await db
      .from("review_items")
      .select("id, lesson_id, exercise_key, stage, due_on")
      .eq("id", parsed.data.itemId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!item) return { ok: false, error: "Item de revisão não encontrado." };

    const { data: version } = await db
      .from("lesson_versions")
      .select("id, exercises(key, type, data, reference, exercise_solutions(solution, explanation))")
      .eq("lesson_id", item.lesson_id)
      .eq("status", "published")
      .maybeSingle();
    const exercise = ((version?.exercises ?? []) as unknown as {
      key: string;
      type: string;
      data: unknown;
      reference: string;
      exercise_solutions: { solution: unknown; explanation: string } | null;
    }[]).find((e) => e.key === item.exercise_key);
    if (!exercise || !exercise.exercise_solutions || !isExerciseType(exercise.type)) {
      return { ok: false, error: "Este exercício não está mais disponível." };
    }
    const graded = gradeAnswer(exercise.type, exercise.data, exercise.exercise_solutions.solution, parsed.data.answer);
    if (!graded.valid) return { ok: false, error: graded.error };

    // Repetição de rede do mesmo envio: devolve o resultado salvo.
    const { data: previous } = await db
      .from("review_events")
      .select("is_correct, stage_after")
      .eq("user_id", user.id)
      .eq("request_id", parsed.data.requestId)
      .maybeSingle();
    if (!previous && (item.due_on === null || item.due_on > today)) {
      return { ok: false, error: "Este item já foi revisado. Ele volta na data programada." };
    }

    const schedule = nextReviewSchedule(item.stage, graded.correct, today);
    const { data: result, error } = await db.rpc("record_review_answer", {
      p_user: user.id,
      p_item: item.id,
      p_request: parsed.data.requestId,
      p_answer: graded.normalized,
      p_correct: graded.correct,
      p_stage_before: item.stage,
      p_stage_after: schedule.stage,
      p_due: schedule.dueOn,
      p_local_date: today,
      p_xp: RULES.spacedReviewCorrectXp,
      p_xp_slots: RULES.spacedReviewDailyXpSlots,
      p_minutes: RULES.reviewAnswerMinutes,
    });
    if (error) {
      if (error.message.includes("review_item_stale")) return { ok: false, error: "Este item acabou de ser revisado em outra aba." };
      throw error;
    }
    const r = result as { duplicate: boolean; is_correct: boolean; stage_after: number; xp_awarded: number };
    const achievements = r.duplicate ? [] : (await evaluateAchievements(user.id, profile)).map((a) => a.title);
    return {
      ok: true,
      data: {
        correct: r.is_correct,
        solution: exercise.exercise_solutions.solution,
        explanation: exercise.exercise_solutions.explanation,
        reference: exercise.reference,
        xpAwarded: r.xp_awarded,
        nextLabel: describeStage(r.stage_after),
        achievements,
      },
    };
  } catch (e) {
    console.error("[review]", e);
    return { ok: false, error: "Não foi possível salvar agora. Tente novamente." };
  }
}
