"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  resendConfirmationAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
  type FormState,
} from "@/app/actions/auth";
import { Notice } from "../ui";
import { Field, PasswordField, SubmitButton } from "./fields";

const initial: FormState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="Nome" name="name" autoComplete="given-name" required maxLength={60} defaultValue={state.fields?.name} placeholder="Como podemos te chamar?" />
      <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.fields?.email} placeholder="voce@exemplo.com" />
      <PasswordField label="Senha" name="password" autoComplete="new-password" required minLength={8} hint="Pelo menos 8 caracteres." />
      <PasswordField label="Confirmar senha" name="confirm" autoComplete="new-password" required minLength={8} />
      <SubmitButton pending={pending} pendingText="Criando sua conta…">
        Criar minha conta
      </SubmitButton>
      <p className="text-center text-sm font-bold text-ink-soft">
        <Link href="/entrar" className="text-green-dark underline decoration-2 underline-offset-4">
          Já tenho uma conta
        </Link>
      </p>
    </form>
  );
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="next" value={next ?? "/inicio"} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.fields?.email} />
      <PasswordField label="Senha" name="password" autoComplete="current-password" required />
      <div className="-mt-1 text-right">
        <Link href="/recuperar-senha" className="text-sm font-bold text-green-dark underline decoration-2 underline-offset-4">
          Esqueci minha senha
        </Link>
      </div>
      <SubmitButton pending={pending} pendingText="Entrando…">
        Entrar
      </SubmitButton>
      <p className="text-center text-sm font-bold text-ink-soft">
        Ainda não tem conta?{" "}
        <Link href="/" className="text-green-dark underline decoration-2 underline-offset-4">
          Criar conta
        </Link>
      </p>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}
      <Field label="E-mail da conta" name="email" type="email" autoComplete="email" inputMode="email" required />
      <SubmitButton pending={pending} pendingText="Enviando…">
        Enviar link de recuperação
      </SubmitButton>
      <p className="text-center text-sm font-bold">
        <Link href="/entrar" className="text-green-dark underline decoration-2 underline-offset-4">
          Voltar para entrar
        </Link>
      </p>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <PasswordField label="Nova senha" name="password" autoComplete="new-password" required minLength={8} hint="Pelo menos 8 caracteres." />
      <PasswordField label="Confirmar nova senha" name="confirm" autoComplete="new-password" required minLength={8} />
      <SubmitButton pending={pending} pendingText="Salvando…">
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}

export function ResendForm({ email }: { email?: string }) {
  const [state, action, pending] = useActionState(resendConfirmationAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}
      <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={email} required />
      <button
        type="submit"
        disabled={pending}
        className="btn-3d min-h-12 rounded-2xl border-2 border-line bg-paper px-5 font-extrabold text-ink [--btn-shadow:var(--color-line)]"
      >
        {pending ? "Enviando…" : "Reenviar link de confirmação"}
      </button>
    </form>
  );
}
