import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { TipoUsuario, Usuario } from "@prisma/client";

import { dashboardRoutes } from "@/lib/navigation";
import { db } from "@/lib/db";
import { loginPortalRoutes } from "@/lib/auth/portal";
import { verifySession } from "@/lib/auth/session";

const SESSION_COOKIE = "condoreserva.session";

export type CurrentUser = Pick<
  Usuario,
  | "id"
  | "email"
  | "nomeCompleto"
  | "telefone"
  | "tipoUsuario"
  | "status"
  | "apartamento"
  | "bloco"
  | "permissoesAcesso"
>;

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const session = await verifySession(token);
    const user = await db.usuario.findUnique({
      where: { id: Number(session.sub) },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        telefone: true,
        tipoUsuario: true,
        status: true,
        apartamento: true,
        bloco: true,
        permissoesAcesso: true,
      },
    });

    if (!user || user.status !== "ATIVO") {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: TipoUsuario[]) {
  const user = await requireAuthenticatedUser();

  if (!roles.includes(user.tipoUsuario)) {
    redirect(dashboardRoutes[user.tipoUsuario]);
  }

  return user;
}
