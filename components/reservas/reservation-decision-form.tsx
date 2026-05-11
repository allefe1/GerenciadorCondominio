"use client";

import { useActionState } from "react";

import { decideReservationAction } from "@/app/actions/reservas";

type ReservationDecisionFormProps = {
  idReserva: number;
};

const initialState = {
  success: false,
  message: "",
};

export function ReservationDecisionForm({ idReserva }: ReservationDecisionFormProps) {
  const [state, formAction, isPending] = useActionState(decideReservationAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="idReserva" value={idReserva} />
      <textarea
        name="motivo"
        rows={2}
        placeholder="Motivo da decisão. Obrigatório na reprovação."
        className="w-full rounded-[12px] border border-outline-variant/30 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
      />

      {state.message ? (
        <div
          className={`rounded-[12px] px-4 py-3 text-sm font-medium ${
            state.success ? "bg-emerald-100 text-emerald-800" : "bg-error-container text-on-error-container"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          name="decision"
          value="APROVAR"
          disabled={isPending}
          className="rounded-[12px] bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Aprovar
        </button>
        <button
          type="submit"
          name="decision"
          value="REPROVAR"
          disabled={isPending}
          className="rounded-[12px] bg-[#1A1A2E] px-4 py-2 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Reprovar
        </button>
      </div>
    </form>
  );
}
