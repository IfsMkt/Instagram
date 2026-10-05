import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { NewPasswordForm } from "@/components/auth/forms";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Nova senha" };

export default async function NewPasswordPage() {
  await requireUser("/redefinir-senha");
  return (
    <AuthShell title="Criar nova senha" speech={<>Pronto, link confirmado! Agora escolha uma nova senha.</>}>
      <NewPasswordForm />
    </AuthShell>
  );
}
