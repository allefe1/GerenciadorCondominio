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
  const editUserId = params.edit ? Number(params.edit) : undefined;

  return (
    <UserManagementPage
      currentUser={currentUser}
      basePath="/sindico/usuarios"
      pageTitle="Gestão de usuários"
      pageSubtitle="Acompanhe cadastros, permissões e status operacionais"
      editUserId={Number.isNaN(editUserId) ? undefined : editUserId}
    />
  );
}
