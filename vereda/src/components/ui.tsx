import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./art/Icon";
import { colorClasses } from "./art/palette";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "color";
type Size = "md" | "lg" | "sm";

function buttonClasses(variant: Variant, size: Size, color?: string, block?: boolean) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold tracking-wide select-none text-center disabled:opacity-60";
  const sizes: Record<Size, string> = {
    sm: "min-h-10 px-4 text-sm",
    md: "min-h-12 px-5 text-base",
    lg: "min-h-14 px-6 text-lg",
  };
  const c = colorClasses(color);
  const variants: Record<Variant, string> = {
    primary: "btn-3d bg-green text-white [--btn-shadow:var(--color-green-dark)]",
    secondary: "btn-3d bg-paper text-ink border-2 border-line [--btn-shadow:var(--color-line)]",
    ghost: "text-green-dark hover:bg-green-soft",
    danger: "btn-3d bg-coral text-white [--btn-shadow:var(--color-coral-dark)]",
    color: `btn-3d ${c.bg} text-white ${c.shadow}`,
  };
  return cx(base, sizes[size], variants[variant], block && "w-full");
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  color?: string;
  block?: boolean;
  icon?: IconName;
  iconRight?: IconName;
};

export function Button({ variant = "primary", size = "md", color, block, icon, iconRight, className, children, ...rest }: ButtonProps) {
  return (
    <button className={cx(buttonClasses(variant, size, color, block), className)} {...rest}>
      {icon && <Icon name={icon} size={20} />}
      {children}
      {iconRight && <Icon name={iconRight} size={20} />}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  color?: string;
  block?: boolean;
  icon?: IconName;
  iconRight?: IconName;
};

export function LinkButton({ variant = "primary", size = "md", color, block, icon, iconRight, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={cx(buttonClasses(variant, size, color, block), className)} {...rest}>
      {icon && <Icon name={icon} size={20} />}
      {children}
      {iconRight && <Icon name={iconRight} size={20} />}
    </Link>
  );
}

export function ProgressBar({ value, color = "green", label, className }: { value: number; color?: string; label: string; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const c = colorClasses(color);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cx("h-4 w-full overflow-hidden rounded-full bg-cream-deep", className)}
    >
      <div className={cx("relative h-full rounded-full transition-[width] duration-500", c.bg)} style={{ width: `${pct}%` }}>
        <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/40" />
      </div>
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "success" | "error" | "warning";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "bg-blue-soft text-blue-dark border-blue/30",
    success: "bg-green-soft text-green-ink border-green/30",
    error: "bg-coral-soft text-coral-dark border-coral/30",
    warning: "bg-yellow-soft text-ink border-yellow/50",
  }[tone];
  const icon: IconName = tone === "success" ? "check-circle" : tone === "error" ? "x-circle" : "info";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("flex items-start gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold", styles, className)}>
      <Icon name={icon} size={20} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Balão de fala (usado pela Mel e pelos personagens). */
export function Bubble({ children, className, tail = "left" }: { children: ReactNode; className?: string; tail?: "left" | "bottom" | "top" }) {
  return (
    <div className={cx("relative rounded-3xl border-2 border-line bg-paper px-5 py-4 text-base font-semibold text-ink shadow-[0_3px_0_0_var(--color-line)]", className)}>
      {children}
      {tail === "top" ? (
        <span aria-hidden className="absolute -top-2.5 left-10 h-5 w-5 rotate-45 border-l-2 border-t-2 border-line bg-paper" />
      ) : tail === "left" ? (
        <span aria-hidden className="absolute -left-2.5 top-6 h-5 w-5 rotate-45 border-b-2 border-l-2 border-line bg-paper" />
      ) : (
        <span aria-hidden className="absolute -bottom-2.5 left-10 h-5 w-5 rotate-45 border-b-2 border-r-2 border-line bg-paper" />
      )}
    </div>
  );
}

export function Panel({ children, className, color }: { children: ReactNode; className?: string; color?: string }) {
  const c = color ? colorClasses(color) : null;
  return (
    <section className={cx("rounded-[var(--radius-blob)] border-2 p-5", c ? cx(c.soft, "border-transparent") : "border-line bg-paper", className)}>
      {children}
    </section>
  );
}

export function SectionTitle({ children, icon, className }: { children: ReactNode; icon?: IconName; className?: string }) {
  return (
    <h2 className={cx("flex items-center gap-2 text-xl font-extrabold text-ink", className)}>
      {icon && <Icon name={icon} size={22} className="text-green" />}
      {children}
    </h2>
  );
}

export function Chip({ children, color = "green", className }: { children: ReactNode; color?: string; className?: string }) {
  const c = colorClasses(color);
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold", c.soft, c.text, className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: "Rascunho", color: "yellow" },
    reviewed: { label: "Revisado", color: "blue" },
    published: { label: "Publicado", color: "green" },
    archived: { label: "Arquivado", color: "lilac" },
  };
  const s = map[status] ?? { label: status, color: "lilac" };
  return <Chip color={s.color}>{s.label}</Chip>;
}
