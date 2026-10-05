"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { emailSchema, firstError, nameSchema, passwordSchema, safeNext } from "@/lib/validation";

export type FormState = { error?: string; message?: string; fields?: Record<string, string> };

function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Seu e-mail ainda não foi confirmado. Procure o link que enviamos (veja também o spam).";
  if (m.includes("already registered") || m.includes("already been registered")) return "Já existe uma conta com esse e-mail. Que tal entrar?";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.";
  if (m.includes("password")) return "Essa senha não foi aceita. Tente uma senha mais forte, com pelo menos 8 caracteres.";
  if (m.includes("fetch") || m.includes("network")) return "Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.";
  return "Algo não saiu como esperado. Tente novamente em instantes.";
}

const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "As senhas não são iguais.", path: ["confirm"] });

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { error: firstError(parsed.error), fields: { name: raw.name, email: raw.email } };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.name },
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=/boas-vindas`,
    },
  });
  if (error) return { error: authErrorMessage(error.message), fields: { name: raw.name, email: raw.email } };
  if (data.session) redirect("/boas-vindas");
  redirect(`/verifique-seu-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email.success) return { error: firstError(email.error) };
  if (!password) return { error: "Digite sua senha.", fields: { email: email.data } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.data, password });
  if (error) return { error: authErrorMessage(error.message), fields: { email: email.data } };
  redirect(safeNext(formData.get("next")));
}

export async function resendConfirmationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: firstError(email.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.data,
    options: { emailRedirectTo: `${siteUrl()}/auth/confirm?next=/boas-vindas` },
  });
  if (error) return { error: authErrorMessage(error.message) };
  return { message: "Se houver um cadastro pendente com esse e-mail, enviamos um novo link." };
}

export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: firstError(email.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/redefinir-senha`,
  });
  if (error && /rate limit|too many/i.test(error.message)) return { error: authErrorMessage(error.message) };
  // Mesma resposta exista ou não a conta (não revela quem tem cadastro).
  return { message: "Se existir uma conta com esse e-mail, você vai receber um link para criar uma nova senha." };
}

const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "As senhas não são iguais.", path: ["confirm"] });

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "O link expirou. Peça um novo link de recuperação." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (/different from the old/i.test(error.message)) return { error: "A nova senha precisa ser diferente da anterior." };
    return { error: authErrorMessage(error.message) };
  }
  redirect("/inicio?aviso=senha-alterada");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar?aviso=saiu");
}
