import { UserManagementPage } from "@/components/users/user-management-page";
import { requireRole } from "@/lib/auth/current-user";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    edit?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const currentUser = await requireRole(["ADMINISTRADOR"]);
  const params = searchParams ? await searchParams : {};
  
  // Verifica se o botão "Cadastrar usuário" foi clicado
  const isNewUser = params.edit === "new";
  
  // Se for um novo usuário, não tenta converter a palavra "new" em número
  const editUserId = isNewUser ? undefined : Number(params.edit);

  return (
    <UserManagementPage
      currentUser={currentUser}
      basePath="/admin/usuarios"
      pageTitle="Gerenciamento de usuários"
      pageSubtitle="Cadastre, atualize e controle perfis administrativos e moradores"
      editUserId={Number.isNaN(editUserId) ? undefined : editUserId}
      showForm={isNewUser} // Passamos a ordem de mostrar o formulário
    />
  );
}