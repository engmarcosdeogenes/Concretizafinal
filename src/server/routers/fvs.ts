import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const fvsRouter = createTRPCRouter({
  listar: protectedProcedure
    .input(z.object({ obraId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.fVS.findMany({
        where: {
          ...(input.obraId ? { obraId: input.obraId } : {}),
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          itens: true,
          responsavel: { select: { nome: true } },
        },
        orderBy: { data: "desc" },
      })
    }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const fvs = await ctx.db.fVS.findFirst({
        where: {
          id: input.id,
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          itens: true,
          responsavel: { select: { nome: true } },
        },
      })
      if (!fvs) throw new TRPCError({ code: "NOT_FOUND", message: "FVS não encontrada" })
      return fvs
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      servico: z.string().min(1),
      codigo: z.string().optional(),
      data: z.string(),
      observacoes: z.string().optional(),
      itens: z.array(z.object({ descricao: z.string().min(1) })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { obraId, data, itens, ...rest } = input

      const obra = await ctx.db.obra.findFirst({
        where: { id: obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      return ctx.db.$transaction(async (tx) => {
        const fvs = await tx.fVS.create({
          data: {
            obraId,
            data: new Date(data),
            responsavelId: ctx.session.userId,
            ...rest,
          },
        })

        if (itens.length > 0) {
          await tx.fVSItem.createMany({
            data: itens.map((item) => ({ descricao: item.descricao, fvsId: fvs.id })),
          })
        }

        return fvs
      })
    }),

  atualizarStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["PENDENTE", "EM_INSPECAO", "APROVADO", "REJEITADO", "RETRABALHO"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const fvs = await ctx.db.fVS.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!fvs) throw new TRPCError({ code: "NOT_FOUND" })

      return ctx.db.fVS.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    }),

  aprovarItem: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      aprovado: z.boolean().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verifica ownership via join FVSItem → FVS → Obra
      const item = await ctx.db.fVSItem.findFirst({
        where: {
          id: input.itemId,
          fvs: { obra: { empresaId: ctx.session.empresaId } },
        },
      })
      if (!item) throw new TRPCError({ code: "NOT_FOUND" })

      return ctx.db.fVSItem.update({
        where: { id: input.itemId },
        data: { aprovado: input.aprovado },
      })
    }),
})
