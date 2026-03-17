import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { logAudit } from "@/lib/audit"
import { notificarEmpresa } from "@/lib/push"

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

        await logAudit(ctx, { entityType: "FVS", entityId: fvs.id, obraId, acao: "criou" })
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

      const updated = await ctx.db.fVS.update({
        where: { id: input.id },
        data: { status: input.status },
      })
      await logAudit(ctx, {
        entityType: "FVS", entityId: input.id, obraId: fvs.obraId,
        acao: input.status === "APROVADO" ? "aprovou" : input.status === "REJEITADO" ? "rejeitou" : `status→${input.status}`,
      })
      if (input.status === "REJEITADO") {
        notificarEmpresa(ctx.session.empresaId, {
          title: "FVS Rejeitada",
          body:  `${ctx.session.nome} rejeitou uma Ficha de Verificação de Serviço`,
          url:   `/obras/${fvs.obraId}/fvs/${input.id}`,
        }).catch((err: unknown) => { console.warn("[Sienge sync]", err instanceof Error ? err.message : String(err)) })
      }
      return updated
    }),

  aprovarItem: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      aprovado: z.boolean().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
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

  atualizar: protectedProcedure
    .input(z.object({
      id:          z.string(),
      servico:     z.string().min(1).optional(),
      codigo:      z.string().optional().nullable(),
      data:        z.string().optional(),
      observacoes: z.string().optional().nullable(),
      itens: z.array(z.object({
        descricao: z.string().min(1),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.fVS.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
        select: { obraId: true },
      })
      const { id, itens, data, ...rest } = input
      return ctx.db.$transaction(async (tx) => {
        const fvs = await tx.fVS.update({
          where: { id },
          data: { ...rest, ...(data ? { data: new Date(data) } : {}) },
        })
        if (itens !== undefined) {
          await tx.fVSItem.deleteMany({ where: { fvsId: id } })
          if (itens.length > 0) {
            await tx.fVSItem.createMany({
              data: itens.map(it => ({ fvsId: id, descricao: it.descricao })),
            })
          }
        }
        await logAudit(ctx, { entityType: "FVS", entityId: id, obraId: existing.obraId, acao: "atualizou" })
        return fvs
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.fVS.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      return ctx.db.fVS.delete({ where: { id: input.id } })
    }),
})
