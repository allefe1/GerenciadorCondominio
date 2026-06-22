type ExportableReservation = {
  id: number;
  dataReserva: Date;
  horaInicio: Date;
  horaFim: Date;
  statusReserva: string;
  areaComum: { nomeArea: string };
  morador: {
    nomeCompleto: string;
    email: string;
    bloco: string | null;
    apartamento: string | null;
  };
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    dateStyle: "short",
  }).format(date);
}

function formatTime(time: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  }).format(time);
}

function escapeCsvCell(value: string | number | null | undefined) {
  const normalized = String(value ?? "").replace(/[\r\n]+/g, " ");
  const protectedValue = /^[=+\-@]/.test(normalized.trimStart())
    ? `'${normalized}`
    : normalized;

  return `"${protectedValue.replace(/"/g, '""')}"`;
}

export function createReservationsCsv(reservations: ExportableReservation[]) {
  const header = [
    "ID",
    "Área",
    "Data",
    "Início",
    "Fim",
    "Status",
    "Morador",
    "E-mail",
    "Bloco",
    "Apartamento",
  ];

  const rows = reservations.map((reservation) => [
    reservation.id,
    reservation.areaComum.nomeArea,
    formatDate(reservation.dataReserva),
    formatTime(reservation.horaInicio),
    formatTime(reservation.horaFim),
    reservation.statusReserva,
    reservation.morador.nomeCompleto,
    reservation.morador.email,
    reservation.morador.bloco,
    reservation.morador.apartamento,
  ]);

  return "\uFEFF" + [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(";"))
    .join("\r\n");
}
