import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getNavItems } from "@/components/dashboard/user-nav";
import { requireRole } from "@/lib/auth/current-user";
import { countNotificacoesNaoLidas, countReservasAbertas } from "@/lib/db-compat";
import Link from "next/link";

export default async function MoradorPage() {
  const currentUser = await requireRole(["MORADOR"]);
  const [reservasAtivas, notificacoesNaoLidas] = await Promise.all([
    countReservasAbertas({ idMorador: currentUser.id }),
    countNotificacoesNaoLidas(currentUser.id),
  ]);

  return (
    <DashboardShell
      roleLabel="Morador"
      title="Portal do morador"
      subtitle="Acompanhe reservas, avisos e seu cadastro"
      currentPath="/morador"
      userName={currentUser.nomeCompleto}
      userEmail={currentUser.email}
      navItems={getNavItems(currentUser.tipoUsuario)}
    >
      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-[24px] bg-surface-container-lowest p-8 shadow-sm">
          <h2 className="text-xl font-bold">Minhas reservas</h2>
          <p className="mt-4 text-4xl font-black text-primary">{reservasAtivas}</p>
          <p className="mt-3 text-sm text-on-surface-variant">
            Solicitações pendentes e reservas confirmadas já são contabilizadas pelo banco.
          </p>
          <Link
            href="/morador/reservas"
            className="mt-5 inline-flex rounded-[12px] border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
          >
            Gerenciar reservas
          </Link>
        </article>
        <article className="rounded-[24px] bg-brand-gradient p-8 text-white shadow-ambient">
          <h2 className="text-xl font-bold">Notificações</h2>
          <p className="mt-4 text-4xl font-black">{notificacoesNaoLidas}</p>
          <p className="mt-3 text-sm text-white/80">
            Aprovações, reprovações e avisos operacionais já aparecem no fluxo de reservas.
          </p>
          <Link
            href="/morador/reservas"
            className="mt-5 inline-flex rounded-[12px] border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Ver notificações
          </Link>
        </article>
      </section>
    </DashboardShell>
  );
}
