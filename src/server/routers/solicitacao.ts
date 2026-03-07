import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const StatusSolicitacao = z.enum(["RASCUNHO", "PENDENTE", "APROVADA", "REJEITADA", "CANCELADA"])

export const solicitacaoRouter = createTRPCRouter({

  listar: protectedProcedure
    .input(z.object({ obraId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      return ctx.db.solicitacaoCompra.findMany({
        where: {
          obra: { empresaId },
          ...(input?.obraId ? { obraId: input.obraId } : {}),
        },
        orderBy: [{ urgencia: "desc" }, { createdAt: "desc" }],
        include: {
          obra:        { select: { id: true, nome: true } },
          solicitante: { select: { id: true, nome: true } },
          itens: {
            include: { material: { select: { id: true, nome: true, unidade: true } } },
          },
        },
      })
    }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sol = await ctx.db.solicitacaoCompra.findUnique({
        where: { id: input.id },
        include: {
          obra:        { select: { id: true, nome: true, empresaId: true } },
          solicitante: { select: { id: true, nome: true } },
          itens: {
            include: { material: { select: { id: true, nome: true, unidade: true } } },
          },
          pedidos: {
            select: { id: true, status: true, total: true, fornecedor: { select: { nome: true } } },
          },
        },
      })
      if (!sol || sol.obra.empresaId !== ctx.session.empresaId) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }
      return sol
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId:      z.string(),
      urgencia:    z.number().int().min(1).max(3).default(2),
      observacoes: z.string().optional(),
      itens: z.array(z.object({
        materialId: z.string(),
        quantidade: z.number().positive(),
        unidade:    z.string().optional(),
        observacao: z.string().optional(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session
      return ctx.db.solicitacaoCompra.create({
        data: {
          obraId:       input.obraId,
          solicitanteId: userId,
          urgencia:     input.urgencia,
          observacoes:  input.observacoes || null,
          status:       "RASCUNHO",
          itens: {
            create: input.itens.map(item => ({
              materialId: item.materialId,
              quantidade: item.quantidade,
              unidade:    item.unidade || null,
              observacao: item.observacao || null,
            })),
          },
        },
      })
    }),

  atualizarStatus: protectedProcedure
    .input(z.object({
      id:     z.string(),
      status: StatusSolicitacao,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.solicitacaoCompra.update({
        where: { id: input.id },
        data:  { status: input.status },
      })
    }),
})
