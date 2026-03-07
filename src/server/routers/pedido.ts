import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const StatusPedido = z.enum(["RASCUNHO", "ENVIADO", "CONFIRMADO", "ENTREGUE_PARCIAL", "ENTREGUE", "CANCELADO"])

export const pedidoRouter = createTRPCRouter({

  listar: protectedProcedure.query(async ({ ctx }) => {
    const { empresaId } = ctx.session
    return ctx.db.pedidoCompra.findMany({
      where: { fornecedor: { empresaId } },
      orderBy: { createdAt: "desc" },
      include: {
        fornecedor:   { select: { id: true, nome: true } },
        solicitacao:  { select: { id: true, obra: { select: { nome: true } } } },
        itens: {
          include: { material: { select: { id: true, nome: true, unidade: true } } },
        },
      },
    })
  }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const pedido = await ctx.db.pedidoCompra.findUnique({
        where: { id: input.id },
        include: {
          fornecedor:  { select: { id: true, nome: true, telefone: true, email: true } },
          solicitacao: { select: { id: true, obra: { select: { id: true, nome: true, empresaId: true } } } },
          itens: {
            include: { material: { select: { id: true, nome: true, unidade: true } } },
          },
        },
      })
      if (!pedido) throw new TRPCError({ code: "NOT_FOUND" })

      // Verificar pertence à empresa via fornecedor
      const fornecedor = await ctx.db.fornecedor.findUnique({
        where: { id: pedido.fornecedorId },
        select: { empresaId: true },
      })
      if (fornecedor?.empresaId !== ctx.session.empresaId) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }
      return pedido
    }),

  criar: protectedProcedure
    .input(z.object({
      fornecedorId:    z.string(),
      solicitacaoId:   z.string().optional(),
      previsaoEntrega: z.string().optional(), // ISO date string
      observacoes:     z.string().optional(),
      itens: z.array(z.object({
        materialId: z.string(),
        quantidade: z.number().positive(),
        precoUnit:  z.number().nonnegative().optional(),
        unidade:    z.string().optional(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const total = input.itens.reduce((sum, item) => {
        return sum + (item.precoUnit ?? 0) * item.quantidade
      }, 0)

      return ctx.db.pedidoCompra.create({
        data: {
          fornecedorId:    input.fornecedorId,
          solicitacaoId:   input.solicitacaoId || null,
          status:          "RASCUNHO",
          total:           total > 0 ? total : null,
          previsaoEntrega: input.previsaoEntrega ? new Date(input.previsaoEntrega) : null,
          observacoes:     input.observacoes || null,
          itens: {
            create: input.itens.map(item => ({
              materialId: item.materialId,
              quantidade: item.quantidade,
              precoUnit:  item.precoUnit ?? null,
              total:      item.precoUnit != null ? item.precoUnit * item.quantidade : null,
              unidade:    item.unidade || null,
            })),
          },
        },
      })
    }),

  atualizarStatus: protectedProcedure
    .input(z.object({
      id:     z.string(),
      status: StatusPedido,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pedidoCompra.update({
        where: { id: input.id },
        data:  { status: input.status },
      })
    }),
})
