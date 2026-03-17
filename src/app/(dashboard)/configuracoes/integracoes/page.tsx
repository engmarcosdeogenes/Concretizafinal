"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeft, Puzzle, CheckCircle2, Clock, RefreshCw, Plug,
  Eye, EyeOff, Building2, Users, ShoppingCart, ChevronDown, ChevronUp,
  Webhook, Zap, ZapOff, UserCheck, CreditCard, Link2, Link2Off,
  Package, TrendingUp, TrendingDown, Truck,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ─── Outras integrações (informativas) ────────────────────────────────────────
const OUTRAS = [
  {
    name: "WhatsApp Business",
    description: "Envie notificações, aprovações de RDO e alertas de ocorrência direto no WhatsApp da equipe.",
    logo: "W", color: "#25D366",
    features: ["Alertas de ocorrências críticas", "Aprovação de RDO por mensagem", "Notificações de prazo e vencimento"],
  },
  {
    name: "NF-e / SEFAZ",
    description: "Consulte e emita notas fiscais de materiais e serviços direto da plataforma, com validação automática.",
    logo: "N", color: "#003DA5",
    features: ["Validação automática de NF-e", "Vincular nota fiscal a pedido de compra", "Exportar XML para contabilidade"],
  },
  {
    name: "Microsoft Teams",
    description: "Receba resumos diários do RDO e alertas de ocorrência no canal de obras do seu Teams.",
    logo: "T", color: "#6264A7",
    features: ["Diário de obra resumido no canal", "Alertas de ocorrências e FVS", "Comandos para consulta rápida"],
  },
  {
    name: "Google Drive",
    description: "Sincronize documentos, fotos e relatórios da obra automaticamente com pastas do Google Drive.",
    logo: "G", color: "#4285F4",
    features: ["Backup automático de documentos", "Fotos de RDO sincronizadas", "Relatórios PDF salvos na nuvem"],
  },
  {
    name: "Omie",
    description: "Integre o financeiro e as notas fiscais do Omie com os pedidos de compra do Concretiza.",
    logo: "O", color: "#FF6B35",
    features: ["Importar pedidos e faturas", "Sincronizar fornecedores", "Conciliar pagamentos de obra"],
  },
  {
    name: "Excel / Google Sheets",
    description: "Exporte RDOs, checklists, medições e qualquer relatório para planilhas em um clique.",
    logo: "X", color: "#217346",
    features: ["Exportar RDO em Excel (.xlsx)", "Exportar FVS e checklist", "Planilha de acompanhamento de obras"],
  },
]

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Pendente",   cls: "bg-yellow-100 text-yellow-700" },
  AUTHORIZED: { label: "Autorizado", cls: "bg-green-100 text-green-700" },
  DELIVERED:  { label: "Entregue",   cls: "bg-blue-100 text-blue-700" },
  CANCELED:   { label: "Cancelado",  cls: "bg-red-100 text-red-600" },
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function IntegracoesPage() {
  const utils = trpc.useUtils()

  const { data: config, isLoading: loadingConfig } = trpc.integracoes.buscarConfig.useQuery()
  const { data: syncs = [] } = trpc.integracoes.listarSyncs.useQuery()
  const { data: pedidos = [], isFetching: fetchingPedidos } = trpc.integracoes.pedidosSienge.useQuery(
    { obraId: undefined },
    { enabled: !!config }
  )

  const [subdominio, setSubdominio] = useState("")
  const [usuario,    setUsuario]    = useState("")
  const [senha,      setSenha]      = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [formAberto,   setFormAberto]   = useState(false)
  const [pedidosAberto, setPedidosAberto] = useState(false)

  const salvar = trpc.integracoes.salvarConfig.useMutation({
    onSuccess: () => { toast.success("Credenciais salvas."); utils.integracoes.buscarConfig.invalidate(); setFormAberto(false) },
    onError: (e) => toast.error(e.message),
  })

  const testar = trpc.integracoes.testarConexao.useMutation({
    onSuccess: (r) => r.sucesso
      ? toast.success("Conexão com o Sienge estabelecida!")
      : toast.error("Não foi possível conectar. Verifique as credenciais."),
    onError: (e) => toast.error(e.message),
  })

  const [atualizarObrasExistentes, setAtualizarObrasExistentes] = useState(false)

  const importarObras = trpc.integracoes.importarObras.useMutation({
    onSuccess: (r) => {
      const msg = r.atualizadas > 0
        ? `${r.criadas} criada(s), ${r.atualizadas} atualizada(s) de ${r.total} obra(s) no Sienge.`
        : `${r.criadas} obra(s) importada(s) de ${r.total} encontrada(s).`
      toast.success(msg)
      utils.integracoes.listarSyncs.invalidate()
    },
    onError: (e) => { toast.error(e.message); utils.integracoes.listarSyncs.invalidate() },
  })

  const importarFornecedores = trpc.integracoes.importarFornecedores.useMutation({
    onSuccess: (r) => { toast.success(`${r.criados} fornecedor(es) importado(s) de ${r.total} analisado(s).`); utils.integracoes.listarSyncs.invalidate() },
    onError:   (e) => { toast.error(e.message); utils.integracoes.listarSyncs.invalidate() },
  })

  const importarClientes = trpc.integracoes.importarClientes.useMutation({
    onSuccess: (r) => { toast.success(`${r.count} cliente(s) lido(s) do Sienge.`); utils.integracoes.listarSyncs.invalidate() },
    onError:   (e) => { toast.error(e.message); utils.integracoes.listarSyncs.invalidate() },
  })

  const importarContasPagar = trpc.integracoes.importarContasPagar.useMutation({
    onSuccess: (r) => {
      const msg = r.pulados > 0
        ? `${r.criados} lançamento(s) criado(s). ${r.pulados} pulado(s) (sem obra vinculada) de ${r.total} conta(s).`
        : `${r.criados} lançamento(s) de despesa criado(s) de ${r.total} conta(s).`
      toast.success(msg)
      utils.integracoes.listarSyncs.invalidate()
    },
    onError: (e) => { toast.error(e.message); utils.integracoes.listarSyncs.invalidate() },
  })

  const importarPedidosCompra = trpc.integracoes.importarPedidosCompra.useMutation({
    onSuccess: (r) => {
      toast.success(`${r.criados} pedido(s) importado(s), ${r.pulados} já existiam de ${r.total} analisado(s).`)
      utils.integracoes.listarSyncs.invalidate()
    },
    onError: (e) => { toast.error(e.message); utils.integracoes.listarSyncs.invalidate() },
  })

  const importarSolicitacoesCompra = trpc.integracoes.importarSolicitacoesCompra.useMutation({
    onSuccess: (r) => {
      toast.success(`${r.criados} solicitação(ões) importada(s), ${r.pulados} já existiam de ${r.total} analisada(s).`)
      utils.integracoes.listarSyncs.invalidate()
    },
    onError: (e) => { toast.error(e.message); utils.integracoes.listarSyncs.invalidate() },
  })

  const importarContasReceber = trpc.integracoes.importarContasReceber.useMutation({
    onSuccess: (r) => {
      toast.success(`${r.criados} conta(s) a receber importada(s), ${r.pulados} já existiam de ${r.total} analisada(s).`)
      utils.integracoes.listarSyncs.invalidate()
    },
    onError: (e) => { toast.error(e.message); utils.integracoes.listarSyncs.invalidate() },
  })

  const importarEstoque = trpc.integracoes.importarEstoque.useMutation({
    onSuccess: (r) => {
      toast.success(`${r.criados} item(ns) de estoque importado(s), ${r.pulados} pulado(s).`)
      utils.integracoes.listarSyncs.invalidate()
    },
    onError: (e) => { toast.error(e.message); utils.integracoes.listarSyncs.invalidate() },
  })

  type SincronizarTudoResult = {
    obras?: { criadas?: number; atualizadas?: number; total?: number }
    fornecedores?: { criados?: number; total?: number }
    pedidos?: { criados?: number; pulados?: number; total?: number }
    estoque?: { criados?: number; pulados?: number; total?: number }
    contasReceber?: { criados?: number; pulados?: number; total?: number }
  }
  const [sincResultado, setSincResultado] = useState<SincronizarTudoResult | null>(null)

  const sincronizarTudo = trpc.integracoes.sincronizarTudo.useMutation({
    onSuccess: (r) => {
      setSincResultado(r as SincronizarTudoResult)
      const partes: string[] = []
      if ((r as SincronizarTudoResult).obras) partes.push(`${(r as SincronizarTudoResult).obras?.criadas ?? 0} obras`)
      if ((r as SincronizarTudoResult).fornecedores) partes.push(`${(r as SincronizarTudoResult).fornecedores?.criados ?? 0} fornecedores`)
      if ((r as SincronizarTudoResult).pedidos) partes.push(`${(r as SincronizarTudoResult).pedidos?.criados ?? 0} pedidos`)
      if ((r as SincronizarTudoResult).estoque) partes.push(`${(r as SincronizarTudoResult).estoque?.criados ?? 0} itens de estoque`)
      if ((r as SincronizarTudoResult).contasReceber) partes.push(`${(r as SincronizarTudoResult).contasReceber?.criados ?? 0} contas a receber`)
      toast.success(`Sincronização concluída! ${partes.join(", ")} importados.`)
      utils.integracoes.listarSyncs.invalidate()
    },
    onError: (e) => { toast.error(e.message); utils.integracoes.listarSyncs.invalidate() },
  })

  const vincularObra = trpc.integracoes.vincularObra.useMutation({
    onSuccess: () => { toast.success("Vinculação atualizada."); utils.integracoes.listarObrasComVinculo.invalidate() },
    onError:   (e) => toast.error(e.message),
  })

  const { data: obrasSienge = [] } = trpc.integracoes.listarObrasSienge.useQuery(
    undefined,
    { enabled: !!config }
  )

  const { data: obrasComVinculo = [] } = trpc.integracoes.listarObrasComVinculo.useQuery(
    undefined,
    { enabled: !!config }
  )

  const [vinculacaoAberta, setVinculacaoAberta] = useState(false)

  const { data: webhookStatus } = trpc.sienge.buscarStatusWebhook.useQuery(
    undefined,
    { enabled: !!config }
  )

  const registrarWebhook = trpc.sienge.registrarWebhook.useMutation({
    onSuccess: () => { toast.success("Webhook registrado! Sienge enviará eventos em tempo real."); utils.sienge.buscarStatusWebhook.invalidate() },
    onError: (e) => toast.error(e.message),
  })

  const removerWebhook = trpc.sienge.removerWebhook.useMutation({
    onSuccess: () => { toast.success("Webhook removido."); utils.sienge.buscarStatusWebhook.invalidate() },
    onError: (e) => toast.error(e.message),
  })

  const configurado = !!config

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!subdominio || !usuario || !senha) { toast.error("Preencha todos os campos."); return }
    salvar.mutate({ subdominio, usuario, senha })
  }

  const loading = importarObras.isPending || importarFornecedores.isPending || testar.isPending || importarClientes.isPending || importarContasPagar.isPending || importarPedidosCompra.isPending || importarSolicitacoesCompra.isPending || importarContasReceber.isPending || importarEstoque.isPending || sincronizarTudo.isPending

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/configuracoes" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Integrações</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Conecte o Concretiza com os sistemas do escritório.</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex gap-3">
        <Puzzle className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
        <div className="text-sm text-orange-800">
          <p className="font-semibold mb-0.5">Concretiza é o campo. O ERP é o escritório.</p>
          <p className="text-orange-700 text-xs">
            Importe obras, fornecedores e pedidos do Sienge — e use o Concretiza para os registros diários (RDO, FVS, ocorrências) sem duplicar esforço.
          </p>
        </div>
      </div>

      {/* ── Sienge ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">

        {/* Header do card */}
        <div className="flex items-center gap-4 p-6 border-b border-border">
          <div className="w-12 h-12 rounded-xl bg-[#0055A5] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">S</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Sienge Platform</h3>
              {loadingConfig ? null : configurado ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                  <CheckCircle2 size={10} /> Configurado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold">
                  <Clock size={10} /> Não configurado
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {configurado
                ? `Conectado como ${config.usuario} · ${config.subdominio}.sienge.com.br`
                : "Informe as credenciais da API do Sienge para começar."}
            </p>
          </div>
          <button
            onClick={() => setFormAberto(v => !v)}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            {formAberto ? "Fechar" : configurado ? "Editar" : "Configurar"}
          </button>
        </div>

        {/* Form credenciais */}
        {formAberto && (
          <form onSubmit={handleSalvar} className="p-6 border-b border-border space-y-4 bg-slate-50/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Credenciais da API</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Subdomínio</label>
                <div className="flex items-center rounded-lg border bg-white px-3 h-10 gap-1 focus-within:ring-2 focus-within:ring-orange-400">
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">api.sienge.com.br/</span>
                  <input value={subdominio} onChange={e => setSubdominio(e.target.value)} placeholder="minhaempresa"
                    className="flex-1 text-sm bg-transparent outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Usuário</label>
                <input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="usuario.api"
                  className="w-full h-10 rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Senha</label>
                <div className="flex items-center rounded-lg border bg-white px-3 h-10 gap-2 focus-within:ring-2 focus-within:ring-orange-400">
                  <input type={mostrarSenha ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••" className="flex-1 text-sm bg-transparent outline-none" />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)} className="text-muted-foreground hover:text-foreground">
                    {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={salvar.isPending}
                className="h-9 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {salvar.isPending ? "Salvando…" : "Salvar credenciais"}
              </button>
            </div>
          </form>
        )}

        {/* Ações de sync */}
        {configurado && (
          <div className="p-6 space-y-6">

            {/* Banner de loading global — sincronizar tudo */}
            {sincronizarTudo.isPending && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-center gap-3">
                <RefreshCw size={16} className="text-orange-500 animate-spin flex-shrink-0" />
                <p className="text-sm text-orange-800 font-medium">
                  Sincronização em andamento... Isso pode levar alguns minutos.
                </p>
              </div>
            )}

            {/* Card Sincronização Inicial */}
            <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <RefreshCw size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Sincronização Inicial</h4>
                  <p className="text-xs text-muted-foreground">Importe todos os dados do Sienge para o Concretiza de uma só vez</p>
                </div>
              </div>
              <button
                onClick={() => { setSincResultado(null); sincronizarTudo.mutate() }}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sincronizarTudo.isPending ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Sincronizar Tudo
                  </>
                )}
              </button>
              {sincResultado && !sincronizarTudo.isPending && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                  <p className="text-xs font-semibold text-green-700 mb-1.5">Sincronizacao concluida:</p>
                  <div className="flex flex-wrap gap-2">
                    {sincResultado.obras && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 size={11} /> {sincResultado.obras.criadas ?? 0} obras
                      </span>
                    )}
                    {sincResultado.fornecedores && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 size={11} /> {sincResultado.fornecedores.criados ?? 0} fornecedores
                      </span>
                    )}
                    {sincResultado.pedidos && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 size={11} /> {sincResultado.pedidos.criados ?? 0} pedidos
                      </span>
                    )}
                    {sincResultado.estoque && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 size={11} /> {sincResultado.estoque.criados ?? 0} itens de estoque
                      </span>
                    )}
                    {sincResultado.contasReceber && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 size={11} /> {sincResultado.contasReceber.criados ?? 0} contas a receber
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Importações Individuais */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Importações Individuais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                {/* Obras */}
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => importarObras.mutate({ atualizarExistentes: atualizarObrasExistentes })} disabled={loading}
                    className="flex items-center gap-3 h-14 px-4 rounded-xl border border-[#0055A5]/30 bg-[#0055A5]/5 hover:bg-[#0055A5]/10 transition-colors disabled:opacity-50 text-left">
                    <Building2 size={18} className={cn("text-[#0055A5]", importarObras.isPending && "animate-spin")} />
                    <div>
                      <p className="text-sm font-medium text-[#0055A5]">{importarObras.isPending ? "Importando…" : "Importar Obras"}</p>
                      <p className="text-xs text-muted-foreground">Empreendimentos do Sienge</p>
                    </div>
                  </button>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pl-1">
                    <input
                      type="checkbox"
                      checked={atualizarObrasExistentes}
                      onChange={e => setAtualizarObrasExistentes(e.target.checked)}
                      className="accent-[#0055A5]"
                    />
                    Atualizar obras já importadas
                  </label>
                </div>

                {/* Fornecedores */}
                <button onClick={() => importarFornecedores.mutate()} disabled={loading}
                  className="flex items-center gap-3 h-14 px-4 rounded-xl border border-[#0055A5]/30 bg-[#0055A5]/5 hover:bg-[#0055A5]/10 transition-colors disabled:opacity-50 text-left">
                  <Truck size={18} className={cn("text-[#0055A5]", importarFornecedores.isPending && "animate-spin")} />
                  <div>
                    <p className="text-sm font-medium text-[#0055A5]">{importarFornecedores.isPending ? "Importando…" : "Importar Fornecedores"}</p>
                    <p className="text-xs text-muted-foreground">Credores ativos do Sienge</p>
                  </div>
                </button>

                {/* Pedidos de Compra */}
                <button onClick={() => importarPedidosCompra.mutate()} disabled={loading}
                  className="flex items-center gap-3 h-14 px-4 rounded-xl border border-[#0055A5]/30 bg-[#0055A5]/5 hover:bg-[#0055A5]/10 transition-colors disabled:opacity-50 text-left">
                  <ShoppingCart size={18} className={cn("text-[#0055A5]", importarPedidosCompra.isPending && "animate-spin")} />
                  <div>
                    <p className="text-sm font-medium text-[#0055A5]">{importarPedidosCompra.isPending ? "Importando…" : "Importar Pedidos"}</p>
                    <p className="text-xs text-muted-foreground">Pedidos de compra do Sienge</p>
                  </div>
                </button>

                {/* Estoque */}
                <button onClick={() => importarEstoque.mutate()} disabled={loading}
                  className="flex items-center gap-3 h-14 px-4 rounded-xl border border-[#0055A5]/30 bg-[#0055A5]/5 hover:bg-[#0055A5]/10 transition-colors disabled:opacity-50 text-left">
                  <Package size={18} className={cn("text-[#0055A5]", importarEstoque.isPending && "animate-spin")} />
                  <div>
                    <p className="text-sm font-medium text-[#0055A5]">{importarEstoque.isPending ? "Importando…" : "Importar Estoque"}</p>
                    <p className="text-xs text-muted-foreground">Itens de estoque do Sienge</p>
                  </div>
                </button>

                {/* Contas a Receber */}
                <button onClick={() => importarContasReceber.mutate()} disabled={loading}
                  className="flex items-center gap-3 h-14 px-4 rounded-xl border border-[#0055A5]/30 bg-[#0055A5]/5 hover:bg-[#0055A5]/10 transition-colors disabled:opacity-50 text-left">
                  <TrendingUp size={18} className={cn("text-[#0055A5]", importarContasReceber.isPending && "animate-spin")} />
                  <div>
                    <p className="text-sm font-medium text-[#0055A5]">{importarContasReceber.isPending ? "Importando…" : "Importar Contas a Receber"}</p>
                    <p className="text-xs text-muted-foreground">Recebimentos nas obras vinculadas</p>
                  </div>
                </button>

                {/* Contas a Pagar */}
                <button onClick={() => importarContasPagar.mutate()} disabled={loading}
                  className="flex items-center gap-3 h-14 px-4 rounded-xl border border-[#0055A5]/30 bg-[#0055A5]/5 hover:bg-[#0055A5]/10 transition-colors disabled:opacity-50 text-left">
                  <TrendingDown size={18} className={cn("text-[#0055A5]", importarContasPagar.isPending && "animate-spin")} />
                  <div>
                    <p className="text-sm font-medium text-[#0055A5]">{importarContasPagar.isPending ? "Importando…" : "Importar Contas a Pagar"}</p>
                    <p className="text-xs text-muted-foreground">Despesas nas obras vinculadas</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Outros botões utilitários */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Utilitários</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Testar */}
                <button onClick={() => testar.mutate()} disabled={loading}
                  className="flex items-center gap-3 h-14 px-4 rounded-xl border border-border bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 text-left">
                  <Plug size={18} className={cn("text-slate-400", testar.isPending && "animate-pulse")} />
                  <div>
                    <p className="text-sm font-medium">{testar.isPending ? "Testando…" : "Testar Conexão"}</p>
                    <p className="text-xs text-muted-foreground">Verifica se as credenciais estão corretas</p>
                  </div>
                </button>

                {/* Importar Clientes */}
                <button onClick={() => importarClientes.mutate()} disabled={loading}
                  className="flex items-center gap-3 h-14 px-4 rounded-xl border border-[#0055A5]/30 bg-[#0055A5]/5 hover:bg-[#0055A5]/10 transition-colors disabled:opacity-50 text-left">
                  <UserCheck size={18} className={cn("text-[#0055A5]", importarClientes.isPending && "animate-spin")} />
                  <div>
                    <p className="text-sm font-medium text-[#0055A5]">{importarClientes.isPending ? "Importando…" : "Importar Clientes"}</p>
                    <p className="text-xs text-muted-foreground">Lê clientes do Sienge (sem salvar localmente)</p>
                  </div>
                </button>

                {/* Ver Pedidos (visualização raw Sienge) */}
                <button onClick={() => setPedidosAberto(v => !v)} disabled={fetchingPedidos}
                  className="flex items-center gap-3 h-14 px-4 rounded-xl border border-border bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 text-left">
                  <ShoppingCart size={18} className={cn("text-slate-400", fetchingPedidos && "animate-pulse")} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{fetchingPedidos ? "Carregando…" : "Ver Pedidos no Sienge"}</p>
                    <p className="text-xs text-muted-foreground">Visualizar pedidos recentes (somente leitura)</p>
                  </div>
                  {pedidosAberto ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </button>
              </div>
            </div>

            {/* Tabela de pedidos Sienge */}
            {pedidosAberto && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Últimos pedidos no Sienge ({pedidos.length})
                </p>
                {pedidos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum pedido encontrado.</p>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-muted-foreground">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Pedido</th>
                          <th className="text-left px-3 py-2 font-medium">Data</th>
                          <th className="text-left px-3 py-2 font-medium">Status</th>
                          <th className="text-right px-3 py-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {pedidos.map(p => {
                          const st = STATUS_MAP[p.status] ?? { label: p.status, cls: "bg-slate-100 text-slate-600" }
                          return (
                            <tr key={p.id}>
                              <td className="px-3 py-2 font-medium">#{p.formattedPurchaseOrderId ?? p.id}</td>
                              <td className="px-3 py-2 text-muted-foreground">{p.date}</td>
                              <td className="px-3 py-2">
                                <span className={cn("inline-flex px-1.5 py-0.5 rounded-full font-semibold text-[10px]", st.cls)}>
                                  {st.label}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.totalAmount)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Vinculação de Obras */}
            <div>
              <button
                onClick={() => setVinculacaoAberta(v => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 hover:text-foreground transition-colors"
              >
                {vinculacaoAberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Vinculação de Obras ({obrasComVinculo.length})
              </button>
              {vinculacaoAberta && (
                <div className="rounded-xl border border-border overflow-hidden">
                  {obrasComVinculo.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-4">Nenhuma obra cadastrada.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-muted-foreground">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Obra local</th>
                          <th className="text-left px-3 py-2 font-medium">Status</th>
                          <th className="text-left px-3 py-2 font-medium">ID Sienge</th>
                          <th className="text-right px-3 py-2 font-medium">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {obrasComVinculo.map(obra => (
                          <tr key={obra.id}>
                            <td className="px-3 py-2 font-medium">{obra.nome}</td>
                            <td className="px-3 py-2 text-muted-foreground capitalize">
                              {obra.status.replace(/_/g, " ").toLowerCase()}
                            </td>
                            <td className="px-3 py-2">
                              {obra.siengeId ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                                  <Link2 size={9} /> #{obra.siengeId}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold">
                                  <Link2Off size={9} /> Não vinculado
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <select
                                value={obra.siengeId ?? ""}
                                disabled={vincularObra.isPending}
                                onChange={e => vincularObra.mutate({ obraId: obra.id, siengeId: e.target.value || null })}
                                className="text-xs border rounded px-2 py-1 bg-white focus:ring-1 focus:ring-orange-400 outline-none disabled:opacity-50 max-w-[160px]"
                              >
                                <option value="">— Nenhum —</option>
                                {obrasSienge.map(os => (
                                  <option key={os.id} value={os.id}>{os.nome}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Webhooks */}
            <div className={cn("rounded-xl border p-4", webhookStatus?.registrado ? "border-green-200 bg-green-50" : "border-border bg-white")}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Webhook size={16} className={webhookStatus?.registrado ? "text-green-600" : "text-slate-400"} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Webhooks em tempo real
                      {webhookStatus?.registrado && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                          <Zap size={9} /> Ativo
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {webhookStatus?.registrado
                        ? `ID ${webhookStatus.webhookId} — recebendo pedidos, contratos e pagamentos automaticamente`
                        : "Pedidos autorizados, contratos e pagamentos chegam automaticamente ao Concretiza"
                      }
                    </p>
                  </div>
                </div>
                {webhookStatus?.registrado ? (
                  <button
                    onClick={() => removerWebhook.mutate()}
                    disabled={removerWebhook.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ZapOff size={12} /> {removerWebhook.isPending ? "Removendo..." : "Desativar"}
                  </button>
                ) : (
                  <button
                    onClick={() => registrarWebhook.mutate({ appUrl: window.location.origin })}
                    disabled={registrarWebhook.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Zap size={12} /> {registrarWebhook.isPending ? "Registrando..." : "Ativar webhooks"}
                  </button>
                )}
              </div>
            </div>

            {/* Histórico de syncs */}
            {syncs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Últimas sincronizações</p>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-muted-foreground">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Operação</th>
                        <th className="text-left px-3 py-2 font-medium">Status</th>
                        <th className="text-left px-3 py-2 font-medium">Registros</th>
                        <th className="text-left px-3 py-2 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {syncs.slice(0, 8).map(s => (
                        <tr key={s.id}>
                          <td className="px-3 py-2 font-medium capitalize">
                            {s.tipo.replace(/_/g, " ").toLowerCase()}
                          </td>
                          <td className="px-3 py-2">
                            <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold text-[10px]",
                              s.status === "SUCESSO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                              {s.status === "SUCESSO" && <CheckCircle2 size={9} />}
                              {s.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{s.registros}</td>
                          <td className="px-3 py-2 text-muted-foreground">{formatDate(s.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {syncs[0]?.detalhes && (
                  <p className="text-xs text-muted-foreground mt-1.5 italic">{syncs[0].detalhes}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Outras integrações ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Em desenvolvimento</p>
          <span className="text-xs text-muted-foreground">Votando nas próximas? <a href="mailto:contato@concretiza.app" className="text-orange-500 hover:underline">Fale com a gente.</a></span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OUTRAS.map(integration => (
            <div key={integration.name} className="rounded-2xl border border-border bg-white shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                  style={{ backgroundColor: integration.color }}>
                  {integration.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm">{integration.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-full font-semibold">
                      <Clock size={9} /> Em breve
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2.5 leading-relaxed">{integration.description}</p>
                  <ul className="space-y-1">
                    {integration.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center pb-4">
        Precisa de uma integração específica?{" "}
        <a href="mailto:contato@concretiza.app" className="text-orange-500 hover:underline">Fale com a gente.</a>
      </p>
    </div>
  )
}
