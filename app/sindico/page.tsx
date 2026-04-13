import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getNavItems } from "@/components/dashboard/user-nav";
import { requireRole } from "@/lib/auth/current-user";
import { countReservasPendentes } from "@/lib/db-compat";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function SindicoPage() {
  const currentUser = await requireRole(["SINDICO"]);
  const [pendencias, recentLogs] = await Promise.all([
    countReservasPendentes(),
    db.logAtividade.findMany({
      take: 5,
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        usuario: {
          select: {
            nomeCompleto: true,
          },
        },
      },
    }),
  ]);

  return (
    <DashboardShell
      roleLabel="Síndico"
      title="Console do síndico"
      subtitle="Supervisão, pendências e auditoria"
      currentPath="/sindico"
      userName={currentUser.nomeCompleto}
      userEmail={currentUser.email}
      navItems={getNavItems(currentUser.tipoUsuario)}
    >
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <article className="rounded-[24px] bg-surface-container-lowest p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
            Atividade recente
          </p>
          <h2 className="mt-3 text-2xl font-bold">Auditoria operacional</h2>
          <div className="mt-5 space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="rounded-[18px] border border-outline-variant/20 px-4 py-3">
                <p className="text-sm font-semibold text-on-surface">{log.acao}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {log.usuario?.nomeCompleto ?? "Sistema"} · {new Date(log.criadoEm).toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-[24px] bg-gradient-to-br from-[#FF8C6B] to-[#FFB088] p-8 text-white">
          <p className="text-sm text-white/85">Pendências</p>
          <h2 className="mt-3 text-4xl font-black">{pendencias}</h2>
          <Link
            href="/sindico/reservas"
            className="mt-5 inline-flex rounded-[12px] border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Revisar reservas
          </Link>
        </article>
      </section>
    </DashboardShell>
  );
}
