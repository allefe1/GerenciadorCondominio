"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireRole } from "@/lib/auth/current-user";
import { db } from "@/lib/db";

// Função utilitária para pegar o IP para os logs
function getClientIp(ip: string | null) {
  if (!ip) return null;
  return ip.split(",")[0]?.trim() || null;
}

// Esquema de validação dos dados da Área Comum
const areaSchema = z.object({
  id: z.string().optional(),
  nomeArea: z.string().min(3, "O nome da área deve ter pelo menos 3 caracteres."),
  descricao: z.string().optional(),
  capacidadeMaxima: z.coerce.number().min(1, "A capacidade deve ser de pelo menos 1 pessoa."),
  regrasUso: z.string().optional(),
  valorReserva: z.coerce.number().min(0, "O valor não pode ser negativo."),
  status: z.enum(["DISPONIVEL", "INDISPONIVEL"]).default("DISPONIVEL"),
});

export async function upsertAreaAction(_: unknown, formData: FormData) {
  const currentUser = await requireRole(["ADMINISTRADOR", "SINDICO"]);

  const parsed = areaSchema.safeParse({
    id: formData.get("id") || undefined,
    nomeArea: formData.get("nomeArea") || "",
    descricao: formData.get("descricao") || "",
    capacidadeMaxima: formData.get("capacidadeMaxima"),
    regrasUso: formData.get("regrasUso") || "",
    valorReserva: formData.get("valorReserva"),
    status: formData.get("status") || "DISPONIVEL",
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const parsedId = data.id ? Number(data.id) : null;

  if (data.id && (parsedId === null || !Number.isInteger(parsedId) || parsedId <= 0)) {
    return { success: false, message: "Identificador de área inválido." };
  }

  const commonData = {
    nomeArea: data.nomeArea,
    descricao: data.descricao || null,
    capacidadeMaxima: data.capacidadeMaxima,
    regrasUso: data.regrasUso || null,
    valorReserva: data.valorReserva,
    status: data.status,
  };

  try {
    if (data.id) {
      // UPDATE
      const updateId = parsedId as number;
      await db.areaComum.update({
        where: { id: updateId },
        data: commonData,
      });

      await db.logAtividade.create({
        data: {
          idUsuario: currentUser.id,
          acao: "EDITAR_AREA",
          entidade: "AREA_COMUM",
          idEntidade: updateId,
          detalhes: commonData,
          ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
        },
      });
    } else {
      // CREATE
      const created = await db.areaComum.create({
        data: commonData,
      });

      await db.logAtividade.create({
        data: {
          idUsuario: currentUser.id,
          acao: "CRIAR_AREA",
          entidade: "AREA_COMUM",
          idEntidade: created.id,
          detalhes: commonData,
          ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
        },
      });
    }
  } catch (error) {
    console.error("ERRO AO SALVAR AREA:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Já existe uma área cadastrada com este nome." };
    }
    return { success: false, message: "Não foi possível salvar a área." };
  }

  revalidatePath("/admin/areas");
  revalidatePath("/sindico/areas");

  return {
    success: true,
    message: data.id ? "Área atualizada com sucesso." : "Área criada com sucesso.",
  };
}

// SOFT DELETE: Apenas preenche o campo deletadoEm
export async function deleteAreaAction(formData: FormData) {
  const currentUser = await requireRole(["ADMINISTRADOR", "SINDICO"]);
  const id = Number(formData.get("id"));

  if (Number.isNaN(id) || id <= 0) {
    console.error("Identificador inválido para delete.");
    return;
  }

  try {
    await db.areaComum.update({
      where: { id },
      data: { deletadoEm: new Date() }, // <-- O Soft Delete acontecendo aqui!
    });

    await db.logAtividade.create({
      data: {
        idUsuario: currentUser.id,
        acao: "DELETAR_AREA",
        entidade: "AREA_COMUM",
        idEntidade: id,
        detalhes: "Área excluída (soft delete)",
        ipAddress: getClientIp((await headers()).get("x-forwarded-for")),
      },
    });
  } catch (error) {
    console.error("ERRO AO DELETAR AREA:", error);
    return;
  }

  revalidatePath("/admin/areas");
  revalidatePath("/sindico/areas");
}