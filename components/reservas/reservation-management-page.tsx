import { PageHeader } from "@/components/dashboard/page-header";
import { ReservationDecisionForm } from "@/components/reservas/reservation-decision-form";
import type { CurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { formatDateBR, formatTimeBR } from "@/lib/reservas";

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
  const [pendentes, confirmadas] = await Promise.all([
    db.reserva.findMany({
      where: { statusReserva: "PENDENTE" },
      include: {
        areaComum: { select: { nomeArea: true } },
        morador: { select: { nomeCompleto: true, email: true, apartamento: true, bloco: true } },
      },
      orderBy: [{ dataSolicitacao: "asc" }],
    }),
    db.reserva.findMany({
      where: {
        statusReserva: "CONFIRMADA",
        dataReserva: { gte: new Date() },
      },
      include: {
        areaComum: { select: { nomeArea: true } },
        morador: { select: { nomeCompleto: true } },
      },
      orderBy: [{ dataReserva: "asc" }, { horaInicio: "asc" }],
      take: 10,
    }),
  ]);

  return (
    <>
      <PageHeader
        roleLabel={currentUser.tipoUsuario === "ADMINISTRADOR" ? "Administrador" : "Síndico"}
        title={pageTitle}
        subtitle={pageSubtitle}
      />
      <section className="grid gap-5 md:grid-cols-3">
        <article className="rounded-[24px] bg-primary-container p-6 text-white">
          <p className="text-sm text-white/80">Solicitações pendentes</p>
          <h2 className="mt-3 text-4xl font-black">{pendentes.length}</h2>
        </article>
        <article className="rounded-[24px] bg-[#1A1A2E] p-6 text-white">
          <p className="text-sm text-white/80">Reservas futuras confirmadas</p>
          <h2 className="mt-3 text-4xl font-black">{confirmadas.length}</h2>
        </article>
        <article className="rounded-[24px] bg-gradient-to-br from-[#FF8C6B] to-[#FFB088] p-6 text-white">
          <p className="text-sm text-white/80">Fila operacional</p>
          <h2 className="mt-3 text-4xl font-black">{pendentes.length + confirmadas.length}</h2>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Solicitações</p>
            <h2 className="mt-2 text-2xl font-black">Pendentes de decisão</h2>
          </div>

          <div className="space-y-5">
            {pendentes.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-outline-variant/30 px-4 py-5 text-sm text-on-surface-variant">
                Não há solicitações pendentes.
              </div>
            ) : (
              pendentes.map((reserva) => (
                <article key={reserva.id} className="rounded-[22px] border border-outline-variant/20 bg-white p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold">{reserva.areaComum.nomeArea}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {reserva.morador.nomeCompleto} · Bloco {reserva.morador.bloco || "-"} · Apto {reserva.morador.apartamento || "-"}
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {formatDateBR(reserva.dataReserva)} · {formatTimeBR(reserva.horaInicio)} - {formatTimeBR(reserva.horaFim)}
                    </p>
                    {reserva.observacaoSolicitacao ? (
                      <p className="mt-2 text-sm text-on-surface-variant">
                        Observação: {reserva.observacaoSolicitacao}
                      </p>
                    ) : null}
                  </div>
                  <ReservationDecisionForm idReserva={reserva.id} />
                </article>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Agenda confirmada
            </p>
            <h2 className="mt-2 text-2xl font-black">Próximas reservas</h2>
          </div>

          <div className="space-y-3">
            {confirmadas.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-outline-variant/30 px-4 py-5 text-sm text-on-surface-variant">
                Não há reservas futuras confirmadas.
              </div>
            ) : (
              confirmadas.map((reserva) => (
                <div key={reserva.id} className="rounded-[18px] border border-outline-variant/20 px-4 py-4">
                  <p className="font-semibold text-on-surface">{reserva.areaComum.nomeArea}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">{reserva.morador.nomeCompleto}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {formatDateBR(reserva.dataReserva)} · {formatTimeBR(reserva.horaInicio)} - {formatTimeBR(reserva.horaFim)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </>
  );
}
