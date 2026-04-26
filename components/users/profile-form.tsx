"use client";

import { useActionState, useState } from "react"; // Adicionado o useState aqui

import { updateMyProfileAction } from "@/app/actions/users";

type ProfileFormProps = {
  nomeCompleto: string;
  telefone: string | null;
};

const initialState = {
  success: false,
  message: "",
};

// Função auxiliar para aplicar a máscara (XX) XXXXX-XXXX
const formatarTelefone = (value: string) => {
  if (!value) return "";
  
  let fone = value.replace(/\D/g, ""); // Remove o que não é número
  
  // Aplica a formatação
  fone = fone.replace(/^(\d{2})(\d)/g, "($1) $2");
  fone = fone.replace(/(\d)(\d{4})$/, "$1-$2");
  
  return fone.substring(0, 15);
};

export function ProfileForm({ nomeCompleto, telefone }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateMyProfileAction, initialState);
  
  // Estado local para garantir que o React atualize a tela com a máscara
  const [telefoneFormatado, setTelefoneFormatado] = useState(formatarTelefone(telefone ?? ""));

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface" htmlFor="nomeCompleto">
            Nome completo
          </label>
          <input
            id="nomeCompleto"
            name="nomeCompleto"
            defaultValue={nomeCompleto}
            className="w-full rounded-[14px] border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface" htmlFor="telefone">
            Telefone
          </label>
          <input
            id="telefone"
            name="telefone"
            // Trocamos o defaultValue por value
            value={telefoneFormatado} 
            // Atualizamos o estado a cada digitação
            onChange={(e) => setTelefoneFormatado(formatarTelefone(e.target.value))} 
            maxLength={15}
            placeholder="(00) 00000-0000"
            className="w-full rounded-[14px] border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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

      <button
        type="submit"
        disabled={isPending}
        className="rounded-[14px] bg-cta-gradient px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Salvando..." : "Salvar perfil"}
      </button>
    </form>
  );
}