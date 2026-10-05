import type { Metadata } from "next";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { Sheep } from "@/components/art/Sheep";
import { LinkButton } from "@/components/ui";
import { getProfile, isEditor, requireUser } from "@/lib/auth";
import { loadLessonVersion, resolvePlayableVersion, type ContentMode } from "@/lib/data/content";
import { getTrackView, scopeFor } from "@/lib/data/progress";
import { adminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Lição" };

function Unavailable({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Sheep mood="think" size={130} />
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="font-semibold text-ink-soft">{text}</p>
      <LinkButton href={href}>{cta}</LinkButton>
    </main>
  );
}

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ trilha?: string; previa?: string }>;
}) {
  const { lessonId } = await params;
  const { trilha, previa } = await searchParams;
  const user = await requireUser(`/licao/${lessonId}`);
  const profile = await getProfile(user.id);
  if (!profile) redirect("/entrar");

  const wantsPreview = previa === "1";
  const mode: ContentMode = wantsPreview && (await isEditor(user.id)) ? "preview" : "public";
  if (mode === "public" && !profile.onboarding_completed_at) redirect("/boas-vindas");

  const trackSlug = trilha && /^[a-z0-9-]+$/.test(trilha) ? trilha : null;
  const back = mode === "preview" ? `/admin/previa/${trackSlug ?? ""}` : trackSlug ? `/jornada?trilha=${trackSlug}` : "/jornada";
  if (!trackSlug || !/^[0-9a-f-]{36}$/i.test(lessonId)) {
    return <Unavailable title="Lição não encontrada" text="Não encontramos essa lição. Volte ao mapa para escolher a próxima etapa." href="/jornada" cta="Ir para o mapa" />;
  }

  const view = await getTrackView(user.id, trackSlug, mode);
  const item = view?.state.items.find((i) => i.lessonId === lessonId);
  if (!view || !item) {
    return <Unavailable title="Lição indisponível" text="Esta lição não está publicada nesta jornada no momento." href={back} cta="Voltar ao mapa" />;
  }
  if (item.status === "locked") {
    return <Unavailable title="Etapa bloqueada" text="Conclua a etapa anterior para liberar esta. Cada passo prepara o próximo!" href={back} cta="Voltar ao mapa" />;
  }

  // Se já existe uma tentativa aberta, continua na versão em que ela começou.
  const { data: open } = await adminClient()
    .from("lesson_attempts")
    .select("lesson_version_id")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .eq("scope", scopeFor(mode))
    .eq("status", "in_progress")
    .maybeSingle();
  const versionId = (open?.lesson_version_id as string | undefined) ?? (await resolvePlayableVersion(lessonId, mode));
  const lesson = versionId ? await loadLessonVersion(versionId) : null;
  if (!lesson) {
    return <Unavailable title="Lição indisponível" text="Esta lição ainda não foi publicada." href={back} cta="Voltar ao mapa" />;
  }

  const { data: favs } = await adminClient().from("favorites").select("reference").eq("user_id", user.id);

  return (
    <LessonPlayer
      key={lesson.versionId}
      lesson={lesson}
      trackSlug={view.structure.track.slug}
      trackTitle={view.structure.track.title}
      characterSlug={view.structure.track.character?.slug ?? null}
      color={view.structure.track.color}
      preview={mode === "preview"}
      soundEnabled={profile.sound_enabled}
      favorites={((favs ?? []) as { reference: string }[]).map((f) => f.reference)}
      exitHref={back}
    />
  );
}
