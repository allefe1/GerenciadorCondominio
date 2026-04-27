"use server";

import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedUser, requireRole } from "@/lib/auth/current-user";
import { isInvalidReservaStatusValue } from "@/lib/db-compat";
import { db } from "@/lib/db";
import { getPasswordPolicyMessage, isStrongPassword } from "@/lib/auth/password";
import { normalizePermissions, requiresHousingFields } from "@/lib/users";

function getClientIp(ip: string | null) {
  if (!ip) {
    return null;
  }

  return ip.split(",")[0]?.trim() || null;
}

const profileSchema = z.object({
  nomeCompleto: z.string().trim().min(1, "O nome não pode estar vazio.").min(3, "Informe o nome completo.").regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s']+$/, "O nome deve conter apenas letras e espaços."),
  telefone: z.string().trim().refine((val) => !val || /^[\d\s\-\+\(\)]+$/.test(val), "O telefone deve conter apenas números e símbolos válidos.").optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual."),
  newPassword: z.string().min(1, "Informe a nova senha."),
  confirmPassword: z.string().min(1, "Confirme a nova senha."),
});

const userSchema = z.object({
  id: z.string().optional(),
  tipoUsuario: z.enum(["MORADOR", "ADMINISTRADOR", "SINDICO"]),
  nomeCompleto: z.string().trim().min(1, "O nome não pode estar vazio.").min(3, "Informe o nome completo.").regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s']+$/, "O nome deve conter apenas letras e espaços."),
  email: z.string().trim().min(1, "O e-mail não pode estar vazio.").email("Informe um e-mail válido."),
  telefone: z.string().trim().refine((val) => !val || /^[\d\s\-\+\(\)]+$/.test(val), "O telefone deve conter apenas números e símbolos válidos.").optional(),
  apartamento: z.string().trim().optional(),
  bloco: z.string().trim().optional(),
  permissoesAcesso: z.array(z.string()).optional(),
  senha: z.string().optional(),
});

