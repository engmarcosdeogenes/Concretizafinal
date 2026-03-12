import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { decrypt, isEncrypted } from "@/lib/encrypt"
import { logAudit } from "@/lib/audit"
import {
  siengeGet,
  getPdfAnalisePedidoSienge,
  getPdfMapaCotacaoSienge,
  listarContasBancariasFornecedor,
  listarPixFornecedor,
  listarCriteriosAvaliacaoSienge,
  salvarAvaliacaoFornecedor,
  listarProjetosSienge,
  listarTarefasSienge,
  listarOrcamentosSienge,
  listarItensOrcamento,
  listarCotacoesSienge,
  listarRespostasCotacao,
  autorizarPedidoSienge,
  listarContasPagarSienge,
  listarContasBancariasSienge,
  listarSaldosSienge,
  registrarWebhookSienge,
  listarWebhooksSienge,
  excluirWebhookSienge,
  listarEstoqueSienge,
  listarNFeSienge,
  listarContasReceberSienge,
  listarInadimplenteSienge,
  listarContratosSienge,
  listarMedicoesSienge,
  listarUnidadesSienge,
  listarContratosVendaSienge,
  listarLocacoesSienge,
  listarComissoesSienge,
  listarBensImoveisSienge,
  listarBensMoveisSienge,
  listarBalanceteSienge,
  listarReservasEstoqueSienge,
  atenderReservaSienge,
  transferirEstoqueSienge,
  lancarMovimentacaoEstoqueSienge,
  listarEntregaChavesSienge,
  getExtratoClientePdfSienge,
  listarClientesSienge,
  getInformeIRPdfSienge,
  listarRdosSienge,
  listarSolicitacoesPorObraSienge,
  listarPedidosSienge,
  ativarCreditorSienge,
  desativarCreditorSienge,
  criarContaPagarSienge,
  enviarBoleto2ViaSienge,
  obterSaldoDevedorSienge,
  enviarSaldoDevedorEmailSienge,
  criarLoteContabilSienge,
  criarCotacaoSienge,
  listarEmpresasSienge,
} from "@/lib/sienge/client"

type Ctx = { db: typeof import("../db").db; session: { empresaId: string; userId: string; nome: string } }

// Retorna null se não configurado (graceful degradation)
async function getSiengeConfigOptional(ctx: Ctx) {
  const config = await ctx.db.integracaoConfig.findUnique({
    where: { empresaId: ctx.session.empresaId },
  })
  if (!config) return null
  const senha = isEncrypted(config.senha) ? decrypt(config.senha) : config.senha
  return { sub: config.subdominio, user: config.usuario, pass: senha }
}

// Lança erro se não configurado
async function getSiengeConfig(ctx: Ctx) {
  const config = await getSiengeConfigOptional(ctx)
  if (!config) throw new TRPCError({ code: "NOT_FOUND", message: "Credenciais Sienge não configuradas." })
  return config
}

