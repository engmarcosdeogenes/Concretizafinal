import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const analisesRouter = createTRPCRouter({

  resumo: protectedProcedure.query(async ({ ctx }) => {
    const { empresaId } = ctx.session

    const [obras, rdos, ocorrencias, fvs, fvm, lancamentos] = await Promise.all([
      ctx.db.obra.findMany({
        where: { empresaId },
        select: { id: true, nome: true, status: true, progresso: true, orcamento: true, custoAtual: true, dataInicio: true, dataFim: true },
        take: 200,
      }),
      ctx.db.rDO.findMany({
        where: { obra: { empresaId } },
        select: { id: true, data: true, status: true, obraId: true },
        orderBy: { data: "desc" },
        take: 200,
      }),
      ctx.db.ocorrencia.findMany({
        where: { obra: { empresaId } },
        select: { id: true, tipo: true, status: true, prioridade: true, data: true },
        take: 500,
      }),
      ctx.db.fVS.findMany({
        where: { obra: { empresaId } },
        select: { id: true, status: true, obraId: true },
        take: 500,
      }),
      ctx.db.fVM.findMany({
        where: { obra: { empresaId } },
        select: { id: true, status: true },
        take: 500,
      }),
      ctx.db.lancamentoFinanceiro.findMany({
        where: { obra: { empresaId } },
        select: { tipo: true, valor: true, data: true },
        take: 500,
      }),
    ])

    const hoje = new Date()

    // RDOs por mês (últimos 12 meses)
    const rdosPorMes = Array.from({ length: 12 }, (_, i) => {
      const d   = new Date(hoje.getFullYear(), hoje.getMonth() - (11 - i), 1)
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() - (11 - i) + 1, 1)
      const mes = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      return { mes, count: rdos.filter(r => { const rd = new Date(r.data); return rd >= d && rd < fim }).length }
    })

    // Ocorrências por tipo
    const tiposOc: Record<string, number> = {}
    for (const oc of ocorrencias) {
      tiposOc[oc.tipo] = (tiposOc[oc.tipo] ?? 0) + 1
    }
    const ocorrenciasPorTipo = Object.entries(tiposOc).map(([tipo, count]) => ({ tipo, count }))

    // Ocorrências por status
    const statusOc = {
      ABERTA:     ocorrencias.filter(o => o.status === "ABERTA").length,
      EM_ANALISE: ocorrencias.filter(o => o.status === "EM_ANALISE").length,
      RESOLVIDA:  ocorrencias.filter(o => o.status === "RESOLVIDA").length,
      FECHADA:    ocorrencias.filter(o => o.status === "FECHADA").length,
    }

    // FVS por status
    const statusFvs = {
      PENDENTE:    fvs.filter(f => f.status === "PENDENTE").length,
      EM_INSPECAO: fvs.filter(f => f.status === "EM_INSPECAO").length,
      APROVADO:    fvs.filter(f => f.status === "APROVADO").length,
      REJEITADO:   fvs.filter(f => f.status === "REJEITADO").length,
      RETRABALHO:  fvs.filter(f => f.status === "RETRABALHO").length,
    }

    // Financeiro por mês (últimos 6 meses)
    const financeiroPorMes = Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1)
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i) + 1, 1)
      const mes = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      const period = lancamentos.filter(l => { const ld = new Date(l.data); return ld >= d && ld < fim })
      return {
        mes,
        receitas: period.filter(l => l.tipo === "RECEITA").reduce((s, l) => s + l.valor, 0),
        despesas: period.filter(l => l.tipo === "DESPESA").reduce((s, l) => s + l.valor, 0),
      }
    })

    // Obras por status
    const statusObras = {
      PLANEJAMENTO: obras.filter(o => o.status === "PLANEJAMENTO").length,
      EM_ANDAMENTO: obras.filter(o => o.status === "EM_ANDAMENTO").length,
      PAUSADA:      obras.filter(o => o.status === "PAUSADA").length,
      CONCLUIDA:    obras.filter(o => o.status === "CONCLUIDA").length,
    }

    // Progresso médio obras ativas
    const obrasAtivas = obras.filter(o => o.status === "EM_ANDAMENTO")
    const progressoMedio = obrasAtivas.length
      ? Math.round(obrasAtivas.reduce((s, o) => s + o.progresso, 0) / obrasAtivas.length)
      : 0

    // Orçamento vs custo por obra (top 5 por orçamento)
    const orcamentoVsCusto = obras
      .filter(o => o.orcamento)
      .sort((a, b) => (b.orcamento ?? 0) - (a.orcamento ?? 0))
      .slice(0, 6)
      .map(o => ({
        nome:     o.nome.length > 18 ? o.nome.slice(0, 16) + "…" : o.nome,
        orcamento: o.orcamento ?? 0,
        custo:     o.custoAtual,
      }))

    // Avanço físico por obra com base em FVS aprovadas
    const avancoFisicoObras = obras.map(o => {
      const obraFvs   = fvs.filter(f => f.obraId === o.id)
      const aprovadas = obraFvs.filter(f => f.status === "APROVADO").length
      const total     = obraFvs.length
      return {
        nome:      o.nome.length > 22 ? o.nome.slice(0, 20) + "…" : o.nome,
        aprovadas,
        total,
        pct:       total > 0 ? Math.round(aprovadas / total * 100) : 0,
        progresso: o.progresso,
      }
    }).filter(o => o.total > 0)

    return {
      kpis: {
        totalObras: obras.length,
        obrasAtivas: obrasAtivas.length,
        totalRdos: rdos.length,
        totalOcorrencias: ocorrencias.length,
        ocAbertas: statusOc.ABERTA + statusOc.EM_ANALISE,
        fvsAprovadas: statusFvs.APROVADO,
        fvmTotal: fvm.length,
        progressoMedio,
      },
      rdosPorMes,
      ocorrenciasPorTipo,
      statusOc,
      statusFvs,
      statusObras,
      financeiroPorMes,
      orcamentoVsCusto,
      avancoFisicoObras,
    }
  }),

  histogramaMO: protectedProcedure
    .input(z.object({ obraId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      const equipe = await ctx.db.rDOEquipe.findMany({
        where: {
          rdo: {
            obra: { empresaId },
            ...(input.obraId ? { obraId: input.obraId } : {}),
          },
        },
        select: {
          funcao: true,
          quantidade: true,
          statusPresenca: true,
          rdo: { select: { data: true, obraId: true } },
        },
        take: 3000,
        orderBy: { rdo: { data: "desc" } },
      })

      const hoje = new Date()

      // Por função: presentes vs ausentes
      const funcaoMap: Record<string, { presentes: number; ausentes: number }> = {}
      for (const e of equipe) {
        if (!funcaoMap[e.funcao]) funcaoMap[e.funcao] = { presentes: 0, ausentes: 0 }
        if (e.statusPresenca === "PRESENTE") funcaoMap[e.funcao].presentes += e.quantidade
        else funcaoMap[e.funcao].ausentes += e.quantidade
      }
      const porFuncao = Object.entries(funcaoMap)
        .map(([funcao, v]) => ({ funcao, ...v, total: v.presentes + v.ausentes }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 12)

      // Por mês (últimos 6 meses) — total trabalhadores
      const porMes = Array.from({ length: 6 }, (_, i) => {
        const d   = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1)
        const fim = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i) + 1, 1)
        const mes = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
        const period = equipe.filter(e => { const ed = new Date(e.rdo.data); return ed >= d && ed < fim })
        const presentes = period.filter(e => e.statusPresenca === "PRESENTE").reduce((s, e) => s + e.quantidade, 0)
        const ausentes  = period.filter(e => e.statusPresenca !== "PRESENTE").reduce((s, e) => s + e.quantidade, 0)
        return { mes, presentes, ausentes, total: presentes + ausentes }
      })

      // Breakdown por status
      const statusMap: Record<string, number> = {}
      for (const e of equipe) {
        statusMap[e.statusPresenca] = (statusMap[e.statusPresenca] ?? 0) + e.quantidade
      }
      const statusBreakdown = Object.entries(statusMap)
        .map(([status, total]) => ({ status, total }))
        .sort((a, b) => b.total - a.total)

      return { porFuncao, porMes, statusBreakdown, totalRegistros: equipe.length }
    }),
})
