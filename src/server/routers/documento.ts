import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const CATEGORIAS = z.enum(["ART", "PROJETO", "CONTRATO", "LAUDO", "CERTIFICADO", "FOTO", "OUTRO"])

export const documentoRouter = createTRPCRouter({

  listar: protectedProcedure
    .input(z.object({
      obraId:    z.string().optional(),
      categoria: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      return ctx.db.documento.findMany({
        where: {
          obra: { empresaId },
          ...(input.obraId    ? { obraId:    input.obraId }    : {}),
          ...(input.categoria ? { categoria: input.categoria }  : {}),
        },
        orderBy: { createdAt: "desc" },
        include: { obra: { select: { id: true, nome: true } } },
      })
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId:    z.string(),
      nome:      z.string().min(1),
      categoria: CATEGORIAS,
      url:       z.string().url(),
      tipo:      z.string().optional(),
      tamanho:   z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.documento.create({
        data: {
          obraId:    input.obraId,
          nome:      input.nome,
          categoria: input.categoria,
          url:       input.url,
          tipo:      input.tipo || null,
          tamanho:   input.tamanho || null,
        },
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.documento.delete({
        where: { id: input.id },
      })
    }),
})
