"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { TipoUsuario } from "@prisma/client";

import { upsertUserAction } from "@/app/actions/users";
import { permissionOptions } from "@/lib/users";

type EditableUser = {
  id: number;
  tipoUsuario: TipoUsuario;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  apartamento: string | null;
  bloco: string | null;
  permissoesAcesso: string[];
};

type UserFormProps = {
  editingUser: EditableUser | null;
  cancelHref: string;
};

const initialState = {
  success: false,
  message: "",
};

export function UserForm({ editingUser, cancelHref }: UserFormProps) {
  const [state, formAction, isPending] = useActionState(upsertUserAction, initialState);
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>(editingUser?.tipoUsuario ?? "MORADOR");
  const isMorador = tipoUsuario === "MORADOR";

  return (
    <form action={formAction} className="space-y-5 rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            {editingUser ? "Editar usuario" : "Novo usuario"}
          </p>
          <h2 className="mt-2 text-2xl font-black text-on-surface">
            {editingUser ? editingUser.nomeCompleto : "Cadastro de usuario"}
          </h2>
        </div>
      </div>

      {editingUser ? <input type="hidden" name="id" value={editingUser.id} /> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="tipoUsuario">
            Perfil
          </label>
          <select
            id="tipoUsuario"
            name="tipoUsuario"
            defaultValue={editingUser?.tipoUsuario ?? "MORADOR"}
            onChange={(event) => setTipoUsuario(event.target.value as TipoUsuario)}
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="MORADOR">Morador</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="SINDICO">Síndico</option>
          </select>
        </div>

        <div className="space-y-2 xl:col-span-2">
          <label className="text-sm font-semibold" htmlFor="nomeCompleto">
            Nome completo
          </label>
          <input
            id="nomeCompleto"
            name="nomeCompleto"
            defaultValue={editingUser?.nomeCompleto ?? ""}
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="space-y-2 xl:col-span-2">
          <label className="text-sm font-semibold" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={editingUser?.email ?? ""}
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="telefone">
            Telefone
          </label>
          <input
            id="telefone"
            name="telefone"
            defaultValue={editingUser?.telefone ?? ""}
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="senha">
            {editingUser ? "Nova senha opcional" : "Senha inicial"}
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        {isMorador ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="apartamento">
                Apartamento
              </label>
              <input
                id="apartamento"
                name="apartamento"
                defaultValue={editingUser?.apartamento ?? ""}
                className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="bloco">
                Bloco
              </label>
              <input
                id="bloco"
                name="bloco"
                defaultValue={editingUser?.bloco ?? ""}
                className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </>
        ) : (
          <div className="space-y-3 xl:col-span-3">
            <p className="text-sm font-semibold">Permissões administrativas</p>
            <div className="grid gap-3 md:grid-cols-2">
              {permissionOptions.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-3 rounded-[14px] border border-outline-variant/30 bg-white px-4 py-3 text-sm text-on-surface"
                >
                  <input
                    type="checkbox"
                    name="permissoesAcesso"
                    value={permission}
                    defaultChecked={editingUser?.permissoesAcesso.includes(permission)}
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                  />
                  {permission}
                </label>
              ))}
            </div>
          </div>
        )}
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
          {isPending ? "Salvando..." : editingUser ? "Salvar alteracoes" : "Criar usuario"}
        </button>
        {editingUser ? (
          <Link
            href={cancelHref}
            className="rounded-[14px] border border-outline-variant/40 px-5 py-3 text-sm font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
          >
            Cancelar edicao
          </Link>
        ) : null}
      </div>
    </form>
  );
}
