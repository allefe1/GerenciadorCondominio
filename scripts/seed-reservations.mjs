import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();
const daysToSeed = 15;
const reservationsPerDay = 5;
const monthlyReservationLimit = 5;
const timeSlots = [
  ["08:00", "09:00"],
  ["10:00", "11:00"],
  ["12:00", "13:00"],
  ["14:00", "15:00"],
  ["16:00", "17:00"],
];
const nonReservableAreaNames = new Set(["Academia", "Piscina"]);
const seedPrefix = "SEED_RESERVA_DEMONSTRACAO";

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getReservationDate(daysFromNow) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

function getTimeValue(time) {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getSeedMarker(date, slotIndex) {
  return `${seedPrefix}-${formatDateInput(date)}-${slotIndex + 1}`;
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getNextMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

async function createDemoResident() {
  let sequence = 1;
  let email = "";

  do {
    email = `demo.reserva.${sequence}@condoreserva.local`;
    sequence += 1;
  } while (await db.usuario.findUnique({ where: { email }, select: { id: true } }));

  const resident = await db.usuario.create({
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

  await db.logAtividade.create({
    data: {
      idUsuario: resident.id,
      acao: "CRIAR_USUARIO_DEMONSTRACAO",
      entidade: "USUARIO",
      idEntidade: resident.id,
      detalhes: { email },
    },
  });

  return resident;
}

async function main() {
  const startDate = getReservationDate(1);
  const endDate = getReservationDate(daysToSeed + 1);
  const accountingStartDate = getMonthStart(startDate);
  const accountingEndDate = getNextMonthStart(endDate);
  const [moradores, areas, existingReservations, seededReservations] = await Promise.all([
    db.usuario.findMany({
      where: { tipoUsuario: "MORADOR", status: "ATIVO" },
      select: { id: true, nomeCompleto: true },
      orderBy: { id: "asc" },
    }),
    db.areaComum.findMany({
      where: { status: "DISPONIVEL", deletadoEm: null },
      select: { id: true, nomeArea: true },
      orderBy: { id: "asc" },
    }),
    db.reserva.findMany({
      where: {
        statusReserva: { in: ["PENDENTE", "CONFIRMADA"] },
        dataReserva: { gte: accountingStartDate, lt: accountingEndDate },
      },
      select: { idMorador: true, dataReserva: true },
    }),
    db.reserva.findMany({
      where: {
        observacaoSolicitacao: { startsWith: seedPrefix },
        dataReserva: { gte: startDate, lt: endDate },
      },
      select: { observacaoSolicitacao: true },
    }),
  ]);

  const reservableAreas = areas.filter((area) => !nonReservableAreaNames.has(area.nomeArea));
  if (moradores.length === 0 || reservableAreas.length === 0) {
    throw new Error("É necessário ter ao menos um morador ativo e uma área reservável disponível.");
  }

  const seededMarkers = new Set(
    seededReservations
      .map((reservation) => reservation.observacaoSolicitacao)
      .filter(Boolean),
  );
  const monthlyCount = new Map();

  for (const reservation of existingReservations) {
    const key = `${reservation.idMorador}-${getMonthKey(reservation.dataReserva)}`;
    monthlyCount.set(key, (monthlyCount.get(key) ?? 0) + 1);
  }

  const plan = [];
  let existing = 0;

  for (let dayOffset = 1; dayOffset <= daysToSeed; dayOffset += 1) {
    const dataReserva = getReservationDate(dayOffset);

    for (const [slotIndex, [startTime, endTime]] of timeSlots.entries()) {
      const marker = getSeedMarker(dataReserva, slotIndex);
      if (seededMarkers.has(marker)) {
        existing += 1;
        continue;
      }

      const monthKey = getMonthKey(dataReserva);
      let morador = moradores.find((candidate) => {
        const key = `${candidate.id}-${monthKey}`;
        return (monthlyCount.get(key) ?? 0) < monthlyReservationLimit;
      });

      if (!morador) {
        morador = await createDemoResident();
        moradores.push(morador);
      }

      const horaInicio = getTimeValue(startTime);
      const horaFim = getTimeValue(endTime);
      let selectedArea = null;

      for (const offset of reservableAreas.keys()) {
        const area = reservableAreas[(slotIndex + offset) % reservableAreas.length];
        const conflict = await db.reserva.findFirst({
          where: {
            idAreaComum: area.id,
            dataReserva,
            statusReserva: "CONFIRMADA",
            AND: [{ horaInicio: { lt: horaFim } }, { horaFim: { gt: horaInicio } }],
          },
          select: { id: true },
        });

        if (!conflict) {
          selectedArea = area;
          break;
        }
      }

      if (!selectedArea) {
        throw new Error(`Não há área disponível em ${formatDateInput(dataReserva)} às ${startTime}.`);
      }

      plan.push({
        morador,
        selectedArea,
        dataReserva,
        horaInicio,
        horaFim,
        startTime,
        endTime,
        marker,
      });

      const residentMonthKey = `${morador.id}-${monthKey}`;
      monthlyCount.set(residentMonthKey, (monthlyCount.get(residentMonthKey) ?? 0) + 1);
    }
  }

  await db.$transaction(async (tx) => {
    for (const reservationPlan of plan) {
      const reservation = await tx.reserva.create({
        data: {
          idMorador: reservationPlan.morador.id,
          idAreaComum: reservationPlan.selectedArea.id,
          dataReserva: reservationPlan.dataReserva,
          horaInicio: reservationPlan.horaInicio,
          horaFim: reservationPlan.horaFim,
          statusReserva: "CONFIRMADA",
          observacaoSolicitacao: reservationPlan.marker,
          dataDecisao: new Date(),
          motivoDecisao: "Reserva de demonstração cadastrada pelo sistema.",
          idDecididoPor: reservationPlan.morador.id,
        },
      });

      await tx.logAtividade.create({
        data: {
          idUsuario: reservationPlan.morador.id,
          acao: "CRIAR_RESERVA_DEMONSTRACAO",
          entidade: "RESERVA",
          idEntidade: reservation.id,
          detalhes: {
            area: reservationPlan.selectedArea.nomeArea,
            dataReserva: formatDateInput(reservationPlan.dataReserva),
            horaInicio: reservationPlan.startTime,
            horaFim: reservationPlan.endTime,
          },
        },
      });
    }
  }, { maxWait: 10_000, timeout: 120_000 });

  console.log(`Reservas criadas: ${plan.length}. Reservas já existentes: ${existing}.`);
}

main()
  .finally(() => db.$disconnect())
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
