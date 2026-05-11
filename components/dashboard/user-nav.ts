import type { TipoUsuario } from "@prisma/client";

export function getNavItems(role: TipoUsuario) {
  const homeHref =
    role === "ADMINISTRADOR" ? "/admin" : role === "SINDICO" ? "/sindico" : "/morador";
  const reservasHref =
    role === "ADMINISTRADOR"
      ? "/admin/reservas"
      : role === "SINDICO"
        ? "/sindico/reservas"
        : "/morador/reservas";

  const base = [
    { href: homeHref, label: "Home" },
    { href: reservasHref, label: "Reservas" },
    { href: "/perfil", label: "Perfil" },
  ];

  if (role === "ADMINISTRADOR" || role === "SINDICO") {
    // Injetamos Usuários e Áreas de uma vez só!
    base.splice(
      1,
      0,
      {
        href: role === "ADMINISTRADOR" ? "/admin/usuarios" : "/sindico/usuarios",
        label: "Usuarios",
      },
      {
        href: role === "ADMINISTRADOR" ? "/admin/areas" : "/sindico/areas",
        label: "Areas",
      }
    );
  }

  return base;
}