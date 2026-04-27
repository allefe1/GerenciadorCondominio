"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { StatusArea } from "@prisma/client";

import { upsertAreaAction } from "@/app/actions/areas";

// Tipo para ajudar o TypeScript a entender o que vem do banco
type EditableArea = {
  id: number;
  nomeArea: string;
  descricao: string | null;
  capacidadeMaxima: number;
  regrasUso: string | null;
  valorReserva: any; // Usamos any aqui porque o Prisma devolve um objeto Decimal complexo
  status: StatusArea;
};

type AreaFormProps = {
  editingArea?: EditableArea | null;
  cancelHref: string;
};

const initialState = {
  success: false,
  message: "",
};

export function AreaForm({ editingArea, cancelHref }: AreaFormProps) {
  const [state, formAction, isPending] = useActionState(upsertAreaAction, initialState);

  return (
    <form action={formAction} className="space-y-5 rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            {editingArea ? "Editar área" : "Nova área comum"}
          </p>
          <h2 className="mt-2 text-2xl font-black text-on-surface">
            {editingArea ? editingArea.nomeArea : "Cadastro de área"}
          </h2>
        </div>
      </div>

      {/* Se estiver editando, envia o ID escondido para o backend */}
      {editingArea ? <input type="hidden" name="id" value={editingArea.id} /> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold" htmlFor="nomeArea">
            Nome da Área
          </label>
          <input
            id="nomeArea"
            name="nomeArea"
            required
            defaultValue={editingArea?.nomeArea ?? ""}
            placeholder="Ex: Salão de Festas, Churrasqueira..."
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold" htmlFor="descricao">
            Descrição (Opcional)
          </label>
          <textarea
            id="descricao"
            name="descricao"
            rows={2}
            defaultValue={editingArea?.descricao ?? ""}
            placeholder="Breve descrição do espaço..."
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="capacidadeMaxima">
            Capacidade Máxima (Pessoas)
          </label>
          <input
            id="capacidadeMaxima"
            name="capacidadeMaxima"
            type="number"
            min="1"
            required
            defaultValue={editingArea?.capacidadeMaxima ?? ""}
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="valorReserva">
            Valor da Reserva (R$)
          </label>
          <input
            id="valorReserva"
            name="valorReserva"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={editingArea ? Number(editingArea.valorReserva) : 0}
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="status">
            Status Atual
          </label>
          <select
            id="status"
            name="status"
            defaultValue={editingArea?.status ?? "DISPONIVEL"}
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="DISPONIVEL">Disponível</option>
            <option value="INDISPONIVEL">Indisponível</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold" htmlFor="regrasUso">
            Regras de Uso (Opcional)
          </label>
          <textarea
            id="regrasUso"
            name="regrasUso"
            rows={3}
            defaultValue={editingArea?.regrasUso ?? ""}
            placeholder="Ex: Proibido som alto após as 22h, obrigatório limpar as grelhas..."
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </div>

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

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[14px] bg-cta-gradient px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Salvando..." : editingArea ? "Salvar alterações" : "Criar área comum"}
        </button>
        {editingArea ? (
          <Link
            href={cancelHref}
            className="rounded-[14px] border border-outline-variant/40 px-5 py-3 text-sm font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
          >
            Cancelar edição
          </Link>
        ) : null}
      </div>
    </form>
  );
}