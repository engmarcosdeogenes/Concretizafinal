import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const materialRouter = createTRPCRouter({

  listar: protectedProcedure.query(async ({ ctx }) => {
    const { empresaId } = ctx.session
    return ctx.db.materialCatalogo.findMany({
      where: { empresaId },
      orderBy: [{ categoria: "asc" }, { nome: "asc" }],
    })
  }),

  criar: protectedProcedure
    .input(z.object({
      nome:          z.string().min(1),
      unidade:       z.string().min(1),
      descricao:     z.string().optional(),
      categoria:     z.string().optional(),
      precoUnitario: z.number().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      return ctx.db.materialCatalogo.create({
        data: {
          empresaId,
          nome:          input.nome,
          unidade:       input.unidade,
          descricao:     input.descricao || null,
          categoria:     input.categoria || null,
          precoUnitario: input.precoUnitario ?? null,
        },
      })
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:            z.string(),
      nome:          z.string().min(1).optional(),
      unidade:       z.string().min(1).optional(),
      descricao:     z.string().optional(),
      categoria:     z.string().optional(),
      precoUnitario: z.number().positive().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.materialCatalogo.update({
        where: { id, empresaId: ctx.session.empresaId },
        data: {
          ...data,
          descricao:     data.descricao !== undefined ? (data.descricao || null) : undefined,
          categoria:     data.categoria !== undefined ? (data.categoria || null) : undefined,
        },
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.materialCatalogo.delete({
        where: { id: input.id, empresaId: ctx.session.empresaId },
      })
    }),
})
