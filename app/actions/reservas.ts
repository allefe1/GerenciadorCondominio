"use server";

import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/current-user";
import { isInvalidReservaStatusValue, isMissingTableError } from "@/lib/db-compat";
import { db } from "@/lib/db";
import { combineDateAndTime, isReservableAreaName, startOfDay } from "@/lib/reservas";

const GENERIC_RESERVA_MESSAGE =
  "Não foi possível concluir a operação de reserva com o estado atual do banco local.";

function getClientIp(ip: string | null) {
  if (!ip) {
    return null;
  }

  return ip.split(",")[0]?.trim() || null;
}

const reservationRequestSchema = z.object({
  idAreaComum: z.coerce.number().int().positive("Selecione uma área."),
  dataReserva: z.string().min(1, "Informe a data da reserva."),
  horaInicio: z.string().min(1, "Informe o horário inicial."),
  horaFim: z.string().min(1, "Informe o horário final."),
  observacaoSolicitacao: z.string().max(500).optional(),
});

const reservationDecisionSchema = z.object({
  idReserva: z.coerce.number().int().positive(),
  decision: z.enum(["APROVAR", "REPROVAR"]),
  motivo: z.string().max(500).optional(),
});

export async function markNotificationAsReadAction(formData: FormData) {
  const currentUser = await requireRole(["MORADOR"]);
  const idNotificacao = Number(formData.get("idNotificacao"));

  if (!Number.isInteger(idNotificacao) || idNotificacao <= 0) {
    return;
  }

  try {
    await db.notificacao.updateMany({
      where: {
        id: idNotificacao,
        idUsuario: currentUser.id,
        lidaEm: null,
      },
      data: {
        lidaEm: new Date(),
      },
    });
  } catch {
    return;
  }

  revalidatePath("/morador");
  revalidatePath("/morador/reservas");
}

export async function markAllNotificationsAsReadAction() {
  const currentUser = await requireRole(["MORADOR"]);

  try {
    await db.notificacao.updateMany({
      where: {
        idUsuario: currentUser.id,
        lidaEm: null,
      },
      data: {
        lidaEm: new Date(),
      },
    });
  } catch {
    return;
  }

  revalidatePath("/morador");
  revalidatePath("/morador/reservas");
}

