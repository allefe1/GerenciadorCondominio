import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

export function isMissingTableError(error: unknown, tableName: string) {
  const message = getErrorMessage(error);

  return (
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") ||
    message.includes(`public.${tableName}`) ||
    message.includes(`table \`public.${tableName}\``)
  );
}

export function isInvalidReservaStatusValue(error: unknown, status: "PENDENTE" | "REPROVADA") {
  const message = getErrorMessage(error);

  return message.includes("status_reserva_enum") && message.includes(`"${status}"`);
}

export async function countReservasAbertas(filters: { idMorador?: number } = {}) {
  try {
    return await db.reserva.count({
      where: {
        ...filters,
        statusReserva: {
          in: ["PENDENTE", "CONFIRMADA"],
        },
      },
    });
  } catch (error) {
    if (!isInvalidReservaStatusValue(error, "PENDENTE")) {
      throw error;
    }

    return db.reserva.count({
      where: {
        ...filters,
        statusReserva: "CONFIRMADA",
      },
    });
  }
}

export async function countReservasPendentes() {
  try {
    return await db.reserva.count({
      where: {
        statusReserva: "PENDENTE",
      },
    });
  } catch (error) {
    if (!isInvalidReservaStatusValue(error, "PENDENTE")) {
      throw error;
    }

    return 0;
  }
}

export async function countNotificacoesNaoLidas(idUsuario: number) {
  try {
    return await db.notificacao.count({
      where: {
        idUsuario,
        lidaEm: null,
      },
    });
  } catch (error) {
    if (!isMissingTableError(error, "notificacao")) {
      throw error;
    }

    return 0;
  }
}

export async function findRecentNotifications(idUsuario: number, take = 8) {
  try {
    return await db.notificacao.findMany({
      where: { idUsuario },
      orderBy: { criadoEm: "desc" },
      take,
    });
  } catch (error) {
    if (!isMissingTableError(error, "notificacao")) {
      throw error;
    }

    return [];
  }
}
