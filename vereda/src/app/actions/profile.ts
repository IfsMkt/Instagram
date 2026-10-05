"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/domain/dates";
import { getTrackView, lessonHref } from "@/lib/data/progress";
import type { ActionResult } from "@/lib/types";

const knowledge = z.enum(["nenhum", "pouco", "algum", "bastante"]);
const goal = z.enum(["conhecer", "rotina", "aprofundar", "ensinar", "curiosidade"]);
const tradition = z.enum(["geral", "catolica", "protestante", "prefiro-nao-dizer"]);
const minutes = z.union([z.literal(5), z.literal(10), z.literal(15)]);
const timezone = z.string().refine(isValidTimeZone, "Fuso horário inválido.");

const onboardingSchema = z.object({
  step: z.number().int().min(0).max(20),
  bible_knowledge: knowledge.optional(),
  learning_goal: goal.optional(),
  daily_goal_minutes: minutes.optional(),
  tradition: tradition.nullable().optional(),
  timezone: timezone.optional(),
});

async function sessionClient() {
  const user = await getUser();
  if (!user) throw new Error("Sua sessão terminou. Entre novamente.");
  return { user, db: await createClient() };
}

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof Error && e.message.startsWith("Sua sessão")) return { ok: false, error: e.message };
  console.error("[profile]", e);
  return { ok: false, error: "Não foi possível salvar agora. Tente novamente." };
}

/** Salva cada resposta do onboarding assim que é escolhida (para retomar depois). */
export async function saveOnboardingAnswer(input: z.input<typeof onboardingSchema>): Promise<ActionResult> {
  try {
    const parsed = onboardingSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const { user, db } = await sessionClient();
    const { step, ...fields } = parsed.data;
    const { error } = await db
      .from("profiles")
      .update({ ...fields, onboarding_step: step })
      .eq("id", user.id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Escolhe a trilha ativa (onboarding ou "Explorar jornadas").
 * O progresso de todas as trilhas é preservado: só muda qual está ativa.
 */
export async function chooseTrack(input: { trackId: string; finishOnboarding?: boolean }): Promise<ActionResult<{ firstLessonHref: string | null; firstLessonTitle: string | null }>> {
  try {
    const trackId = z.string().uuid().parse(input.trackId);
    const { user, db } = await sessionClient();
    const view = await getTrackView(user.id, trackId, "public");
    if (!view || view.structure.units.length === 0) return { ok: false, error: "Esta jornada ainda não tem lições publicadas." };

    const update: Record<string, unknown> = { active_track_id: trackId };
    if (input.finishOnboarding) {
      update.onboarding_completed_at = new Date().toISOString();
      update.onboarding_step = 6;
    }
    const { error } = await db.from("profiles").update(update).eq("id", user.id);
    if (error) throw error;
    await adminClient()
      .from("track_progress")
      .upsert({ user_id: user.id, track_id: trackId, scope: "live", last_opened_at: new Date().toISOString() }, { onConflict: "user_id,track_id,scope" });

    // Sem revalidatePath aqui: o onboarding precisa continuar na mesma tela
    // (as páginas privadas são sempre renderizadas sob demanda).
    const action = view.action;
    const item = action.type === "start" || action.type === "resume" ? action.item : null;
    return {
      ok: true,
      data: {
        firstLessonHref: item ? lessonHref(item.lessonId, view.structure.track.slug) : null,
        firstLessonTitle: item?.title ?? null,
      },
    };
  } catch (e) {
    return fail(e);
  }
}

/** Conclui o onboarding sem trilha (quando ainda não há conteúdo publicado). */
export async function finishOnboardingWithoutTrack(): Promise<ActionResult> {
  try {
    const { user, db } = await sessionClient();
    const { error } = await db
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString(), onboarding_step: 6 })
      .eq("id", user.id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const settingsSchema = z.object({
  display_name: z.string().trim().min(1, "Informe um nome.").max(60, "Use até 60 caracteres."),
  daily_goal_minutes: minutes,
  timezone,
  tradition: tradition.nullable(),
  sound_enabled: z.boolean(),
  reduced_motion: z.boolean(),
  avatar: z.string().regex(/^[a-z0-9-]+$/).max(30),
});

export async function updateSettings(input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  try {
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const { user, db } = await sessionClient();
    const { error } = await db.from("profiles").update(parsed.data).eq("id", user.id);
    if (error) throw error;
    revalidatePath("/", "layout");
    return { ok: true, message: "Preferências salvas." };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Exclui a conta e TODOS os dados privados (progresso, anotações, favoritos,
 * conquistas). As tabelas usam ON DELETE CASCADE a partir de auth.users.
 */
export async function deleteAccount(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const confirmation = String(formData.get("confirmacao") ?? "").trim().toUpperCase();
  if (confirmation !== "EXCLUIR") return { error: "Digite EXCLUIR para confirmar." };
  const user = await getUser();
  if (!user) return { error: "Sua sessão terminou. Entre novamente." };
  const { error } = await adminClient().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[deleteAccount]", error);
    return { error: "Não foi possível excluir agora. Tente novamente em instantes." };
  }
  const db = await createClient();
  await db.auth.signOut();
  redirect("/entrar?aviso=conta-excluida");
}
