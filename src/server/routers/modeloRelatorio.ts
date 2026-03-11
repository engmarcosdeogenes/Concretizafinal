import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const secoesSchema = z.array(z.string())

export const modeloRelatorioRouter = createTRPCRouter({
  listar: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.modeloRelatorio.findMany({
      where: { empresaId: ctx.session.empresaId },
      orderBy: { criadoEm: "asc" },
    })
  }),

  criar: protectedProcedure
    .input(z.object({
      nome: z.string().min(1),
      nomeRelatorio: z.string().min(1).default("Relatório Diário de Obra"),
      secoesVisiveis: secoesSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.modeloRelatorio.create({
        data: {
          empresaId: ctx.session.empresaId,
          nome: input.nome,
          nomeRelatorio: input.nomeRelatorio,
          secoesVisiveis: input.secoesVisiveis,
        },
      })
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id: z.string(),
      nome: z.string().min(1).optional(),
      nomeRelatorio: z.string().min(1).optional(),
      secoesVisiveis: secoesSchema.optional(),
      ativo: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.modeloRelatorio.update({
        where: { id: input.id, empresaId: ctx.session.empresaId },
        data: {
          ...(input.nome !== undefined && { nome: input.nome }),
          ...(input.nomeRelatorio !== undefined && { nomeRelatorio: input.nomeRelatorio }),
          ...(input.secoesVisiveis !== undefined && { secoesVisiveis: input.secoesVisiveis }),
          ...(input.ativo !== undefined && { ativo: input.ativo }),
        },
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.modeloRelatorio.delete({
        where: { id: input.id, empresaId: ctx.session.empresaId },
      })
      return { ok: true }
    }),
})
