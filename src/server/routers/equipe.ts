import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { decrypt, isEncrypted } from "@/lib/encrypt"
import { buscarCreditorPorCpf } from "@/lib/sienge/client"

async function vincularCreditorSienge(
  ctx: { db: typeof import("../db").db; session: { empresaId: string } },
  membroId: string,
  cpf: string,
) {
  const config = await ctx.db.integracaoConfig.findUnique({
    where: { empresaId: ctx.session.empresaId },
  })
  if (!config) return
  const senha = isEncrypted(config.senha) ? decrypt(config.senha) : config.senha
  const creditor = await buscarCreditorPorCpf(config.subdominio, config.usuario, senha, cpf).catch(() => null)
  if (creditor) {
    await ctx.db.membroEquipe.update({
      where: { id: membroId },
      data: { siengeCreditorId: creditor.id },
    }).catch((err: unknown) => { console.warn("[Sienge sync]", err instanceof Error ? err.message : String(err)) })
  }
}

export const equipeRouter = createTRPCRouter({

  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { id: true },
      })
      if (!obra) return []
      return ctx.db.membroEquipe.findMany({
        where: { obraId: input.obraId },
        orderBy: [{ ativo: "desc" }, { funcao: "asc" }, { nome: "asc" }],
      })
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId:      z.string(),
      nome:        z.string().min(1),
      funcao:      z.string().min(1),
      cpf:         z.string().regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional(),
      telefone:    z.string().optional(),
      empresaNome: z.string().optional(),
      dataEntrada: z.string().optional(), // ISO date
    }))
    .mutation(async ({ ctx, input }) => {
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { id: true },
      })
      if (!obra) throw new Error("Obra não encontrada")
      const membro = await ctx.db.membroEquipe.create({
        data: {
          obraId:      input.obraId,
          nome:        input.nome,
          funcao:      input.funcao,
          cpf:         input.cpf || null,
          telefone:    input.telefone || null,
          empresaNome: input.empresaNome || null,
          dataEntrada: input.dataEntrada ? new Date(input.dataEntrada) : new Date(),
        },
      })
      // Fire-and-forget: vincular ao creditor Sienge pelo CPF
      if (input.cpf) {
        vincularCreditorSienge(ctx, membro.id, input.cpf).catch((err: unknown) => { console.warn("[Sienge sync]", err instanceof Error ? err.message : String(err)) })
      }
      return membro
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.membroEquipe.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      return ctx.db.membroEquipe.delete({ where: { id: input.id } })
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:          z.string(),
      nome:        z.string().min(1).optional(),
      funcao:      z.string().min(1).optional(),
      cpf:         z.string().regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional(),
      telefone:    z.string().optional(),
      empresaNome: z.string().optional(),
      ativo:       z.boolean().optional(),
      dataSaida:   z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.membroEquipe.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      const { id, dataSaida, ...rest } = input
      const membro = await ctx.db.membroEquipe.update({
        where: { id },
        data: {
          ...rest,
          cpf:         rest.cpf !== undefined ? (rest.cpf || null) : undefined,
          telefone:    rest.telefone !== undefined ? (rest.telefone || null) : undefined,
          empresaNome: rest.empresaNome !== undefined ? (rest.empresaNome || null) : undefined,
          dataSaida:   dataSaida !== undefined
            ? (dataSaida ? new Date(dataSaida) : null)
            : undefined,
        },
      })
      // Fire-and-forget: vincular ao creditor Sienge pelo CPF se informado
      if (input.cpf) {
        vincularCreditorSienge(ctx, id, input.cpf).catch((err: unknown) => { console.warn("[Sienge sync]", err instanceof Error ? err.message : String(err)) })
      }
      return membro
    }),
})
