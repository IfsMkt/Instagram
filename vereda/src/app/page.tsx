import { redirect } from "next/navigation";
import { AuthShell, NotConfigured } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/forms";
import { getUser } from "@/lib/auth";
import { publicEnv } from "@/lib/env";

export default async function WelcomePage() {
  if (!publicEnv().configured) return <NotConfigured />;
  const user = await getUser();
  if (user) redirect("/inicio");

  return (
    <AuthShell
      title="Crie sua conta"
      mood="wave"
      speech={
        <>
          <span className="block font-extrabold">Oi! Eu sou a Mel.</span>
          Vou te acompanhar numa jornada para conhecer a Bíblia com lições curtas, no seu ritmo.
        </>
      }
      hero={
        <div className="max-w-sm text-center">
          <p className="font-display text-2xl font-extrabold leading-tight text-ink">Aprenda a Bíblia, um passo por dia.</p>
          <p className="mt-2 text-sm font-bold text-ink-soft">Cinco minutos de lição, exercícios divertidos e revisão para lembrar de verdade.</p>
        </div>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
