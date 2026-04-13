"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "@/app/actions/auth";
import { getPasswordPolicyMessage } from "@/lib/auth/password";

type ResetPasswordFormProps = {
  token: string;
};

const initialState = {
  success: false,
  message: "",
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const resetAction = resetPasswordAction.bind(null, token);
  const [state, formAction, isPending] = useActionState(resetAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface" htmlFor="password">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="w-full rounded-[12px] border border-outline-variant/40 bg-surface-container-lowest px-5 py-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface" htmlFor="confirmPassword">
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          className="w-full rounded-[12px] border border-outline-variant/40 bg-surface-container-lowest px-5 py-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <p className="text-xs leading-5 text-on-surface-variant">{getPasswordPolicyMessage()}</p>

      {state.message ? (
        <div
          className={`rounded-[12px] px-4 py-3 text-sm font-medium ${
            state.success
              ? "bg-primary-fixed text-on-primary-fixed-variant"
              : "bg-error-container text-on-error-container"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-[12px] bg-cta-gradient px-5 py-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Redefinindo..." : "Redefinir senha"}
      </button>
    </form>
  );
}
