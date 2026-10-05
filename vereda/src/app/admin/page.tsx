import type { Metadata } from "next";
import Link from "next/link";
import { colorClasses } from "@/components/art/palette";
import { Chip, cx, Notice, StatusBadge } from "@/components/ui";
import { getAdminOverview } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Editorial" };

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await searchParams;
  const tracks = await getAdminOverview();
  const totals = tracks.reduce(
    (acc, t) => ({
      draft: acc.draft + t.counts.draft,
      reviewed: acc.reviewed + t.counts.reviewed,
      published: acc.published + t.counts.published,
      lessons: acc.lessons + t.lessons,
    }),
    { draft: 0, reviewed: 0, published: 0, lessons: 0 },
  );
  return (
    <div className="flex flex-col gap-6">
      {aviso === "somente-admin" && <Notice tone="info">Essa página é exclusiva de administradores.</Notice>}
      <div>
        <h1 className="text-3xl font-extrabold">Conteúdo</h1>
        <p className="font-semibold text-ink-soft">
          Fluxo: <strong>rascunho → revisado → publicado</strong>. Conteúdo gerado com apoio de IA entra como rascunho e só vai ao ar depois da revisão de uma
          pessoa. Alterar algo publicado cria uma versão de trabalho, sem tirar a versão pública do ar.
        </p>
      </div>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Totais">
        {[
          ["Posições na trilha", totals.lessons, "lilac"],
          ["Rascunhos", totals.draft, "yellow"],
          ["Revisados (aguardando)", totals.reviewed, "blue"],
          ["Publicados", totals.published, "green"],
        ].map(([label, value, color]) => (
          <div key={String(label)} className={cx("rounded-2xl p-4", colorClasses(String(color)).soft)}>
            <p className="text-2xl font-extrabold">{value}</p>
            <p className="text-xs font-extrabold text-ink-soft">{label}</p>
          </div>
        ))}
      </section>
      <section className="overflow-x-auto rounded-2xl border-2 border-line bg-paper">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-cream-deep/60 text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-3">Trilha</th>
              <th className="p-3">Status</th>
              <th className="p-3">Unidades</th>
              <th className="p-3">Lições: rascunho / revisado / publicado</th>
              <th className="p-3">Prévia</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.id} className="border-t-2 border-line">
                <td className="p-3">
                  <Link href={`/admin/trilhas/${t.id}`} className="font-extrabold text-blue-dark underline underline-offset-4">
                    {t.title}
                  </Link>
                  {t.characters && <span className="ml-2 text-xs font-bold text-ink-soft">personagem: {t.characters.name}</span>}
                </td>
                <td className="p-3">
                  <StatusBadge status={t.status} />
                  {t.pending ? <Chip color="orange" className="ml-1">alterações pendentes</Chip> : null}
                </td>
                <td className="p-3 font-bold">{t.units}</td>
                <td className="p-3 font-bold">
                  {t.counts.draft} / {t.counts.reviewed} / {t.counts.published} <span className="text-ink-faint">de {t.lessons}</span>
                </td>
                <td className="p-3">
                  <Link href={`/admin/previa/${t.slug}`} className="font-bold text-green-dark underline underline-offset-4">
                    Percorrer
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