export async function requestReservationAction(_: unknown, formData: FormData) {
  const currentUser = await requireRole(["MORADOR"]);
  const parsed = reservationRequestSchema.safeParse({
    idAreaComum: formData.get("idAreaComum"),
    dataReserva: formData.get("dataReserva"),
    horaInicio: formData.get("horaInicio"),
    horaFim: formData.get("horaFim"),
    observacaoSolicitacao: formData.get("observacaoSolicitacao"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { idAreaComum, dataReserva, horaInicio, horaFim, observacaoSolicitacao } = parsed.data;
  const start = combineDateAndTime(dataReserva, horaInicio);
  const end = combineDateAndTime(dataReserva, horaFim);
  const dateValue = startOfDay(dataReserva);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(dateValue.getTime())) {
    return { success: false, message: "Data ou horário inválido." };
  }

  if (end <= start) {
    return { success: false, message: "O horário final deve ser maior que o horário inicial." };
  }

  if (start <= new Date()) {
    return { success: false, message: "A reserva precisa ser solicitada para um horário futuro." };
  }

  try {
    const area = await db.areaComum.findUnique({
      where: { id: idAreaComum },
      select: { id: true, nomeArea: true, status: true },
    });

    if (!area || area.status !== "DISPONIVEL") {
      return { success: false, message: "A área selecionada não está disponível para reserva." };
    }

    if (!isReservableAreaName(area.nomeArea)) {
      return { success: false, message: "Esta área é de uso livre e não precisa de reserva." };
    }

    const destinatarios = await db.usuario.findMany({
      where: {
        tipoUsuario: {
          in: ["ADMINISTRADOR", "SINDICO"],
        },
        status: "ATIVO",
      },
      select: { id: true },
    });

    await db.$transaction(async (tx) => {
      const reserva = await tx.reserva.create({
        data: {
          idMorador: currentUser.id,
          idAreaComum,
          dataReserva: dateValue,
          horaInicio: start,
          horaFim: end,
          statusReserva: "PENDENTE",
          observacaoSolicitacao: observacaoSolicitacao || null,
        },
      });

      await tx.logAtividade.create({
        data: {
          idUsuario: currentUser.id,
          acao: "SOLICITAR_RESERVA",
          entidade: "RESERVA",
          idEntidade: reserva.id,
          detalhes: {
            area: area.nomeArea,
            dataReserva,
            horaInicio,
            horaFim,
          },
          ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
        },
      });

      if (destinatarios.length > 0) {
        await tx.notificacao.createMany({
          data: destinatarios.map((destinatario) => ({
            idUsuario: destinatario.id,
            tipo: "RESERVA_SOLICITADA",
            titulo: "Nova solicitação de reserva",
            mensagem: `${currentUser.nomeCompleto} solicitou a área ${area.nomeArea} em ${dataReserva} às ${horaInicio}.`,
            idReserva: reserva.id,
          })),
        });
      }
    });
  } catch (error) {
    if (
      isInvalidReservaStatusValue(error, "PENDENTE") ||
      isMissingTableError(error, "notificacao")
    ) {
      return { success: false, message: GENERIC_RESERVA_MESSAGE };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientUnknownRequestError) {
      const message = error.message;

      if (message.includes("RESERVA_CONFLITO")) {
        return { success: false, message: "Já existe reserva confirmada para a área nesse horário." };
      }

      if (message.includes("LIMITE_RESERVAS")) {
        return { success: false, message: "O morador atingiu o limite mensal de reservas." };
      }
    }

    return { success: false, message: "Não foi possível solicitar a reserva." };
  }

  revalidatePath("/morador");
  revalidatePath("/morador/reservas");
  revalidatePath("/admin");
  revalidatePath("/admin/reservas");
  revalidatePath("/sindico");
  revalidatePath("/sindico/reservas");

  return { success: true, message: "Reserva solicitada com sucesso." };
}

export async function cancelOwnReservationAction(formData: FormData) {
  const currentUser = await requireRole(["MORADOR"]);
  const idReserva = Number(formData.get("idReserva"));

  if (!Number.isInteger(idReserva) || idReserva <= 0) {
    return;
  }

  try {
    const reserva = await db.reserva.findUnique({
      where: { id: idReserva },
      include: {
        areaComum: {
          select: { nomeArea: true },
        },
      },
    });

    if (!reserva || reserva.idMorador !== currentUser.id) {
      return;
    }

    if (!["PENDENTE", "CONFIRMADA"].includes(reserva.statusReserva)) {
      return;
    }

    const reservaDateTime = combineDateAndTime(
      reserva.dataReserva.toISOString().slice(0, 10),
      reserva.horaInicio.toISOString().slice(11, 16),
    );

    if (reservaDateTime <= new Date()) {
      return;
    }

    const config = await db.configuracao.findUnique({
      where: { chave: "ANTECEDENCIA_MINIMA_CANCELAMENTO_HORAS" },
    });

    const minHours = Number(config?.valor || "24");
    const minCancelDate = new Date(reservaDateTime.getTime() - minHours * 60 * 60 * 1000);
    if (new Date() > minCancelDate) {
      return;
    }

    await db.$transaction(async (tx) => {
      await tx.reserva.update({
        where: { id: reserva.id },
        data: {
          statusReserva: "CANCELADA",
          dataCancelamento: new Date(),
          idCanceladoPor: currentUser.id,
        },
      });

      await tx.logAtividade.create({
        data: {
          idUsuario: currentUser.id,
          acao: "CANCELAR_RESERVA",
          entidade: "RESERVA",
          idEntidade: reserva.id,
          detalhes: { area: reserva.areaComum.nomeArea },
          ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
        },
      });
    });
  } catch {
    return;
  }

  revalidatePath("/morador");
  revalidatePath("/morador/reservas");
  revalidatePath("/admin/reservas");
  revalidatePath("/sindico/reservas");

  redirect("/morador/reservas");
}

export async function decideReservationAction(_: unknown, formData: FormData) {
  const currentUser = await requireRole(["ADMINISTRADOR", "SINDICO"]);
  const parsed = reservationDecisionSchema.safeParse({
    idReserva: formData.get("idReserva"),
    decision: formData.get("decision"),
    motivo: formData.get("motivo"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { idReserva, decision, motivo } = parsed.data;
  if (decision === "REPROVAR" && !motivo?.trim()) {
    return { success: false, message: "Informe o motivo ao reprovar a reserva." };
  }

  try {
    const reserva = await db.reserva.findUnique({
      where: { id: idReserva },
      include: {
        areaComum: {
          select: { nomeArea: true },
        },
        morador: {
          select: { id: true, nomeCompleto: true },
        },
      },
    });

    if (!reserva || reserva.statusReserva !== "PENDENTE") {
      return { success: false, message: "A reserva não está mais pendente." };
    }

    const statusReserva = decision === "APROVAR" ? "CONFIRMADA" : "REPROVADA";
    const motivoDecisao =
      decision === "REPROVAR" ? motivo?.trim() || null : motivo?.trim() || "Aprovada";

    await db.$transaction(async (tx) => {
      await tx.reserva.update({
        where: { id: idReserva },
        data: {
          statusReserva,
          dataDecisao: new Date(),
          motivoDecisao,
          idDecididoPor: currentUser.id,
        },
      });

      await tx.notificacao.create({
        data: {
          idUsuario: reserva.morador.id,
          tipo: decision === "APROVAR" ? "RESERVA_APROVADA" : "RESERVA_REPROVADA",
          titulo: decision === "APROVAR" ? "Reserva aprovada" : "Reserva reprovada",
          mensagem:
            decision === "APROVAR"
              ? `Sua solicitação para ${reserva.areaComum.nomeArea} foi aprovada.`
              : `Sua solicitação para ${reserva.areaComum.nomeArea} foi reprovada. Motivo: ${motivo?.trim()}.`,
          idReserva: reserva.id,
        },
      });

      await tx.logAtividade.create({
        data: {
          idUsuario: currentUser.id,
          acao: decision === "APROVAR" ? "APROVAR_RESERVA" : "REPROVAR_RESERVA",
          entidade: "RESERVA",
          idEntidade: reserva.id,
          detalhes: {
            area: reserva.areaComum.nomeArea,
            morador: reserva.morador.nomeCompleto,
            motivo: motivo?.trim() || null,
          },
          ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
        },
      });
    });
  } catch (error) {
    if (
      isInvalidReservaStatusValue(error, "PENDENTE") ||
      isMissingTableError(error, "notificacao")
    ) {
      return { success: false, message: GENERIC_RESERVA_MESSAGE };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientUnknownRequestError) {
      const message = error.message;

      if (message.includes("RESERVA_CONFLITO")) {
        return { success: false, message: "Conflito de horário ao confirmar a reserva." };
      }
    }

    return { success: false, message: "Não foi possível registrar a decisão da reserva." };
  }

  revalidatePath("/morador");
  revalidatePath("/morador/reservas");
  revalidatePath("/admin");
  revalidatePath("/admin/reservas");
  revalidatePath("/sindico");
  revalidatePath("/sindico/reservas");

  redirect(currentUser.tipoUsuario === "ADMINISTRADOR" ? "/admin/reservas" : "/sindico/reservas");
}