export const siengeRouter = createTRPCRouter({

  // ── Tarefas por obra ──────────────────────────────────────────────────────
  listarTarefas: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { siengeId: true },
      })
      if (!obra?.siengeId) return []
      const projetos = await listarProjetosSienge(config.sub, config.user, config.pass, parseInt(obra.siengeId)).catch(() => [])
      return Promise.all(projetos.map(async (p) => ({
        projeto: p,
        tarefas: await listarTarefasSienge(config.sub, config.user, config.pass, p.id).catch(() => []),
      })))
    }),

  // ── Orçamento por obra ────────────────────────────────────────────────────
  listarOrcamento: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { siengeId: true },
      })
      if (!obra?.siengeId) return []
      const orcamentos = await listarOrcamentosSienge(config.sub, config.user, config.pass, parseInt(obra.siengeId)).catch(() => [])
      return Promise.all(orcamentos.map(async (o) => ({
        orcamento: o,
        itens: await listarItensOrcamento(config.sub, config.user, config.pass, o.id).catch(() => []),
      })))
    }),

  // ── Cotações (opcionalmente filtradas por obra) ───────────────────────────
  listarCotacoes: protectedProcedure
    .input(z.object({ obraId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      let siengeId: number | undefined
      if (input.obraId) {
        const obra = await ctx.db.obra.findFirst({
          where: { id: input.obraId, empresaId: ctx.session.empresaId },
          select: { siengeId: true },
        })
        siengeId = obra?.siengeId ? parseInt(obra.siengeId) : undefined
      }
      const cotacoes = await listarCotacoesSienge(config.sub, config.user, config.pass, siengeId).catch(() => [])
      return Promise.all(cotacoes.map(async (c) => ({
        cotacao: c,
        respostas: await listarRespostasCotacao(config.sub, config.user, config.pass, c.id).catch(() => []),
      })))
    }),

  // ── Autorizar pedido no Sienge ────────────────────────────────────────────
  autorizarPedido: protectedProcedure
    .input(z.object({ pedidoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await autorizarPedidoSienge(config.sub, config.user, config.pass, input.pedidoId)
      await logAudit(ctx, {
        entityType: "SIENGE_PEDIDO",
        entityId: String(input.pedidoId),
        acao: "autorizou",
      })
      return { sucesso: true }
    }),

  // ── Contas a pagar do Sienge ─────────────────────────────────────────────
  listarContasPagar: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarContasPagarSienge(config.sub, config.user, config.pass).catch(() => [])
    }),

  // ── Saldos bancários do Sienge ───────────────────────────────────────────
  listarSaldos: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      const [contas, saldos] = await Promise.all([
        listarContasBancariasSienge(config.sub, config.user, config.pass).catch(() => []),
        listarSaldosSienge(config.sub, config.user, config.pass).catch(() => []),
      ])
      return contas.map((c) => ({
        ...c,
        saldo: saldos.find((s) => s.accountId === c.id)?.balance ?? 0,
      }))
    }),

  // ── Webhooks ──────────────────────────────────────────────────────────────

  buscarStatusWebhook: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await ctx.db.integracaoConfig.findUnique({
        where: { empresaId: ctx.session.empresaId },
        select: { siengeWebhookId: true, webhookSecret: true },
      })
      return {
        registrado: !!config?.siengeWebhookId,
        webhookId: config?.siengeWebhookId ?? null,
      }
    }),

  registrarWebhook: protectedProcedure
    .input(z.object({ appUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const siengeConfig = await getSiengeConfig(ctx)

      // Gerar secret único para esta empresa
      const secret = crypto.randomUUID().replace(/-/g, "")

      // Montar URL do webhook
      const webhookUrl = `${input.appUrl}/api/sienge/webhook?empresaId=${ctx.session.empresaId}&secret=${secret}`

      const events = [
        "PURCHASE_ORDER_AUTHORIZED",
        "PURCHASE_ORDER_CREATED",
        "BILL_PAID",
        "CONTRACT_CREATED",
      ]

      const { id: webhookId } = await registrarWebhookSienge(
        siengeConfig.sub, siengeConfig.user, siengeConfig.pass,
        webhookUrl, events,
      )

      await ctx.db.integracaoConfig.update({
        where: { empresaId: ctx.session.empresaId },
        data: { siengeWebhookId: webhookId, webhookSecret: secret },
      })

      await logAudit(ctx, { entityType: "WEBHOOK", entityId: String(webhookId), acao: "registrou webhook Sienge" })

      return { webhookId, secret }
    }),

  removerWebhook: protectedProcedure
    .mutation(async ({ ctx }) => {
      const dbConfig = await ctx.db.integracaoConfig.findUnique({
        where: { empresaId: ctx.session.empresaId },
        select: { siengeWebhookId: true },
      })
      if (!dbConfig?.siengeWebhookId) return { sucesso: true }

      const siengeConfig = await getSiengeConfig(ctx)
      await excluirWebhookSienge(
        siengeConfig.sub, siengeConfig.user, siengeConfig.pass,
        dbConfig.siengeWebhookId,
      ).catch(() => {}) // ignora se já não existe no Sienge

      await ctx.db.integracaoConfig.update({
        where: { empresaId: ctx.session.empresaId },
        data: { siengeWebhookId: null, webhookSecret: null },
      })

      return { sucesso: true }
    }),

  // ── Dados Bancários de Fornecedor ────────────────────────────────────────
  listarDadosBancariosCredor: protectedProcedure
    .input(z.object({ credorId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return { contas: [], pix: [] }
      const [contas, pix] = await Promise.all([
        listarContasBancariasFornecedor(config.sub, config.user, config.pass, input.credorId).catch(() => []),
        listarPixFornecedor(config.sub, config.user, config.pass, input.credorId).catch(() => []),
      ])
      return { contas, pix }
    }),

  buscarDadosBancariosPorCnpj: protectedProcedure
    .input(z.object({ cnpj: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return { credorId: null, contas: [], pix: [] }
      const cnpjLimpo = input.cnpj.replace(/\D/g, "")
      if (!cnpjLimpo) return { credorId: null, contas: [], pix: [] }
      // Buscar creditor pelo CNPJ na API Sienge
      const data = await siengeGet(config.sub, config.user, config.pass, `/creditors?documentNumber=${cnpjLimpo}&limit=1`).catch(() => null)
      if (!data) return { credorId: null, contas: [], pix: [] }
      const list = (Array.isArray(data) ? data : (data as Record<string, unknown[]>).items ?? []) as { id: number }[]
      const credorId = list[0]?.id ?? null
      if (!credorId) return { credorId: null, contas: [], pix: [] }
      const [contas, pix] = await Promise.all([
        listarContasBancariasFornecedor(config.sub, config.user, config.pass, credorId).catch(() => []),
        listarPixFornecedor(config.sub, config.user, config.pass, credorId).catch(() => []),
      ])
      return { credorId, contas, pix }
    }),

  // ── Avaliação de Fornecedor ───────────────────────────────────────────────
  listarCriteriosAvaliacao: protectedProcedure
    .input(z.object({ pedidoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarCriteriosAvaliacaoSienge(config.sub, config.user, config.pass, input.pedidoId).catch(() => [])
    }),

  salvarAvaliacao: protectedProcedure
    .input(z.object({
      pedidoId:   z.number(),
      criterios:  z.array(z.object({ criterioId: z.number(), nota: z.number().min(0).max(10) })),
      observacao: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await salvarAvaliacaoFornecedor(config.sub, config.user, config.pass, input.pedidoId, {
        criterios:  input.criterios,
        observacao: input.observacao,
      })
      await logAudit(ctx, { entityType: "SIENGE_AVALIACAO", entityId: String(input.pedidoId), acao: "avaliou fornecedor" })

      // Atualizar nota média do fornecedor local
      if (input.criterios.length > 0) {
        const novaNota = input.criterios.reduce((sum, c) => sum + c.nota, 0) / input.criterios.length
        const pedido = await ctx.db.pedidoCompra.findFirst({
          where: { siengePurchaseOrderId: input.pedidoId },
          select: { fornecedorId: true },
        })
        if (pedido) {
          const fornecedor = await ctx.db.fornecedor.findFirst({
            where: { id: pedido.fornecedorId, empresa: { id: ctx.session.empresaId } },
            select: { id: true, notaMedia: true, totalAvaliacoes: true },
          })
          if (fornecedor) {
            const total = fornecedor.totalAvaliacoes
            const mediaAtual = fornecedor.notaMedia ?? 0
            const novaMedia = (mediaAtual * total + novaNota) / (total + 1)
            await ctx.db.fornecedor.update({
              where: { id: fornecedor.id },
              data: { notaMedia: novaMedia, totalAvaliacoes: { increment: 1 } },
            }).catch(() => {})
          }
        }
      }

      return { sucesso: true }
    }),

  // ── Toggle Ativo Creditor ─────────────────────────────────────────────────
  toggleAtivoCreditor: protectedProcedure
    .input(z.object({ credorId: z.number(), ativo: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      if (input.ativo) {
        await ativarCreditorSienge(config.sub, config.user, config.pass, input.credorId)
      } else {
        await desativarCreditorSienge(config.sub, config.user, config.pass, input.credorId)
      }
      return { sucesso: true }
    }),

  // ── Criar Conta a Pagar ───────────────────────────────────────────────────
  criarContaPagar: protectedProcedure
    .input(z.object({
      creditorId:     z.number(),
      documentNumber: z.string().optional(),
      dueDate:        z.string(),
      amount:         z.number().positive(),
      description:    z.string().optional(),
      obraId:         z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      let buildingId: number | undefined
      if (input.obraId) {
        const obra = await ctx.db.obra.findFirst({
          where: { id: input.obraId, empresaId: ctx.session.empresaId },
          select: { siengeId: true },
        })
        if (obra?.siengeId) buildingId = parseInt(obra.siengeId)
      }
      const result = await criarContaPagarSienge(config.sub, config.user, config.pass, {
        creditorId:     input.creditorId,
        documentNumber: input.documentNumber,
        dueDate:        input.dueDate,
        amount:         input.amount,
        description:    input.description,
        buildingId,
      })
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao criar título no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CONTA_PAGAR", entityId: String(result.id), acao: "criou título a pagar" })
      return { id: result.id }
    }),

  // ── Buscar Cliente por ID ─────────────────────────────────────────────────
  buscarClientePorId: protectedProcedure
    .input(z.object({ clienteId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return { cliente: null, contratos: [] }
      const [clientes, contratos] = await Promise.all([
        listarClientesSienge(config.sub, config.user, config.pass),
        listarContratosVendaSienge(config.sub, config.user, config.pass),
      ])
      const cliente = clientes.find((c) => String(c.id) === input.clienteId) ?? null
      const clienteContratos = cliente
        ? contratos.filter((c) => (c.clientName ?? "").toLowerCase() === (cliente.name ?? "").toLowerCase())
        : []
      return { cliente, contratos: clienteContratos }
    }),

  // ── Estoque Real ─────────────────────────────────────────────────────────
  listarEstoque: protectedProcedure
    .input(z.object({ obraId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      let siengeId: number | undefined
      if (input.obraId) {
        const obra = await ctx.db.obra.findFirst({
          where: { id: input.obraId, empresaId: ctx.session.empresaId },
          select: { siengeId: true },
        })
        siengeId = obra?.siengeId ? parseInt(obra.siengeId) : undefined
      }
      return listarEstoqueSienge(config.sub, config.user, config.pass, siengeId).catch(() => [])
    }),

  // ── NFe ───────────────────────────────────────────────────────────────────
  listarNFe: protectedProcedure
    .input(z.object({
      obraId:     z.string().optional(),
      dataInicio: z.string().optional(),
      dataFim:    z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      let siengeId: number | undefined
      if (input.obraId) {
        const obra = await ctx.db.obra.findFirst({
          where: { id: input.obraId, empresaId: ctx.session.empresaId },
          select: { siengeId: true },
        })
        siengeId = obra?.siengeId ? parseInt(obra.siengeId) : undefined
      }
      return listarNFeSienge(config.sub, config.user, config.pass, siengeId, input.dataInicio, input.dataFim).catch(() => [])
    }),

  // ── Contas a Receber ──────────────────────────────────────────────────────
  listarContasReceber: protectedProcedure
    .input(z.object({
      status:     z.string().optional(),
      dataInicio: z.string().optional(),
      dataFim:    z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarContasReceberSienge(config.sub, config.user, config.pass, input.status, input.dataInicio, input.dataFim).catch(() => [])
    }),

  listarInadimplentes: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarInadimplenteSienge(config.sub, config.user, config.pass).catch(() => [])
    }),

  // ── Contratos ─────────────────────────────────────────────────────────────
  listarContratos: protectedProcedure
    .input(z.object({ obraId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      let siengeId: number | undefined
      if (input.obraId) {
        const obra = await ctx.db.obra.findFirst({
          where: { id: input.obraId, empresaId: ctx.session.empresaId },
          select: { siengeId: true },
        })
        siengeId = obra?.siengeId ? parseInt(obra.siengeId) : undefined
      }
      return listarContratosSienge(config.sub, config.user, config.pass, siengeId).catch(() => [])
    }),

  listarMedicoes: protectedProcedure
    .input(z.object({ contratoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarMedicoesSienge(config.sub, config.user, config.pass, input.contratoId).catch(() => [])
    }),

  // ── Comercial ─────────────────────────────────────────────────────────────
  listarMapaImobiliario: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarUnidadesSienge(config.sub, config.user, config.pass)
    }),

  listarContratosVenda: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarContratosVendaSienge(config.sub, config.user, config.pass)
    }),

  listarLocacoes: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarLocacoesSienge(config.sub, config.user, config.pass)
    }),

  listarComissoes: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarComissoesSienge(config.sub, config.user, config.pass)
    }),

  listarPatrimonio: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return { imoveis: [], moveis: [] }
      const [imoveis, moveis] = await Promise.all([
        listarBensImoveisSienge(config.sub, config.user, config.pass),
        listarBensMoveisSienge(config.sub, config.user, config.pass),
      ])
      return { imoveis, moveis }
    }),

  listarBalancete: protectedProcedure
    .input(z.object({ competencia: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarBalanceteSienge(config.sub, config.user, config.pass, input.competencia)
    }),

  listarReservas: protectedProcedure
    .input(z.object({ siengeObraId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarReservasEstoqueSienge(config.sub, config.user, config.pass, input.siengeObraId)
    }),

  atenderReserva: protectedProcedure
    .input(z.object({ reservaId: z.number(), quantidade: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return { ok: false }
      const ok = await atenderReservaSienge(config.sub, config.user, config.pass, input.reservaId, input.quantidade)
      return { ok }
    }),

  transferirEstoque: protectedProcedure
    .input(z.object({
      fromBuildingId: z.number(),
      toBuildingId: z.number(),
      materialId: z.number(),
      quantidade: z.number().positive(),
      observacao: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return { ok: false }
      const ok = await transferirEstoqueSienge(config.sub, config.user, config.pass, input)
      return { ok }
    }),

  listarEntregaChaves: protectedProcedure.query(async ({ ctx }) => {
    const config = await getSiengeConfigOptional(ctx)
    if (!config) return []
    return listarEntregaChavesSienge(config.sub, config.user, config.pass)
  }),

  listarClientes: protectedProcedure.query(async ({ ctx }) => {
    const config = await getSiengeConfigOptional(ctx)
    if (!config) return []
    return listarClientesSienge(config.sub, config.user, config.pass)
  }),

  getExtratoPdfUrl: protectedProcedure
    .input(z.object({ contratoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return null
      // Returns boolean indicating endpoint exists (actual PDF served via API route)
      return { url: `/api/sienge/pdf/extrato/${input.contratoId}` }
    }),

  getInformeIRPdfUrl: protectedProcedure
    .input(z.object({ clienteId: z.number(), ano: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return null
      return { url: `/api/sienge/pdf/ir/${input.clienteId}?ano=${input.ano}` }
    }),

  listarRdosPorObra: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { siengeId: true },
      })
      if (!obra?.siengeId) return []
      return listarRdosSienge(config.sub, config.user, config.pass, parseInt(obra.siengeId))
    }),

  listarSolicitacoesPorObra: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { siengeId: true },
      })
      if (!obra?.siengeId) return []
      return listarSolicitacoesPorObraSienge(config.sub, config.user, config.pass, parseInt(obra.siengeId))
    }),

  listarPedidosPorObra: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { siengeId: true },
      })
      if (!obra?.siengeId) return []
      return listarPedidosSienge(config.sub, config.user, config.pass, parseInt(obra.siengeId))
    }),

  // ── Movimentação de Estoque ──────────────────────────────────────────────────

  lancarMovimentacao: protectedProcedure
    .input(z.object({
      obraId:      z.string(),
      materialId:  z.number().int(),
      tipo:        z.enum(["ENTRADA", "SAIDA"]),
      quantidade:  z.number().positive(),
      data:        z.string(), // ISO date YYYY-MM-DD
      observacao:  z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Sienge não configurado" })
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { siengeId: true },
      })
      if (!obra?.siengeId) throw new TRPCError({ code: "BAD_REQUEST", message: "Obra não vinculada ao Sienge" })
      return lancarMovimentacaoEstoqueSienge(config.sub, config.user, config.pass, {
        materialId: input.materialId,
        obraId:     parseInt(obra.siengeId),
        tipo:       input.tipo,
        quantidade: input.quantidade,
        data:       input.data,
        observacao: input.observacao,
      })
    }),

  // ── Boletos / Segunda Via ────────────────────────────────────────────────────

  enviarBoleto2Via: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      email: z.string().email().optional(),
      installmentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Sienge não configurado" })
      return enviarBoleto2ViaSienge(config.sub, config.user, config.pass, input)
    }),

  obterSaldoDevedor: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return null
      return obterSaldoDevedorSienge(config.sub, config.user, config.pass, input.customerId).catch(() => null)
    }),

  enviarSaldoDevedorEmail: protectedProcedure
    .input(z.object({ customerId: z.number(), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Sienge não configurado" })
      return enviarSaldoDevedorEmailSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Lançamentos Contábeis ────────────────────────────────────────────────────

  criarLoteContabil: protectedProcedure
    .input(z.object({
      entries: z.array(z.object({
        accountCode: z.string(),
        costCenterCode: z.string().optional(),
        description: z.string(),
        value: z.number(),
        date: z.string(),
        documentNumber: z.string().optional(),
        debitOrCredit: z.enum(["D", "C"]).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return { sucesso: false }
      return criarLoteContabilSienge(config.sub, config.user, config.pass, input.entries)
    }),

  // ── Cotação (criar) ──────────────────────────────────────────────────────────

  criarCotacao: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      descricao: z.string().optional(),
      itens: z.array(z.object({
        materialId: z.number().optional(),
        descricao: z.string().optional(),
        quantidade: z.number(),
        unidade: z.string(),
      })),
      fornecedoresIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Sienge não configurado" })
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { siengeId: true, nome: true },
      })
      if (!obra?.siengeId) throw new TRPCError({ code: "BAD_REQUEST", message: "Obra não vinculada ao Sienge" })
      return criarCotacaoSienge(config.sub, config.user, config.pass, {
        buildingId: parseInt(obra.siengeId),
        description: input.descricao,
        items: input.itens.map(i => ({ materialId: i.materialId, description: i.descricao, quantity: i.quantidade, unit: i.unidade })),
        suppliers: input.fornecedoresIds.map(id => ({ creditorId: id })),
      })
    }),

  // ── Multi-empresa ─────────────────────────────────────────────────────────────

  listarEmpresas: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarEmpresasSienge(config.sub, config.user, config.pass)
    }),
})
