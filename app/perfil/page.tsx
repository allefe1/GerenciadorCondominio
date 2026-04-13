import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getNavItems } from "@/components/dashboard/user-nav";
import { PasswordForm } from "@/components/users/password-form";
import { ProfileForm } from "@/components/users/profile-form";
import { requireAuthenticatedUser } from "@/lib/auth/current-user";

export default async function PerfilPage() {
  const currentUser = await requireAuthenticatedUser();

  return (
    <DashboardShell
      roleLabel="Meu perfil"
      title="Dados da conta"
      subtitle="Atualize informações pessoais e credenciais"
      currentPath="/perfil"
      userName={currentUser.nomeCompleto}
      userEmail={currentUser.email}
      navItems={getNavItems(currentUser.tipoUsuario)}
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Cadastro</p>
          <h2 className="mt-2 text-2xl font-black">Informações pessoais</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Mantenha seus dados atualizados para notificações e contato do condomínio.
          </p>

          <div className="mt-6">
            <ProfileForm
              nomeCompleto={currentUser.nomeCompleto}
              telefone={currentUser.telefone}
            />
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Acesso
            </p>
            <h2 className="mt-2 text-2xl font-black">Credenciais</h2>
            <dl className="mt-5 space-y-3 text-sm text-on-surface-variant">
              <div className="flex justify-between gap-4">
                <dt>E-mail</dt>
                <dd className="font-semibold text-on-surface">{currentUser.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Perfil</dt>
                <dd className="font-semibold text-on-surface">{currentUser.tipoUsuario}</dd>
              </div>
              {currentUser.tipoUsuario === "MORADOR" ? (
                <div className="flex justify-between gap-4">
                  <dt>Unidade</dt>
                  <dd className="font-semibold text-on-surface">
                    Bloco {currentUser.bloco || "-"} · Apto {currentUser.apartamento || "-"}
                  </dd>
                </div>
              ) : null}
            </dl>
          </article>

          <article className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Segurança</p>
            <h2 className="mt-2 text-2xl font-black">Alterar senha</h2>
            <div className="mt-6">
              <PasswordForm />
            </div>
          </article>
        </div>
      </section>
    </DashboardShell>
  );
}
