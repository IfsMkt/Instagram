import { Sheep } from "@/components/art/Sheep";

export default function Loading() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <Sheep mood="think" size={110} label="" className="animate-float" />
      <p className="font-bold text-ink-soft">Carregando…</p>
    </div>
  );
}
