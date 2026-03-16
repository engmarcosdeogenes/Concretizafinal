import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { decrypt, isEncrypted } from "@/lib/encrypt"
import { logAudit } from "@/lib/audit"
import {
  siengeGet,
  buscarCreditorPorId,
  getPdfAnalisePedidoSienge,
  getPdfMapaCotacaoSienge,
  listarContasBancariasFornecedor,
  listarPixFornecedor,
  inserirContaBancariaFornecedor,
  atualizarContaBancariaFornecedor,
  inserirPixFornecedor,
  atualizarPixFornecedor,
  listarCriteriosAvaliacaoSienge,
  salvarAvaliacaoFornecedor,
  listarProjetosSienge,
  listarTarefasSienge,
  listarOrcamentosSienge,
  listarItensOrcamento,
  listarCotacoesSienge,
  listarRespostasCotacao,
  autorizarPedidoSienge,
  buscarPedidoSienge,
  listarItensPedidoSienge,
  reprovarPedidoSienge,
  buscarSolicitacaoSienge,
  criarItensSolicitacaoSienge,
  listarAnexosSolicitacaoSienge,
  downloadAnexoSolicitacaoSienge,
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
  listarTodosSupplyContractsSienge,
  listarItensSupplyContractsSienge,
  listarBuildingsSupplyContractsSienge,
  listarTodasMedicoesSupplyContractsSienge,
  listarItensMedicoesSupplyContractsSienge,
  listarCompensacoesMedicoesSupplyContractsSienge,
  criarMedicaoSupplyContractSienge,
  listarUnidadesSienge,
  uploadAnexoUnidadeSienge,
  listarContratosVendaSienge,
  criarContratoVendaSienge,
  buscarContratoVendaSienge,
  atualizarContratoVendaSienge,
  excluirContratoVendaSienge,
  cancelarContratoVendaSienge,
  listarAnexosContratoVendaSienge,
  uploadAnexoContratoVendaSienge,
  downloadAnexoContratoVendaSienge,
  listarLocacoesSienge,
  listarComissoesSienge,
  criarComissaoSienge,
  buscarComissaoSienge,
  atualizarComissaoSienge,
  excluirComissaoSienge,
  autorizarComissoesSienge,
  cancelarComissoesSienge,
  liberarComissoesSienge,
  comissoesCountFiltersSienge,
  adicionarCorretorComissaoSienge,
  removerCorretorComissaoSienge,
  listarConfigCorretoresComissaoSienge,
  criarConfigCorretorComissaoSienge,
  atualizarConfigCorretorComissaoSienge,
  excluirConfigCorretorComissaoSienge,
  buscarConfigEmpreendimentoComissaoSienge,
  criarConfigEmpreendimentoComissaoSienge,
  atualizarConfigEmpreendimentoComissaoSienge,
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
  uploadAnexoBillSienge,
  listarAnexosBillSienge,
  downloadAnexoBillSienge,
  enviarBoleto2ViaSienge,
  obterSaldoDevedorSienge,
  enviarSaldoDevedorEmailSienge,
  criarLoteContabilSienge,
  criarCotacaoSienge,
  criarItemCotacaoFromSolicitacaoSienge,
  listarEmpresasSienge,
  criarEntregasPedidoNfCompraSienge,
  listarEntregasAtendidasNfCompraSienge,
  buscarNFeDetalheSienge,
  atualizarTelefoneCredor,
  atualizarContatoCredor,
  atualizarProcuradorCredor,
  atualizarRepresentantesCredor,
  atualizarDesoneracaoFolhaCredor,
  criarClienteSienge,
  buscarClientePorIdSienge,
  atualizarClienteSienge,
  sobrescreverTelefonesCliente,
  atualizarConjugeCliente,
  atualizarRendaFamiliarCliente,
  atualizarEnderecoCliente,
  listarAnexosClienteSienge,
  uploadAnexoClienteSienge,
  downloadAnexoClienteSienge,
  criarProcuradorClienteSienge,
  listarAvalistasContratoVendaSienge,
  adicionarAvalistaContratoVendaSienge,
  buscarAvalistaContratoVendaSienge,
  atualizarAvalistaContratoVendaSienge,
  atualizarTelefonesAvalistaContratoVendaSienge,
  listarAnexosPedidoSienge,
  uploadAnexoPedidoSienge,
  downloadAnexoPedidoSienge,
  criarUnidadeSienge,
  buscarUnidadeSienge,
  atualizarUnidadeSienge,
  adicionarUnidadeFilhaSienge,
  atualizarEnderecoUnidadeSienge,
  buscarAgrupamentosUnidadeSienge,
  listarCaracteristicasUnidadeSienge,
  criarCaracteristicaUnidadeSienge,
  vincularCaracteristicasUnidadeSienge,
  listarSituacoesUnidadeSienge,
  criarSituacaoUnidadeSienge,
  listarExtratoClienteSienge,
  enviarExtratoClienteEmailSienge,
  listarLancamentosContabeisSienge,
  salvarLancamentosContabeisSienge,
  salvarLancamentosContabeisAsyncSienge,
  statusLancamentosContabeisAsyncSienge,
  listarBillsByChangeDateSienge,
  buscarBillSienge,
  atualizarBillSienge,
  criarBillFromNFeSienge,
  listarParcelasBillSienge,
  atualizarParcelaBillSienge,
  listarImpostosBillSienge,
  listarBudgetCategoriesBillSienge,
  listarDepartmentsCostBillSienge,
  listarBuildingsCostBillSienge,
  atualizarBuildingsCostBillSienge,
  listarUnitsBillSienge,
  atualizarUnitsBillSienge,
  criarTaxInformationBillSienge,
  criarTaxInformationItemBillSienge,
  buscarReceivableBillSienge,
  listarParcReceivableBillSienge,
  alterarVencimentoReceivableBillSienge,
  criarReservaUnidadeSienge,
  inativarReservaUnidadeSienge,
  criarLocacaoSienge,
  enviarInformeIREmailSienge,
  buscarWebhookSienge,
  buscarDirectBillingPedidoSienge,
  getPaymentInfoSienge,
  patchPaymentInfoSienge,
  buscarItemPedidoSienge,
  listarDeliverySchedulesPedidoSienge,
  listarBuildingsAppropriationsPedidoItemSienge,
  buscarTotalizacaoPedidoSienge,
  reprovarPedidoComObsSienge,
  autorizarSolicitacaoSienge,
  reprovarSolicitacaoSienge,
  listarTodosItensSolicitacaoSienge,
  listarApropriacoesSolicitacaoItemSienge,
  listarRequisitosEntregaSolicitacaoItemSienge,
  autorizarItensSolicitacaoSienge,
  autorizarItemSolicitacaoSienge,
  reprovarItemSolicitacaoSienge,
  buscarNFeIssuersRecipientsSienge,
  buscarNFePaymentsSienge,
  buscarNFeDeliveriesSienge,
  buscarNFeLinkedNfesSienge,
  buscarNFeIcmsSienge,
  buscarNFeCarriersSienge,
  buscarNFeIssqnSienge,
  listarBulkBillPayablesInstallmentsSienge,
  listarBulkReceivableInstallmentsSienge,
  listarBulkBankMovementsSienge,
  listarBulkSalesContractsSienge,
  listarBulkCustomerExtractHistorySienge,
  listarNegociacoesCotacaoSienge,
  criarItemCotacaoSienge,
  incluirFornecedorItemCotacaoSienge,
  criarNegociacaoCotacaoSienge,
  autorizarNegociacaoCotacaoSienge,
  buscarNFeItemIpiSienge,
  buscarNFeItemPisCofinsSienge,
  buscarNFeItemSimplifiedIcmsSienge,
  buscarNFeItemIssqnSienge,
  buscarNFeItemIcmsSienge,
  atualizarNegociacaoCotacaoSienge,
  atualizarItemNegociacaoCotacaoSienge,
  listarApropriacoesInventarioSienge,
  listarItensReservaEstoqueSienge,
  listarMovimentacoesInventarioSienge,
  buscarMovimentacaoInventarioSienge,
  buscarDiarioObraSienge,
  deletarDiarioObraSienge,
  incluirOcorrenciasDiarioObraSienge,
  atualizarOcorrenciasDiarioObraSienge,
  incluirTarefasDiarioObraSienge,
  atualizarTarefasDiarioObraSienge,
  incluirEquipesDiarioObraSienge,
  atualizarEquipesDiarioObraSienge,
  incluirEquipamentosDiarioObraSienge,
  atualizarEquipamentosDiarioObraSienge,
  listarTiposOcorrenciaDiarioObraSienge,
  listarTiposDiarioObraSienge,
  adicionarInsumoOrcamentoSienge,
  buscarInsumoOrcamentoSienge,
  atualizarInsumoOrcamentoSienge,
  listarPlanilhasOrcamentoSienge,
  inserirTarefasPlanilhaSienge,
  cadastrarPurchaseInvoiceSienge,
  buscarPurchaseInvoiceSienge,
  listarItensPurchaseInvoiceSienge,
  listarBuildingsAppropriationsNfItemSienge,
  listarBudgetCategoriesReceivableSienge,
  listarBulkPurchaseQuotationsSienge,
  listarBulkInvoiceItensSienge,
  listarBulkBuildingResourcesSienge,
  listarBulkBudgetItemsSienge,
  listarBulkDefaultersSienge,
  listarBulkAccountBalancesSienge,
  listarBulkBusinessBudgetsSienge,
  consultarBulkAsyncStatusSienge,
  consultarBulkAsyncResultSienge,
} from "@/lib/sienge/client"
import type { PaymentInfoType } from "@/lib/sienge/client"

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

  // ── Buscar pedido por ID ────────────────────────────────────────────────
  buscarPedido: protectedProcedure
    .input(z.object({ pedidoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarPedidoSienge(config.sub, config.user, config.pass, input.pedidoId)
    }),

  // ── Itens do pedido ─────────────────────────────────────────────────────
  listarItensPedido: protectedProcedure
    .input(z.object({ pedidoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarItensPedidoSienge(config.sub, config.user, config.pass, input.pedidoId)
    }),

  // ── Reprovar pedido no Sienge ───────────────────────────────────────────
  reprovarPedido: protectedProcedure
    .input(z.object({ pedidoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await reprovarPedidoSienge(config.sub, config.user, config.pass, input.pedidoId)
      await logAudit(ctx, {
        entityType: "SIENGE_PEDIDO",
        entityId: String(input.pedidoId),
        acao: "reprovou",
      })
      return { sucesso: true }
    }),

  // ── Buscar solicitação de compra por ID ─────────────────────────────────
  buscarSolicitacao: protectedProcedure
    .input(z.object({ solicitacaoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarSolicitacaoSienge(config.sub, config.user, config.pass, input.solicitacaoId)
    }),

  // ── Criar itens na solicitação de compra ────────────────────────────────
  criarItensSolicitacao: protectedProcedure
    .input(z.object({
      solicitacaoId: z.number(),
      items: z.array(z.object({
        description: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string().optional(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await criarItensSolicitacaoSienge(config.sub, config.user, config.pass, input.solicitacaoId, input.items)
      await logAudit(ctx, {
        entityType: "SIENGE_SOLICITACAO",
        entityId: String(input.solicitacaoId),
        acao: "criou itens",
      })
      return { sucesso: true }
    }),

  // ── Listar anexos de solicitação de compra ─────────────────────────────────
  listarAnexosSolicitacao: protectedProcedure
    .input(z.object({ solicitacaoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarAnexosSolicitacaoSienge(config.sub, config.user, config.pass, input.solicitacaoId)
    }),

  // ── Download de anexo de solicitação ─────────────────────────────────────
  downloadAnexoSolicitacao: protectedProcedure
    .input(z.object({ solicitacaoId: z.number(), attachmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await downloadAnexoSolicitacaoSienge(config.sub, config.user, config.pass, input.solicitacaoId, input.attachmentId)
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Anexo não encontrado" })
      return result
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
  buscarCreditorPorId: protectedProcedure
    .input(z.object({ credorId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return null
      return buscarCreditorPorId(config.sub, config.user, config.pass, input.credorId).catch(() => null)
    }),

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

  // ── Inserir Conta Bancária de Credor ──────────────────────────────────────
  inserirContaBancariaCredor: protectedProcedure
    .input(z.object({
      credorId:    z.number(),
      bankCode:    z.string(),
      agency:      z.string(),
      account:     z.string(),
      accountType: z.string().optional(),
      holder:      z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { credorId, ...data } = input
      const result = await inserirContaBancariaFornecedor(config.sub, config.user, config.pass, credorId, data)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao inserir conta bancária no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CREDITOR_BANK", entityId: String(result.id), acao: "inseriu conta bancária no credor" })
      return result
    }),

  // ── Atualizar Conta Bancária de Credor ───────────────────────────────────
  atualizarContaBancariaCredor: protectedProcedure
    .input(z.object({
      credorId:            z.number(),
      bankInformationId:   z.number(),
      bankCode:            z.string().optional(),
      agency:              z.string().optional(),
      account:             z.string().optional(),
      accountType:         z.string().optional(),
      holder:              z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { credorId, bankInformationId, ...data } = input
      const ok = await atualizarContaBancariaFornecedor(config.sub, config.user, config.pass, credorId, bankInformationId, data)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar conta bancária no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CREDITOR_BANK", entityId: String(bankInformationId), acao: "atualizou conta bancária do credor" })
      return { success: true }
    }),

  // ── Inserir Chave PIX de Credor ──────────────────────────────────────────
  inserirPixCredor: protectedProcedure
    .input(z.object({
      credorId: z.number(),
      keyType:  z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]),
      keyValue: z.string(),
      holder:   z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { credorId, ...data } = input
      const result = await inserirPixFornecedor(config.sub, config.user, config.pass, credorId, data)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao inserir chave PIX no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CREDITOR_PIX", entityId: String(result.id), acao: "inseriu chave PIX no credor" })
      return result
    }),

  // ── Atualizar Chave PIX de Credor ──────────────────────────────────────
  atualizarPixCredor: protectedProcedure
    .input(z.object({
      credorId: z.number(),
      pixId:    z.number(),
      keyType:  z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]).optional(),
      keyValue: z.string().optional(),
      holder:   z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { credorId, pixId, ...data } = input
      const ok = await atualizarPixFornecedor(config.sub, config.user, config.pass, credorId, pixId, data)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar chave PIX no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CREDITOR_PIX", entityId: String(pixId), acao: "atualizou chave PIX do credor" })
      return { success: true }
    }),

  // ── Atualizar Telefone de Credor ─────────────────────────────────────────
  atualizarTelefoneCredor: protectedProcedure
    .input(z.object({
      credorId: z.number(),
      phoneId:  z.number(),
      ddd:      z.string().optional(),
      number:   z.string().optional(),
      type:     z.enum(["COMMERCIAL", "RESIDENTIAL", "MOBILE", "FAX"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { credorId, phoneId, ...data } = input
      const ok = await atualizarTelefoneCredor(config.sub, config.user, config.pass, credorId, phoneId, data)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar telefone no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CREDITOR_PHONE", entityId: String(phoneId), acao: "atualizou telefone do credor" })
      return { success: true }
    }),

  atualizarContatoCredor: protectedProcedure
    .input(z.object({
      credorId:   z.number(),
      contactId:  z.number(),
      name:       z.string().optional(),
      email:      z.string().email().optional(),
      phone:      z.string().optional(),
      department: z.string().optional(),
      position:   z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { credorId, contactId, ...data } = input
      const ok = await atualizarContatoCredor(config.sub, config.user, config.pass, credorId, contactId, data)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar contato no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CREDITOR_CONTACT", entityId: String(contactId), acao: "atualizou contato do credor" })
      return { success: true }
    }),

  atualizarProcuradorCredor: protectedProcedure
    .input(z.object({
      credorId:     z.number(),
      procuratorId: z.number(),
      name:         z.string().optional(),
      cpf:          z.string().optional(),
      rg:           z.string().optional(),
      rgEmitter:    z.string().optional(),
      rgState:      z.string().optional(),
      nationality:  z.string().optional(),
      civilStatus:  z.string().optional(),
      profession:   z.string().optional(),
      email:        z.string().email().optional(),
      phone:        z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { credorId, procuratorId, ...data } = input
      const ok = await atualizarProcuradorCredor(config.sub, config.user, config.pass, credorId, procuratorId, data)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar procurador no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CREDITOR_PROCURATOR", entityId: String(procuratorId), acao: "atualizou procurador do credor" })
      return { success: true }
    }),

  // ── Representantes do Credor ─────────────────────────────────────────────
  atualizarRepresentantesCredor: protectedProcedure
    .input(z.object({
      credorId: z.number(),
      agents: z.array(z.object({
        name:  z.string(),
        cpf:   z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await atualizarRepresentantesCredor(config.sub, config.user, config.pass, input.credorId, input.agents)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar representantes no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CREDITOR_AGENTS", entityId: String(input.credorId), acao: "atualizou representantes do credor" })
      return { success: true }
    }),

  // ── Desoneração de Folha do Credor ────────────────────────────────────────
  atualizarDesoneracaoFolhaCredor: protectedProcedure
    .input(z.object({
      credorId: z.number(),
      years: z.array(z.number().int().min(1900).max(2100)),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await atualizarDesoneracaoFolhaCredor(config.sub, config.user, config.pass, input.credorId, { years: input.years })
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar anos de desoneração de folha no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CREDITOR_DESONERATION", entityId: String(input.credorId), acao: "atualizou anos de desoneração de folha do credor" })
      return { success: true }
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

  lancarDespesa: protectedProcedure
    .input(z.object({
      creditorId:     z.number(),
      documentNumber: z.string().optional(),
      dueDate:        z.string(),
      amount:         z.number().positive(),
      description:    z.string().optional(),
      obraId:         z.string().optional(),
      categoria:      z.string().optional(),
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
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao lançar despesa no Sienge." })
      // Also track locally as a financial entry
      if (input.obraId) {
        await ctx.db.lancamentoFinanceiro.create({
          data: {
            obraId:    input.obraId,
            tipo:      "DESPESA",
            categoria: input.categoria ?? "Conta a Pagar",
            descricao: input.description ?? `Título Sienge #${result.id}`,
            valor:     input.amount,
            data:      new Date(input.dueDate),
          },
        })
      }
      await logAudit(ctx, { entityType: "SIENGE_CONTA_PAGAR", entityId: String(result.id), acao: "lançou despesa" })
      return { id: result.id }
    }),

  lancarDespesaNf: protectedProcedure
    .input(z.object({
      accessKey:  z.string().min(1),
      companyId:  z.number().optional(),
      buildingId: z.number().optional(),
      creditorId: z.number().optional(),
      obraId:     z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      let buildingId = input.buildingId
      if (!buildingId && input.obraId) {
        const obra = await ctx.db.obra.findFirst({
          where: { id: input.obraId, empresaId: ctx.session.empresaId },
          select: { siengeId: true },
        })
        if (obra?.siengeId) buildingId = parseInt(obra.siengeId)
      }
      const result = await criarBillFromNFeSienge(config.sub, config.user, config.pass, {
        accessKey:  input.accessKey,
        companyId:  input.companyId,
        buildingId,
        creditorId: input.creditorId,
      })
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao lançar despesa via NF-e no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CONTA_PAGAR", entityId: String(result.id), acao: "lançou despesa via NF-e" })
      return { id: result.id }
    }),

  uploadAnexoBill: protectedProcedure
    .input(z.object({
      billId: z.number(),
      fileBase64: z.string(),
      fileName: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const fileBuffer = Buffer.from(input.fileBase64, "base64")
      const maxSize = 70 * 1024 * 1024
      if (fileBuffer.length > maxSize) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo excede o limite de 70MB." })
      }
      const result = await uploadAnexoBillSienge(config.sub, config.user, config.pass, input.billId, fileBuffer, input.fileName, input.description)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao fazer upload do anexo no Sienge." })
      await logAudit(ctx, {
        entityType: "SIENGE_BILL_ATTACHMENT",
        entityId: String(input.billId),
        acao: `fez upload de anexo: ${input.fileName}`,
      })
      return result
    }),

  listarAnexosBill: protectedProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await listarAnexosBillSienge(config.sub, config.user, config.pass, input.billId)
      return result
    }),

  downloadAnexoBill: protectedProcedure
    .input(z.object({ billId: z.number(), attachmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await downloadAnexoBillSienge(config.sub, config.user, config.pass, input.billId, input.attachmentId)
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Anexo não encontrado" })
      return result
    }),

  // ── Purchase Orders — Attachments ─────────────────────────────────────────

  listarAnexosPedido: protectedProcedure
    .input(z.object({ pedidoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarAnexosPedidoSienge(config.sub, config.user, config.pass, input.pedidoId)
    }),

  uploadAnexoPedido: protectedProcedure
    .input(z.object({
      pedidoId: z.number(),
      fileBase64: z.string(),
      fileName: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const fileBuffer = Buffer.from(input.fileBase64, "base64")
      const maxSize = 70 * 1024 * 1024
      if (fileBuffer.length > maxSize) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo excede o limite de 70MB." })
      }
      const result = await uploadAnexoPedidoSienge(config.sub, config.user, config.pass, input.pedidoId, fileBuffer, input.fileName, input.description)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao fazer upload do anexo no Sienge." })
      await logAudit(ctx, {
        entityType: "SIENGE_PURCHASE_ORDER_ATTACHMENT",
        entityId: String(input.pedidoId),
        acao: `fez upload de anexo: ${input.fileName}`,
      })
      return result
    }),

  downloadAnexoPedido: protectedProcedure
    .input(z.object({ pedidoId: z.number(), attachmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await downloadAnexoPedidoSienge(config.sub, config.user, config.pass, input.pedidoId, input.attachmentId)
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Anexo não encontrado" })
      return result
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

  buscarNFeDetalhe: protectedProcedure
    .input(z.object({ nfeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarNFeDetalheSienge(config.sub, config.user, config.pass, input.nfeId)
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

  listarTodosSupplyContracts: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarTodosSupplyContractsSienge(config.sub, config.user, config.pass).catch(() => [])
    }),

  listarItensSupplyContracts: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarItensSupplyContractsSienge(config.sub, config.user, config.pass).catch(() => [])
    }),

  listarBuildingsSupplyContracts: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarBuildingsSupplyContractsSienge(config.sub, config.user, config.pass).catch(() => [])
    }),

  listarTodasMedicoesSupplyContracts: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarTodasMedicoesSupplyContractsSienge(config.sub, config.user, config.pass).catch(() => [])
    }),

  listarItensMedicoesSupplyContracts: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarItensMedicoesSupplyContractsSienge(config.sub, config.user, config.pass).catch(() => [])
    }),

  listarCompensacoesMedicoesSupplyContracts: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarCompensacoesMedicoesSupplyContractsSienge(config.sub, config.user, config.pass).catch(() => [])
    }),

  criarMedicaoSupplyContract: protectedProcedure
    .input(z.object({
      supplyContractId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarMedicaoSupplyContractSienge(config.sub, config.user, config.pass, input)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao criar medição de contrato de suprimento no Sienge." })
      await logAudit(ctx, {
        entityType: "SIENGE_MEDICAO_SUPPLY_CONTRACT",
        entityId: String(result.id),
        acao: "criou medição de contrato de suprimento",
      })
      return result
    }),

  // ── Comercial ─────────────────────────────────────────────────────────────
  listarMapaImobiliario: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarUnidadesSienge(config.sub, config.user, config.pass)
    }),

  uploadAnexoUnidade: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      fileBase64: z.string(),
      fileName: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const fileBuffer = Buffer.from(input.fileBase64, "base64")
      const maxSize = 70 * 1024 * 1024
      if (fileBuffer.length > maxSize) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo excede o limite de 70MB." })
      }
      const result = await uploadAnexoUnidadeSienge(config.sub, config.user, config.pass, input.unitId, fileBuffer, input.fileName, input.description)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao fazer upload do anexo da unidade no Sienge." })
      await logAudit(ctx, {
        entityType: "SIENGE_UNIDADE_ATTACHMENT",
        entityId: String(input.unitId),
        acao: `fez upload de anexo: ${input.fileName}`,
      })
      return result
    }),

  listarContratosVenda: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarContratosVendaSienge(config.sub, config.user, config.pass)
    }),

  criarContratoVenda: protectedProcedure
    .input(z.object({
      enterpriseId:        z.number(),
      unitId:              z.number(),
      customerId:          z.number(),
      signatureDate:       z.string().optional(),
      totalValue:          z.number().optional(),
      installmentsCount:   z.number().optional(),
      firstInstallmentDate: z.string().optional(),
      observations:        z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarContratoVendaSienge(config.sub, config.user, config.pass, input)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao criar contrato de venda no Sienge." })
      await logAudit(ctx, {
        entityType: "SIENGE_CONTRATO_VENDA",
        entityId: String(result.id),
        acao: "criou contrato de venda",
      })
      return result
    }),

  buscarContratoVenda: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const contrato = await buscarContratoVendaSienge(config.sub, config.user, config.pass, input.id)
      if (!contrato) throw new TRPCError({ code: "NOT_FOUND", message: "Contrato de venda não encontrado no Sienge." })
      return contrato
    }),

  atualizarContratoVenda: protectedProcedure
    .input(z.object({
      id:                  z.number(),
      enterpriseId:        z.number().optional(),
      unitId:              z.number().optional(),
      customerId:          z.number().optional(),
      signatureDate:       z.string().optional(),
      totalValue:          z.number().optional(),
      installmentsCount:   z.number().optional(),
      firstInstallmentDate: z.string().optional(),
      observations:        z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { id, ...data } = input
      await atualizarContratoVendaSienge(config.sub, config.user, config.pass, id, data)
      await logAudit(ctx, {
        entityType: "SIENGE_CONTRATO_VENDA",
        entityId: String(id),
        acao: "atualizou contrato de venda",
      })
      return { success: true }
    }),

  excluirContratoVenda: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await excluirContratoVendaSienge(config.sub, config.user, config.pass, input.id)
      await logAudit(ctx, {
        entityType: "SIENGE_CONTRATO_VENDA",
        entityId: String(input.id),
        acao: "excluiu contrato de venda",
      })
      return { success: true }
    }),

  cancelarContratoVenda: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await cancelarContratoVendaSienge(config.sub, config.user, config.pass, input.id)
      await logAudit(ctx, {
        entityType: "SIENGE_CONTRATO_VENDA",
        entityId: String(input.id),
        acao: "cancelou contrato de venda",
      })
      return { success: true }
    }),

  listarAnexosContratoVenda: protectedProcedure
    .input(z.object({ contratoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarAnexosContratoVendaSienge(config.sub, config.user, config.pass, input.contratoId)
    }),

  uploadAnexoContratoVenda: protectedProcedure
    .input(z.object({
      contratoId: z.number(),
      fileBase64: z.string(),
      fileName: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const fileBuffer = Buffer.from(input.fileBase64, "base64")
      const maxSize = 70 * 1024 * 1024
      if (fileBuffer.length > maxSize) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo excede o limite de 70MB." })
      }
      const result = await uploadAnexoContratoVendaSienge(config.sub, config.user, config.pass, input.contratoId, fileBuffer, input.fileName, input.description)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao fazer upload do anexo no Sienge." })
      await logAudit(ctx, {
        entityType: "SIENGE_CONTRATO_VENDA_ATTACHMENT",
        entityId: String(input.contratoId),
        acao: `fez upload de anexo: ${input.fileName}`,
      })
      return result
    }),

  downloadAnexoContratoVenda: protectedProcedure
    .input(z.object({ contratoId: z.number(), anexoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await downloadAnexoContratoVendaSienge(config.sub, config.user, config.pass, input.contratoId, input.anexoId)
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Anexo não encontrado no Sienge." })
      return {
        dataBase64: result.data.toString("base64"),
        contentType: result.contentType,
        fileName: result.fileName,
      }
    }),

  listarAvalistasContratoVenda: protectedProcedure
    .input(z.object({ contratoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarAvalistasContratoVendaSienge(config.sub, config.user, config.pass, input.contratoId)
    }),

  adicionarAvalistaContratoVenda: protectedProcedure
    .input(z.object({
      contratoId: z.number(),
      customerId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await adicionarAvalistaContratoVendaSienge(config.sub, config.user, config.pass, input.contratoId, { customerId: input.customerId })
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao adicionar avalista no Sienge." })
      await logAudit(ctx, {
        entityType: "SIENGE_CONTRATO_VENDA_AVALISTA",
        entityId: String(input.contratoId),
        acao: `adicionou avalista customerId=${input.customerId}`,
      })
      return result
    }),

  buscarAvalistaContratoVenda: protectedProcedure
    .input(z.object({ contratoId: z.number(), avalistaId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await buscarAvalistaContratoVendaSienge(config.sub, config.user, config.pass, input.contratoId, input.avalistaId)
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Avalista não encontrado no Sienge." })
      return result
    }),

  atualizarAvalistaContratoVenda: protectedProcedure
    .input(z.object({
      contratoId: z.number(),
      avalistaId: z.number(),
      customerId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { contratoId, avalistaId, ...data } = input
      await atualizarAvalistaContratoVendaSienge(config.sub, config.user, config.pass, contratoId, avalistaId, data)
      await logAudit(ctx, {
        entityType: "SIENGE_CONTRATO_VENDA_AVALISTA",
        entityId: `${contratoId}/${avalistaId}`,
        acao: "atualizou avalista",
      })
      return { success: true }
    }),

  atualizarTelefonesAvalistaContratoVenda: protectedProcedure
    .input(z.object({
      contratoId: z.number(),
      avalistaId: z.number(),
      phones: z.array(z.object({
        countryCode: z.string().optional(),
        areaCode: z.string().optional(),
        number: z.string(),
        type: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await atualizarTelefonesAvalistaContratoVendaSienge(config.sub, config.user, config.pass, input.contratoId, input.avalistaId, { phones: input.phones })
      await logAudit(ctx, {
        entityType: "SIENGE_CONTRATO_VENDA_AVALISTA",
        entityId: `${input.contratoId}/${input.avalistaId}`,
        acao: "atualizou telefones do avalista",
      })
      return { success: true }
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

  criarComissao: protectedProcedure
    .input(z.object({
      salesContractId:   z.number(),
      installmentNumber: z.number(),
      brokerId:          z.number(),
      commissionValue:   z.number(),
      dueDate:           z.string(),
      observations:      z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarComissaoSienge(config.sub, config.user, config.pass, input)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao criar comissão no Sienge." })
      await logAudit(ctx, {
        entityType: "SIENGE_COMISSAO",
        entityId: String(result.id),
        acao: "criou comissão",
      })
      return result
    }),

  buscarComissao: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const comissao = await buscarComissaoSienge(config.sub, config.user, config.pass, input.id)
      if (!comissao) throw new TRPCError({ code: "NOT_FOUND", message: "Comissão não encontrada no Sienge." })
      return comissao
    }),

  atualizarComissao: protectedProcedure
    .input(z.object({
      id:                z.number(),
      installmentNumber: z.number().optional(),
      brokerId:          z.number().optional(),
      commissionValue:   z.number().optional(),
      dueDate:           z.string().optional(),
      observations:      z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { id, ...data } = input
      await atualizarComissaoSienge(config.sub, config.user, config.pass, id, data)
      await logAudit(ctx, {
        entityType: "SIENGE_COMISSAO",
        entityId: String(id),
        acao: "atualizou comissão",
      })
      return { success: true }
    }),

  excluirComissao: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await excluirComissaoSienge(config.sub, config.user, config.pass, input.id)
      await logAudit(ctx, {
        entityType: "SIENGE_COMISSAO",
        entityId: String(input.id),
        acao: "excluiu comissão",
      })
      return { success: true }
    }),

  autorizarComissoes: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await autorizarComissoesSienge(config.sub, config.user, config.pass, input.ids)
      await logAudit(ctx, {
        entityType: "SIENGE_COMISSAO",
        entityId: input.ids.join(","),
        acao: "autorizou comissões",
      })
      return { success: true }
    }),

  cancelarComissoes: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await cancelarComissoesSienge(config.sub, config.user, config.pass, input.ids)
      await logAudit(ctx, {
        entityType: "SIENGE_COMISSAO",
        entityId: input.ids.join(","),
        acao: "cancelou comissões",
      })
      return { success: true }
    }),

  liberarComissoes: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await liberarComissoesSienge(config.sub, config.user, config.pass, input.ids)
      await logAudit(ctx, {
        entityType: "SIENGE_COMISSAO",
        entityId: input.ids.join(","),
        acao: "liberou comissões",
      })
      return { success: true }
    }),

  comissoesCountFilters: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return comissoesCountFiltersSienge(config.sub, config.user, config.pass)
    }),

  adicionarCorretorComissao: protectedProcedure
    .input(z.object({
      comissaoId:             z.number(),
      brokerId:               z.number(),
      commissionPercentage:   z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { comissaoId, ...data } = input
      await adicionarCorretorComissaoSienge(config.sub, config.user, config.pass, comissaoId, data)
      await logAudit(ctx, {
        entityType: "SIENGE_COMISSAO",
        entityId: String(comissaoId),
        acao: "adicionou corretor à comissão",
      })
      return { success: true }
    }),

  removerCorretorComissao: protectedProcedure
    .input(z.object({ comissaoId: z.number(), corretorId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await removerCorretorComissaoSienge(config.sub, config.user, config.pass, input.comissaoId, input.corretorId)
      await logAudit(ctx, {
        entityType: "SIENGE_COMISSAO",
        entityId: `${input.comissaoId}/${input.corretorId}`,
        acao: "removeu corretor da comissão",
      })
      return { success: true }
    }),

  listarConfigCorretoresComissao: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarConfigCorretoresComissaoSienge(config.sub, config.user, config.pass)
    }),

  criarConfigCorretorComissao: protectedProcedure
    .input(z.object({
      brokerId:             z.number(),
      commissionPercentage: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarConfigCorretorComissaoSienge(config.sub, config.user, config.pass, input)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao criar config de corretor no Sienge." })
      await logAudit(ctx, {
        entityType: "SIENGE_CONFIG_CORRETOR",
        entityId: String(result.id),
        acao: "criou config de corretor de comissão",
      })
      return result
    }),

  atualizarConfigCorretorComissao: protectedProcedure
    .input(z.object({
      id:                   z.number(),
      brokerId:             z.number().optional(),
      commissionPercentage: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { id, ...data } = input
      await atualizarConfigCorretorComissaoSienge(config.sub, config.user, config.pass, id, data)
      await logAudit(ctx, {
        entityType: "SIENGE_CONFIG_CORRETOR",
        entityId: String(id),
        acao: "atualizou config de corretor de comissão",
      })
      return { success: true }
    }),

  excluirConfigCorretorComissao: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await excluirConfigCorretorComissaoSienge(config.sub, config.user, config.pass, input.id)
      await logAudit(ctx, {
        entityType: "SIENGE_CONFIG_CORRETOR",
        entityId: String(input.id),
        acao: "excluiu config de corretor de comissão",
      })
      return { success: true }
    }),

  buscarConfigEmpreendimentoComissao: protectedProcedure
    .input(z.object({ enterpriseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const resultado = await buscarConfigEmpreendimentoComissaoSienge(config.sub, config.user, config.pass, input.enterpriseId)
      if (!resultado) throw new TRPCError({ code: "NOT_FOUND", message: "Config de empreendimento não encontrada no Sienge." })
      return resultado
    }),

  criarConfigEmpreendimentoComissao: protectedProcedure
    .input(z.object({
      enterpriseId:         z.number(),
      commissionPercentage: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarConfigEmpreendimentoComissaoSienge(config.sub, config.user, config.pass, input)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao criar config de empreendimento no Sienge." })
      await logAudit(ctx, {
        entityType: "SIENGE_CONFIG_EMPREENDIMENTO",
        entityId: String(result.id),
        acao: "criou config de empreendimento de comissão",
      })
      return result
    }),

  atualizarConfigEmpreendimentoComissao: protectedProcedure
    .input(z.object({
      id:                   z.number(),
      enterpriseId:         z.number().optional(),
      commissionPercentage: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { id, ...data } = input
      await atualizarConfigEmpreendimentoComissaoSienge(config.sub, config.user, config.pass, id, data)
      await logAudit(ctx, {
        entityType: "SIENGE_CONFIG_EMPREENDIMENTO",
        entityId: String(id),
        acao: "atualizou config de empreendimento de comissão",
      })
      return { success: true }
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

  // ── Criar Cliente ───────────────────────────────────────────────────────
  criarCliente: protectedProcedure
    .input(z.object({
      name:          z.string().min(1),
      cpf:           z.string().optional(),
      cnpj:          z.string().optional(),
      email:         z.string().email().optional(),
      birthDate:     z.string().optional(),
      gender:        z.string().optional(),
      maritalStatus: z.string().optional(),
      nationality:   z.string().optional(),
      rg:            z.string().optional(),
      rgEmitter:     z.string().optional(),
      phones: z.array(z.object({
        typeId: z.number(),
        ddd:    z.string(),
        number: z.string(),
      })).optional(),
      addresses: z.array(z.object({
        typeId:       z.number(),
        street:       z.string(),
        number:       z.string().optional(),
        complement:   z.string().optional(),
        neighborhood: z.string().optional(),
        city:         z.string().optional(),
        state:        z.string().optional(),
        zipCode:      z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarClienteSienge(config.sub, config.user, config.pass, input)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao criar cliente no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CLIENTE", entityId: String(result.id), acao: "criou cliente" })
      return { id: result.id }
    }),

  // ── Buscar Cliente por ID ─────────────────────────────────────────────
  buscarClienteSiengePorId: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return null
      return buscarClientePorIdSienge(config.sub, config.user, config.pass, input.clienteId)
    }),

  // ── Atualizar Cliente ─────────────────────────────────────────────────
  atualizarCliente: protectedProcedure
    .input(z.object({
      clienteId:     z.number(),
      name:          z.string().min(1).optional(),
      cpf:           z.string().optional(),
      cnpj:          z.string().optional(),
      email:         z.string().email().optional(),
      birthDate:     z.string().optional(),
      gender:        z.string().optional(),
      maritalStatus: z.string().optional(),
      nationality:   z.string().optional(),
      rg:            z.string().optional(),
      rgEmitter:     z.string().optional(),
      phones: z.array(z.object({
        typeId: z.number(),
        ddd:    z.string(),
        number: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { clienteId, ...data } = input
      const ok = await atualizarClienteSienge(config.sub, config.user, config.pass, clienteId, data)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar cliente no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CLIENTE", entityId: String(clienteId), acao: "atualizou cliente" })
      return { sucesso: true }
    }),

  sobrescreverTelefonesCliente: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      phones: z.array(z.object({
        typeId: z.number(),
        ddd:    z.string(),
        number: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await sobrescreverTelefonesCliente(config.sub, config.user, config.pass, input.clienteId, input.phones)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao sobrescrever telefones do cliente no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CLIENTE_PHONES", entityId: String(input.clienteId), acao: "sobrescreveu telefones do cliente" })
      return { sucesso: true }
    }),

  atualizarConjugeCliente: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      spouse: z.object({
        name: z.string(),
        cpf: z.string().optional(),
        rg: z.string().optional(),
        rgEmitter: z.string().optional(),
        rgState: z.string().optional(),
        birthDate: z.string().optional(),
        nationality: z.string().optional(),
        profession: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await atualizarConjugeCliente(config.sub, config.user, config.pass, input.clienteId, input.spouse)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar cônjuge do cliente no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CLIENTE_SPOUSE", entityId: String(input.clienteId), acao: "atualizou cônjuge do cliente" })
      return { sucesso: true }
    }),

  atualizarRendaFamiliarCliente: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      familyIncomes: z.array(z.object({
        sourceOfIncome: z.string(),
        grossIncome: z.number(),
        provenIncome: z.number().optional(),
        deductions: z.number().optional(),
        liquidIncome: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await atualizarRendaFamiliarCliente(config.sub, config.user, config.pass, input.clienteId, input.familyIncomes)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar renda familiar do cliente no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CLIENTE_FAMILY_INCOMES", entityId: String(input.clienteId), acao: "atualizou renda familiar do cliente" })
      return { sucesso: true }
    }),

  atualizarEnderecoCliente: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      addressType: z.string(),
      address: z.object({
        street: z.string(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await atualizarEnderecoCliente(config.sub, config.user, config.pass, input.clienteId, input.addressType, input.address)
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao atualizar endereço do cliente no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CLIENTE_ADDRESS", entityId: String(input.clienteId), acao: `atualizou endereço (${input.addressType}) do cliente` })
      return { sucesso: true }
    }),

  // ── Listar Anexos de Cliente ──────────────────────────────────────────
  listarAnexosCliente: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarAnexosClienteSienge(config.sub, config.user, config.pass, input.clienteId)
    }),

  // ── Upload Anexo de Cliente ───────────────────────────────────────────
  uploadAnexoCliente: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      fileBase64: z.string(),
      fileName: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const fileBuffer = Buffer.from(input.fileBase64, "base64")
      const maxSize = 70 * 1024 * 1024 // 70MB
      if (fileBuffer.length > maxSize) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo excede o limite de 70MB." })
      }
      const result = await uploadAnexoClienteSienge(config.sub, config.user, config.pass, input.clienteId, fileBuffer, input.fileName, input.description)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao fazer upload do anexo no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CLIENTE_ATTACHMENT", entityId: String(input.clienteId), acao: `fez upload de anexo: ${input.fileName}` })
      return result
    }),

  // ── Download Anexo de Cliente ─────────────────────────────────────────
  downloadAnexoCliente: protectedProcedure
    .input(z.object({ clienteId: z.number(), anexoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await downloadAnexoClienteSienge(config.sub, config.user, config.pass, input.clienteId, input.anexoId)
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Anexo não encontrado no Sienge." })
      return {
        dataBase64: result.data.toString("base64"),
        contentType: result.contentType,
        fileName: result.fileName,
      }
    }),

  // ── Adicionar Procurador de Cliente ───────────────────────────────────
  criarProcuradorCliente: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      name: z.string().min(1),
      cpf: z.string().optional(),
      rg: z.string().optional(),
      rgEmitter: z.string().optional(),
      rgState: z.string().optional(),
      nationality: z.string().optional(),
      civilStatus: z.string().optional(),
      profession: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { clienteId, ...data } = input
      const result = await criarProcuradorClienteSienge(config.sub, config.user, config.pass, clienteId, data)
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao adicionar procurador no Sienge." })
      await logAudit(ctx, { entityType: "SIENGE_CLIENTE_PROCURATOR", entityId: String(clienteId), acao: `adicionou procurador: ${input.name}` })
      return result
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

  // ── Cotação (criar item a partir de solicitação) ────────────────────────────

  criarItemCotacaoFromSolicitacao: protectedProcedure
    .input(z.object({
      cotacaoId: z.number(),
      solicitacaoId: z.number(),
      itemSolicitacaoId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Sienge não configurado" })
      return criarItemCotacaoFromSolicitacaoSienge(config.sub, config.user, config.pass, input.cotacaoId, {
        purchaseRequestId: input.solicitacaoId,
        purchaseRequestItemId: input.itemSolicitacaoId,
      })
    }),

  // ── Multi-empresa ─────────────────────────────────────────────────────────────

  listarEmpresas: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarEmpresasSienge(config.sub, config.user, config.pass)
    }),

  // ── Notas Fiscais de Compra — Entregas Atendidas ─────────────────────────────

  listarEntregasAtendidasNfCompra: protectedProcedure
    .input(z.object({
      purchaseInvoiceId: z.number().optional(),
      purchaseOrderId: z.number().optional(),
      offset: z.number().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarEntregasAtendidasNfCompraSienge(
        config.sub, config.user, config.pass,
        input,
      )
    }),

  // ── Notas Fiscais de Compra — Entregas de Pedidos ────────────────────────────

  criarEntregasPedidoNfCompra: protectedProcedure
    .input(z.object({
      purchaseInvoiceId: z.number(),
      entregas: z.array(z.object({
        purchaseOrderId: z.number(),
        purchaseOrderItemId: z.number(),
        quantity: z.number().positive(),
        unitPrice: z.number().optional(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await criarEntregasPedidoNfCompraSienge(
        config.sub, config.user, config.pass,
        input.purchaseInvoiceId,
        input.entregas,
      )
      return { ok: true }
    }),

  // ── Units — CRUD, endereço, filhos ──────────────────────────────────────────

  criarUnidade: protectedProcedure
    .input(z.object({
      enterpriseId: z.number(),
      name: z.string().min(1),
      number: z.string().optional(),
      type: z.string().optional(),
      floor: z.union([z.string(), z.number()]).optional(),
      area: z.number().optional(),
      price: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarUnidadeSienge(config.sub, config.user, config.pass, input)
      await logAudit(ctx, {
        entityType: "SIENGE_UNIT",
        entityId: String(result?.id ?? 0),
        acao: "criou unidade",
      })
      return result
    }),

  buscarUnidade: protectedProcedure
    .input(z.object({ unitId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarUnidadeSienge(config.sub, config.user, config.pass, input.unitId)
    }),

  atualizarUnidade: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      data: z.object({
        name: z.string().optional(),
        number: z.string().optional(),
        type: z.string().optional(),
        floor: z.union([z.string(), z.number()]).optional(),
        area: z.number().optional(),
        price: z.number().optional(),
        status: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await atualizarUnidadeSienge(config.sub, config.user, config.pass, input.unitId, input.data)
      await logAudit(ctx, {
        entityType: "SIENGE_UNIT",
        entityId: String(input.unitId),
        acao: "atualizou unidade",
      })
      return { ok }
    }),

  adicionarUnidadeFilha: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      data: z.object({
        name: z.string().min(1),
        number: z.string().optional(),
        type: z.string().optional(),
        floor: z.union([z.string(), z.number()]).optional(),
        area: z.number().optional(),
        price: z.number().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await adicionarUnidadeFilhaSienge(config.sub, config.user, config.pass, input.unitId, input.data)
      await logAudit(ctx, {
        entityType: "SIENGE_UNIT",
        entityId: String(input.unitId),
        acao: "adicionou unidade filha",
      })
      return result
    }),

  atualizarEnderecoUnidade: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      data: z.object({
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await atualizarEnderecoUnidadeSienge(config.sub, config.user, config.pass, input.unitId, input.data)
      await logAudit(ctx, {
        entityType: "SIENGE_UNIT",
        entityId: String(input.unitId),
        acao: "atualizou endereço da unidade",
      })
      return { ok }
    }),

  buscarAgrupamentosUnidade: protectedProcedure
    .input(z.object({ unitId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarAgrupamentosUnidadeSienge(config.sub, config.user, config.pass, input.unitId)
    }),

  listarCaracteristicasUnidade: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfig(ctx)
      return listarCaracteristicasUnidadeSienge(config.sub, config.user, config.pass)
    }),

  criarCaracteristicaUnidade: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      type: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarCaracteristicaUnidadeSienge(config.sub, config.user, config.pass, input)
      await logAudit(ctx, {
        entityType: "SIENGE_UNIT_CHARACTERISTIC",
        entityId: String(result?.id ?? 0),
        acao: "criou característica de unidade",
      })
      return result
    }),

  vincularCaracteristicasUnidade: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      characteristicIds: z.array(z.number()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await vincularCaracteristicasUnidadeSienge(config.sub, config.user, config.pass, input.unitId, {
        characteristicIds: input.characteristicIds,
      })
      await logAudit(ctx, {
        entityType: "SIENGE_UNIT",
        entityId: String(input.unitId),
        acao: "vinculou características à unidade",
      })
      return { ok }
    }),

  listarSituacoesUnidade: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfig(ctx)
      return listarSituacoesUnidadeSienge(config.sub, config.user, config.pass)
    }),

  criarSituacaoUnidade: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarSituacaoUnidadeSienge(config.sub, config.user, config.pass, input)
      await logAudit(ctx, {
        entityType: "SIENGE_UNIT_SITUATION",
        entityId: String(result?.id ?? 0),
        acao: "criou situação de unidade",
      })
      return result
    }),

  listarBillsByChangeDate: protectedProcedure
    .input(z.object({
      startDate: z.string().min(1),
      endDate: z.string().min(1),
      offset: z.number().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBillsByChangeDateSienge(config.sub, config.user, config.pass, input)
    }),

  buscarBill: protectedProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarBillSienge(config.sub, config.user, config.pass, input.billId)
    }),

  atualizarBill: protectedProcedure
    .input(z.object({
      billId: z.number(),
      documentNumber: z.string().optional(),
      dueDate: z.string().optional(),
      amount: z.number().optional(),
      description: z.string().optional(),
      creditorId: z.number().optional(),
      buildingId: z.number().optional(),
      companyId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { billId, ...data } = input
      const ok = await atualizarBillSienge(config.sub, config.user, config.pass, billId, data)
      await logAudit(ctx, {
        entityType: "SIENGE_BILL",
        entityId: String(billId),
        acao: "atualizou título",
      })
      return { ok }
    }),

  criarBillFromNFe: protectedProcedure
    .input(z.object({
      accessKey: z.string().min(1),
      companyId: z.number().optional(),
      buildingId: z.number().optional(),
      creditorId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarBillFromNFeSienge(config.sub, config.user, config.pass, input)
      await logAudit(ctx, {
        entityType: "SIENGE_BILL",
        entityId: String(result?.id ?? 0),
        acao: "criou título a partir de NF-e",
      })
      return result
    }),

  listarParcelasBill: protectedProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarParcelasBillSienge(config.sub, config.user, config.pass, input.billId)
    }),

  atualizarParcelaBill: protectedProcedure
    .input(z.object({
      billId: z.number(),
      installmentId: z.number(),
      dueDate: z.string().optional(),
      amount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { billId, installmentId, ...data } = input
      const ok = await atualizarParcelaBillSienge(config.sub, config.user, config.pass, billId, installmentId, data)
      await logAudit(ctx, {
        entityType: "SIENGE_BILL_INSTALLMENT",
        entityId: `${billId}/${installmentId}`,
        acao: "atualizou parcela do título",
      })
      return { ok }
    }),

  listarImpostosBill: protectedProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarImpostosBillSienge(config.sub, config.user, config.pass, input.billId)
    }),

  listarBudgetCategoriesBill: protectedProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBudgetCategoriesBillSienge(config.sub, config.user, config.pass, input.billId)
    }),

  listarDepartmentsCostBill: protectedProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarDepartmentsCostBillSienge(config.sub, config.user, config.pass, input.billId)
    }),

  listarBuildingsCostBill: protectedProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBuildingsCostBillSienge(config.sub, config.user, config.pass, input.billId)
    }),

  atualizarBuildingsCostBill: protectedProcedure
    .input(z.object({
      billId: z.number(),
      items: z.array(z.object({
        buildingId: z.number(),
        percentage: z.number().optional(),
        value: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await atualizarBuildingsCostBillSienge(config.sub, config.user, config.pass, input.billId, input.items)
      await logAudit(ctx, {
        entityType: "SIENGE_BILL_BUILDINGS_COST",
        entityId: String(input.billId),
        acao: "atualizou apropriações por obra do título",
      })
      return { ok }
    }),

  listarUnitsBill: protectedProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarUnitsBillSienge(config.sub, config.user, config.pass, input.billId)
    }),

  atualizarUnitsBill: protectedProcedure
    .input(z.object({
      billId: z.number(),
      items: z.array(z.object({
        unitId: z.number(),
        percentage: z.number().optional(),
        value: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await atualizarUnitsBillSienge(config.sub, config.user, config.pass, input.billId, input.items)
      await logAudit(ctx, {
        entityType: "SIENGE_BILL_UNITS",
        entityId: String(input.billId),
        acao: "atualizou unidades do título",
      })
      return { ok }
    }),

  criarTaxInformationBill: protectedProcedure
    .input(z.object({
      billId: z.number(),
      serviceCodeId: z.number().optional(),
      cnaeId: z.number().optional(),
      municipalityId: z.number().optional(),
      description: z.string().optional(),
      issRetention: z.boolean().optional(),
      issAliquot: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { billId, ...data } = input
      const result = await criarTaxInformationBillSienge(config.sub, config.user, config.pass, billId, data)
      await logAudit(ctx, {
        entityType: "SIENGE_BILL_TAX_INFO",
        entityId: String(billId),
        acao: "criou informação fiscal no título",
      })
      return result
    }),

  // ── Bills — Tax Information Items ─────────────────────────────────────────
  criarTaxInformationItemBill: protectedProcedure
    .input(z.object({
      billId: z.number(),
      taxInformationId: z.number(),
      budgetCategoryId: z.number().optional(),
      departmentId: z.number().optional(),
      buildingId: z.number().optional(),
      amount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { billId, ...data } = input
      const result = await criarTaxInformationItemBillSienge(config.sub, config.user, config.pass, billId, data)
      await logAudit(ctx, {
        entityType: "SIENGE_BILL_TAX_INFO_ITEM",
        entityId: String(billId),
        acao: "criou item na informação fiscal do título",
      })
      return result
    }),

  // ── Contas a Receber ──────────────────────────────────────────────────────
  buscarReceivableBill: protectedProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarReceivableBillSienge(config.sub, config.user, config.pass, input.billId)
    }),

  listarParcReceivableBill: protectedProcedure
    .input(z.object({
      billId: z.number(),
      includedCarriers: z.string().optional(),
      excludedCarriers: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const { billId, ...filtros } = input
      return listarParcReceivableBillSienge(config.sub, config.user, config.pass, billId, filtros)
    }),

  alterarVencimentoReceivableBill: protectedProcedure
    .input(z.object({
      billId: z.number(),
      installmentId: z.number(),
      dueDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await alterarVencimentoReceivableBillSienge(
        config.sub, config.user, config.pass,
        input.billId, input.installmentId, input.dueDate,
      )
      await logAudit(ctx, {
        entityType: "SIENGE_RECEIVABLE_BILL_INSTALLMENT",
        entityId: `${input.billId}/${input.installmentId}`,
        acao: "alterou vencimento de parcela do título a receber",
      })
      return { ok }
    }),

  // ── Reservas de Unidades ──────────────────────────────────────────────────
  criarReservaUnidade: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      customerId: z.number(),
      brokerId: z.number().optional(),
      observation: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarReservaUnidadeSienge(config.sub, config.user, config.pass, input)
      await logAudit(ctx, {
        entityType: "SIENGE_UNIT_BOOKING",
        entityId: String(input.unitId),
        acao: "criou reserva de unidade",
      })
      return result
    }),

  // ── Payment Information por parcela (GET + PATCH) ───────────────────────
  buscarPaymentInfo: protectedProcedure
    .input(z.object({
      billId: z.number(),
      installmentId: z.number(),
      type: z.enum([
        "bank-transfer", "boleto-bancario", "boleto-concessionaria",
        "boleto-tax", "dda", "darf-tax", "darj-tax",
        "fgts-tax", "gare-tax", "inss-tax", "pix",
      ]),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return getPaymentInfoSienge(
        config.sub, config.user, config.pass,
        input.billId, input.installmentId, input.type as PaymentInfoType,
      )
    }),

  atualizarPaymentInfo: protectedProcedure
    .input(z.object({
      billId: z.number(),
      installmentId: z.number(),
      type: z.enum([
        "bank-transfer", "boleto-bancario", "boleto-concessionaria",
        "boleto-tax", "dda", "darf-tax", "darj-tax",
        "fgts-tax", "gare-tax", "inss-tax", "pix",
      ]),
      data: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await patchPaymentInfoSienge(
        config.sub, config.user, config.pass,
        input.billId, input.installmentId, input.type as PaymentInfoType,
        input.data,
      )
      await logAudit(ctx, {
        entityType: "SIENGE_BILL_PAYMENT_INFO",
        entityId: `${input.billId}/${input.installmentId}/${input.type}`,
        acao: `atualizou payment-info ${input.type}`,
      })
      return { ok }
    }),

  // ── Inativar Reserva de Unidade (PATCH /unit-bookings/units/{id}/deactivate) ──
  inativarReservaUnidade: protectedProcedure
    .input(z.object({ unitId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await inativarReservaUnidadeSienge(config.sub, config.user, config.pass, input.unitId)
      await logAudit(ctx, {
        entityType: "SIENGE_UNIT_BOOKING",
        entityId: String(input.unitId),
        acao: "inativou reserva de unidade",
      })
      return { ok }
    }),

  // ── Criar Contrato de Locação (POST /property-rental) ──────────────────────
  criarLocacao: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      tenantId: z.number(),
      monthlyRent: z.number(),
      startDate: z.string(),
      endDate: z.string().optional(),
      observation: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarLocacaoSienge(config.sub, config.user, config.pass, input)
      await logAudit(ctx, {
        entityType: "SIENGE_PROPERTY_RENTAL",
        entityId: result?.id ? String(result.id) : "new",
        acao: "criou contrato de locação",
      })
      return result
    }),

  // ── Enviar Informe IR por E-mail (POST /customer-income-tax/report) ────────
  enviarInformeIREmail: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      ano: z.number(),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await enviarInformeIREmailSienge(config.sub, config.user, config.pass, input.clienteId, input.ano, input.email)
      await logAudit(ctx, {
        entityType: "SIENGE_INCOME_TAX",
        entityId: String(input.clienteId),
        acao: `enviou informe IR ${input.ano} por email`,
      })
      return { ok }
    }),

  // ── Buscar Webhook por UUID (GET /hooks/{id}) ─────────────────────────────
  buscarWebhook: protectedProcedure
    .input(z.object({ hookId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarWebhookSienge(config.sub, config.user, config.pass, input.hookId)
    }),

  // ── Faturamento Direto do Pedido (GET /purchase-orders/{id}/direct-billing) ─
  buscarDirectBillingPedido: protectedProcedure
    .input(z.object({ pedidoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarDirectBillingPedidoSienge(config.sub, config.user, config.pass, input.pedidoId)
    }),

  // ── Item específico do pedido (GET /purchase-orders/{id}/items/{n}) ────────
  buscarItemPedido: protectedProcedure
    .input(z.object({ pedidoId: z.number(), itemSeq: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarItemPedidoSienge(config.sub, config.user, config.pass, input.pedidoId, input.itemSeq)
    }),

  // ── Previsões de entrega do item (GET /purchase-orders/{id}/items/{n}/delivery-schedules) ──
  listarDeliverySchedulesPedido: protectedProcedure
    .input(z.object({ pedidoId: z.number(), itemSeq: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarDeliverySchedulesPedidoSienge(config.sub, config.user, config.pass, input.pedidoId, input.itemSeq)
    }),

  // ── Apropriações por obra do item (GET /purchase-orders/{id}/items/{n}/buildings-appropriations) ──
  listarBuildingsAppropriationsPedidoItem: protectedProcedure
    .input(z.object({ pedidoId: z.number(), itemSeq: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBuildingsAppropriationsPedidoItemSienge(config.sub, config.user, config.pass, input.pedidoId, input.itemSeq)
    }),

  // ── Totalização do pedido (GET /purchase-orders/{id}/totalization) ─────────
  buscarTotalizacaoPedido: protectedProcedure
    .input(z.object({ pedidoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarTotalizacaoPedidoSienge(config.sub, config.user, config.pass, input.pedidoId)
    }),

  // ── Reprovar pedido com observação (PATCH /purchase-orders/{id}/disapprove) ──
  reprovarPedidoComObs: protectedProcedure
    .input(z.object({ pedidoId: z.number(), observation: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const ok = await reprovarPedidoComObsSienge(config.sub, config.user, config.pass, input.pedidoId, input.observation)
      await logAudit(ctx, {
        entityType: "SIENGE_PURCHASE_ORDER",
        entityId: String(input.pedidoId),
        acao: `reprovou pedido com observação`,
      })
      return { ok }
    }),

  // ── Autorizar todos os itens de solicitação ─────────────────────────────
  autorizarSolicitacao: protectedProcedure
    .input(z.object({ solicitacaoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await autorizarSolicitacaoSienge(config.sub, config.user, config.pass, input.solicitacaoId)
      await logAudit(ctx, {
        entityType: "SIENGE_SOLICITACAO",
        entityId: String(input.solicitacaoId),
        acao: "autorizou todos os itens",
      })
      return { sucesso: true }
    }),

  // ── Reprovar todos os itens de solicitação ──────────────────────────────
  reprovarSolicitacao: protectedProcedure
    .input(z.object({ solicitacaoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await reprovarSolicitacaoSienge(config.sub, config.user, config.pass, input.solicitacaoId)
      await logAudit(ctx, {
        entityType: "SIENGE_SOLICITACAO",
        entityId: String(input.solicitacaoId),
        acao: "reprovou todos os itens",
      })
      return { sucesso: true }
    }),

  // ── Listar todos os itens de solicitações ───────────────────────────────
  listarTodosItensSolicitacao: protectedProcedure
    .input(z.object({
      buildingId: z.number().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarTodosItensSolicitacaoSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Apropriações por obra de item de solicitação ────────────────────────
  listarApropriacoesSolicitacaoItem: protectedProcedure
    .input(z.object({ solicitacaoId: z.number(), itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarApropriacoesSolicitacaoItemSienge(config.sub, config.user, config.pass, input.solicitacaoId, input.itemId)
    }),

  // ── Requisitos de entrega de item de solicitação ────────────────────────
  listarRequisitosEntregaSolicitacaoItem: protectedProcedure
    .input(z.object({ solicitacaoId: z.number(), itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarRequisitosEntregaSolicitacaoItemSienge(config.sub, config.user, config.pass, input.solicitacaoId, input.itemId)
    }),

  // ── Autorizar itens específicos de solicitação ──────────────────────────
  autorizarItensSolicitacao: protectedProcedure
    .input(z.object({ solicitacaoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await autorizarItensSolicitacaoSienge(config.sub, config.user, config.pass, input.solicitacaoId)
      await logAudit(ctx, {
        entityType: "SIENGE_SOLICITACAO",
        entityId: String(input.solicitacaoId),
        acao: "autorizou itens específicos",
      })
      return { sucesso: true }
    }),

  // ── Autorizar item específico de solicitação ────────────────────────────
  autorizarItemSolicitacao: protectedProcedure
    .input(z.object({ solicitacaoId: z.number(), itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await autorizarItemSolicitacaoSienge(config.sub, config.user, config.pass, input.solicitacaoId, input.itemId)
      await logAudit(ctx, {
        entityType: "SIENGE_SOLICITACAO_ITEM",
        entityId: `${input.solicitacaoId}/item/${input.itemId}`,
        acao: "autorizou item específico",
      })
      return { sucesso: true }
    }),

  // ── Reprovar item específico de solicitação ─────────────────────────────
  reprovarItemSolicitacao: protectedProcedure
    .input(z.object({ solicitacaoId: z.number(), itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await reprovarItemSolicitacaoSienge(config.sub, config.user, config.pass, input.solicitacaoId, input.itemId)
      await logAudit(ctx, {
        entityType: "SIENGE_SOLICITACAO_ITEM",
        entityId: `${input.solicitacaoId}/item/${input.itemId}`,
        acao: "reprovou item específico",
      })
      return { sucesso: true }
    }),

  // ── NFe — Emitente e Destinatário ───────────────────────────────────────
  buscarNFeIssuersRecipients: protectedProcedure
    .input(z.object({ chaveAcesso: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarNFeIssuersRecipientsSienge(config.sub, config.user, config.pass, input.chaveAcesso)
    }),

  // ── NFe — Formas de Pagamento ───────────────────────────────────────────
  buscarNFePayments: protectedProcedure
    .input(z.object({ chaveAcesso: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarNFePaymentsSienge(config.sub, config.user, config.pass, input.chaveAcesso)
    }),

  // ── NFe — Local de Entrega/Retirada ─────────────────────────────────────
  buscarNFeDeliveries: protectedProcedure
    .input(z.object({ chaveAcesso: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarNFeDeliveriesSienge(config.sub, config.user, config.pass, input.chaveAcesso)
    }),

  // ── NFe — Notas Referenciadas ───────────────────────────────────────────
  buscarNFeLinkedNfes: protectedProcedure
    .input(z.object({ chaveAcesso: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarNFeLinkedNfesSienge(config.sub, config.user, config.pass, input.chaveAcesso)
    }),

  // ── NFe — ICMS Total ───────────────────────────────────────────────────
  buscarNFeIcms: protectedProcedure
    .input(z.object({ chaveAcesso: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarNFeIcmsSienge(config.sub, config.user, config.pass, input.chaveAcesso)
    }),

  // ── NFe — Informações de Transporte ─────────────────────────────────────
  buscarNFeCarriers: protectedProcedure
    .input(z.object({ chaveAcesso: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarNFeCarriersSienge(config.sub, config.user, config.pass, input.chaveAcesso)
    }),

  // ── NFe — ISSQN Total ──────────────────────────────────────────────────
  buscarNFeIssqn: protectedProcedure
    .input(z.object({ chaveAcesso: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarNFeIssqnSienge(config.sub, config.user, config.pass, input.chaveAcesso)
    }),

  // ── Bulk Data — Parcelas Contas a Pagar ───────────────────────────────
  listarBulkBillPayablesInstallments: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkBillPayablesInstallmentsSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Parcelas a Receber ────────────────────────────────────
  listarBulkReceivableInstallments: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkReceivableInstallmentsSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Movimentos de Caixa/Bancos ────────────────────────────
  listarBulkBankMovements: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkBankMovementsSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Contratos de Venda ────────────────────────────────────
  listarBulkSalesContracts: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkSalesContractsSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Histórico de Extrato de Clientes ──────────────────────
  listarBulkCustomerExtractHistory: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      customerId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkCustomerExtractHistorySienge(config.sub, config.user, config.pass, input)
    }),

  // ── Cotações — Negociações em andamento ──────────────────────────────
  listarNegociacoesCotacao: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfig(ctx)
      return listarNegociacoesCotacaoSienge(config.sub, config.user, config.pass)
    }),

  // ── Cotações — Criar item de cotação ─────────────────────────────────
  criarItemCotacao: protectedProcedure
    .input(z.object({
      cotacaoId: z.number(),
      materialId: z.number().optional(),
      descricao: z.string().optional(),
      quantidade: z.number(),
      unidade: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarItemCotacaoSienge(config.sub, config.user, config.pass, input.cotacaoId, {
        materialId: input.materialId,
        description: input.descricao,
        quantity: input.quantidade,
        unit: input.unidade,
      })
      await logAudit(ctx, {
        entityType: "cotacao_item",
        entityId: String(input.cotacaoId),
        acao: "criar_item_cotacao",
        detalhes: `Item criado na cotação ${input.cotacaoId}`,
      })
      return result
    }),

  // ── Cotações — Incluir fornecedor no item ────────────────────────────
  incluirFornecedorItemCotacao: protectedProcedure
    .input(z.object({
      cotacaoId: z.number(),
      itemNumber: z.number(),
      creditorId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await incluirFornecedorItemCotacaoSienge(config.sub, config.user, config.pass, input.cotacaoId, input.itemNumber, {
        creditorId: input.creditorId,
      })
      await logAudit(ctx, {
        entityType: "cotacao_item_fornecedor",
        entityId: `${input.cotacaoId}-${input.itemNumber}`,
        acao: "incluir_fornecedor_item_cotacao",
        detalhes: `Fornecedor ${input.creditorId} incluído no item ${input.itemNumber} da cotação ${input.cotacaoId}`,
      })
      return result
    }),

  // ── Cotações — Nova negociação com fornecedor ────────────────────────
  criarNegociacaoCotacao: protectedProcedure
    .input(z.object({
      cotacaoId: z.number(),
      supplierId: z.number(),
      observacao: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await criarNegociacaoCotacaoSienge(config.sub, config.user, config.pass, input.cotacaoId, input.supplierId, {
        observation: input.observacao,
      })
      await logAudit(ctx, {
        entityType: "cotacao_negociacao",
        entityId: `${input.cotacaoId}-${input.supplierId}`,
        acao: "criar_negociacao_cotacao",
        detalhes: `Negociação criada com fornecedor ${input.supplierId} na cotação ${input.cotacaoId}`,
      })
      return result
    }),

  // ── Cotações — Autorizar negociação ──────────────────────────────────
  autorizarNegociacaoCotacao: protectedProcedure
    .input(z.object({
      cotacaoId: z.number(),
      supplierId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await autorizarNegociacaoCotacaoSienge(config.sub, config.user, config.pass, input.cotacaoId, input.supplierId)
      await logAudit(ctx, {
        entityType: "cotacao_negociacao",
        entityId: `${input.cotacaoId}-${input.supplierId}`,
        acao: "autorizar_negociacao_cotacao",
        detalhes: `Negociação autorizada para fornecedor ${input.supplierId} na cotação ${input.cotacaoId}`,
      })
      return result
    }),

  // ── NFe — IPI do item ─────────────────────────────────────────────────
  buscarNFeItemIpi: protectedProcedure
    .input(z.object({ chaveAcesso: z.string(), itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await buscarNFeItemIpiSienge(config.sub, config.user, config.pass, input.chaveAcesso, input.itemId)
      await logAudit(ctx, {
        entityType: "nfe_item_ipi",
        entityId: `${input.chaveAcesso}-${input.itemId}`,
        acao: "consultar_nfe_item_ipi",
        detalhes: `IPI do item ${input.itemId} da NFe ${input.chaveAcesso}`,
      })
      return result
    }),

  // ── NFe — PIS-COFINS do item ──────────────────────────────────────────
  buscarNFeItemPisCofins: protectedProcedure
    .input(z.object({ chaveAcesso: z.string(), itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await buscarNFeItemPisCofinsSienge(config.sub, config.user, config.pass, input.chaveAcesso, input.itemId)
      await logAudit(ctx, {
        entityType: "nfe_item_pis_cofins",
        entityId: `${input.chaveAcesso}-${input.itemId}`,
        acao: "consultar_nfe_item_pis_cofins",
        detalhes: `PIS-COFINS do item ${input.itemId} da NFe ${input.chaveAcesso}`,
      })
      return result
    }),

  // ── NFe — ICMS Simples Nacional do item ───────────────────────────────
  buscarNFeItemSimplifiedIcms: protectedProcedure
    .input(z.object({ chaveAcesso: z.string(), itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await buscarNFeItemSimplifiedIcmsSienge(config.sub, config.user, config.pass, input.chaveAcesso, input.itemId)
      await logAudit(ctx, {
        entityType: "nfe_item_simplified_icms",
        entityId: `${input.chaveAcesso}-${input.itemId}`,
        acao: "consultar_nfe_item_simplified_icms",
        detalhes: `ICMS Simples Nacional do item ${input.itemId} da NFe ${input.chaveAcesso}`,
      })
      return result
    }),

  // ── NFe — ISSQN do item ───────────────────────────────────────────────
  buscarNFeItemIssqn: protectedProcedure
    .input(z.object({ chaveAcesso: z.string(), itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await buscarNFeItemIssqnSienge(config.sub, config.user, config.pass, input.chaveAcesso, input.itemId)
      await logAudit(ctx, {
        entityType: "nfe_item_issqn",
        entityId: `${input.chaveAcesso}-${input.itemId}`,
        acao: "consultar_nfe_item_issqn",
        detalhes: `ISSQN do item ${input.itemId} da NFe ${input.chaveAcesso}`,
      })
      return result
    }),

  // ── NFe — ICMS do item ────────────────────────────────────────────────
  buscarNFeItemIcms: protectedProcedure
    .input(z.object({ chaveAcesso: z.string(), itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await buscarNFeItemIcmsSienge(config.sub, config.user, config.pass, input.chaveAcesso, input.itemId)
      await logAudit(ctx, {
        entityType: "nfe_item_icms",
        entityId: `${input.chaveAcesso}-${input.itemId}`,
        acao: "consultar_nfe_item_icms",
        detalhes: `ICMS do item ${input.itemId} da NFe ${input.chaveAcesso}`,
      })
      return result
    }),

  // ── Cotações — Atualizar negociação ─────────────────────────────────
  atualizarNegociacaoCotacao: protectedProcedure
    .input(z.object({
      cotacaoId: z.number(),
      supplierId: z.number(),
      negotiationNumber: z.number(),
      data: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await atualizarNegociacaoCotacaoSienge(
        config.sub, config.user, config.pass,
        input.cotacaoId, input.supplierId, input.negotiationNumber, input.data,
      )
      await logAudit(ctx, {
        entityType: "cotacao_negociacao",
        entityId: `${input.cotacaoId}-${input.supplierId}-${input.negotiationNumber}`,
        acao: "atualizar_negociacao_cotacao",
        detalhes: `Atualizou negociação ${input.negotiationNumber} do fornecedor ${input.supplierId} na cotação ${input.cotacaoId}`,
      })
      return result
    }),

  // ── Cotações — Atualizar item de negociação ─────────────────────────
  atualizarItemNegociacaoCotacao: protectedProcedure
    .input(z.object({
      cotacaoId: z.number(),
      supplierId: z.number(),
      negotiationNumber: z.number(),
      itemNumber: z.number(),
      data: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await atualizarItemNegociacaoCotacaoSienge(
        config.sub, config.user, config.pass,
        input.cotacaoId, input.supplierId, input.negotiationNumber, input.itemNumber, input.data,
      )
      await logAudit(ctx, {
        entityType: "cotacao_negociacao_item",
        entityId: `${input.cotacaoId}-${input.supplierId}-${input.negotiationNumber}-${input.itemNumber}`,
        acao: "atualizar_item_negociacao_cotacao",
        detalhes: `Atualizou item ${input.itemNumber} da negociação ${input.negotiationNumber}`,
      })
      return result
    }),

  // ── Estoque — Apropriações de obra do inventário ────────────────────
  listarApropriacoesInventario: protectedProcedure
    .input(z.object({ inventoryCountId: z.number(), resourceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await listarApropriacoesInventarioSienge(
        config.sub, config.user, config.pass, input.inventoryCountId, input.resourceId,
      )
      await logAudit(ctx, {
        entityType: "stock_inventory_appropriation",
        entityId: `${input.inventoryCountId}-${input.resourceId}`,
        acao: "listar_apropriacoes_inventario",
        detalhes: `Apropriações do recurso ${input.resourceId} no inventário ${input.inventoryCountId}`,
      })
      return result
    }),

  // ── Estoque — Itens da reserva ──────────────────────────────────────
  listarItensReservaEstoque: protectedProcedure
    .input(z.object({ reservaId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await listarItensReservaEstoqueSienge(
        config.sub, config.user, config.pass, input.reservaId,
      )
      await logAudit(ctx, {
        entityType: "stock_reservation_items",
        entityId: String(input.reservaId),
        acao: "listar_itens_reserva_estoque",
        detalhes: `Itens da reserva de estoque ${input.reservaId}`,
      })
      return result
    }),

  // ── Estoque — Movimentações de inventário ───────────────────────────
  listarMovimentacoesInventario: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      buildingId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await listarMovimentacoesInventarioSienge(
        config.sub, config.user, config.pass, input,
      )
      await logAudit(ctx, {
        entityType: "inventory_movements",
        entityId: "list",
        acao: "listar_movimentacoes_inventario",
        detalhes: `Movimentações de inventário${input.buildingId ? ` obra ${input.buildingId}` : ""}`,
      })
      return result
    }),

  // ── Estoque — Buscar movimentação específica ────────────────────────
  buscarMovimentacaoInventario: protectedProcedure
    .input(z.object({ movimentacaoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await buscarMovimentacaoInventarioSienge(
        config.sub, config.user, config.pass, input.movimentacaoId,
      )
      await logAudit(ctx, {
        entityType: "inventory_movement",
        entityId: String(input.movimentacaoId),
        acao: "buscar_movimentacao_inventario",
        detalhes: `Movimentação de inventário ${input.movimentacaoId}`,
      })
      return result
    }),

  // ── Diário de Obra — Busca diário específico ──────────────────────
  buscarDiarioObra: protectedProcedure
    .input(z.object({ buildingId: z.number(), dailyReportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await buscarDiarioObraSienge(
        config.sub, config.user, config.pass, input.buildingId, input.dailyReportId,
      )
      await logAudit(ctx, {
        entityType: "construction_daily_report",
        entityId: `${input.buildingId}/${input.dailyReportId}`,
        acao: "buscar_diario_obra",
        detalhes: `Diário de obra ${input.dailyReportId} da obra ${input.buildingId}`,
      })
      return result
    }),

  // ── Diário de Obra — Deletar diário ───────────────────────────────
  deletarDiarioObra: protectedProcedure
    .input(z.object({ buildingId: z.number(), dailyReportId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await deletarDiarioObraSienge(
        config.sub, config.user, config.pass, input.buildingId, input.dailyReportId,
      )
      await logAudit(ctx, {
        entityType: "construction_daily_report",
        entityId: `${input.buildingId}/${input.dailyReportId}`,
        acao: "deletar_diario_obra",
        detalhes: `Deletou diário de obra ${input.dailyReportId} da obra ${input.buildingId}`,
      })
      return result
    }),

  // ── Diário de Obra — Incluir ocorrências ──────────────────────────
  incluirOcorrenciasDiarioObra: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      dailyReportId: z.number(),
      events: z.array(z.record(z.string(), z.unknown())),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await incluirOcorrenciasDiarioObraSienge(
        config.sub, config.user, config.pass, input.buildingId, input.dailyReportId, input.events,
      )
      await logAudit(ctx, {
        entityType: "construction_daily_report_events",
        entityId: `${input.buildingId}/${input.dailyReportId}`,
        acao: "incluir_ocorrencias_diario",
        detalhes: `Incluiu ${input.events.length} ocorrências no diário ${input.dailyReportId}`,
      })
      return result
    }),

  // ── Diário de Obra — Atualizar ocorrências ────────────────────────
  atualizarOcorrenciasDiarioObra: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      dailyReportId: z.number(),
      events: z.array(z.record(z.string(), z.unknown())),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await atualizarOcorrenciasDiarioObraSienge(
        config.sub, config.user, config.pass, input.buildingId, input.dailyReportId, input.events,
      )
      await logAudit(ctx, {
        entityType: "construction_daily_report_events",
        entityId: `${input.buildingId}/${input.dailyReportId}`,
        acao: "atualizar_ocorrencias_diario",
        detalhes: `Atualizou ocorrências no diário ${input.dailyReportId}`,
      })
      return result
    }),

  // ── Diário de Obra — Incluir tarefas ──────────────────────────────
  incluirTarefasDiarioObra: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      dailyReportId: z.number(),
      tasks: z.array(z.record(z.string(), z.unknown())),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await incluirTarefasDiarioObraSienge(
        config.sub, config.user, config.pass, input.buildingId, input.dailyReportId, input.tasks,
      )
      await logAudit(ctx, {
        entityType: "construction_daily_report_tasks",
        entityId: `${input.buildingId}/${input.dailyReportId}`,
        acao: "incluir_tarefas_diario",
        detalhes: `Incluiu ${input.tasks.length} tarefas no diário ${input.dailyReportId}`,
      })
      return result
    }),

  // ── Diário de Obra — Atualizar tarefas ─────────────────────────────
  atualizarTarefasDiarioObra: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      dailyReportId: z.number(),
      tasks: z.array(z.record(z.string(), z.unknown())),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await atualizarTarefasDiarioObraSienge(
        config.sub, config.user, config.pass, input.buildingId, input.dailyReportId, input.tasks,
      )
      await logAudit(ctx, {
        entityType: "construction_daily_report_tasks",
        entityId: `${input.buildingId}/${input.dailyReportId}`,
        acao: "atualizar_tarefas_diario",
        detalhes: `Atualizou tarefas no diário ${input.dailyReportId}`,
      })
      return result
    }),

  // ── Diário de Obra — Incluir equipes ───────────────────────────────
  incluirEquipesDiarioObra: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      dailyReportId: z.number(),
      crews: z.array(z.record(z.string(), z.unknown())),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await incluirEquipesDiarioObraSienge(
        config.sub, config.user, config.pass, input.buildingId, input.dailyReportId, input.crews,
      )
      await logAudit(ctx, {
        entityType: "construction_daily_report_crews",
        entityId: `${input.buildingId}/${input.dailyReportId}`,
        acao: "incluir_equipes_diario",
        detalhes: `Incluiu ${input.crews.length} equipes no diário ${input.dailyReportId}`,
      })
      return result
    }),

  // ── Diário de Obra — Atualizar equipes ─────────────────────────────
  atualizarEquipesDiarioObra: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      dailyReportId: z.number(),
      crews: z.array(z.record(z.string(), z.unknown())),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await atualizarEquipesDiarioObraSienge(
        config.sub, config.user, config.pass, input.buildingId, input.dailyReportId, input.crews,
      )
      await logAudit(ctx, {
        entityType: "construction_daily_report_crews",
        entityId: `${input.buildingId}/${input.dailyReportId}`,
        acao: "atualizar_equipes_diario",
        detalhes: `Atualizou equipes no diário ${input.dailyReportId}`,
      })
      return result
    }),

  // ── Diário de Obra — Incluir equipamentos ─────────────────────────
  incluirEquipamentosDiarioObra: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      dailyReportId: z.number(),
      equipments: z.array(z.record(z.string(), z.unknown())),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await incluirEquipamentosDiarioObraSienge(
        config.sub, config.user, config.pass, input.buildingId, input.dailyReportId, input.equipments,
      )
      await logAudit(ctx, {
        entityType: "construction_daily_report_equipments",
        entityId: `${input.buildingId}/${input.dailyReportId}`,
        acao: "incluir_equipamentos_diario",
        detalhes: `Incluiu ${input.equipments.length} equipamentos no diário ${input.dailyReportId}`,
      })
      return result
    }),

  // ── Diário de Obra — Atualizar equipamentos ───────────────────────
  atualizarEquipamentosDiarioObra: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      dailyReportId: z.number(),
      equipments: z.array(z.record(z.string(), z.unknown())),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await atualizarEquipamentosDiarioObraSienge(
        config.sub, config.user, config.pass, input.buildingId, input.dailyReportId, input.equipments,
      )
      await logAudit(ctx, {
        entityType: "construction_daily_report_equipments",
        entityId: `${input.buildingId}/${input.dailyReportId}`,
        acao: "atualizar_equipamentos_diario",
        detalhes: `Atualizou equipamentos no diário ${input.dailyReportId}`,
      })
      return result
    }),

  // ── Diário de Obra — Tipos de ocorrência ────────────────────────────────
  listarTiposOcorrenciaDiarioObra: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarTiposOcorrenciaDiarioObraSienge(config.sub, config.user, config.pass)
    }),

  // ── Diário de Obra — Todos os tipos disponíveis ─────────────────────────
  listarTiposDiarioObra: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfigOptional(ctx)
      if (!config) return []
      return listarTiposDiarioObraSienge(config.sub, config.user, config.pass)
    }),

  // ── Orçamento — Adicionar insumo ────────────────────────────────────────
  adicionarInsumoOrcamento: protectedProcedure
    .input(z.object({
      estimationId: z.number(),
      payload: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await adicionarInsumoOrcamentoSienge(
        config.sub, config.user, config.pass, input.estimationId, input.payload,
      )
      await logAudit(ctx, {
        entityType: "building_cost_estimation_resource",
        entityId: String(input.estimationId),
        acao: "adicionar_insumo",
        detalhes: `Adicionou insumo ao orçamento ${input.estimationId}`,
      })
      return result
    }),

  // ── Orçamento — Buscar insumo específico ────────────────────────────────
  buscarInsumoOrcamento: protectedProcedure
    .input(z.object({
      estimationId: z.number(),
      resourceId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarInsumoOrcamentoSienge(
        config.sub, config.user, config.pass, input.estimationId, input.resourceId,
      )
    }),

  // ── Orçamento — Atualizar código auxiliar do insumo ─────────────────────
  atualizarInsumoOrcamento: protectedProcedure
    .input(z.object({
      estimationId: z.number(),
      resourceId: z.number(),
      payload: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await atualizarInsumoOrcamentoSienge(
        config.sub, config.user, config.pass, input.estimationId, input.resourceId, input.payload,
      )
      await logAudit(ctx, {
        entityType: "building_cost_estimation_resource",
        entityId: `${input.estimationId}/${input.resourceId}`,
        acao: "atualizar_insumo",
        detalhes: `Atualizou insumo ${input.resourceId} do orçamento ${input.estimationId}`,
      })
      return result
    }),

  // ── Orçamento — Planilhas da versão atual ───────────────────────────────
  listarPlanilhasOrcamento: protectedProcedure
    .input(z.object({ estimationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarPlanilhasOrcamentoSienge(
        config.sub, config.user, config.pass, input.estimationId,
      )
    }),

  // ── Planejamento — Inserir tarefas em nova versão ───────────────────────
  inserirTarefasPlanilha: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      sheetUid: z.string(),
      tasks: z.array(z.record(z.string(), z.unknown())),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await inserirTarefasPlanilhaSienge(
        config.sub, config.user, config.pass, input.buildingId, input.sheetUid, input.tasks,
      )
      await logAudit(ctx, {
        entityType: "building_project_sheet_tasks",
        entityId: `${input.buildingId}/${input.sheetUid}`,
        acao: "inserir_tarefas_planilha",
        detalhes: `Inseriu tarefas na planilha ${input.sheetUid} do projeto ${input.buildingId}`,
      })
      return result
    }),

  // ── NF de Compra — Cadastrar ────────────────────────────────────────────
  cadastrarPurchaseInvoice: protectedProcedure
    .input(z.object({
      supplierId: z.number(),
      companyId: z.number(),
      buildingId: z.number().optional(),
      invoiceNumber: z.string().optional(),
      serialNumber: z.string().optional(),
      issueDate: z.string().optional(),
      arrivalDate: z.string().optional(),
      cfop: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await cadastrarPurchaseInvoiceSienge(
        config.sub, config.user, config.pass, input,
      )
      await logAudit(ctx, {
        entityType: "purchase_invoice",
        entityId: String(result.id),
        acao: "cadastrar_nf_compra",
        detalhes: `Cadastrou NF de compra ${input.invoiceNumber ?? ""} fornecedor ${input.supplierId}`,
      })
      return result
    }),

  // ── NF de Compra — Consultar por ID ─────────────────────────────────────
  buscarPurchaseInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return buscarPurchaseInvoiceSienge(
        config.sub, config.user, config.pass, input.invoiceId,
      )
    }),

  // ── NF de Compra — Itens ────────────────────────────────────────────────
  listarItensPurchaseInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarItensPurchaseInvoiceSienge(
        config.sub, config.user, config.pass, input.invoiceId,
      )
    }),

  // ── NF de Compra — Apropriações de obra por item ────────────────────────
  listarBuildingsAppropriationsNfItem: protectedProcedure
    .input(z.object({ invoiceId: z.number(), itemNumber: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBuildingsAppropriationsNfItemSienge(
        config.sub, config.user, config.pass, input.invoiceId, input.itemNumber,
      )
    }),

  // ── Contas a Receber — Apropriações financeiras ─────────────────────────
  listarBudgetCategoriesReceivable: protectedProcedure
    .input(z.object({ billId: z.number() }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBudgetCategoriesReceivableSienge(
        config.sub, config.user, config.pass, input.billId,
      )
    }),

  // ── Extrato Financeiro de Cliente ─────────────────────────────────────────
  listarExtratoCliente: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      offset: z.number().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await logAudit(ctx, {
        entityType: "SIENGE_EXTRATO_CLIENTE",
        entityId: String(input.customerId),
        acao: "consultou extrato",
      })
      return listarExtratoClienteSienge(
        config.sub, config.user, config.pass, input.customerId,
        { startDate: input.startDate, endDate: input.endDate, offset: input.offset, limit: input.limit },
      )
    }),

  enviarExtratoClienteEmail: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      email: z.string().email(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      const result = await enviarExtratoClienteEmailSienge(
        config.sub, config.user, config.pass,
        input.customerId, input.email, input.startDate, input.endDate,
      )
      await logAudit(ctx, {
        entityType: "SIENGE_EXTRATO_CLIENTE",
        entityId: String(input.customerId),
        acao: "enviou extrato por email",
        detalhes: `Destinatário: ${input.email}`,
      })
      return result
    }),

  // ── Lançamentos Contábeis ─────────────────────────────────────────────────
  listarLancamentosContabeis: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      offset: z.number().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      await logAudit(ctx, {
        entityType: "SIENGE_LANCAMENTO_CONTABIL",
        entityId: String(input.companyId),
        acao: "consultou lançamentos contábeis",
      })
      return listarLancamentosContabeisSienge(
        config.sub, config.user, config.pass, input.companyId,
        { startDate: input.startDate, endDate: input.endDate, offset: input.offset, limit: input.limit },
      )
    }),

  salvarLancamentosContabeis: protectedProcedure
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
      const config = await getSiengeConfig(ctx)
      const result = await salvarLancamentosContabeisSienge(
        config.sub, config.user, config.pass, input.entries,
      )
      await logAudit(ctx, {
        entityType: "SIENGE_LANCAMENTO_CONTABIL",
        entityId: "batch",
        acao: "salvou lançamentos contábeis",
        detalhes: `${input.entries.length} lançamentos`,
      })
      return result
    }),

  salvarLancamentosContabeisAsync: protectedProcedure
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
      const config = await getSiengeConfig(ctx)
      const result = await salvarLancamentosContabeisAsyncSienge(
        config.sub, config.user, config.pass, input.entries,
      )
      await logAudit(ctx, {
        entityType: "SIENGE_LANCAMENTO_CONTABIL",
        entityId: result.asyncId ?? "async",
        acao: "salvou lançamentos contábeis (async)",
        detalhes: `${input.entries.length} lançamentos`,
      })
      return result
    }),

  statusLancamentosContabeisAsync: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await getSiengeConfig(ctx)
      return statusLancamentosContabeisAsyncSienge(
        config.sub, config.user, config.pass,
      )
    }),

  // ── Bulk Data — Cotações de Compra ────────────────────────────────────
  listarBulkPurchaseQuotations: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkPurchaseQuotationsSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Itens de Notas Fiscais ────────────────────────────────
  listarBulkInvoiceItens: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkInvoiceItensSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Insumos/Recursos de Obra ──────────────────────────────
  listarBulkBuildingResources: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      buildingId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkBuildingResourcesSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Itens de Orçamento ────────────────────────────────────
  listarBulkBudgetItems: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      buildingId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkBudgetItemsSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Inadimplentes ─────────────────────────────────────────
  listarBulkDefaulters: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      buildingId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkDefaultersSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Saldos Contábeis ───────────────────────────────────────
  listarBulkAccountBalances: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      costCenterId: z.number().optional(),
      referenceDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkAccountBalancesSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Orçamentos Empresariais ────────────────────────────────
  listarBulkBusinessBudgets: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      buildingId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return listarBulkBusinessBudgetsSienge(config.sub, config.user, config.pass, input)
    }),

  // ── Bulk Data — Async Status ───────────────────────────────────────────
  consultarBulkAsyncStatus: protectedProcedure
    .input(z.object({
      asyncId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return consultarBulkAsyncStatusSienge(config.sub, config.user, config.pass, input.asyncId)
    }),

  // ── Bulk Data — Async Result Chunk ─────────────────────────────────────
  consultarBulkAsyncResult: protectedProcedure
    .input(z.object({
      asyncId: z.string(),
      chunk: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await getSiengeConfig(ctx)
      return consultarBulkAsyncResultSienge(config.sub, config.user, config.pass, input.asyncId, input.chunk)
    }),
})
