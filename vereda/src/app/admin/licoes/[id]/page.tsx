import Link from "next/link";
import { notFound } from "next/navigation";
import { createWorkingVersion, unpublishLesson, versionStatusAction } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/AdminControls";
import { ExerciseEditor, LessonEditor } from "@/components/admin/LessonEditor";
import { Chip, Notice, Panel, StatusBadge } from "@/components/ui";
import { getLessonAdmin } from "@/lib/data/admin";

const ACTION_LABEL: Record<string, string> = {
  created_version: "criou versão de trabalho",
  edited: "editou",
  reviewed: "revisou",
  published: "publicou",
  unpublished: "retirou do ar",
  reset_to_draft: "voltou para rascunho",
};
const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function LessonAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getLessonAdmin(id);
  if (!data) notFound();
  const { lesson, versions, working, published, shown, exercises, placements, log, names } = data;
  const name = (uid: string | null) => (uid ? (names.get(uid) ?? uid.slice(0, 8)) : "—");
  const editable = !!working;
  const previewTrack = placements[0]?.tracks.slug;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {placements.map((p) => (
          <Link key={p.id} href={`/admin/unidades/${p.id}`} className="text-sm font-bold text-ink-soft underline">
            {p.tracks.title} › {p.title}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{shown?.title ?? lesson.slug}</h1>
        {lesson.kind === "unit_review" && <Chip color="lilac">revisão da unidade</Chip>}
        {working && <StatusBadge status={working.status} />}
        {published && <StatusBadge status="published" />}
        {shown?.ai_generated && <Chip color="orange">gerado com apoio de IA</Chip>}
        {previewTrack && (
          <Link href={`/licao/${lesson.id}?trilha=${previewTrack}&previa=1`} className="ml-auto font-extrabold text-green-dark underline">
            Testar na prévia
          </Link>
        )}
      </div>

      <Panel color="lilac">
        <h2 className="mb-2 text-lg font-extrabold">Fluxo editorial</h2>
        {working ? (
          <p className="mb-3 text-sm font-semibold">
            Editando a <strong>versão {working.version}</strong> ({working.status === "draft" ? "rascunho" : "revisada"}).
            {published ? ` A versão ${published.version} continua publicada até você publicar esta.` : " Ainda não há versão publicada."}
          </p>
        ) : (
          <p className="mb-3 text-sm font-semibold">Não há versão de trabalho. Para alterar a lição publicada, crie uma — a versão pública continua no ar.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {!working && <ActionButton label="Criar versão de trabalho" variant="primary" action={createWorkingVersion.bind(null, lesson.id)} />}
          {working?.status === "draft" && (
            <ActionButton
              label="Marcar como revisada"
              confirmText="Você leu esta versão por completo na prévia e conferiu referências, fatos e tom?"
              action={versionStatusAction.bind(null, working.id, "review")}
            />
          )}
          {working?.status === "reviewed" && (
            <>
              <ActionButton label="Publicar esta versão" variant="primary" action={versionStatusAction.bind(null, working.id, "publish")} />
              <ActionButton label="Voltar para rascunho" action={versionStatusAction.bind(null, working.id, "reset")} />
            </>
          )}
          {published && <ActionButton label="Retirar do ar" variant="danger" confirmText="Retirar esta lição do ar? O progresso das pessoas é preservado." action={unpublishLesson.bind(null, lesson.id)} />}
        </div>
      </Panel>

      {!editable && <Notice tone="info">Visualizando a versão publicada (somente leitura).</Notice>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <h2 className="mb-3 text-lg font-extrabold">Conteúdo</h2>
          {shown && (
            <LessonEditor
              key={`${shown.id}-${shown.updated_at}`}
              versionId={shown.id}
              title={shown.title}
              objective={shown.objective}
              content={shown.content as never}
              editable={editable}
            />
          )}
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel>
            <h2 className="mb-3 text-lg font-extrabold">Exercícios ({exercises.length})</h2>
            <p className="mb-3 text-xs font-semibold text-ink-soft">
              Lições: 4 a 6 exercícios. Revisões de unidade: 8 a 10. Temas com interpretações divergentes não devem ter resposta única.
            </p>
            <div className="flex flex-col gap-2">
              {exercises.map((ex) => (
                <ExerciseEditor key={`${ex.id}-${shown?.updated_at}`} versionId={shown!.id} exercise={ex} editable={editable} />
              ))}
              {shown && <ExerciseEditor versionId={shown.id} exercise={null} editable={editable} />}
            </div>
          </Panel>
          <Panel>
            <h2 className="mb-3 text-lg font-extrabold">Versões</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {versions.map((v) => (
                <li key={v.id} className="rounded-xl border-2 border-line p-3">
                  <p className="flex flex-wrap items-center gap-2 font-extrabold">
                    Versão {v.version} <StatusBadge status={v.status} />
                    {v.ai_generated && <Chip color="orange">IA</Chip>}
                  </p>
                  <p className="text-xs font-semibold text-ink-soft">
                    Criada {fmt.format(new Date(v.created_at))} por {v.created_by ? name(v.created_by) : "seed (conteúdo gerado com apoio de IA)"}
                    {v.reviewed_at && ` · revisada por ${name(v.reviewed_by)} em ${fmt.format(new Date(v.reviewed_at))}`}
                    {v.published_at && ` · publicada por ${name(v.published_by)} em ${fmt.format(new Date(v.published_at))}`}
                    {v.archived_at && ` · arquivada em ${fmt.format(new Date(v.archived_at))}`}
                  </p>
                </li>
              ))}
            </ul>
            {log.length > 0 && (
              <>
                <h3 className="mb-2 mt-4 font-extrabold">Histórico</h3>
                <ul className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
                  {log.map((l, i) => (
                    <li key={i}>
                      {fmt.format(new Date(l.created_at))} — {name(l.actor_id)} {ACTION_LABEL[l.action] ?? l.action} (v{versions.find((v) => v.id === l.entity_id)?.version})
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
