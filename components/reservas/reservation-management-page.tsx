import { PageHeader } from "@/components/dashboard/page-header";
import type { CurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { formatDateBR, formatTimeBR } from "@/lib/reservas";
import { Download } from "lucide-react";

type ReservationManagementPageProps = {
  currentUser: CurrentUser;
  pageTitle: string;
  pageSubtitle: string;
};

export async function ReservationManagementPage({
  currentUser,
  pageTitle,
  pageSubtitle,
}: ReservationManagementPageProps) {
  const reservas = await db.reserva.findMany({
    include: {
      areaComum: { select: { nomeArea: true } },
      morador: { select: { nomeCompleto: true, email: true, apartamento: true, bloco: true } },
    },
    orderBy: [{ dataReserva: "desc" }, { horaInicio: "desc" }],
  });

  const now = new Date();
  
  const summary = {
    futuras: reservas.filter(r => r.statusReserva === "CONFIRMADA" && r.dataReserva >= now).length,
    historico: reservas.filter(r => r.dataReserva < now).length,
    canceladas: reservas.filter(r => r.statusReserva === "CANCELADA").length,
  };

  return (
    <>
      <PageHeader
        roleLabel={currentUser.tipoUsuario === "ADMINISTRADOR" ? "Administrador" : "Síndico"}
        title={pageTitle}
        subtitle={pageSubtitle}
      />
      
      <section className="grid gap-5 md:grid-cols-3">
        <article className="rounded-[24px] bg-primary-container p-6 text-white">
          <p className="text-sm text-white/80">Reservas futuras</p>
          <h2 className="mt-3 text-4xl font-black">{summary.futuras}</h2>
        </article>
        <article className="rounded-[24px] bg-[#1A1A2E] p-6 text-white">
          <p className="text-sm text-white/80">Histórico de reservas</p>
          <h2 className="mt-3 text-4xl font-black">{summary.historico}</h2>
        </article>
        <article className="rounded-[24px] bg-gradient-to-br from-[#FF8C6B] to-[#FFB088] p-6 text-white">
          <p className="text-sm text-white/80">Reservas canceladas</p>
          <h2 className="mt-3 text-4xl font-black">{summary.canceladas}</h2>
        </article>
      </section>

      <section className="mt-6 rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Listagem
            </p>
            <h2 className="mt-2 text-2xl font-black">Todas as reservas</h2>
          </div>
          <a
            href="/api/reservas/export"
            title="Exportar reservas em CSV"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
          >
            <Download aria-hidden="true" size={16} />
            Exportar CSV
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                <th className="pb-2">Área e Data</th>
                <th className="pb-2">Morador</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-on-surface-variant">
                    Nenhuma reserva encontrada.
                  </td>
                </tr>
              ) : (
                reservas.map((reserva) => (
                  <tr key={reserva.id} className="rounded-[18px] bg-white shadow-sm">
                    <td className="rounded-l-[18px] px-4 py-4">
                      <p className="font-bold text-on-surface">{reserva.areaComum.nomeArea}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {formatDateBR(reserva.dataReserva)} · {formatTimeBR(reserva.horaInicio)} - {formatTimeBR(reserva.horaFim)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-on-surface">{reserva.morador.nomeCompleto}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Bloco {reserva.morador.bloco || "-"} · Apto {reserva.morador.apartamento || "-"}
                      </p>
                    </td>
                    <td className="rounded-r-[18px] px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          reserva.statusReserva === "CONFIRMADA"
                            ? "bg-emerald-100 text-emerald-800"
                            : reserva.statusReserva === "CANCELADA"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {reserva.statusReserva}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
