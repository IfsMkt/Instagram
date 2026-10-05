import Link from "next/link";
import { Icon } from "@/components/art/Icon";
import { requireEditor } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { roles } = await requireEditor();
  const links = [
    { href: "/admin", label: "Conteúdo", icon: "book" as const },
    { href: "/admin/personagens", label: "Personagens", icon: "profile" as const },
    { href: "/admin/previa", label: "Prévia", icon: "eye" as const },
    ...(roles.includes("admin") ? [{ href: "/admin/equipe", label: "Equipe", icon: "shield" as const }] : []),
  ];
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b-2 border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <Link href="/admin" className="mr-2 font-display text-xl font-extrabold text-lilac-dark">
            Vereda · Editorial
          </Link>
          <nav aria-label="Área editorial" className="flex flex-wrap gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-extrabold text-ink-soft hover:bg-lilac-soft">
                <Icon name={l.icon} size={18} /> {l.label}
              </Link>
            ))}
          </nav>
          <Link href="/inicio" className="ml-auto flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-extrabold text-green-dark hover:bg-green-soft">
            <Icon name="arrow-left" size={18} /> Voltar ao app
          </Link>
        </div>
      </header>
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
