import Link from "next/link";
import { cancelOwnReservationAction } from "@/app/actions/reservas";
import { PageHeader } from "@/components/dashboard/page-header";
import { NotificationList } from "@/components/reservas/notification-list";
import { ReservationRequestForm } from "@/components/reservas/reservation-request-form";
import { requireRole } from "@/lib/auth/current-user";
import { findRecentNotifications } from "@/lib/db-compat";
import { db } from "@/lib/db";
import {
  formatDateBR,
  formatTimeBR,
  getTodayDateInputValue,
  NON_RESERVABLE_AREA_NAMES,
} from "@/lib/reservas";

type MoradorReservasPageProps = {
  searchParams?: Promise<{
    area?: string;
    data?: string;
  }>;
};

export default async function MoradorReservasPage({ searchParams }: MoradorReservasPageProps) {
  const currentUser = await requireRole(["MORADOR"]);
  const params = searchParams ? await searchParams : {};
  const selectedDate = params.data || getTodayDateInputValue();
  const selectedAreaId = params.area ? Number(params.area) : undefined;
  const calendarDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    return {
      value: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }).format(date),
    };
  });

  const [areas, minhasReservas, disponibilidade, notifications] = await Promise.all([
    db.areaComum.findMany({
      where: {
        status: "DISPONIVEL",
        nomeArea: {
          notIn: [...NON_RESERVABLE_AREA_NAMES],
        },
      },
      orderBy: { nomeArea: "asc" },
      select: {
        id: true,
        nomeArea: true,
        capacidadeMaxima: true,
        valorReserva: true,
      },
    }),
    db.reserva.findMany({
      where: {
        idMorador: currentUser.id,
      },
      include: {
        areaComum: {
          select: { nomeArea: true },
        },
      },
      orderBy: [{ dataReserva: "asc" }, { horaInicio: "asc" }],
      take: 12,
    }),
    db.reserva.findMany({
      where: {
        ...(selectedAreaId ? { idAreaComum: selectedAreaId } : {}),
        dataReserva: new Date(`${selectedDate}T00:00:00`),
        statusReserva: "CONFIRMADA",
      },
      include: {
        areaComum: {
          select: { nomeArea: true },
        },
      },
      orderBy: { horaInicio: "asc" },
    }),
    findRecentNotifications(currentUser.id),
  ]);

  return (
    <>
      <PageHeader
        roleLabel="Morador"
        title="Reservas e disponibilidade"
        subtitle="Solicite áreas comuns e acompanhe suas reservas"
      />
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ReservationRequestForm
          areas={areas.map((area) => ({
            ...area,
            valorReserva: area.valorReserva.toFixed(2),
          }))}
          defaultAreaId={selectedAreaId}
          defaultDate={selectedDate}
        />

        <article className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Disponibilidade</p>
          <h2 className="mt-2 text-2xl font-black">Agenda confirmada</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Visualização das reservas confirmadas para a data selecionada.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
            {calendarDates.map((date) => {
              const active = date.value === selectedDate;

              return (
                <Link
                  key={date.value}
                  href={`/morador/reservas?data=${date.value}${selectedAreaId ? `&area=${selectedAreaId}` : ""}`}
                  className={`rounded-[14px] border px-3 py-3 text-center text-sm font-semibold transition ${
                    active
                      ? "border-primary bg-primary-container text-white"
                      : "border-outline-variant/30 bg-white text-on-surface hover:border-primary hover:text-primary"
                  }`}
                >
                  {date.label}
                </Link>
              );
            })}
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2">
            <select
              name="area"
              defaultValue={selectedAreaId ?? ""}
              className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">Todas as áreas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nomeArea}
                </option>
              ))}
            </select>
            <input
              name="data"
              type="date"
              defaultValue={selectedDate}
              className="w-full rounded-[14px] border border-outline-variant/40 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="submit"
              className="rounded-[14px] border border-outline-variant/40 px-5 py-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary md:col-span-2"
            >
              Filtrar agenda
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {disponibilidade.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-outline-variant/30 px-4 py-5 text-sm text-on-surface-variant">
                Não há reservas confirmadas para esse filtro.
              </div>
            ) : (
              disponibilidade.map((item) => (
                <div key={item.id} className="rounded-[18px] border border-outline-variant/20 px-4 py-4">
                  <p className="font-semibold text-on-surface">{item.areaComum.nomeArea}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {formatTimeBR(item.horaInicio)} - {formatTimeBR(item.horaFim)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
            Histórico recente
          </p>
          <h2 className="mt-2 text-2xl font-black">Minhas reservas</h2>
        </div>

        <div className="grid gap-4">
          {minhasReservas.map((reserva) => {
            const now = new Date();
            const currentDateStr = now.getFullYear().toString() +
              String(now.getMonth() + 1).padStart(2, '0') +
              String(now.getDate()).padStart(2, '0') +
              String(now.getHours()).padStart(2, '0') +
              String(now.getMinutes()).padStart(2, '0');

            const reservaDateStr = reserva.dataReserva.getUTCFullYear().toString() +
              String(reserva.dataReserva.getUTCMonth() + 1).padStart(2, '0') +
              String(reserva.dataReserva.getUTCDate()).padStart(2, '0') +
              String(reserva.horaInicio.getUTCHours()).padStart(2, '0') +
              String(reserva.horaInicio.getUTCMinutes()).padStart(2, '0');

            const isFuture = reservaDateStr > currentDateStr;

            
            const canCancel =
              (reserva.statusReserva === "PENDENTE" || reserva.statusReserva === "CONFIRMADA") && isFuture;

            return (
              <article key={reserva.id} className="rounded-[22px] border border-outline-variant/20 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">{reserva.areaComum.nomeArea}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {formatDateBR(reserva.dataReserva)} · {formatTimeBR(reserva.horaInicio)} - {formatTimeBR(reserva.horaFim)}
                    </p>
                    {reserva.observacaoSolicitacao ? (
                      <p className="mt-2 text-sm text-on-surface-variant">
                        Observação: {reserva.observacaoSolicitacao}
                      </p>
                    ) : null}
                    {reserva.motivoDecisao ? (
                      <p className="mt-2 text-sm text-on-surface-variant">
                        Motivo da decisão: {reserva.motivoDecisao}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed-variant">
                      {reserva.statusReserva}
                    </span>
                    {canCancel ? (
                      <form action={cancelOwnReservationAction}>
                        <input type="hidden" name="idReserva" value={reserva.id} />
                        <button
                          type="submit"
                          className="rounded-[12px] border border-outline-variant/40 px-3 py-2 text-xs font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          Cancelar
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <NotificationList notifications={notifications} />
    </>
  );
}
