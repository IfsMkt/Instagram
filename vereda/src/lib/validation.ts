import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Digite um e-mail válido.").max(254);
export const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.");
export const nameSchema = z.string().trim().min(1, "Conte como podemos te chamar.").max(60, "Use até 60 caracteres.");

/** Aceita apenas caminhos internos (evita redirecionamento aberto). */
export function safeNext(value: unknown, fallback = "/inicio"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}
