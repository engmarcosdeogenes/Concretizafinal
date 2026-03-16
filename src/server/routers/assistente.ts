import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { enviarMensagemClaude } from "@/lib/claude"
import { TRPCError } from "@trpc/server"
import { decrypt, isEncrypted } from "@/lib/encrypt"
import {
  listarObras as listarObrasSienge,
  listarPedidosSienge,
  listarContasPagarSienge,
  listarSaldosSienge,
  listarEstoqueSienge,
  listarContasReceberSienge,
  listarInadimplenteSienge,
} from "@/lib/sienge/client"

/** Retorna credenciais Sienge ou null se não configurado */
async function getSiengeCredentials(db: typeof import("../db").db, empresaId: string) {
  const config = await db.integracaoConfig.findUnique({ where: { empresaId } })
  if (!config) return null
  const senha = isEncrypted(config.senha) ? decrypt(config.senha) : config.senha
  return { sub: config.subdominio, user: config.usuario, pass: senha }
}

/** Busca dados Sienge de forma segura (retorna null em caso de erro) */
async function fetchSiengeContext(db: typeof import("../db").db, empresaId: string) {
  const creds = await getSiengeCredentials(db, empresaId)
  if (!creds) return null

  const { sub, user, pass } = creds
  const safe = <T>(fn: () => Promise<T>) => fn().catch(() => null)

  const [obrasSienge, pedidos, contasPagar, saldos, inadimplentes] = await Promise.all([
    safe(() => listarObrasSienge(sub, user, pass)),
    safe(() => listarPedidosSienge(sub, user, pass)),
    safe(() => listarContasPagarSienge(sub, user, pass)),
    safe(() => listarSaldosSienge(sub, user, pass)),
    safe(() => listarInadimplenteSienge(sub, user, pass)),
  ])

  const partes: string[] = []

  if (obrasSienge?.length) {
    const resumo = obrasSienge.slice(0, 10).map((o) => `  - ${o.name} (ID ${o.id}, status: ${o.status ?? "N/A"})`).join("\n")
    partes.push(`Obras no Sienge (${obrasSienge.length} total):\n${resumo}`)
  }

  if (pedidos?.length) {
    const recentes = pedidos.slice(0, 5)
    const resumo = recentes.map((p) => `  - Pedido #${p.id}: fornecedor ID ${p.supplierId}, R$ ${p.totalAmount?.toFixed(2) ?? "N/A"}, status: ${p.status ?? "N/A"}, ${p.authorized ? "autorizado" : "não autorizado"}`).join("\n")
    partes.push(`Pedidos de compra recentes (${pedidos.length} total):\n${resumo}`)
  }

  if (contasPagar?.length) {
    const vencidas = contasPagar.filter((c) => {
      if (!c.dueDate) return false
      return new Date(c.dueDate) < new Date()
    })
    const totalPagar = contasPagar.reduce((s, c) => s + (c.amount ?? 0), 0)
    partes.push(`Contas a pagar: ${contasPagar.length} títulos, total R$ ${totalPagar.toFixed(2)}, ${vencidas.length} vencidas`)
  }

  if (saldos?.length) {
    const totalSaldo = saldos.reduce((s, c) => s + (c.balance ?? 0), 0)
    partes.push(`Saldos bancários: ${saldos.length} contas, saldo total R$ ${totalSaldo.toFixed(2)}`)
  }

  if (inadimplentes?.length) {
    partes.push(`Inadimplência: ${inadimplentes.length} clientes com parcelas vencidas`)
  }

  return partes.length > 0 ? partes.join("\n\n") : null
}

