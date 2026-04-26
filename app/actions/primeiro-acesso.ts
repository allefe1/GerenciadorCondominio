"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { getPasswordPolicyMessage, isStrongPassword } from "@/lib/auth/password";

const firstAccessSchema = z.object({
  newPassword: z.string().min(1, "Informe a nova senha."),
  confirmPassword: z.string().min(1, "Confirme a nova senha."),
});

export async function updateFirstAccessPasswordAction(_: unknown, formData: FormData) {
  // Pega o usuário que acabou de logar (mas que ainda tem o acesso restrito)
  const user = await requireAuthenticatedUser();

  const parsed = firstAccessSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (!isStrongPassword(parsed.data.newPassword)) {
    return { success: false, message: getPasswordPolicyMessage() };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { success: false, message: "As senhas não conferem. Digite novamente." };
  }

  // Atualiza a senha no banco e marca que não é mais o primeiro acesso
  await db.usuario.update({
    where: { id: user.id },
    data: {
      senha: await hash(parsed.data.newPassword, 12),
      primeiroAcesso: false, // Libera o usuário!
    },
  });

  // Grava no log de segurança
  await db.logAtividade.create({
    data: {
      idUsuario: user.id,
      acao: "PRIMEIRO_ACESSO_SENHA",
      entidade: "USUARIO",
      idEntidade: user.id,
      detalhes: "Usuário definiu a senha definitiva no primeiro login.",
    },
  });

  // Redireciona o usuário para o painel correto de acordo com o tipo
  if (user.tipoUsuario === "MORADOR") {
    redirect("/morador/reservas");
  } else if (user.tipoUsuario === "ADMINISTRADOR") {
    redirect("/admin");
  } else {
    redirect("/sindico");
  }
}