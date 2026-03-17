import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const TIPO = z.enum(["RECEITA", "DESPESA"])

export const financeiroRouter = createTRPCRouter({

  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.lancamentoFinanceiro.findMany({
        where: { obraId: input.obraId, obra: { empresaId: ctx.session.empresaId } },
        orderBy: { data: "desc" },
      })
    }),

  resumo: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [lancamentos, obra] = await Promise.all([
        ctx.db.lancamentoFinanceiro.findMany({
          where: { obraId: input.obraId, obra: { empresaId: ctx.session.empresaId } },
        }),
        ctx.db.obra.findUnique({
          where: { id: input.obraId },
          select: { orcamento: true, custoAtual: true, empresaId: true },
        }),
      ])
      if (!obra || obra.empresaId !== ctx.session.empresaId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })
      }

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
      obraId:        z.string(),
      tipo:          TIPO,
      categoria:     z.string().optional(),
      descricao:     z.string().min(1),
      valor:         z.number().positive(),
      data:          z.string().optional(),
      recorrencia:   z.enum(["NENHUMA", "DIARIA", "SEMANAL", "MENSAL"]).optional(),
      recorrenciaFim: z.string().optional(), // ISO date
    }))
    .mutation(async ({ ctx, input }) => {
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { id: true },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      const dataBase = input.data ? new Date(input.data) : new Date()
      const recorrencia = input.recorrencia ?? "NENHUMA"

      // Cria o lançamento raiz
      const raiz = await ctx.db.lancamentoFinanceiro.create({
        data: {
          obraId:        input.obraId,
          tipo:          input.tipo,
          categoria:     input.categoria ?? null,
          descricao:     input.descricao,
          valor:         input.valor,
          data:          dataBase,
          recorrencia,
          recorrenciaFim: input.recorrenciaFim ? new Date(input.recorrenciaFim) : null,
        },
      })

      // Gera lançamentos futuros se houver recorrência
      if (recorrencia !== "NENHUMA" && input.recorrenciaFim) {
        const fim     = new Date(input.recorrenciaFim)
        const futuros = []
        let   prox    = new Date(dataBase)

        while (true) {
          if      (recorrencia === "DIARIA")  prox.setDate(prox.getDate() + 1)
          else if (recorrencia === "SEMANAL") prox.setDate(prox.getDate() + 7)
          else if (recorrencia === "MENSAL")  prox.setMonth(prox.getMonth() + 1)
          if (prox > fim) break

          futuros.push({
            obraId:              input.obraId,
            tipo:                input.tipo,
            categoria:           input.categoria ?? null,
            descricao:           input.descricao,
            valor:               input.valor,
            data:                new Date(prox),
            recorrencia:         recorrencia as "NENHUMA" | "DIARIA" | "SEMANAL" | "MENSAL",
            recorrenciaOrigemId: raiz.id,
          })

          if (futuros.length > 365) break // segurança
        }

        if (futuros.length > 0) {
          await ctx.db.lancamentoFinanceiro.createMany({ data: futuros })
        }
      }

      return raiz
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.lancamentoFinanceiro.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      return ctx.db.lancamentoFinanceiro.delete({ where: { id: input.id } })
    }),
})
