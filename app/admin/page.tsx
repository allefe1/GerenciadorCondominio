import { PageHeader } from "@/components/dashboard/page-header";
import { requireRole } from "@/lib/auth/current-user";
import { countReservasAbertas } from "@/lib/db-compat";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminPage() {
  const currentUser = await requireRole(["ADMINISTRADOR"]);
  const [moradores, areas, reservasFuturas] = await Promise.all([
    db.usuario.count({ where: { tipoUsuario: "MORADOR" } }),
    db.areaComum.count(),
    countReservasAbertas(),
  ]);

  return (
    <>
      <PageHeader
        roleLabel="Administrador"
        title="Painel administrativo"
        subtitle="Visão operacional do condomínio"
      />
      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-[24px] bg-primary-container p-6 text-white">
          <p className="text-sm text-white/80">Total de moradores</p>
          <h2 className="mt-3 text-4xl font-black">{moradores}</h2>
        </article>
        <article className="rounded-[24px] bg-tertiary-container p-6 text-white">
          <p className="text-sm text-white/80">Áreas cadastradas</p>
          <h2 className="mt-3 text-4xl font-black">{areas}</h2>
        </article>
        <article className="rounded-[24px] bg-secondary-container p-6 text-white">
          <p className="text-sm text-white/80">Reservas abertas</p>
          <h2 className="mt-3 text-4xl font-black">{reservasFuturas}</h2>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
            Operação
          </p>
          <h2 className="mt-2 text-2xl font-black">Gerencie usuários e permissões</h2>
          <p className="mt-3 text-sm text-on-surface-variant">
            Cadastre, edite e controle o acesso de moradores, administradores e síndicos.
          </p>
          <Link
            href="/admin/usuarios"
            className="mt-5 inline-flex rounded-[12px] border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
          >
            Abrir usuários
          </Link>
        </article>

        <article className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Reservas</p>
          <h2 className="mt-2 text-2xl font-black">Aprove ou reprove solicitações</h2>
          <p className="mt-3 text-sm text-on-surface-variant">
            O painel de reservas centraliza fila pendente, agenda confirmada e notificações aos moradores.
          </p>
          <Link
            href="/admin/reservas"
            className="mt-5 inline-flex rounded-[12px] bg-cta-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            Abrir reservas
          </Link>
        </article>
      </section>
    </>
  );
}
