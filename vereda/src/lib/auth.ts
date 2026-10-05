import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

/** Usuário autenticado (validado no servidor de Auth), ou null. */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (data) return data as Profile;
  // Conta criada antes do gatilho de perfil: cria o perfil com segurança no servidor.
  const { data: created } = await adminClient()
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true })
    .select("*")
    .maybeSingle();
  if (created) return created as Profile;
  const { data: again } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (again as Profile) ?? null;
});

export const getRoles = cache(async (userId: string): Promise<string[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: { role: string }) => r.role);
});

export async function requireUser(next?: string): Promise<User> {
  const user = await getUser();
  if (!user) redirect(next ? `/entrar?proximo=${encodeURIComponent(next)}` : "/entrar");
  return user;
}

/** Usuário com onboarding concluído (senão, volta às boas-vindas). */
export async function requireOnboarded(): Promise<{ user: User; profile: Profile }> {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/entrar");
  if (!profile.onboarding_completed_at) redirect("/boas-vindas");
  return { user, profile };
}

export async function isEditor(userId: string): Promise<boolean> {
  const roles = await getRoles(userId);
  return roles.includes("admin") || roles.includes("editor");
}

/** Área administrativa: valida a permissão no servidor (e o banco valida de novo). */
export async function requireEditor(): Promise<{ user: User; roles: string[] }> {
  const user = await requireUser("/admin");
  const roles = await getRoles(user.id);
  if (!roles.includes("admin") && !roles.includes("editor")) redirect("/inicio?aviso=sem-permissao");
  return { user, roles };
}

export async function requireAdmin(): Promise<{ user: User }> {
  const { user, roles } = await requireEditor();
  if (!roles.includes("admin")) redirect("/admin?aviso=somente-admin");
  return { user };
}
