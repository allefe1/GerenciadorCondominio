"use client";

import { useActionState } from "react";

import { changeMyPasswordAction } from "@/app/actions/users";

const initialState = {
  success: false,
  message: "",
};

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changeMyPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface" htmlFor="currentPassword">
            Senha atual
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            className="w-full rounded-[14px] border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface" htmlFor="newPassword">
            Nova senha
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            className="w-full rounded-[14px] border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface" htmlFor="confirmPassword">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="w-full rounded-[14px] border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </div>

      <p className="text-sm text-on-surface-variant">
        A senha deve ter ao menos 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial.
      </p>

      {state.message ? (
        <div
          className={`rounded-[14px] px-4 py-3 text-sm font-medium ${
            state.success
              ? "bg-emerald-100 text-emerald-800"
              : "bg-error-container text-on-error-container"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-[14px] bg-[#1A1A2E] px-5 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Alterando..." : "Alterar senha"}
      </button>
    </form>
  );
}
