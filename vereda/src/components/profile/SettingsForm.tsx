"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { signOutAction } from "@/app/actions/auth";
import { deleteAccount, updateSettings } from "@/app/actions/profile";
import type { Profile } from "@/lib/types";
import { Icon } from "../art/Icon";
import { Button, cx, LinkButton, Notice, Panel, SectionTitle } from "../ui";
import { Avatar, AVATARS } from "./Avatar";

const AVATAR_LABEL: Record<string, string> = {
  ovelha: "Mel, a ovelhinha",
  joao: "João",
  pedro: "Pedro",
  paulo: "Paulo",
  moises: "Moisés",
  elias: "Elias",
  isaias: "Isaías",
  daniel: "Daniel",
};

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-line bg-paper p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-blue">
      <span className="flex-1">
        <span className="block font-extrabold">{label}</span>
        <span className="text-sm font-semibold text-ink-soft">{description}</span>
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden className={cx("relative h-8 w-14 shrink-0 rounded-full transition-colors", checked ? "bg-green" : "bg-cream-deep")}>
        <span className={cx("absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left]", checked ? "left-7" : "left-1")} />
      </span>
      <span className="w-8 text-xs font-extrabold text-ink-soft">{checked ? "Sim" : "Não"}</span>
    </label>
  );
}

