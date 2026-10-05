"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../art/Icon";
import { Sheep } from "../art/Sheep";
import { cx } from "../ui";

const ITEMS: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: "/inicio", label: "Início", icon: "home", match: ["/inicio"] },
  { href: "/jornada", label: "Jornada", icon: "map", match: ["/jornada", "/jornadas"] },
  { href: "/revisao", label: "Revisão", icon: "review", match: ["/revisao"] },
  { href: "/caderno", label: "Caderno", icon: "notebook", match: ["/caderno"] },
  { href: "/perfil", label: "Perfil", icon: "profile", match: ["/perfil"] },
];

export function AppNav({ dueCount, editor }: { dueCount: number; editor: boolean }) {
  const path = usePathname();
  const isActive = (match: string[]) => match.some((m) => path === m || path.startsWith(`${m}/`));
  return (
    <>
      {/* Celular: barra inferior */}
      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-lg justify-between px-1">
          {ITEMS.map((item) => {
            const active = isActive(item.match);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-extrabold",
                    active ? "text-green-dark" : "text-ink-faint",
                  )}
                >
                  <span className={cx("flex h-9 w-12 items-center justify-center rounded-2xl transition-colors", active && "bg-green-soft")}>
                    <Icon name={item.icon} size={24} />
                  </span>
                  {item.label}
                  {item.href === "/revisao" && dueCount > 0 && (
                    <span className="absolute right-3 top-1.5 min-w-5 rounded-full bg-coral px-1.5 text-[10px] leading-5 text-white" aria-label={`${dueCount} para revisar`}>
                      {dueCount > 99 ? "99+" : dueCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: barra lateral */}
      <nav aria-label="Navegação principal" className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-2 border-r-2 border-line bg-paper/70 px-4 py-6 md:flex">
        <Link href="/inicio" className="mb-4 flex items-center gap-2 px-2">
          <Sheep size={44} label="" />
          <span className="font-display text-2xl font-extrabold text-green-dark">Vereda</span>
        </Link>
        {ITEMS.map((item) => {
          const active = isActive(item.match);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex min-h-12 items-center gap-3 rounded-2xl border-2 px-3 font-extrabold",
                active ? "border-green/40 bg-green-soft text-green-dark" : "border-transparent text-ink-soft hover:bg-cream-deep",
              )}
            >
              <Icon name={item.icon} size={24} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/revisao" && dueCount > 0 && (
                <span className="rounded-full bg-coral px-2 text-xs leading-6 text-white" aria-label={`${dueCount} para revisar`}>
                  {dueCount}
                </span>
              )}
            </Link>
          );
        })}
        {editor && (
          <Link href="/admin" className="mt-auto flex min-h-12 items-center gap-3 rounded-2xl px-3 font-extrabold text-lilac-dark hover:bg-lilac-soft">
            <Icon name="shield" size={22} /> Área editorial
          </Link>
        )}
      </nav>
    </>
  );
}
