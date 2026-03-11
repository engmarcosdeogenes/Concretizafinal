import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { decrypt, isEncrypted } from "@/lib/encrypt"
import { listarProjetosSienge, criarProgressLogSienge } from "@/lib/sienge/client"

type Ctx = { db: typeof import("../db").db; session: { empresaId: string; userId: string; nome: string } }

async function getSiengeConfigOptional(ctx: Ctx) {
  const config = await ctx.db.integracaoConfig.findUnique({
    where: { empresaId: ctx.session.empresaId },
  })
  if (!config) return null
  const senha = isEncrypted(config.senha) ? decrypt(config.senha) : config.senha
  return { sub: config.subdominio, user: config.usuario, pass: senha }
}

export const medicaoRouter = createTRPCRouter({

  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ctx.db.obra.findFirstOrThrow({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
      })
      return ctx.db.medicaoObra.findMany({
        where: { obraId: input.obraId },
        include: { itens: true },
        orderBy: { data: "desc" },
      })
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId:    z.string(),
      data:      z.string(), // "YYYY-MM-DD"
      descricao: z.string().optional(),
      itens:     z.array(z.object({
        descricao:    z.string().min(1),
        unidade:      z.string().optional(),
        qtdPrevista:  z.number().optional(),
        qtdMedida:    z.number(),
        percentual:   z.number().min(0).max(100).optional(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const obra = await ctx.db.obra.findFirstOrThrow({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { id: true, siengeId: true },
      })
      const medicao = await ctx.db.medicaoObra.create({
        data: {
          obraId:    input.obraId,
          data:      new Date(input.data),
          descricao: input.descricao ?? null,
          itens:     { create: input.itens },
        },
        include: { itens: true },
      })
      // Fire-and-forget: envia % médio para Sienge se obra vinculada
      if (obra.siengeId) {
        const percentualMedio = input.itens.reduce((s, i) => s + (i.percentual ?? 0), 0) / input.itens.length
        getSiengeConfigOptional(ctx)
          .then(config => {
            if (!config) return
            return listarProjetosSienge(config.sub, config.user, config.pass, parseInt(obra.siengeId!))
              .then(projetos => {
                if (!projetos[0]) return
                return criarProgressLogSienge(config.sub, config.user, config.pass, {
                  buildingProjectId: projetos[0].id,
                  date:              input.data,
                  percentageExecuted: Math.round(percentualMedio),
                  description:       input.descricao,
                })
              })
          })
          .catch(() => {})
      }
      return medicao
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.medicaoObra.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      await ctx.db.medicaoObra.delete({ where: { id: input.id } })
      return { ok: true }
    }),
})
