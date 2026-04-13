import type { TipoUsuario } from "@prisma/client";

export const permissionOptions = [
  "GERENCIAR_MORADORES",
  "GERENCIAR_AREAS",
  "GERENCIAR_RESERVAS",
  "GERENCIAR_ADMINISTRADORES",
] as const;

export function normalizePermissions(input: string | string[]) {
  const values = Array.isArray(input) ? input : input.split(",");

  return values
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((value) => permissionOptions.includes(value as (typeof permissionOptions)[number]));
}

export function requiresHousingFields(role: TipoUsuario) {
  return role === "MORADOR";
}
