import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetRequestForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ResetRequestPage() {
  return (
    <AuthShell title="Recuperar senha" mood="think" speech={<>Acontece com todo mundo! Me diga seu e-mail e eu envio um link para você criar uma nova senha.</>}>
      <ResetRequestForm />
    </AuthShell>
  );
}
