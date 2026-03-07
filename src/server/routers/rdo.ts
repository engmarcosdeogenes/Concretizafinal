import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const rdoRouter = createTRPCRouter({
  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.rDO.findMany({
        where: {
          obraId: input.obraId,
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          atividades: { select: { descricao: true } },
          equipe: { select: { quantidade: true } },
          _count: { select: { midias: true } },
          responsavel: { select: { nome: true } },
        },
        orderBy: { data: "desc" },
      })
    }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rdo = await ctx.db.rDO.findFirst({
        where: {
          id: input.id,
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          atividades: true,
          equipe: true,
          _count: { select: { midias: true } },
          responsavel: { select: { nome: true } },
        },
      })
      if (!rdo) throw new TRPCError({ code: "NOT_FOUND", message: "RDO não encontrado" })
      return rdo
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      data: z.string(),
      clima: z.string().optional(),
      temperaturaMin: z.number().optional(),
      temperaturaMax: z.number().optional(),
      ocorreuChuva: z.boolean().default(false),
      observacoes: z.string().optional(),
      atividades: z.array(z.object({
        descricao: z.string(),
        quantidade: z.number().optional(),
        unidade: z.string().optional(),
      })),
      equipe: z.array(z.object({
        funcao: z.string(),
        quantidade: z.number().int(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { obraId, data, atividades, equipe, ...rest } = input

      const obra = await ctx.db.obra.findFirst({
        where: { id: obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      return ctx.db.$transaction(async (tx) => {
        const rdo = await tx.rDO.create({
          data: {
            obraId,
            data: new Date(data),
            responsavelId: ctx.session.userId,
            ...rest,
          },
        })

        if (atividades.length > 0) {
          await tx.rDOAtividade.createMany({
            data: atividades.map((a) => ({ ...a, rdoId: rdo.id })),
          })
        }

        if (equipe.length > 0) {
          await tx.rDOEquipe.createMany({
            data: equipe.map((e) => ({ ...e, rdoId: rdo.id })),
          })
        }

        return rdo
      })
    }),

  atualizarStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["RASCUNHO", "ENVIADO", "APROVADO", "REJEITADO"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const rdo = await ctx.db.rDO.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!rdo) throw new TRPCError({ code: "NOT_FOUND" })

      return ctx.db.rDO.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    }),
})
