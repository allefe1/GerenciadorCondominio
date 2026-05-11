"use client";

import { useActionState } from "react";
import type { TipoUsuario } from "@prisma/client";

import { loginAction } from "@/app/actions/auth";

type LoginFormProps = {
  portal: TipoUsuario;
};

const initialState = {
  success: false,
  message: "",
};

export function LoginForm({ portal }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="portal" value={portal} />
      <div className="space-y-2">
        <label className="sr-only" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="E-mail"
          className="w-full rounded-[12px] border border-outline-variant/40 bg-surface-container-lowest px-5 py-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="space-y-2">
        <label className="sr-only" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Senha"
          className="w-full rounded-[12px] border border-outline-variant/40 bg-surface-container-lowest px-5 py-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-on-surface-variant">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
          />
          Lembrar-me
        </label>
        <a className="font-semibold text-primary hover:underline" href="/recuperar-senha">
          Esqueceu sua senha?
        </a>
      </div>

      {state.message ? (
        <div className="rounded-[12px] bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-[12px] bg-cta-gradient px-5 py-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
