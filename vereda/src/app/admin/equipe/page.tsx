import type { Metadata } from "next";
import { revokeRole } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/AdminControls";
import { GrantRoleForm } from "@/components/admin/GrantRoleForm";
import { Notice, Panel } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Equipe editorial" };

export default async function TeamPage() {
  const { user } = await requireAdmin();
  const db = await createClient();
  const { data, error } = await db.rpc("admin_list_team");
  const team = (data ?? []) as { user_id: string; email: string; display_name: string; roles: string[] }[];
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-extrabold">Equipe editorial</h1>
        <p className="font-semibold text-ink-soft">Somente administradores concedem papéis. Ninguém consegue se promover pela aplicação; o banco também verifica.</p>
      </div>
      {error && <Notice tone="error">Não foi possível carregar a equipe.</Notice>}
      <Panel>
        <h2 className="mb-3 text-lg font-extrabold">Conceder papel</h2>
        <GrantRoleForm />
        <p className="mt-2 text-xs font-semibold text-ink-soft">A pessoa precisa já ter criado uma conta no Vereda.</p>
      </Panel>
      <Panel>
        <h2 className="mb-3 text-lg font-extrabold">Pessoas com acesso</h2>
        <ul className="flex flex-col gap-2">
          {team.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-line p-3">
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold">{m.display_name || m.email}</span>
                <span className="text-sm font-semibold text-ink-soft">{m.email}</span>
              </span>
              {m.roles.map((r) => (
                <span key={r} className="flex items-center gap-2">
                  <span className="rounded-full bg-lilac-soft px-3 py-1 text-xs font-extrabold text-lilac-dark">{r === "admin" ? "Administrador" : "Editor"}</span>
                  {!(m.user_id === user.id && r === "admin") && (
                    <ActionButton label="Remover" variant="ghost" confirmText={`Remover o papel ${r} de ${m.email}?`} action={revokeRole.bind(null, m.user_id, r as "admin" | "editor")} />
                  )}
                </span>
              ))}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
