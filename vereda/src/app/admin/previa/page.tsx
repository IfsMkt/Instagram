import type { Metadata } from "next";
import Link from "next/link";
import { resetPreviewProgress } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/AdminControls";
import { Character } from "@/components/art/Character";
import { Sheep } from "@/components/art/Sheep";
import { Notice, StatusBadge } from "@/components/ui";
import { listTracks } from "@/lib/data/content";

export const metadata: Metadata = { title: "Prévia editorial" };

export default async function PreviewIndex() {
  const tracks = await listTracks("preview");
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-extrabold">Prévia editorial</h1>
        <p className="font-semibold text-ink-soft">Percorra as trilhas completas — inclusive rascunhos — exatamente como as pessoas verão.</p>
      </div>
      <Notice tone="info">
        Na prévia, seu progresso é de <strong>teste</strong>: fica separado do seu progresso real, não gera XP, sequência, conquistas nem revisões.
      </Notice>
      <div>
        <ActionButton label="Reiniciar meu progresso de teste" icon="refresh" confirmText="Apagar todo o seu progresso de teste da prévia?" action={resetPreviewProgress} />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {tracks.map((t) => (
          <li key={t.id}>
            <Link href={`/admin/previa/${t.slug}`} className="btn-3d flex items-center gap-3 rounded-2xl border-2 border-line bg-paper p-4 [--btn-shadow:var(--color-line)]">
              {t.character ? <Character slug={t.character.slug} size={56} label="" /> : <Sheep size={56} label="" />}
              <span className="flex-1 font-extrabold">{t.title}</span>
              <StatusBadge status={t.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
