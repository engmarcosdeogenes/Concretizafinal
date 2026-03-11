import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const tarefaObraRouter = createTRPCRouter({
  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tarefaObra.findMany({
        where: { obraId: input.obraId, obra: { empresaId: ctx.session.empresaId } },
        include: { filhos: { orderBy: { ordem: "asc" } } },
        orderBy: { ordem: "asc" },
      })
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId:          z.string(),
      codigo:          z.string().optional(),
      nome:            z.string().min(1),
      setor:           z.string().optional(),
      unidade:         z.string().default("un"),
      quantidadeTotal: z.number().min(0).default(0),
      parentId:        z.string().optional(),
      ordem:           z.number().int().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new Error("Obra não encontrada")
      return ctx.db.tarefaObra.create({ data: input })
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:              z.string(),
      codigo:          z.string().optional().nullable(),
      nome:            z.string().min(1).optional(),
      setor:           z.string().optional().nullable(),
      unidade:         z.string().optional(),
      quantidadeTotal: z.number().min(0).optional(),
      ordem:           z.number().int().optional(),
      status:          z.enum(["NAO_INICIADO","EM_ANDAMENTO","CONCLUIDO","SUSPENSO"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      await ctx.db.tarefaObra.findFirstOrThrow({
        where: { id, obra: { empresaId: ctx.session.empresaId } },
      })
      return ctx.db.tarefaObra.update({ where: { id }, data })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.tarefaObra.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      return ctx.db.tarefaObra.delete({ where: { id: input.id } })
    }),
})
