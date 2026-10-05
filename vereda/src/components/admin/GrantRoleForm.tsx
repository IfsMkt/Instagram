"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { grantRole } from "@/app/actions/admin";
import { Button, Notice } from "../ui";

export function GrantRoleForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "admin">("editor");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await grantRole(email, role);
    setPending(false);
    setResult(res.ok ? { tone: "success", text: res.message ?? "Feito." } : { tone: "error", text: res.error });
    if (res.ok) {
      setEmail("");
      router.refresh();
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-sm font-extrabold">
        E-mail
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-11 rounded-xl border-2 border-line bg-paper px-3 font-semibold" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-extrabold">
        Papel
        <select value={role} onChange={(e) => setRole(e.target.value as "editor" | "admin")} className="min-h-11 rounded-xl border-2 border-line bg-paper px-3 font-semibold">
          <option value="editor">Editor</option>
          <option value="admin">Administrador</option>
        </select>
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Aguarde…" : "Conceder"}
      </Button>
      {result && <Notice tone={result.tone}>{result.text}</Notice>}
    </form>
  );
}
