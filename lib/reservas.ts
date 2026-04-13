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
    dateStyle: "short",
  }).format(date);
}

export function formatTimeBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}
