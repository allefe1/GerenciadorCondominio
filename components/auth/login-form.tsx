"use client";

import { useActionState, useState } from "react";

import { loginAction } from "@/app/actions/auth";

const initialState = {
  success: false,
  message: "",
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <label className="sr-only" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
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
            autoComplete="current-password"
            required
            placeholder="Senha"
            className="w-full rounded-[12px] border border-outline-variant/40 bg-surface-container-lowest px-5 py-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-on-surface-variant">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
            />
            Lembrar-me
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="font-semibold text-primary hover:underline"
            >
              Primeiro acesso?
            </button>
            <a className="font-semibold text-primary hover:underline" href="/recuperar-senha">
              Esqueceu sua senha?
            </a>
          </div>
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

      {isHelpOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="primeiro-acesso-title"
        >
          <div className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-ambient">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Primeiro acesso
                </p>
                <h2 id="primeiro-acesso-title" className="mt-2 text-2xl font-black text-on-surface">
                  Como descobrir sua senha inicial
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="rounded-full border border-outline-variant/40 px-3 py-1 text-sm font-bold text-on-surface-variant transition hover:border-primary hover:text-primary"
                aria-label="Fechar ajuda de primeiro acesso"
              >
                X
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-6 text-on-surface-variant">
              <p>
                No primeiro acesso, use seu e-mail cadastrado e monte a senha temporaria com seus
                dados de cadastro.
              </p>
              <div className="rounded-[14px] bg-surface-container-low p-4 font-semibold text-on-surface">
                ultimos 4 digitos do telefone + primeiro nome + @AP + andar
              </div>
              <p>
                Exemplo: se seu telefone for <strong>(85) 99912-3456</strong>, seu nome for{" "}
                <strong>Matheus Silva</strong> e seu apartamento for <strong>304</strong>, sua senha
                inicial sera <strong>3456Matheus@AP3</strong>.
              </p>
              <p>
                Depois de entrar, o sistema vai pedir uma nova senha. Essa nova senha deve ter no
                minimo 8 caracteres, 1 letra maiuscula, 1 numero e 1 caractere especial.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="mt-6 w-full rounded-[12px] bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Entendi
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
