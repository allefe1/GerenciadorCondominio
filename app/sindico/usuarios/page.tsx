import { UserManagementPage } from "@/components/users/user-management-page";
import { requireRole } from "@/lib/auth/current-user";

type SindicoUsersPageProps = {
  searchParams?: Promise<{
    edit?: string;
  }>;
};

export default async function SindicoUsersPage({ searchParams }: SindicoUsersPageProps) {
  const currentUser = await requireRole(["SINDICO"]);
  const params = searchParams ? await searchParams : {};
  
  // Verifica se o botão "Cadastrar usuário" foi clicado
  const isNewUser = params.edit === "new";
  
  // Se for um novo usuário, não tenta converter a palavra "new" em número
  const editUserId = isNewUser ? undefined : Number(params.edit);

  return (
    <UserManagementPage
      currentUser={currentUser}
      basePath="/sindico/usuarios"
      pageTitle="Gestão de usuários"
      pageSubtitle="Acompanhe cadastros, permissões e status operacionais"
      editUserId={Number.isNaN(editUserId) ? undefined : editUserId}
      showForm={isNewUser} // Passamos a ordem de mostrar o formulário
    />
  );
}
