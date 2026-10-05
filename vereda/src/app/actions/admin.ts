"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getRoles, getUser } from "@/lib/auth";
import { EXERCISE_TYPES, validateExercise, type ExerciseType } from "@/lib/domain/exercises";
import type { ActionResult } from "@/lib/types";

/**
 * Ações editoriais. Cada uma:
 * 1) verifica a permissão no servidor (papel admin/editor), e
 * 2) executa com a sessão da pessoa, para que o banco (RLS e funções
 *    com verificação de papel) valide de novo.
 */
async function editorSession() {
  const user = await getUser();
  if (!user) throw new Denied("Sua sessão terminou. Entre novamente.");
  const roles = await getRoles(user.id);
  if (!roles.includes("admin") && !roles.includes("editor")) throw new Denied("Permissão editorial necessária.");
  return { user, roles, db: await createClient() };
}

class Denied extends Error {}

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof Denied) return { ok: false, error: e.message };
  const message = (e as { message?: string })?.message ?? "";
  // Mensagens das funções do banco já estão em português e não expõem segredos.
  if (/^[A-ZÀ-Ú][^\n]{3,160}\.$/.test(message)) return { ok: false, error: message };
  console.error("[admin]", e);
  return { ok: false, error: "Não foi possível concluir a ação." };
}

function done(message: string): ActionResult {
  revalidatePath("/admin", "layout");
  return { ok: true, message };
}

const uuid = z.string().uuid();

// ---------------------------------------------------------------------
// Versões de lição
// ---------------------------------------------------------------------
export async function createWorkingVersion(lessonId: string): Promise<ActionResult<{ versionId: string }>> {
  try {
    const { db } = await editorSession();
    const { data, error } = await db.rpc("editorial_working_version", { p_lesson: uuid.parse(lessonId) });
    if (error) throw error;
    revalidatePath("/admin", "layout");
    return { ok: true, data: { versionId: data as string }, message: "Versão de trabalho criada. A versão pública continua no ar." };
  } catch (e) {
    return fail(e);
  }
}

export async function versionStatusAction(versionId: string, action: "review" | "reset" | "publish"): Promise<ActionResult> {
  try {
    const { db } = await editorSession();
    const fn = action === "review" ? "editorial_review_version" : action === "reset" ? "editorial_reset_version" : "editorial_publish_version";
    const { error } = await db.rpc(fn, { p_version: uuid.parse(versionId) });
    if (error) throw error;
    return done(action === "review" ? "Marcada como revisada." : action === "reset" ? "Voltou para rascunho." : "Versão publicada.");
  } catch (e) {
    return fail(e);
  }
}

export async function unpublishLesson(lessonId: string): Promise<ActionResult> {
  try {
    const { db } = await editorSession();
    const { error } = await db.rpc("editorial_unpublish_lesson", { p_lesson: uuid.parse(lessonId) });
    if (error) throw error;
    return done("Lição retirada do ar.");
  } catch (e) {
    return fail(e);
  }
}

const blockSchema = z.object({
  kind: z.enum(["resumo", "contexto", "explicacao", "interpretacao", "tradicoes", "citacao"]),
  title: z.string().trim().min(1, "Todo bloco precisa de título.").max(160),
  text: z.string().trim().min(1, "Todo bloco precisa de texto.").max(3000),
  reference: z.string().trim().max(120).optional(),
  translation: z.string().trim().max(120).optional(),
});

const lessonSchema = z.object({
  title: z.string().trim().min(3, "Título muito curto.").max(160),
  objective: z.string().trim().max(400),
  references: z.array(z.string().trim().min(2).max(120)).min(1, "Informe pelo menos uma referência.").max(12),
  context: z.string().trim().max(3000),
  blocks: z.array(blockSchema).max(12),
  takeaways: z.array(z.string().trim().min(3).max(300)).length(3, "São exatamente três aprendizados."),
  reflection: z.string().trim().max(500).nullable(),
});

