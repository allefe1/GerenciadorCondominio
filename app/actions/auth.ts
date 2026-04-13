"use server";

import { compare } from "bcryptjs";
import { hash } from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

import { db } from "@/lib/db";
import { dashboardRoutes } from "@/lib/navigation";
import { loginSchema } from "@/lib/auth/login-schema";
import { loginPortalRoutes } from "@/lib/auth/portal";
import { getPasswordPolicyMessage, isStrongPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/session";
import { sendResetPasswordMail } from "@/lib/mail";

const SESSION_COOKIE = "condoreserva.session";
const GENERIC_DB_MESSAGE =
  "A aplicação não conseguiu acessar o banco de dados corretamente. Revise o bootstrap local antes de continuar.";

function getClientIp(ip: string | null) {
  if (!ip) {
    return null;
  }

  return ip.split(",")[0]?.trim() || null;
}

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    portal: formData.get("portal"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const password = parsed.data.password;
  const portal = parsed.data.portal;

  let user;
  try {
    user = await db.usuario.findUnique({ where: { email } });
  } catch {
    return { success: false, message: GENERIC_DB_MESSAGE };
  }

  if (!user) {
    return { success: false, message: "E-mail ou senha incorretos." };
  }

  const now = new Date();
  if (user.bloqueadoAte && user.bloqueadoAte > now) {
    return {
      success: false,
      message: `Conta bloqueada até ${user.bloqueadoAte.toLocaleString("pt-BR")}.`,
    };
  }

  if (user.status !== "ATIVO") {
    return {
      success: false,
      message: "Usuário inativo. Entre em contato com a administração do condomínio.",
    };
  }

  if (user.tipoUsuario !== portal) {
    return {
      success: false,
      message:
        "Este usuario nao pode autenticar neste portal. Use a rota de login correspondente ao seu perfil.",
    };
  }

  const passwordMatches = await compare(password, user.senha);

  if (!passwordMatches) {
    const nextAttempts = Math.min(user.tentativasLogin + 1, 3);
    const shouldBlock = nextAttempts >= 3;

    try {
      await db.usuario.update({
        where: { id: user.id },
        data: {
          tentativasLogin: shouldBlock ? 3 : nextAttempts,
          bloqueadoAte: shouldBlock
            ? new Date(now.getTime() + 15 * 60 * 1000)
            : null,
        },
      });

      await db.logAtividade.create({
        data: {
          idUsuario: user.id,
          acao: "LOGIN_FALHA",
          entidade: "USUARIO",
          idEntidade: user.id,
          detalhes: { email, tentativas: nextAttempts, portal },
          ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
        },
      });
    } catch {
      return { success: false, message: GENERIC_DB_MESSAGE };
    }

    return {
      success: false,
      message: shouldBlock
        ? "Conta bloqueada por 15 minutos após 3 tentativas inválidas."
        : "E-mail ou senha incorretos.",
    };
  }

  try {
    await db.usuario.update({
      where: { id: user.id },
      data: {
        tentativasLogin: 0,
        bloqueadoAte: null,
      },
    });

    await db.logAtividade.create({
      data: {
        idUsuario: user.id,
        acao: "LOGIN",
        entidade: "USUARIO",
        idEntidade: user.id,
        detalhes: { email, portal },
        ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
      },
    });
  } catch {
    return { success: false, message: GENERIC_DB_MESSAGE };
  }

  const token = await signSession({
    sub: String(user.id),
    role: user.tipoUsuario,
    name: user.nomeCompleto,
    email: user.email,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(dashboardRoutes[user.tipoUsuario]);
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect(loginPortalRoutes.MORADOR);
}

export async function requestPasswordResetAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    return { success: false, message: "Informe o e-mail para recuperação." };
  }

  let user;
  try {
    user = await db.usuario.findUnique({ where: { email } });
  } catch {
    return { success: false, message: GENERIC_DB_MESSAGE };
  }

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    try {
      await db.recuperacaoSenha.updateMany({
        where: {
          idUsuario: user.id,
          usadoEm: null,
        },
        data: {
          usadoEm: new Date(),
        },
      });

      await db.recuperacaoSenha.create({
        data: {
          idUsuario: user.id,
          token,
          expiraEm: expiresAt,
        },
      });

      await sendResetPasswordMail({
        to: user.email,
        name: user.nomeCompleto,
        token,
      });

      await db.logAtividade.create({
        data: {
          idUsuario: user.id,
          acao: "SOLICITAR_RECUPERACAO_SENHA",
          entidade: "USUARIO",
          idEntidade: user.id,
          detalhes: { email: user.email },
          ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
        },
      });
    } catch {
      return { success: false, message: GENERIC_DB_MESSAGE };
    }
  }

  return {
    success: true,
    message: "Se o e-mail existir, enviaremos um link de recuperação.",
  };
}

export async function resetPasswordAction(
  token: string,
  _: unknown,
  formData: FormData,
) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!isStrongPassword(password)) {
    return { success: false, message: getPasswordPolicyMessage() };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "A confirmação de senha não confere." };
  }

  let recovery;
  try {
    recovery = await db.recuperacaoSenha.findUnique({
      where: { token },
      include: { usuario: true },
    });
  } catch {
    return { success: false, message: GENERIC_DB_MESSAGE };
  }

  if (!recovery || recovery.usadoEm || recovery.expiraEm < new Date()) {
    return { success: false, message: "Token inválido ou expirado." };
  }

  const hashedPassword = await hash(password, 12);

  try {
    await db.usuario.update({
      where: { id: recovery.idUsuario },
      data: {
        senha: hashedPassword,
        tentativasLogin: 0,
        bloqueadoAte: null,
      },
    });

    await db.recuperacaoSenha.update({
      where: { id: recovery.id },
      data: {
        usadoEm: new Date(),
      },
    });

    await db.logAtividade.create({
      data: {
        idUsuario: recovery.idUsuario,
        acao: "REDEFINIR_SENHA",
        entidade: "USUARIO",
        idEntidade: recovery.idUsuario,
        detalhes: { email: recovery.usuario.email },
        ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
      },
    });
  } catch {
    return { success: false, message: GENERIC_DB_MESSAGE };
  }

  return { success: true, message: "Senha redefinida com sucesso. Faça login." };
}
