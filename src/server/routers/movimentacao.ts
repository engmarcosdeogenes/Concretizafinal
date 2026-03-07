import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const TipoMovimentacao = z.enum(["ENTRADA", "SAIDA", "TRANSFERENCIA", "AJUSTE"])

export const movimentacaoRouter = createTRPCRouter({

  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.movimentacaoMaterial.findMany({
        where: { obraId: input.obraId },
        orderBy: { data: "desc" },
        include: {
          material: { select: { id: true, nome: true, unidade: true, categoria: true } },
        },
      })
    }),

  saldoPorMaterial: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const movs = await ctx.db.movimentacaoMaterial.findMany({
        where: { obraId: input.obraId },
        include: { material: { select: { id: true, nome: true, unidade: true, categoria: true } } },
      })

      // Agrupa e calcula saldo
      const map = new Map<string, { material: typeof movs[0]["material"]; saldo: number }>()
      for (const m of movs) {
        const key = m.materialId
        const current = map.get(key) ?? { material: m.material, saldo: 0 }
        const delta = m.tipo === "ENTRADA" || m.tipo === "AJUSTE"
          ? m.quantidade
          : -m.quantidade
        map.set(key, { material: m.material, saldo: current.saldo + delta })
      }
      return Array.from(map.values()).sort((a, b) => a.material.nome.localeCompare(b.material.nome))
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId:     z.string(),
      materialId: z.string(),
      tipo:       TipoMovimentacao,
      quantidade: z.number().positive(),
      data:       z.string().optional(),
      observacao: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.movimentacaoMaterial.create({
        data: {
          obraId:     input.obraId,
          materialId: input.materialId,
          tipo:       input.tipo,
          quantidade: input.quantidade,
          data:       input.data ? new Date(input.data) : new Date(),
          observacao: input.observacao || null,
        },
      })
    }),
})
