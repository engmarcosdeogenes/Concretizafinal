import { createTRPCRouter, protectedProcedure } from "../trpc"

export const painelRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.session
  }),

  resumo: protectedProcedure.query(async ({ ctx }) => {
    const { empresaId } = ctx.session

    const [obras, rdos, ocorrencias, fvs, equipe] = await Promise.all([
      ctx.db.obra.findMany({
        where: { empresaId },
        select: {
          id: true, nome: true, status: true, progresso: true,
          cidade: true, estado: true, imagemUrl: true,
          dataInicio: true, dataFim: true,
          orcamento: true, custoAtual: true,
          _count: { select: { rdos: true, ocorrencias: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.rDO.findMany({
        where: { obra: { empresaId } },
        select: { id: true, status: true, data: true, obraId: true },
        orderBy: { data: "desc" },
        take: 100,
      }),
      ctx.db.ocorrencia.findMany({
        where: { obra: { empresaId } },
        select: { id: true, status: true, tipo: true, prioridade: true, titulo: true, obraId: true, data: true },
        orderBy: [{ prioridade: "desc" }, { data: "desc" }],
        take: 50,
      }),
      ctx.db.fVS.findMany({
        where: { obra: { empresaId } },
        select: { id: true, status: true, obraId: true },
        take: 200,
      }),
      ctx.db.membroEquipe.count({
        where: { obra: { empresaId }, ativo: true },
      }),
    ])

    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    const rdosMes = rdos.filter(r => new Date(r.data) >= inicioMes)
    const ocAbertas = ocorrencias.filter(o => o.status === "ABERTA" || o.status === "EM_ANALISE")
    const fvsPendentes = fvs.filter(f => f.status === "PENDENTE" || f.status === "EM_INSPECAO")

    // Últimos 6 meses — contagem de RDOs por mês
    const rdosPorMes = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1)
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i) + 1, 1)
      const mes = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      const count = rdos.filter(r => {
        const rd = new Date(r.data)
        return rd >= d && rd < fim
      }).length
      return { mes, count }
    })

    // Distribuição de obras por status
    const statusObras = {
      EM_ANDAMENTO: obras.filter(o => o.status === "EM_ANDAMENTO").length,
      PLANEJAMENTO: obras.filter(o => o.status === "PLANEJAMENTO").length,
      PAUSADA: obras.filter(o => o.status === "PAUSADA").length,
      CONCLUIDA: obras.filter(o => o.status === "CONCLUIDA").length,
    }

    return {
      kpis: {
        totalObras: obras.length,
        obrasAtivas: obras.filter(o => o.status === "EM_ANDAMENTO").length,
        rdosMes: rdosMes.length,
        ocAbertas: ocAbertas.length,
        fvsPendentes: fvsPendentes.length,
        membrosAtivos: equipe,
      },
      obras,
      rdosPorMes,
      statusObras,
      ocorreciasRecentes: ocAbertas.slice(0, 5),
    }
  }),
})
