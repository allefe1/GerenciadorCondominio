"use client";

import { useActionState } from "react";
import { updateFirstAccessPasswordAction } from "@/app/actions/primeiro-acesso";

const initialState = {
  success: false,
  message: "",
};

export function PrimeiroAcessoForm() {
  const [state, formAction, isPending] = useActionState(updateFirstAccessPasswordAction, initialState);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-on-surface" htmlFor="newPassword">
          Nova senha
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder="Digite sua nova senha"
          className="w-full rounded-[14px] border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-on-surface" htmlFor="confirmPassword">
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Repita a nova senha"
          className="w-full rounded-[14px] border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <p className="text-xs text-on-surface-variant">
        Sua senha deve ter ao menos 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial.
      </p>

      {state?.message && (
        <div className="rounded-[14px] bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-[14px] bg-[#623CEA] px-4 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#5028D5] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Salvando..." : "Salvar e Entrar"}
      </button>
    </form>
  );
}