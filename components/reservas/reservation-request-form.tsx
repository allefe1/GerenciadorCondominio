"use client";

import { useState, useActionState } from "react";

import { requestReservationAction } from "@/app/actions/reservas";

type ReservationArea = {
  id: number;
  nomeArea: string;
  capacidadeMaxima: number;
  valorReserva: string;
};

type ReservationRequestFormProps = {
  areas: ReservationArea[];
  defaultAreaId?: number;
  defaultDate: string;
};

const initialState = {
  success: false,
  message: "",
};

export function ReservationRequestForm({
  areas,
  defaultAreaId,
  defaultDate,
}: ReservationRequestFormProps) {
  const [state, formAction, isPending] = useActionState(requestReservationAction, initialState);
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-outline-variant/30 bg-surface-container-lowest p-10 text-center shadow-sm">
        <h2 className="text-xl font-bold">Deseja reservar um espaço?</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Verifique a disponibilidade ao lado ou solicite diretamente por aqui.
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-6 rounded-full bg-[#623CEA] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#5028D5]"
        >
          + Cadastrar nova reserva
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Nova reserva</p>
          <h2 className="mt-2 text-2xl font-black">Solicitar área comum</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-full bg-surface-container p-2 text-on-surface-variant transition hover:bg-surface-container-highest hover:text-on-surface"
          aria-label="Fechar formulário"
        >
          ✕
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-2 xl:col-span-12">
          <label className="text-sm font-semibold" htmlFor="idAreaComum">
            Área comum
          </label>
          <select
            id="idAreaComum"
            name="idAreaComum"
            defaultValue={defaultAreaId ?? ""}
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="" disabled>
              Selecione a área
            </option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nomeArea} · Capacidade {area.capacidadeMaxima}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 xl:col-span-4">
          <label className="text-sm font-semibold" htmlFor="dataReserva">
            Data
          </label>
          <input
            id="dataReserva"
            name="dataReserva"
            type="date"
            defaultValue={defaultDate}
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:col-span-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="horaInicio">
              Início
            </label>
            <input
              id="horaInicio"
              name="horaInicio"
              type="time"
              className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 text-sm tabular-nums outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="horaFim">
              Fim
            </label>
            <input
              id="horaFim"
              name="horaFim"
              type="time"
              className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 text-sm tabular-nums outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="observacaoSolicitacao">
          Observação
        </label>
        <textarea
          id="observacaoSolicitacao"
          name="observacaoSolicitacao"
          rows={3}
          className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="Detalhes úteis para a administração, se necessário."
        />
      </div>

      {state.message ? (
        <div
          className={`rounded-[14px] px-4 py-3 text-sm font-medium ${
            state.success ? "bg-emerald-100 text-emerald-800" : "bg-error-container text-on-error-container"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[14px] bg-[#623CEA] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#5028D5] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Confirmando..." : "Confirmar reserva"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-[14px] px-5 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
