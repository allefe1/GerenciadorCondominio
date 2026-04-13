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
  const editUserId = params.edit ? Number(params.edit) : undefined;

  return (
    <UserManagementPage
      currentUser={currentUser}
      currentPath="/admin/usuarios"
      basePath="/admin/usuarios"
      pageTitle="Gerenciamento de usuários"
      pageSubtitle="Cadastre, atualize e controle perfis administrativos e moradores"
      editUserId={Number.isNaN(editUserId) ? undefined : editUserId}
    />
  );
}
