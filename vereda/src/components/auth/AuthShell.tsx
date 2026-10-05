import type { ReactNode } from "react";
import { Sheep, type SheepMood } from "../art/Sheep";
import { Scene } from "../art/Scene";
import { Bubble } from "../ui";

export function AuthShell({
  title,
  speech,
  mood = "happy",
  children,
  hero,
}: {
  title: string;
  speech: ReactNode;
  mood?: SheepMood;
  children: ReactNode;
  hero?: ReactNode;
}) {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col md:flex-row md:items-center md:gap-10 md:px-6">
      <div className="relative overflow-hidden md:flex-1 md:rounded-[36px]">
        <Scene kind="garden" className="absolute inset-0 h-full w-full" />
        <div className="relative flex flex-col items-center gap-3 px-4 pb-6 pt-6 md:py-14">
          <p className="font-display text-3xl font-extrabold text-green-ink">Vereda</p>
          <Sheep mood={mood} size={150} className="animate-float drop-shadow-sm" />
          {hero && <div className="rounded-3xl bg-paper/85 px-4 py-3 backdrop-blur-sm">{hero}</div>}
        </div>
      </div>
      <div className="flex w-full flex-col gap-5 px-4 py-6 md:max-w-md md:py-10">
        <Bubble tail="top">{speech}</Bubble>
        <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function NotConfigured() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <Sheep mood="think" size={140} />
      <h1 className="text-2xl font-extrabold">O Vereda ainda não está conectado ao banco</h1>
      <p className="font-semibold text-ink-soft">
        Para criar contas e salvar o progresso, configure o Supabase em <code className="rounded bg-cream-deep px-1">.env.local</code> (veja{" "}
        <code className="rounded bg-cream-deep px-1">.env.example</code> e o README).
      </p>
    </main>
  );
}
