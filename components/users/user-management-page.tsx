import Link from "next/link";
import type { TipoUsuario } from "@prisma/client";

import { deleteMoradorAction, toggleUserStatusAction } from "@/app/actions/users";
import { PageHeader } from "@/components/dashboard/page-header";
import { UserForm } from "@/components/users/user-form";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isInvalidReservaStatusValue } from "@/lib/db-compat";
import { db } from "@/lib/db";
import { censurarTelefone } from "@/lib/utils";

type UserManagementPageProps = {
  currentUser: CurrentUser;
  basePath: string;
  pageTitle: string;
  pageSubtitle: string;
  editUserId?: number;
  showForm?: boolean; 
};

export async function UserManagementPage({
  currentUser,
  basePath,
  pageTitle,
  pageSubtitle,
  editUserId,
  showForm, // <- ESQUECI DE RECEBER ESSA VARIÁVEL AQUI ANTES!
}: UserManagementPageProps) {
  const [users, editingUser] = await Promise.all([getUsersForManagement(), getEditingUser(editUserId)]);

  const summary = {
    moradores: users.filter((user) => user.tipoUsuario === "MORADOR").length,
    administradores: users.filter((user) => user.tipoUsuario === "ADMINISTRADOR").length,
    sindicos: users.filter((user) => user.tipoUsuario === "SINDICO").length,
  };

  // Agora o formulário aparece se estiver editando alguém OU se showForm for verdadeiro
  const isFormVisible = !!editingUser || showForm;

  return (
    <>
      <PageHeader
        roleLabel={currentUser.tipoUsuario === "ADMINISTRADOR" ? "Administrador" : "Síndico"}
        title={pageTitle}
        subtitle={pageSubtitle}
      />
      <section className="grid gap-5 md:grid-cols-3">
        <article className="rounded-[24px] bg-primary-container p-6 text-white">
          <p className="text-sm text-white/80">Moradores ativos</p>
          <h2 className="mt-3 text-4xl font-black">{summary.moradores}</h2>
        </article>
        <article className="rounded-[24px] bg-[#1A1A2E] p-6 text-white">
          <p className="text-sm text-white/80">Administradores</p>
          <h2 className="mt-3 text-4xl font-black">{summary.administradores}</h2>
        </article>
        <article className="rounded-[24px] bg-gradient-to-br from-[#FF8C6B] to-[#FFB088] p-6 text-white">
          <p className="text-sm text-white/80">Síndicos</p>
          <h2 className="mt-3 text-4xl font-black">{summary.sindicos}</h2>
        </article>
      </section>

      {/* Renderiza o formulário apenas se estiver visível */}
      {isFormVisible && (
        <div id="form-usuario" className="scroll-mt-6">
          <UserForm editingUser={editingUser} cancelHref={`${basePath}#lista-usuarios`} />
        </div>
      )}

      <section id="lista-usuarios" className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm scroll-mt-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Operação
            </p>
            <h2 className="mt-2 text-2xl font-black">Usuários cadastrados</h2>
          </div>
          {/* Novo Botão de Cadastrar */}
           <Link
            href={`${basePath}?edit=new#form-usuario`} // Rola para o form
            className="rounded-[12px] bg-cta-gradient px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
          >
            Cadastrar usuário
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                <th className="pb-2">Usuário</th>
                <th className="pb-2">Perfil</th>
                <th className="pb-2">Status</th>
                {/* Removido o cabeçalho de Permissões */}
                <th className="pb-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const editHref =
                  currentUser.tipoUsuario === "ADMINISTRADOR"
                    ? `/admin/usuarios?edit=${user.id}#form-usuario`
                    : `/sindico/usuarios?edit=${user.id}#form-usuario`;
                const canDeleteMorador =
                  user.tipoUsuario === "MORADOR" && user.reservasMorador.length === 0;

                return (
                  <tr key={user.id} className="rounded-[18px] bg-white shadow-sm">
                    <td className="rounded-l-[18px] px-4 py-4">
                      <p className="font-semibold text-on-surface">{user.nomeCompleto}</p>
                      <p className="text-sm text-on-surface-variant">{user.email}</p>
                      {/* Telefone Censurado Adicionado Aqui */}
                      {user.telefone && (
                         <p className="mt-1 text-sm text-on-surface-variant">{censurarTelefone(user.telefone)}</p>
                      )}
                      {user.tipoUsuario === "MORADOR" ? (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Bloco {user.bloco || "-"} · Apto {user.apartamento || "-"}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-on-surface">
                      {formatRole(user.tipoUsuario)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          user.status === "ATIVO"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    {/* Removida a célula de Permissões */}
                    <td className="rounded-r-[18px] px-4 py-4">
                      <div className="flex justify-end gap-2">
                         {/* Botão Editar Colorido */}
                        <Link
                          href={editHref}
                          className="rounded-[12px] border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          Editar
                        </Link>
                        
                         {/* Botão Ativar/Desativar Colorido */}
                        <form action={toggleUserStatusAction}>
                          <input type="hidden" name="id" value={user.id} />
                          <button
                            type="submit"
                            className="rounded-[12px] border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-50"
                          >
                            {user.status === "ATIVO" ? "Desativar" : "Ativar"}
                          </button>
                        </form>

                        {/* Botão Excluir Colorido e sem texto de reserva */}
                        {user.tipoUsuario === "MORADOR" ? (
                          <form action={deleteMoradorAction}>
                            <input type="hidden" name="id" value={user.id} />
                            <button
                              type="submit"
                              disabled={!canDeleteMorador}
                              className="rounded-[12px] border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:bg-slate-50"
                            >
                              Excluir
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ... as funções de busca (getUsersForManagement, getEditingUser, formatRole) permanecem iguais.
// Não precisa colá-las de novo se não quiser, deixei elas como no original.
async function getUsersForManagement() {
  try {
    return await db.usuario.findMany({
      orderBy: [{ tipoUsuario: "asc" }, { nomeCompleto: "asc" }],
      include: {
        reservasMorador: {
          where: {
            statusReserva: {
              in: ["PENDENTE", "CONFIRMADA"],
            },
          },
          select: { id: true },
        },
      },
    });
  } catch (error) {
    if (!isInvalidReservaStatusValue(error, "PENDENTE")) {
      throw error;
    }

    return db.usuario.findMany({
      orderBy: [{ tipoUsuario: "asc" }, { nomeCompleto: "asc" }],
      include: {
        reservasMorador: {
          where: {
            statusReserva: "CONFIRMADA",
          },
          select: { id: true },
        },
      },
    });
  }
}

async function getEditingUser(editUserId?: number) {
  if (!editUserId) {
    return null;
  }

  return db.usuario.findUnique({
    where: { id: editUserId },
    select: {
      id: true,
      tipoUsuario: true,
      nomeCompleto: true,
      email: true,
      telefone: true,
      apartamento: true,
      bloco: true,
      permissoesAcesso: true,
    },
  });
}

function formatRole(role: TipoUsuario) {
  if (role === "ADMINISTRADOR") {
    return "Administrador";
  }

  if (role === "SINDICO") {
    return "Síndico";
  }

  return "Morador";
}