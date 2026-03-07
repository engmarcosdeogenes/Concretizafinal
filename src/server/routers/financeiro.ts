import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const TIPO = z.enum(["RECEITA", "DESPESA"])

export const financeiroRouter = createTRPCRouter({

  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.lancamentoFinanceiro.findMany({
        where: { obraId: input.obraId },
        orderBy: { data: "desc" },
      })
    }),

  resumo: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [lancamentos, obra] = await Promise.all([
        ctx.db.lancamentoFinanceiro.findMany({
          where: { obraId: input.obraId },
        }),
        ctx.db.obra.findUnique({
          where: { id: input.obraId },
          select: { orcamento: true, custoAtual: true },
        }),
      ])

      const totalReceitas = lancamentos
        .filter(l => l.tipo === "RECEITA")
        .reduce((s, l) => s + l.valor, 0)
      const totalDespesas = lancamentos
        .filter(l => l.tipo === "DESPESA")
        .reduce((s, l) => s + l.valor, 0)

      return {
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        orcamento: obra?.orcamento ?? null,
        custoAtual: obra?.custoAtual ?? 0,
      }
    }),

  resumoGeral: protectedProcedure
    .query(async ({ ctx }) => {
      const { empresaId } = ctx.session
      const [lancamentos, obras] = await Promise.all([
        ctx.db.lancamentoFinanceiro.findMany({
          where: { obra: { empresaId } },
          include: { obra: { select: { id: true, nome: true } } },
          orderBy: { data: "desc" },
        }),
        ctx.db.obra.findMany({
          where: { empresaId },
          select: { id: true, nome: true, orcamento: true, custoAtual: true, status: true },
        }),
      ])

      const totalReceitas = lancamentos
        .filter(l => l.tipo === "RECEITA")
        .reduce((s, l) => s + l.valor, 0)
      const totalDespesas = lancamentos
        .filter(l => l.tipo === "DESPESA")
        .reduce((s, l) => s + l.valor, 0)
      const orcamentoTotal = obras.reduce((s, o) => s + (o.orcamento ?? 0), 0)

      return {
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        orcamentoTotal,
        lancamentosRecentes: lancamentos.slice(0, 10),
        resumoPorObra: obras.map(o => ({
          ...o,
          receitas: lancamentos.filter(l => l.obraId === o.id && l.tipo === "RECEITA").reduce((s, l) => s + l.valor, 0),
          despesas: lancamentos.filter(l => l.obraId === o.id && l.tipo === "DESPESA").reduce((s, l) => s + l.valor, 0),
        })),
      }
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId:    z.string(),
      tipo:      TIPO,
      categoria: z.string().optional(),
      descricao: z.string().min(1),
      valor:     z.number().positive(),
      data:      z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lancamentoFinanceiro.create({
        data: {
          obraId:    input.obraId,
          tipo:      input.tipo,
          categoria: input.categoria ?? null,
          descricao: input.descricao,
          valor:     input.valor,
          data:      input.data ? new Date(input.data) : new Date(),
        },
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lancamentoFinanceiro.delete({ where: { id: input.id } })
    }),
})
