import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const checklistRouter = createTRPCRouter({
  // ─── Templates ──────────────────────────────────────────────────────────────

  listarTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.templateChecklist.findMany({
        where: { empresaId: ctx.session.empresaId },
        include: { _count: { select: { itens: true } } },
        orderBy: { nome: "asc" },
      })
    }),

  buscarTemplate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const t = await ctx.db.templateChecklist.findFirst({
        where: { id: input.id, empresaId: ctx.session.empresaId },
        include: { itens: { orderBy: { ordem: "asc" } } },
      })
      if (!t) throw new TRPCError({ code: "NOT_FOUND" })
      return t
    }),

  criarTemplate: protectedProcedure
    .input(z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      itens: z.array(z.object({
        descricao: z.string().min(1),
        secao: z.string().optional(),
        obrigatorio: z.boolean().default(false),
        ordem: z.number().int().default(0),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { itens, ...rest } = input
      return ctx.db.$transaction(async (tx) => {
        const template = await tx.templateChecklist.create({
          data: { ...rest, empresaId: ctx.session.empresaId },
        })
        if (itens.length > 0) {
          await tx.itemTemplateChecklist.createMany({
            data: itens.map((item, i) => ({
              ...item,
              templateId: template.id,
              ordem: item.ordem ?? i,
            })),
          })
        }
        return tx.templateChecklist.findFirst({
          where: { id: template.id },
          include: { itens: { orderBy: { ordem: "asc" } } },
        })
      })
    }),

  atualizarTemplate: protectedProcedure
    .input(z.object({
      id: z.string(),
      nome: z.string().min(1).optional(),
      descricao: z.string().optional().nullable(),
      itens: z.array(z.object({
        descricao: z.string().min(1),
        secao: z.string().optional(),
        obrigatorio: z.boolean().default(false),
        ordem: z.number().int().default(0),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, itens, ...data } = input
      await ctx.db.templateChecklist.findFirstOrThrow({
        where: { id, empresaId: ctx.session.empresaId },
      })

      return ctx.db.$transaction(async (tx) => {
        await tx.templateChecklist.update({ where: { id }, data })
        if (itens !== undefined) {
          await tx.itemTemplateChecklist.deleteMany({ where: { templateId: id } })
          if (itens.length > 0) {
            await tx.itemTemplateChecklist.createMany({
              data: itens.map((item, i) => ({
                ...item,
                templateId: id,
                ordem: item.ordem ?? i,
              })),
            })
          }
        }
        return tx.templateChecklist.findFirst({
          where: { id },
          include: { itens: { orderBy: { ordem: "asc" } } },
        })
      })
    }),

  excluirTemplate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.templateChecklist.findFirstOrThrow({
        where: { id: input.id, empresaId: ctx.session.empresaId },
      })
      return ctx.db.templateChecklist.delete({ where: { id: input.id } })
    }),

  // ─── Respostas ──────────────────────────────────────────────────────────────

  listarRespostas: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      templateId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.respostaChecklist.findMany({
        where: {
          obraId: input.obraId,
          obra: { empresaId: ctx.session.empresaId },
          ...(input.templateId ? { templateId: input.templateId } : {}),
        },
        include: {
          template: { select: { nome: true } },
          _count: { select: { itens: true } },
        },
        orderBy: { data: "desc" },
        take: 100,
      })
    }),

  buscarResposta: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const r = await ctx.db.respostaChecklist.findFirst({
        where: {
          id: input.id,
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          template: { include: { itens: { orderBy: { ordem: "asc" } } } },
          itens: { include: { item: true } },
        },
      })
      if (!r) throw new TRPCError({ code: "NOT_FOUND" })
      return r
    }),

  criarResposta: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      templateId: z.string(),
      data: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      const template = await ctx.db.templateChecklist.findFirst({
        where: { id: input.templateId, empresaId: ctx.session.empresaId },
        include: { itens: true },
      })
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" })

      return ctx.db.$transaction(async (tx) => {
        const resposta = await tx.respostaChecklist.create({
          data: {
            obraId: input.obraId,
            templateId: input.templateId,
            data: input.data ? new Date(input.data) : new Date(),
          },
        })
        // Criar itens de resposta com base no template
        if (template.itens.length > 0) {
          await tx.itemRespostaChecklist.createMany({
            data: template.itens.map((item) => ({
              respostaId: resposta.id,
              itemId: item.id,
            })),
          })
        }
        return resposta
      })
    }),

  atualizarItem: protectedProcedure
    .input(z.object({
      itemRespostaId: z.string(),
      conforme: z.boolean().nullable().optional(),
      observacao: z.string().optional().nullable(),
      fotoUrl: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { itemRespostaId, ...data } = input
      // Verificar que o item pertence à empresa
      const item = await ctx.db.itemRespostaChecklist.findFirst({
        where: {
          id: itemRespostaId,
          resposta: { obra: { empresaId: ctx.session.empresaId } },
        },
      })
      if (!item) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.itemRespostaChecklist.update({
        where: { id: itemRespostaId },
        data,
      })
    }),

  finalizarResposta: protectedProcedure
    .input(z.object({
      id: z.string(),
      assinaturaUrl: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.respostaChecklist.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      return ctx.db.respostaChecklist.update({
        where: { id: input.id },
        data: { assinaturaUrl: input.assinaturaUrl },
      })
    }),

  excluirResposta: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.respostaChecklist.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      return ctx.db.respostaChecklist.delete({ where: { id: input.id } })
    }),
})