export async function saveLessonVersion(versionId: string, input: z.input<typeof lessonSchema>): Promise<ActionResult> {
  try {
    const { user, db } = await editorSession();
    const parsed = lessonSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    for (const blk of parsed.data.blocks) {
      if (blk.kind === "citacao" && !blk.translation) return { ok: false, error: "Citações literais precisam identificar a tradução (e ter licença compatível)." };
    }
    const { title, objective, ...rest } = parsed.data;
    const content = { ...rest, reflection: rest.reflection || null, minutes: 5 };
    const { data, error } = await db
      .from("lesson_versions")
      .update({ title, objective, content, edited_in_admin: true, updated_by: user.id, status: "draft", reviewed_by: null, reviewed_at: null })
      .eq("id", uuid.parse(versionId))
      .in("status", ["draft", "reviewed"])
      .select("id");
    if (error) throw error;
    if (!data?.length) return { ok: false, error: "Só versões de trabalho podem ser editadas. Crie uma versão de trabalho." };
    await adminClient().from("editorial_log").insert({ entity_type: "lesson_version", entity_id: versionId, action: "edited", actor_id: user.id });
    return done("Rascunho salvo.");
  } catch (e) {
    return fail(e);
  }
}

const exerciseSchema = z.object({
  type: z.enum(EXERCISE_TYPES),
  prompt: z.string().trim().min(3).max(500),
  data: z.unknown(),
  solution: z.unknown(),
  explanation: z.string().trim().min(3, "Toda questão precisa de explicação.").max(1200),
  reference: z.string().trim().min(2, "Toda questão precisa de referência.").max(160),
});

async function markEdited(db: Awaited<ReturnType<typeof createClient>>, versionId: string, userId: string) {
  await db.from("lesson_versions").update({ edited_in_admin: true, updated_by: userId }).eq("id", versionId).eq("status", "draft");
  await adminClient().from("editorial_log").insert({ entity_type: "lesson_version", entity_id: versionId, action: "edited", actor_id: userId, note: "exercícios" });
}

export async function saveExercise(input: { versionId: string; exerciseId: string | null } & z.input<typeof exerciseSchema>): Promise<ActionResult> {
  try {
    const { user, db } = await editorSession();
    const versionId = uuid.parse(input.versionId);
    const parsed = exerciseSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const problem = validateExercise(parsed.data.type as ExerciseType, parsed.data.data, parsed.data.solution);
    if (problem) return { ok: false, error: problem };

    const { data: version } = await db.from("lesson_versions").select("status, lessons(slug)").eq("id", versionId).maybeSingle();
    if (!version || !["draft", "reviewed"].includes(version.status as string)) {
      return { ok: false, error: "Só versões de trabalho podem ser editadas." };
    }

    if (input.exerciseId) {
      const exerciseId = uuid.parse(input.exerciseId);
      const { error } = await db
        .from("exercises")
        .update({ type: parsed.data.type, prompt: parsed.data.prompt, data: parsed.data.data, reference: parsed.data.reference })
        .eq("id", exerciseId)
        .eq("lesson_version_id", versionId);
      if (error) throw error;
      const { error: solError } = await db
        .from("exercise_solutions")
        .upsert({ exercise_id: exerciseId, solution: parsed.data.solution, explanation: parsed.data.explanation });
      if (solError) throw solError;
    } else {
      const { data: existing } = await db.from("exercises").select("position, key").eq("lesson_version_id", versionId);
      const rows = (existing ?? []) as { position: number; key: string }[];
      const position = Math.max(0, ...rows.map((r) => r.position)) + 1;
      const slug = (version.lessons as unknown as { slug: string } | null)?.slug ?? "licao";
      let n = position;
      while (rows.some((r) => r.key === `${slug}:e${n}`)) n++;
      const { data: created, error } = await db
        .from("exercises")
        .insert({ lesson_version_id: versionId, key: `${slug}:e${n}`, position, type: parsed.data.type, prompt: parsed.data.prompt, data: parsed.data.data, reference: parsed.data.reference })
        .select("id")
        .single();
      if (error) throw error;
      const { error: solError } = await db
        .from("exercise_solutions")
        .insert({ exercise_id: created.id, solution: parsed.data.solution, explanation: parsed.data.explanation });
      if (solError) throw solError;
    }
    await markEdited(db, versionId, user.id);
    return done("Exercício salvo.");
  } catch (e) {
    return fail(e);
  }
}

