export function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export const NON_RESERVABLE_AREA_NAMES = ["Academia", "Piscina"] as const;

export function isReservableAreaName(name: string) {
  return !NON_RESERVABLE_AREA_NAMES.includes(name as (typeof NON_RESERVABLE_AREA_NAMES)[number]);
}

export function startOfDay(date: string) {
  return new Date(`${date}T00:00:00`);
}

export function formatDateBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    dateStyle: "short",
  }).format(date);
}

export function formatTimeBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