export async function updateMyProfileAction(_: unknown, formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = profileSchema.safeParse({
    nomeCompleto: formData.get("nomeCompleto"),
    telefone: formData.get("telefone"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.usuario.update({
    where: { id: user.id },
    data: {
      nomeCompleto: parsed.data.nomeCompleto,
      telefone: parsed.data.telefone || null,
    },
  });

  await db.logAtividade.create({
    data: {
      idUsuario: user.id,
      acao: "EDITAR_PERFIL",
      entidade: "USUARIO",
      idEntidade: user.id,
      detalhes: parsed.data,
      ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
    },
  });

  revalidatePath("/perfil");

  return { success: true, message: "Perfil atualizado com sucesso." };
}

export async function changeMyPasswordAction(_: unknown, formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
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
    return { success: false, message: "A confirmação da senha não confere." };
  }

  const dbUser = await db.usuario.findUnique({ where: { id: user.id } });

  if (!dbUser) {
    return { success: false, message: "Usuário não encontrado." };
  }

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.senha);

  if (!valid) {
    return { success: false, message: "Senha atual incorreta." };
  }

  await db.usuario.update({
    where: { id: user.id },
    data: {
      senha: await hash(parsed.data.newPassword, 12),
    },
  });

  await db.logAtividade.create({
    data: {
      idUsuario: user.id,
      acao: "ALTERAR_SENHA",
      entidade: "USUARIO",
      idEntidade: user.id,
      detalhes: {},
      ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
    },
  });

  return { success: true, message: "Senha alterada com sucesso." };
}

export async function upsertUserAction(_: unknown, formData: FormData) {
  const currentUser = await requireRole(["ADMINISTRADOR", "SINDICO"]);

  // Trata os valores null convertendo para undefined ou string vazia para o Zod
  const parsed = userSchema.safeParse({
    id: formData.get("id") || undefined,
    tipoUsuario: formData.get("tipoUsuario"),
    nomeCompleto: formData.get("nomeCompleto") || "",
    email: formData.get("email") || "",
    telefone: formData.get("telefone") || undefined,
    apartamento: formData.get("apartamento") || undefined,
    bloco: formData.get("bloco") || undefined,
    permissoesAcesso: formData.getAll("permissoesAcesso"),
    senha: formData.get("senha") || undefined,
  });

  if (!parsed.success) {
    return { 
      success: false, 
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      fields: Object.fromEntries(formData.entries()) as Record<string, string>
    };
  }

  const data = parsed.data;
  const parsedId = data.id ? Number(data.id) : null;
  const isMorador = requiresHousingFields(data.tipoUsuario);

  if (data.id && (parsedId === null || !Number.isInteger(parsedId) || parsedId <= 0)) {
    return { success: false, message: "Identificador de usuário inválido.", fields: Object.fromEntries(formData.entries()) as Record<string, string> };
  }

  if (isMorador && (!data.apartamento || !data.bloco)) {
    return { success: false, message: "Morador exige apartamento e bloco.", fields: Object.fromEntries(formData.entries()) as Record<string, string> };
  }

  // Gera a senha padrão: Primeira palavra do nome (Capitalizada) + @123
  const primeiroNome = data.nomeCompleto.trim().split(" ")[0];
  const nomeFormatado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
  // Valida a senha apenas se o admin decidir digitar uma senha manualmente
  // Pega o tipo de usuário e capitaliza (Ex: MORADOR vira Morador, SINDICO vira Sindico)
  const prefixo = data.tipoUsuario.charAt(0).toUpperCase() + data.tipoUsuario.slice(1).toLowerCase();
  
  // Tenta pegar os 3 últimos dígitos do telefone. Se não tiver, usa "123" como plano B.
  let sufixo = "123";
  if (data.telefone) {
    const apenasNumeros = data.telefone.replace(/\D/g, ""); // Tira os parênteses e traços da máscara
    if (apenasNumeros.length >= 3) {
      sufixo = apenasNumeros.slice(-3);
    }
  }
  
  const senhaPadrao = `${prefixo}@${sufixo}`; // Ex: Morador@003, Administrador@123

  const commonData = {
    tipoUsuario: data.tipoUsuario,
    nomeCompleto: data.nomeCompleto,
    email: data.email.toLowerCase().trim(),
    telefone: data.telefone || null,
    apartamento: isMorador ? data.apartamento || null : null,
    bloco: isMorador ? data.bloco || null : null,
    permissoesAcesso: isMorador ? [] : normalizePermissions(data.permissoesAcesso || []),
  };

  try {
    if (data.id) {
      const updateId = parsedId as number;
      await db.usuario.update({
        where: { id: updateId },
        data: {
          ...commonData,
          // Se o admin preencheu a senha na edição, atualiza. Se não, mantém a atual.
          ...(data.senha ? { senha: await hash(data.senha, 12) } : {}),
        },
      });

      await db.logAtividade.create({
        data: {
          idUsuario: currentUser.id,
          acao: "EDITAR_USUARIO",
          entidade: "USUARIO",
          idEntidade: updateId,
          detalhes: commonData,
          ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
        },
      });
    } else {
      // Define a senha final: a digitada no form ou a gerada automaticamente
      const senhaFinal = data.senha ? data.senha : senhaPadrao;

      const created = await db.usuario.create({
        data: {
          ...commonData,
          senha: await hash(senhaFinal, 12),
          status: "ATIVO",
          primeiroAcesso: true, // Garante o fluxo de troca de senha no primeiro login
        },
      });

      await db.logAtividade.create({
        data: {
          idUsuario: currentUser.id,
          acao: "CRIAR_USUARIO",
          entidade: "USUARIO",
          idEntidade: created.id,
          detalhes: { ...commonData, gerouSenhaAutomatica: !data.senha },
          ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
        },
      });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Já existe usuário com este e-mail.", fields: Object.fromEntries(formData.entries()) as Record<string, string> };
    }

    return { success: false, message: "Não foi possível salvar o usuário.", fields: Object.fromEntries(formData.entries()) as Record<string, string> };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/sindico/usuarios");

  return {
    success: true,
    message: data.id ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso.",
  };
}

export async function toggleUserStatusAction(formData: FormData) {
  const currentUser = await requireRole(["ADMINISTRADOR", "SINDICO"]);
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0 || id === currentUser.id) {
    return;
  }

  const user = await db.usuario.findUnique({ where: { id } });

  if (!user) {
    return;
  }

  const nextStatus = user.status === "ATIVO" ? "INATIVO" : "ATIVO";

  await db.usuario.update({
    where: { id },
    data: { status: nextStatus },
  });

  await db.logAtividade.create({
    data: {
      idUsuario: currentUser.id,
      acao: nextStatus === "ATIVO" ? "ATIVAR_USUARIO" : "INATIVAR_USUARIO",
      entidade: "USUARIO",
      idEntidade: id,
      detalhes: { status: nextStatus },
      ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/sindico/usuarios");
  revalidatePath("/admin");
  revalidatePath("/sindico");
}

export async function deleteMoradorAction(formData: FormData) {
  const currentUser = await requireRole(["ADMINISTRADOR", "SINDICO"]);
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0 || id === currentUser.id) {
    return;
  }

  const user = await getMoradorForDeletion(id);

  if (!user || user.tipoUsuario !== "MORADOR") {
    return;
  }

  if (user.reservasMorador.length > 0) {
    return;
  }

  await db.usuario.delete({ where: { id } });

  await db.logAtividade.create({
    data: {
      idUsuario: currentUser.id,
      acao: "EXCLUIR_MORADOR",
      entidade: "USUARIO",
      idEntidade: id,
      detalhes: { email: user.email },
      ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/sindico/usuarios");
  revalidatePath("/admin");
  revalidatePath("/sindico");
}

async function getMoradorForDeletion(id: number) {
  try {
    return await db.usuario.findUnique({
      where: { id },
      include: {
        reservasMorador: {
          where: {
            statusReserva: {
              in: ["PENDENTE", "CONFIRMADA"],
            },
          },
        },
      },
    });
  } catch (error) {
    if (!isInvalidReservaStatusValue(error, "PENDENTE")) {
      throw error;
    }

    return db.usuario.findUnique({
      where: { id },
      include: {
        reservasMorador: {
          where: {
            statusReserva: "CONFIRMADA",
          },
        },
      },
    });
  }
}
