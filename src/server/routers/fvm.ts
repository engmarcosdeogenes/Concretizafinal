import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const fvmRouter = createTRPCRouter({
  listar: protectedProcedure
    .input(z.object({ obraId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.fVM.findMany({
        where: {
          ...(input.obraId ? { obraId: input.obraId } : {}),
          obra: { empresaId: ctx.session.empresaId },
        },
        orderBy: { data: "desc" },
      })
    }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const fvm = await ctx.db.fVM.findFirst({
        where: {
          id: input.id,
          obra: { empresaId: ctx.session.empresaId },
        },
      })
      if (!fvm) throw new TRPCError({ code: "NOT_FOUND", message: "FVM não encontrada" })
      return fvm
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      material: z.string().min(1),
      codigo: z.string().optional(),
      fornecedorNome: z.string().optional(),
      quantidade: z.number(),
      unidade: z.string().optional(),
      data: z.string(),
      notaFiscal: z.string().optional(),
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { obraId, data, ...rest } = input

      const obra = await ctx.db.obra.findFirst({
        where: { id: obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      return ctx.db.fVM.create({
        data: { obraId, data: new Date(data), ...rest },
      })
    }),

  atualizarStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["PENDENTE", "RECEBIDO", "APROVADO", "REJEITADO", "DEVOLVIDO"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const fvm = await ctx.db.fVM.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!fvm) throw new TRPCError({ code: "NOT_FOUND" })

      return ctx.db.fVM.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    }),
})
