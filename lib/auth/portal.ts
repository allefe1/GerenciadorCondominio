import type { TipoUsuario } from "@prisma/client";

export const loginPortalRoutes: Record<TipoUsuario, string> = {
  MORADOR: "/login",
  ADMINISTRADOR: "/login",
  SINDICO: "/login",
};

export const loginPortalContent = {
  MORADOR: {
    eyebrow: "Portal do Morador",
    title: "Acesse sua conta",
    description: "Consulte disponibilidade, acompanhe reservas e gerencie seu perfil.",
    accentClassName: "bg-brand-gradient",
    badge: "Moradores",
    sideTitle: "Reservas e rotinas do seu condominio",
    sideDescription:
      "Um portal unico para consultar areas comuns, solicitar reservas e acompanhar aprovacoes.",
    demoAccounts: [
      { email: "morador@condo.com", password: "Morador@123", role: "Morador" },
    ],
    alternateHref: "/login/admin",
    alternateLabel: "Entrar como administrador ou sindico",
  },
  ADMINISTRADOR: {
    eyebrow: "Portal Administrativo",
    title: "Login do administrador",
    description: "Acesso restrito para gerenciamento operacional do condominio.",
    accentClassName: "bg-[#1A1A2E]",
    badge: "Administracao",
    sideTitle: "Operacao e governanca",
    sideDescription:
      "Gerencie moradores, acompanhe reservas, auditoria e fluxos administrativos.",
    demoAccounts: [
      { email: "admin@condo.com", password: "Admin@123", role: "Administrador" },
    ],
    alternateHref: "/login/morador",
    alternateLabel: "Voltar para o portal do morador",
  },
  SINDICO: {
    eyebrow: "Portal do Sindico",
    title: "Login do sindico",
    description: "Acesso restrito para supervisao, aprovacoes e visao executiva.",
    accentClassName: "bg-[#2A174B]",
    badge: "Sindico",
    sideTitle: "Supervisao e decisao",
    sideDescription:
      "Acompanhe pendencias, aprove reservas e monitore os indicadores do condominio.",
    demoAccounts: [
      { email: "sindico@condoreserva.com", password: "Sindico@123", role: "Sindico" },
    ],
    alternateHref: "/login/morador",
    alternateLabel: "Voltar para o portal do morador",
  },
} as const;
