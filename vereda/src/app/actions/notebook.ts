"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/auth";
import { evaluateAchievements } from "@/lib/data/progress";
import type { ActionResult } from "@/lib/types";

/**
 * Caderno privado. Todas as operações usam a sessão da pessoa: o banco
 * (RLS) garante que cada um só lê e altera os próprios registros, e aqui
 * também filtramos explicitamente por user_id.
 */

const referenceSchema = z.string().trim().min(2, "Informe uma referência, como “Salmos 23:1”.").max(80);

async function session() {
  const user = await getUser();
  if (!user) throw new Error("Sua sessão terminou. Entre novamente.");
  return { user, db: await createClient() };
}

function err(e: unknown): { ok: false; error: string } {
  const message = e instanceof Error ? e.message : "";
  if (message.startsWith("Sua sessão")) return { ok: false, error: message };
  console.error("[notebook]", e);
  return { ok: false, error: "Não foi possível salvar agora. Tente novamente." };
}

export async function toggleFavorite(input: { reference: string; lessonId?: string | null }): Promise<ActionResult<{ favorited: boolean }>> {
  try {
    const ref = referenceSchema.safeParse(input.reference);
    if (!ref.success) return { ok: false, error: ref.error.issues[0].message };
    const lessonId = input.lessonId && z.string().uuid().safeParse(input.lessonId).success ? input.lessonId : null;
    const { user, db } = await session();
    const { data: existing } = await db.from("favorites").select("id").eq("user_id", user.id).eq("reference", ref.data).maybeSingle();
    if (existing) {
      const { error } = await db.from("favorites").delete().eq("id", existing.id).eq("user_id", user.id);
      if (error) throw error;
      revalidatePath("/caderno");
      return { ok: true, data: { favorited: false }, message: "Removido dos favoritos." };
    }
    const { error } = await db.from("favorites").insert({ user_id: user.id, reference: ref.data, lesson_id: lessonId });
    if (error && error.code !== "23505") throw error;
    revalidatePath("/caderno");
    return { ok: true, data: { favorited: true }, message: "Referência salva nos favoritos." };
  } catch (e) {
    return err(e);
  }
}

const noteSchema = z.object({
  title: z.string().trim().max(120, "Título com até 120 caracteres."),
  body: z.string().trim().min(1, "Escreva algo antes de salvar.").max(5000, "Use até 5000 caracteres."),
  reference: z.string().trim().max(80, "Referência com até 80 caracteres."),
  kind: z.enum(["note", "reflection"]),
});

export async function saveNote(input: {
  id?: string | null;
  title: string;
  body: string;
  reference: string;
  kind: "note" | "reflection";
  lessonId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = noteSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const { user, db } = await session();
    if (input.id) {
      if (!z.string().uuid().safeParse(input.id).success) return { ok: false, error: "Anotação inválida." };
      const { data, error } = await db
        .from("notes")
        .update(parsed.data)
        .eq("id", input.id)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: "Anotação não encontrada." };
      revalidatePath("/caderno");
      return { ok: true, data: { id: data.id }, message: "Anotação atualizada." };
    }
    const lessonId = input.lessonId && z.string().uuid().safeParse(input.lessonId).success ? input.lessonId : null;
    const { data, error } = await db
      .from("notes")
      .insert({ ...parsed.data, user_id: user.id, lesson_id: lessonId })
      .select("id")
      .single();
    if (error) throw error;
    const profile = await getProfile(user.id);
    if (profile) await evaluateAchievements(user.id, profile);
    revalidatePath("/caderno");
    return { ok: true, data: { id: data.id }, message: parsed.data.kind === "reflection" ? "Reflexão salva no seu caderno." : "Anotação salva." };
  } catch (e) {
    return err(e);
  }
}

export async function deleteNote(input: { id: string }): Promise<ActionResult> {
  try {
    if (!z.string().uuid().safeParse(input.id).success) return { ok: false, error: "Anotação inválida." };
    const { user, db } = await session();
    const { data, error } = await db.from("notes").delete().eq("id", input.id).eq("user_id", user.id).select("id");
    if (error) throw error;
    if (!data || data.length === 0) return { ok: false, error: "Anotação não encontrada." };
    revalidatePath("/caderno");
    return { ok: true, message: "Anotação excluída." };
  } catch (e) {
    return err(e);
  }
}

export async function deleteFavorite(input: { id: string }): Promise<ActionResult> {
  try {
    if (!z.string().uuid().safeParse(input.id).success) return { ok: false, error: "Favorito inválido." };
    const { user, db } = await session();
    const { error } = await db.from("favorites").delete().eq("id", input.id).eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/caderno");
    return { ok: true, message: "Favorito removido." };
  } catch (e) {
    return err(e);
  }
}

export async function addFavorite(input: { reference: string; note: string }): Promise<ActionResult> {
  try {
    const ref = referenceSchema.safeParse(input.reference);
    if (!ref.success) return { ok: false, error: ref.error.issues[0].message };
    const note = z.string().trim().max(500, "Nota com até 500 caracteres.").safeParse(input.note ?? "");
    if (!note.success) return { ok: false, error: note.error.issues[0].message };
    const { user, db } = await session();
    const { error } = await db.from("favorites").insert({ user_id: user.id, reference: ref.data, note: note.data });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Essa referência já está nos favoritos." };
      throw error;
    }
    revalidatePath("/caderno");
    return { ok: true, message: "Referência salva nos favoritos." };
  } catch (e) {
    return err(e);
  }
}
