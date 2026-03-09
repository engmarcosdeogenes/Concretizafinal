import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const plantaRouter = createTRPCRouter({
  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.planta.findMany({
        where: {
          obraId: input.obraId,
          obra: { empresaId: ctx.session.empresaId },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      nome: z.string().min(1),
      url: z.string().url("URL inválida"),
    }))
    .mutation(async ({ ctx, input }) => {
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      return ctx.db.planta.create({
        data: {
          obraId: input.obraId,
          nome: input.nome,
          url: input.url,
        },
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const planta = await ctx.db.planta.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!planta) throw new TRPCError({ code: "NOT_FOUND" })

      // Remove posicionamento das ocorrências vinculadas a esta planta
      await ctx.db.ocorrencia.updateMany({
        where: { plantaId: input.id },
        data: { plantaId: null, posX: null, posY: null },
      })

      return ctx.db.planta.delete({ where: { id: input.id } })
    }),
})