export const assistenteRouter = createTRPCRouter({

  listar: protectedProcedure
    .query(async ({ ctx }) => {
      const { userId } = ctx.session
      return ctx.db.mensagemAssistente.findMany({
        where: { usuarioId: userId },
        orderBy: { createdAt: "asc" },
        take: 100,
      })
    }),

  enviar: protectedProcedure
    .input(z.object({ mensagem: z.string().min(1).max(4000) }))
    .mutation(async ({ ctx, input }) => {
      const { userId, empresaId } = ctx.session

      // Salvar mensagem do usuário
      await ctx.db.mensagemAssistente.create({
        data: {
          usuarioId: userId,
          empresaId,
          role: "user",
          conteudo: input.mensagem,
        },
      })

      // Buscar histórico recente para contexto (últimas 20 mensagens)
      const historico = await ctx.db.mensagemAssistente.findMany({
        where: { usuarioId: userId },
        orderBy: { createdAt: "asc" },
        take: 20,
        select: { role: true, conteudo: true },
      })

      // Buscar dados locais + Sienge em paralelo
      const [
        obrasCount,
        rdosCount,
        ocorrenciasAbertas,
        fvsCount,
        medicoesCount,
        obrasAtivas,
        ocorrenciasPorTipo,
        siengeContext,
      ] = await Promise.all([
        ctx.db.obra.count({ where: { empresaId, status: "EM_ANDAMENTO" } }),
        ctx.db.rDO.count({ where: { obra: { empresaId } } }),
        ctx.db.ocorrencia.count({ where: { obra: { empresaId }, status: "ABERTA" } }),
        ctx.db.fVS.count({ where: { obra: { empresaId } } }),
        ctx.db.medicaoObra.count({ where: { obra: { empresaId } } }),
        ctx.db.obra.findMany({
          where: { empresaId, status: "EM_ANDAMENTO" },
          select: { nome: true, progresso: true, orcamento: true, custoAtual: true },
          take: 10,
        }),
        ctx.db.ocorrencia.groupBy({
          by: ["tipo"],
          where: { obra: { empresaId }, status: "ABERTA" },
          _count: true,
        }),
        fetchSiengeContext(ctx.db, empresaId),
      ])

      // Montar contexto rico
      const secoes: string[] = []

      // Dados locais do Concretiza
      secoes.push(`[DADOS CONCRETIZA]
Obras ativas: ${obrasCount} | RDOs: ${rdosCount} | FVS: ${fvsCount} | Medições: ${medicoesCount} | Ocorrências abertas: ${ocorrenciasAbertas}`)

      if (obrasAtivas.length > 0) {
        const lista = obrasAtivas.map((o) => {
          const desvio = o.orcamento && o.custoAtual ? (((o.custoAtual - o.orcamento) / o.orcamento) * 100).toFixed(1) : null
          return `  - ${o.nome}: ${o.progresso ?? 0}% concluído${o.orcamento ? `, orçamento R$ ${o.orcamento.toFixed(0)}, gasto R$ ${(o.custoAtual ?? 0).toFixed(0)}` : ""}${desvio ? ` (desvio ${desvio}%)` : ""}`
        }).join("\n")
        secoes.push(`Obras em andamento:\n${lista}`)
      }

      if (ocorrenciasPorTipo.length > 0) {
        const lista = ocorrenciasPorTipo.map((o) => `  - ${o.tipo}: ${o._count}`).join("\n")
        secoes.push(`Ocorrências abertas por tipo:\n${lista}`)
      }

      // Dados Sienge
      if (siengeContext) {
        secoes.push(`[DADOS SIENGE (ERP)]\n${siengeContext}`)
      }

      const contextoCompleto = secoes.join("\n\n")

      // Montar mensagens para a API
      const mensagens = historico.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.conteudo,
      }))

      // Adicionar contexto à última mensagem do usuário (a que acabou de enviar)
      const lastIdx = mensagens.length - 1
      if (lastIdx >= 0 && mensagens[lastIdx].role === "user") {
        mensagens[lastIdx].content = `${contextoCompleto}\n\n${mensagens[lastIdx].content}`
      }

      try {
        const resposta = await enviarMensagemClaude(mensagens)

        // Salvar resposta do assistente
        const msgAssistente = await ctx.db.mensagemAssistente.create({
          data: {
            usuarioId: userId,
            empresaId,
            role: "assistant",
            conteudo: resposta,
          },
        })

        return msgAssistente
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao chamar IA"
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message })
      }
    }),

  limpar: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { userId } = ctx.session
      await ctx.db.mensagemAssistente.deleteMany({
        where: { usuarioId: userId },
      })
      return { ok: true }
    }),
})
