import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { createReservationsCsv } from "@/lib/reservas-export";

export const dynamic = "force-dynamic";

function getClientIp(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (
    !currentUser ||
    currentUser.primeiroAcesso ||
    !["ADMINISTRADOR", "SINDICO"].includes(currentUser.tipoUsuario)
  ) {
    return new NextResponse("Não autorizado.", { status: 401 });
  }

  const reservations = await db.reserva.findMany({
    include: {
      areaComum: { select: { nomeArea: true } },
      morador: {
        select: {
          nomeCompleto: true,
          email: true,
          bloco: true,
          apartamento: true,
        },
      },
    },
    orderBy: [{ dataReserva: "desc" }, { horaInicio: "desc" }],
  });

  await db.logAtividade.create({
    data: {
      idUsuario: currentUser.id,
      acao: "EXPORTAR_RESERVAS",
      entidade: "RESERVA",
      detalhes: { quantidade: reservations.length, formato: "CSV" },
      ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
    },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(createReservationsCsv(reservations), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservas-${date}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
