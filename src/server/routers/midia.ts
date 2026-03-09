import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const midiaRouter = createTRPCRouter({

  listar: protectedProcedure
    .input(z.object({
      rdoId:        z.string().optional(),
      fvsId:        z.string().optional(),
      fvmId:        z.string().optional(),
      ocorrenciaId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.midia.findMany({
        where: {
          ...(input.rdoId        && { rdoId:        input.rdoId }),
          ...(input.fvsId        && { fvsId:        input.fvsId }),
          ...(input.fvmId        && { fvmId:        input.fvmId }),
          ...(input.ocorrenciaId && { ocorrenciaId: input.ocorrenciaId }),
          obra: { empresaId: ctx.session.empresaId },
        },
        orderBy: { createdAt: "asc" },
      })
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId:       z.string(),
      url:          z.string().url(),
      tipo:         z.enum(["FOTO", "VIDEO"]).default("FOTO"),
      descricao:    z.string().optional(),
      rdoId:        z.string().optional(),
      fvsId:        z.string().optional(),
      fvmId:        z.string().optional(),
      ocorrenciaId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Valida que a obra pertence à empresa
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      return ctx.db.midia.create({ data: { ...input } })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const midia = await ctx.db.midia.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!midia) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.midia.delete({ where: { id: input.id } })
    }),
})
