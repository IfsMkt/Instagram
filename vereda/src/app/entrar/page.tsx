import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell, NotConfigured } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/forms";
import { Notice } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { safeNext } from "@/lib/validation";

export const metadata: Metadata = { title: "Entrar" };

const NOTICES: Record<string, { tone: "info" | "success" | "error"; text: string }> = {
  saiu: { tone: "success", text: "Você saiu da sua conta. Até a próxima caminhada!" },
  "link-invalido": { tone: "error", text: "Esse link expirou ou já foi usado. Entre com sua senha ou peça um novo link." },
  "conta-excluida": { tone: "success", text: "Sua conta e seus dados foram excluídos." },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ proximo?: string; aviso?: string }> }) {
  if (!publicEnv().configured) return <NotConfigured />;
  const params = await searchParams;
  const next = safeNext(params.proximo);
  if (await getUser()) redirect(next);
  const notice = params.aviso ? NOTICES[params.aviso] : undefined;
  return (
    <AuthShell title="Entrar" speech={<>Que bom te ver de novo! Vamos continuar de onde você parou?</>}>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <SignInForm next={next} />
    </AuthShell>
  );
}
