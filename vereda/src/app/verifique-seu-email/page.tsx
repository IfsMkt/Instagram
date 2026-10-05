import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResendForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Confirme seu e-mail" };

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <AuthShell
      title="Confirme seu e-mail"
      mood="cheer"
      speech={
        <>
          Conta criada! Enviei um link de confirmação para <strong className="break-all">{email ?? "o seu e-mail"}</strong>. Abra o link neste aparelho para começar.
        </>
      }
    >
      <p className="font-semibold text-ink-soft">Não chegou? Confira a caixa de spam ou peça um novo link:</p>
      <ResendForm email={email} />
      <p className="text-center text-sm font-bold">
        <Link href="/entrar" className="text-green-dark underline decoration-2 underline-offset-4">
          Já confirmei, quero entrar
        </Link>
      </p>
    </AuthShell>
  );
}
