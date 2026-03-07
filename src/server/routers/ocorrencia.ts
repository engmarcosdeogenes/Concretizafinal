import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const ocorrenciaRouter = createTRPCRouter({
  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ocorrencia.findMany({
        where: {
          obraId: input.obraId,
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          responsavel: { select: { nome: true } },
        },
        orderBy: [{ prioridade: "desc" }, { data: "desc" }],
      })
    }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ocorrencia = await ctx.db.ocorrencia.findFirst({
        where: {
          id: input.id,
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          responsavel: { select: { nome: true } },
        },
      })
      if (!ocorrencia) throw new TRPCError({ code: "NOT_FOUND", message: "Ocorrência não encontrada" })
      return ocorrencia
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      titulo: z.string().min(1),
      tipo: z.enum(["SEGURANCA", "QUALIDADE", "PRAZO", "CUSTO", "AMBIENTAL", "OUTRO"]),
      prioridade: z.number().int().min(1).max(3).default(2),
      descricao: z.string().optional(),
      data: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { obraId, data, ...rest } = input

      const obra = await ctx.db.obra.findFirst({
        where: { id: obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      return ctx.db.ocorrencia.create({
        data: {
          obraId,
          data: new Date(data),
          responsavelId: ctx.session.userId,
          ...rest,
        },
      })
    }),

  atualizarStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["ABERTA", "EM_ANALISE", "RESOLVIDA", "FECHADA"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const ocorrencia = await ctx.db.ocorrencia.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!ocorrencia) throw new TRPCError({ code: "NOT_FOUND" })

      return ctx.db.ocorrencia.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    }),
})
