"use client";

import { Sheep } from "@/components/art/Sheep";
import { Button } from "@/components/ui";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center" role="alert">
      <Sheep mood="think" size={120} label="" />
      <h1 className="text-2xl font-extrabold">Ops, tropeçamos no caminho</h1>
      <p className="font-semibold text-ink-soft">Não conseguimos carregar esta página agora. Seu progresso está salvo.</p>
      <Button onClick={reset} icon="refresh">
        Tentar novamente
      </Button>
    </div>
  );
}
