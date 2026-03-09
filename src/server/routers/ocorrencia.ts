import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { logAudit } from "@/lib/audit"
import { notificarEmpresa } from "@/lib/push"

export const ocorrenciaRouter = createTRPCRouter({
  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ocorrencia.findMany({
        where: {
          obraId: input.obraId,
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          responsavel: { select: { nome: true } },
        },
        orderBy: [{ prioridade: "desc" }, { data: "desc" }],
      })
    }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ocorrencia = await ctx.db.ocorrencia.findFirst({
        where: {
          id: input.id,
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          responsavel: { select: { nome: true } },
        },
      })
      if (!ocorrencia) throw new TRPCError({ code: "NOT_FOUND", message: "Ocorrência não encontrada" })
      return ocorrencia
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      titulo: z.string().min(1),
      tipo: z.enum(["SEGURANCA", "QUALIDADE", "PRAZO", "CUSTO", "AMBIENTAL", "OUTRO"]),
      prioridade: z.number().int().min(1).max(3).default(2),
      descricao: z.string().optional(),
      data: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { obraId, data, ...rest } = input

      const obra = await ctx.db.obra.findFirst({
        where: { id: obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      const oc = await ctx.db.ocorrencia.create({
        data: {
          obraId,
          data: new Date(data),
          responsavelId: ctx.session.userId,
          ...rest,
        },
      })
      await logAudit(ctx, { entityType: "Ocorrencia", entityId: oc.id, obraId, acao: "criou" })
      if (input.prioridade === 3) {
        notificarEmpresa(ctx.session.empresaId, {
          title: "⚠️ Ocorrência de Alta Prioridade",
          body:  `${ctx.session.nome} registrou: ${input.titulo} (${obra.nome})`,
          url:   `/obras/${obraId}/ocorrencias/${oc.id}`,
        }).catch(() => {})
      }
      return oc
    }),

  atualizarStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["ABERTA", "EM_ANALISE", "RESOLVIDA", "FECHADA"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const ocorrencia = await ctx.db.ocorrencia.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!ocorrencia) throw new TRPCError({ code: "NOT_FOUND" })

      const updated = await ctx.db.ocorrencia.update({
        where: { id: input.id },
        data: { status: input.status },
      })
      await logAudit(ctx, {
        entityType: "Ocorrencia", entityId: input.id, obraId: ocorrencia.obraId,
        acao: input.status === "RESOLVIDA" ? "resolveu" : `status→${input.status}`,
      })
      return updated
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:         z.string(),
      titulo:     z.string().min(1).optional(),
      tipo:       z.enum(["SEGURANCA", "QUALIDADE", "PRAZO", "CUSTO", "AMBIENTAL", "OUTRO"]).optional(),
      prioridade: z.number().int().min(1).max(3).optional(),
      descricao:  z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.ocorrencia.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      const oc = await ctx.db.ocorrencia.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      const { id, ...data } = input
      const updated = await ctx.db.ocorrencia.update({ where: { id }, data })
      await logAudit(ctx, { entityType: "Ocorrencia", entityId: id, obraId: oc.obraId, acao: "atualizou" })
      return updated
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.ocorrencia.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      return ctx.db.ocorrencia.delete({ where: { id: input.id } })
    }),

  atualizarPosicao: protectedProcedure
    .input(z.object({
      id: z.string(),
      posX: z.number().nullable(),
      posY: z.number().nullable(),
      plantaId: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ocorrencia = await ctx.db.ocorrencia.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!ocorrencia) throw new TRPCError({ code: "NOT_FOUND" })

      return ctx.db.ocorrencia.update({
        where: { id: input.id },
        data: {
          posX: input.posX,
          posY: input.posY,
          ...(input.plantaId !== undefined && { plantaId: input.plantaId }),
        },
      })
    }),
})
