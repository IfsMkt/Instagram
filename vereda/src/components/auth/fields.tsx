"use client";

import { useId, useState, type ComponentProps } from "react";
import { Icon } from "../art/Icon";
import { cx } from "../ui";

type FieldProps = ComponentProps<"input"> & { label: string; hint?: string };

const inputClass =
  "w-full min-h-13 rounded-2xl border-2 border-line bg-paper px-4 py-3 text-base font-semibold text-ink placeholder:text-ink-faint focus:border-green focus:outline-none focus-visible:outline-none focus:ring-4 focus:ring-green/20";

export function Field({ label, hint, id, className, ...rest }: FieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = hint ? `${inputId}-dica` : undefined;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-extrabold text-ink">
        {label}
      </label>
      <input id={inputId} aria-describedby={hintId} className={inputClass} {...rest} />
      {hint && (
        <p id={hintId} className="text-xs font-semibold text-ink-soft">
          {hint}
        </p>
      )}
    </div>
  );
}

export function PasswordField({ label, hint, id, className, ...rest }: FieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = hint ? `${inputId}-dica` : undefined;
  const [visible, setVisible] = useState(false);
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-extrabold text-ink">
        {label}
      </label>
      <div className="relative">
        <input id={inputId} type={visible ? "text" : "password"} aria-describedby={hintId} className={cx(inputClass, "pr-14")} {...rest} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-controls={inputId}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-ink-soft hover:bg-cream-deep"
        >
          <Icon name={visible ? "eye-off" : "eye"} size={22} />
        </button>
      </div>
      {hint && (
        <p id={hintId} className="text-xs font-semibold text-ink-soft">
          {hint}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ pending, children, pendingText = "Aguarde…" }: { pending: boolean; children: React.ReactNode; pendingText?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-3d inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green px-6 text-lg font-extrabold text-white [--btn-shadow:var(--color-green-dark)] disabled:opacity-70"
    >
      {pending ? pendingText : children}
    </button>
  );
}
