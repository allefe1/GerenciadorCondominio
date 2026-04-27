import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function censurarTelefone(telefone: string) {
  if (!telefone) return "";
  if (telefone.length <= 4) return telefone;
  return "*".repeat(telefone.length - 4) + telefone.slice(-4);
}