export async function deleteExercise(input: { versionId: string; exerciseId: string }): Promise<ActionResult> {
  try {
    const { user, db } = await editorSession();
    const versionId = uuid.parse(input.versionId);
    const { error } = await db.from("exercises").delete().eq("id", uuid.parse(input.exerciseId)).eq("lesson_version_id", versionId);
    if (error) throw error;
    await markEdited(db, versionId, user.id);
    return done("Exercício removido.");
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------
// Personagens, trilhas, unidades
// ---------------------------------------------------------------------
const entityType = z.enum(["character", "track", "unit"]);

export async function saveEntity(type: string, id: string, changes: Record<string, string>): Promise<ActionResult> {
  try {
    const { db } = await editorSession();
    const { error } = await db.rpc("editorial_save_entity", { p_type: entityType.parse(type), p_id: uuid.parse(id), p_changes: changes });
    if (error) throw error;
    return done("Alterações salvas.");
  } catch (e) {
    return fail(e);
  }
}

export async function entityStatus(type: string, id: string, action: "review" | "publish" | "unpublish" | "discard_pending"): Promise<ActionResult> {
  try {
    const { db } = await editorSession();
    const { error } = await db.rpc("editorial_entity_status", { p_type: entityType.parse(type), p_id: uuid.parse(id), p_action: action });
    if (error) throw error;
    const msg = { review: "Marcado como revisado.", publish: "Publicado.", unpublish: "Retirado do ar.", discard_pending: "Alterações pendentes descartadas." }[action];
    return done(msg);
  } catch (e) {
    return fail(e);
  }
}

export async function bulkAction(scope: "unit" | "track", id: string, action: "review" | "publish", confirmed: boolean): Promise<ActionResult> {
  try {
    if (!confirmed) return { ok: false, error: "Confirme que você revisou o conteúdo na prévia." };
    const { db } = await editorSession();
    const { data, error } = await db.rpc("editorial_bulk", { p_scope: scope, p_id: uuid.parse(id), p_action: action });
    if (error) throw error;
    return done(action === "review" ? `${data} versões marcadas como revisadas.` : `${data} versões publicadas.`);
  } catch (e) {
    return fail(e);
  }
}

export async function moveItem(type: "unit" | "item", id: string, direction: -1 | 1): Promise<ActionResult> {
  try {
    const { db } = await editorSession();
    const { error } = await db.rpc("editorial_move", { p_type: type, p_id: uuid.parse(id), p_direction: direction });
    if (error) throw error;
    return done("Ordem atualizada.");
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------
// Prévia: progresso de teste separado do real
// ---------------------------------------------------------------------
export async function resetPreviewProgress(): Promise<ActionResult> {
  try {
    const { user } = await editorSession();
    const db = adminClient();
    for (const table of ["lesson_attempts", "lesson_completions", "lesson_unlocks", "track_progress"]) {
      const { error } = await db.from(table).delete().eq("user_id", user.id).eq("scope", "preview");
      if (error) throw error;
    }
    return done("Progresso de teste reiniciado.");
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------
// Equipe (somente administradores; o banco também verifica)
// ---------------------------------------------------------------------
export async function grantRole(email: string, role: "admin" | "editor"): Promise<ActionResult> {
  try {
    const { roles, db } = await editorSession();
    if (!roles.includes("admin")) return { ok: false, error: "Somente administradores podem conceder papéis." };
    const parsedEmail = z.string().trim().email("E-mail inválido.").safeParse(email);
    if (!parsedEmail.success) return { ok: false, error: parsedEmail.error.issues[0].message };
    const { error } = await db.rpc("admin_grant_role", { p_email: parsedEmail.data, p_role: z.enum(["admin", "editor"]).parse(role) });
    if (error) throw error;
    return done("Papel concedido.");
  } catch (e) {
    return fail(e);
  }
}

export async function revokeRole(userId: string, role: "admin" | "editor"): Promise<ActionResult> {
  try {
    const { roles, db } = await editorSession();
    if (!roles.includes("admin")) return { ok: false, error: "Somente administradores podem remover papéis." };
    const { error } = await db.rpc("admin_revoke_role", { p_user: uuid.parse(userId), p_role: role });
    if (error) throw error;
    return done("Papel removido.");
  } catch (e) {
    return fail(e);
  }
}