export function SettingsForm({ profile, zones }: { profile: Profile; zones: string[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    display_name: profile.display_name,
    daily_goal_minutes: profile.daily_goal_minutes as 5 | 10 | 15,
    timezone: profile.timezone,
    tradition: profile.tradition as "geral" | "catolica" | "protestante" | "prefiro-nao-dizer" | null,
    sound_enabled: profile.sound_enabled,
    reduced_motion: profile.reduced_motion,
    avatar: profile.avatar,
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [deleteState, deleteAction, deleting] = useActionState(deleteAccount, {});
  const [showDelete, setShowDelete] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setResult(null);
    const res = await updateSettings(form);
    setSaving(false);
    setResult(res.ok ? { tone: "success", text: res.message ?? "Salvo." } : { tone: "error", text: res.error });
    if (res.ok) {
      document.documentElement.dataset.reducedMotion = form.reduced_motion ? "true" : "false";
      router.refresh();
    }
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5">
      <div className="flex items-center gap-2">
        <LinkButton href="/perfil" variant="ghost" size="sm" icon="arrow-left" aria-label="Voltar ao perfil" />
        <h1 className="text-2xl font-extrabold">Configurações</h1>
      </div>

      <form onSubmit={save} className="flex flex-col gap-5">
        <Panel>
          <SectionTitle icon="profile" className="mb-3">
            Perfil
          </SectionTitle>
          <label className="flex flex-col gap-1 text-sm font-extrabold">
            Nome
            <input
              value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              maxLength={60}
              required
              className="min-h-12 rounded-2xl border-2 border-line bg-paper px-3 text-base font-semibold focus:border-green focus:outline-none"
            />
          </label>
          <fieldset className="mt-4">
            <legend className="text-sm font-extrabold">Avatar</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {AVATARS.map((a) => (
                <label
                  key={a}
                  className={cx(
                    "flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 p-2 text-[11px] font-extrabold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-blue",
                    form.avatar === a ? "border-green bg-green-soft" : "border-line bg-paper",
                  )}
                >
                  <input type="radio" name="avatar" className="sr-only" checked={form.avatar === a} onChange={() => set("avatar", a)} />
                  <Avatar avatar={a} size={52} />
                  {AVATAR_LABEL[a]}
                </label>
              ))}
            </div>
          </fieldset>
        </Panel>

        <Panel>
          <SectionTitle icon="target" className="mb-3">
            Meta e rotina
          </SectionTitle>
          <fieldset>
            <legend className="text-sm font-extrabold">Meta diária</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([5, 10, 15] as const).map((m) => (
                <label
                  key={m}
                  className={cx(
                    "flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border-2 font-extrabold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-blue",
                    form.daily_goal_minutes === m ? "border-green bg-green-soft text-green-dark" : "border-line bg-paper",
                  )}
                >
                  <input type="radio" name="goal" className="sr-only" checked={form.daily_goal_minutes === m} onChange={() => set("daily_goal_minutes", m)} />
                  {m} min
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mt-4 flex flex-col gap-1 text-sm font-extrabold">
            Fuso horário (usado para contar seus dias de estudo)
            <select
              value={form.timezone}
              onChange={(e) => set("timezone", e.target.value)}
              className="min-h-12 rounded-2xl border-2 border-line bg-paper px-3 text-base font-semibold focus:border-green focus:outline-none"
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 rounded-2xl bg-cream-deep/60 p-4 text-sm font-semibold text-ink-soft">
            <p className="flex items-center gap-2 font-extrabold text-ink">
              <Icon name="info" size={18} /> Lembretes
            </p>
            Lembretes por notificação ou e-mail ainda não estão disponíveis nesta versão.
          </div>
        </Panel>

        <Panel>
          <SectionTitle icon="settings" className="mb-3">
            Preferências
          </SectionTitle>
          <label className="flex flex-col gap-1 text-sm font-extrabold">
            Tradição (opcional)
            <select
              value={form.tradition ?? ""}
              onChange={(e) => set("tradition", (e.target.value || null) as typeof form.tradition)}
              className="min-h-12 rounded-2xl border-2 border-line bg-paper px-3 text-base font-semibold focus:border-green focus:outline-none"
            >
              <option value="">Não informar</option>
              <option value="geral">Cristão, de forma geral</option>
              <option value="catolica">Católica</option>
              <option value="protestante">Protestante / evangélica</option>
              <option value="prefiro-nao-dizer">Prefiro não dizer</option>
            </select>
            <span className="text-xs font-semibold text-ink-soft">O conteúdo atual é cristão geral; diferenças entre tradições são indicadas nas lições.</span>
          </label>
          <div className="mt-4 flex flex-col gap-3">
            <Toggle label="Sons" description="Toques curtos ao acertar, errar e concluir." checked={form.sound_enabled} onChange={(v) => set("sound_enabled", v)} />
            <Toggle label="Animações reduzidas" description="Diminui movimentos e efeitos na tela." checked={form.reduced_motion} onChange={(v) => set("reduced_motion", v)} />
          </div>
        </Panel>

        {result && <Notice tone={result.tone}>{result.text}</Notice>}
        <Button type="submit" size="lg" block disabled={saving}>
          {saving ? "Salvando…" : "Salvar alterações"}
        </Button>
      </form>

      <form action={signOutAction}>
        <Button type="submit" variant="secondary" block icon="logout">
          Sair da conta
        </Button>
      </form>

      <Panel className="border-coral/40">
        <SectionTitle icon="trash" className="mb-2 text-coral-dark">
          Excluir conta
        </SectionTitle>
        <p className="text-sm font-semibold text-ink-soft">
          Remove sua conta e todos os seus dados privados: progresso, revisões, conquistas, anotações e favoritos. Não dá para desfazer.
        </p>
        {!showDelete ? (
          <Button variant="secondary" className="mt-3" onClick={() => setShowDelete(true)}>
            Quero excluir minha conta
          </Button>
        ) : (
          <form action={deleteAction} className="mt-3 flex flex-col gap-3">
            {deleteState.error && <Notice tone="error">{deleteState.error}</Notice>}
            <label className="flex flex-col gap-1 text-sm font-extrabold">
              Para confirmar, digite EXCLUIR
              <input name="confirmacao" autoComplete="off" className="min-h-12 rounded-2xl border-2 border-coral/50 bg-paper px-3 font-semibold focus:border-coral focus:outline-none" />
            </label>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" block onClick={() => setShowDelete(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="danger" block disabled={deleting}>
                {deleting ? "Excluindo…" : "Excluir definitivamente"}
              </Button>
            </div>
          </form>
        )}
      </Panel>
    </div>
  );
}
