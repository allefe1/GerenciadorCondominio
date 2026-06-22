import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();
const slots = [
  ["14:00", "15:00"],
  ["15:00", "16:00"],
  ["16:00", "17:00"],
  ["17:00", "18:00"],
  ["18:00", "19:00"],
];
const seedPrefix = "SEED_RESERVA_DEMONSTRACAO_HOJE";

function timeValue(time) {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

async function createDemoResident() {
  let sequence = 1;
  let email = "";

  do {
    email = `demo.reserva.${sequence}@condoreserva.local`;
    sequence += 1;
  } while (await db.usuario.findUnique({ where: { email }, select: { id: true } }));

  return db.usuario.create({
    data: {
      tipoUsuario: "MORADOR",
      nomeCompleto: `Morador Demonstração ${sequence - 1}`,
      email,
      senha: await hash(randomBytes(32).toString("base64url"), 12),
      status: "ATIVO",
      apartamento: `DEMO-${sequence - 1}`,
      bloco: "DEMO",
      permissoesAcesso: [],
      primeiroAcesso: false,
    },
    select: { id: true, nomeCompleto: true },
  });
}

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const [moradores, areas, monthlyReservations, existing] = await Promise.all([
    db.usuario.findMany({
      where: { tipoUsuario: "MORADOR", status: "ATIVO" },
      select: { id: true, nomeCompleto: true },
      orderBy: { id: "asc" },
    }),
    db.areaComum.findMany({
      where: {
        status: "DISPONIVEL",
        deletadoEm: null,
        nomeArea: { notIn: ["Academia", "Piscina"] },
      },
      select: { id: true, nomeArea: true },
      orderBy: { id: "asc" },
    }),
    db.reserva.findMany({
      where: {
        statusReserva: { in: ["PENDENTE", "CONFIRMADA"] },
        dataReserva: { gte: monthStart, lt: nextMonthStart },
      },
      select: { idMorador: true },
    }),
    db.reserva.findMany({
      where: {
        observacaoSolicitacao: { startsWith: seedPrefix },
        dataReserva: today,
      },
      select: { observacaoSolicitacao: true },
    }),
  ]);

  if (areas.length === 0) {
    throw new Error("Nenhuma área reservável está disponível.");
  }

  const existingMarkers = new Set(existing.map((item) => item.observacaoSolicitacao));
  const monthlyCount = new Map();
  for (const reservation of monthlyReservations) {
    monthlyCount.set(
      reservation.idMorador,
      (monthlyCount.get(reservation.idMorador) ?? 0) + 1,
    );
  }

  const plan = [];
  for (const [index, [start, end]] of slots.entries()) {
    const marker = `${seedPrefix}-${index + 1}`;
    if (existingMarkers.has(marker)) {
      continue;
    }

    let morador = moradores.find(
      (candidate) => (monthlyCount.get(candidate.id) ?? 0) < 5,
    );
    if (!morador) {
      morador = await createDemoResident();
      moradores.push(morador);
    }

    const horaInicio = timeValue(start);
    const horaFim = timeValue(end);
    const area = await db.areaComum.findFirst({
      where: {
        id: { in: areas.map((item) => item.id) },
        reservas: {
          none: {
            dataReserva: today,
            statusReserva: "CONFIRMADA",
            AND: [{ horaInicio: { lt: horaFim } }, { horaFim: { gt: horaInicio } }],
          },
        },
      },
      orderBy: { id: "asc" },
      select: { id: true, nomeArea: true },
    });

    if (!area) {
      throw new Error(`Nenhuma área livre para ${start}.`);
    }

    plan.push({ morador, area, horaInicio, horaFim, start, end, marker });
    monthlyCount.set(morador.id, (monthlyCount.get(morador.id) ?? 0) + 1);
  }

  await db.$transaction(async (tx) => {
    for (const item of plan) {
      const reservation = await tx.reserva.create({
        data: {
          idMorador: item.morador.id,
          idAreaComum: item.area.id,
          dataReserva: today,
          horaInicio: item.horaInicio,
          horaFim: item.horaFim,
          statusReserva: "CONFIRMADA",
          observacaoSolicitacao: item.marker,
          dataDecisao: new Date(),
          motivoDecisao: "Reserva de demonstração cadastrada pelo sistema.",
          idDecididoPor: item.morador.id,
        },
      });

      await tx.logAtividade.create({
        data: {
          idUsuario: item.morador.id,
          acao: "CRIAR_RESERVA_DEMONSTRACAO",
          entidade: "RESERVA",
          idEntidade: reservation.id,
          detalhes: { area: item.area.nomeArea, horaInicio: item.start, horaFim: item.end },
        },
      });
    }
  });

  console.log(`Reservas criadas: ${plan.length}.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
