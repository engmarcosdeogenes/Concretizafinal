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

  salvarNotaFiscal: protectedProcedure
    .input(z.object({
      id:              z.string(),
      notaFiscalNumero: z.string().optional(),
      notaFiscalUrl:   z.string().optional(),
      notaFiscalValor: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.pedidoCompra.update({
        where: { id },
        data,
      })
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:              z.string(),
      previsaoEntrega: z.string().optional(),
      observacoes:     z.string().optional(),
      itens: z.array(z.object({
        materialId: z.string(),
        quantidade: z.number().positive(),
        precoUnit:  z.number().nonnegative().optional(),
        unidade:    z.string().optional(),
      })).min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const pedido = await ctx.db.pedidoCompra.findUnique({
        where:   { id: input.id },
        include: { fornecedor: { select: { empresaId: true } } },
      })
      if (!pedido || pedido.fornecedor.empresaId !== ctx.session.empresaId) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }
      if (pedido.status !== "RASCUNHO") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas pedidos em rascunho podem ser editados" })
      }

      return ctx.db.$transaction(async (tx) => {
        let novoTotal = pedido.total
        if (input.itens) {
          await tx.itemPedido.deleteMany({ where: { pedidoId: input.id } })
          novoTotal = input.itens.reduce((sum, item) => sum + (item.precoUnit ?? 0) * item.quantidade, 0)
          await tx.itemPedido.createMany({
            data: input.itens.map((item) => ({
              pedidoId:   input.id,
              materialId: item.materialId,
              quantidade: item.quantidade,
              precoUnit:  item.precoUnit  ?? null,
              total:      item.precoUnit != null ? item.precoUnit * item.quantidade : null,
              unidade:    item.unidade   || null,
            })),
          })
        }
        return tx.pedidoCompra.update({
          where: { id: input.id },
          data:  {
            previsaoEntrega: input.previsaoEntrega !== undefined
              ? (input.previsaoEntrega ? new Date(input.previsaoEntrega) : null)
              : undefined,
            observacoes: input.observacoes !== undefined ? (input.observacoes || null) : undefined,
            total:       novoTotal && novoTotal > 0 ? novoTotal : null,
          },
        })
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pedido = await ctx.db.pedidoCompra.findUnique({
        where:   { id: input.id },
        include: { fornecedor: { select: { empresaId: true } } },
      })
      if (!pedido || pedido.fornecedor.empresaId !== ctx.session.empresaId) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }
      if (pedido.status !== "RASCUNHO") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas pedidos em rascunho podem ser excluídos" })
      }
      return ctx.db.pedidoCompra.delete({ where: { id: input.id } })
    }),

  lancarDespesa: protectedProcedure
    .input(z.object({
      pedidoId:  z.string(),
      obraId:    z.string(),
      descricao: z.string().min(1),
      valor:     z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      // verifica que a obra pertence à empresa
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND" })

      return ctx.db.lancamentoFinanceiro.create({
        data: {
          obraId:    input.obraId,
          tipo:      "DESPESA",
          categoria: "Materiais",
          descricao: input.descricao,
          valor:     input.valor,
        },
      })
    }),
})
