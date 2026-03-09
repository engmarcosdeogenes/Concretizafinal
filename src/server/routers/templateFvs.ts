import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const templateFvsRouter = createTRPCRouter({

  listar: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.templateFVS.findMany({
        where: { empresaId: ctx.session.empresaId },
        include: { itens: { orderBy: { ordem: "asc" } } },
        orderBy: { createdAt: "desc" },
      })
    }),

  criar: protectedProcedure
    .input(z.object({
      nome:    z.string().min(1),
      servico: z.string().min(1),
      itens:   z.array(z.object({ descricao: z.string().min(1) })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { nome, servico, itens } = input
      return ctx.db.$transaction(async (tx) => {
        const template = await tx.templateFVS.create({
          data: { nome, servico, empresaId: ctx.session.empresaId },
        })
        if (itens.length > 0) {
          await tx.templateFVSItem.createMany({
            data: itens.map((item, i) => ({
              templateId: template.id,
              descricao:  item.descricao,
              ordem:      i,
            })),
          })
        }
        return template
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const t = await ctx.db.templateFVS.findFirst({
        where: { id: input.id, empresaId: ctx.session.empresaId },
      })
      if (!t) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.templateFVS.delete({ where: { id: input.id } })
    }),
})
