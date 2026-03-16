"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  BarChart3, Settings2, HardHat, AlertTriangle, ClipboardList,
  DollarSign, TrendingUp, TrendingDown, Package, Landmark,
  X, Eye, EyeOff, ArrowRight, Loader2, FileText, Warehouse,
  Users, Clock, Building2, ShoppingCart, GripVertical, RotateCcw,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta, formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts"

type WidgetId =
  | "kpis" | "obras-progresso" | "ocorrencias" | "contas-pagar"
  | "saldos" | "estoque-critico" | "comercial" | "patrimonio" | "tendencia"
  | "custo-orcamento" | "fluxo-caixa" | "top-fornecedores" | "inadimplencia" | "contas-vencimento"
  | "pedidos-recentes"

type WidgetConfig = { id: WidgetId; visivel: boolean; ordem: number }

const WIDGET_DEFS: { id: WidgetId; titulo: string; sienge: boolean }[] = [
  { id: "kpis",              titulo: "KPIs Gerais",             sienge: false },
  { id: "obras-progresso",   titulo: "Avanço das Obras",        sienge: false },
  { id: "ocorrencias",       titulo: "Ocorrências Abertas",     sienge: false },
  { id: "tendencia",         titulo: "Tendência Financeira",    sienge: false },
  { id: "custo-orcamento",   titulo: "Custo vs Orçamento",      sienge: false },
  { id: "pedidos-recentes",  titulo: "Pedidos Recentes",        sienge: false },
  { id: "contas-pagar",      titulo: "Contas a Pagar",          sienge: true  },
  { id: "saldos",            titulo: "Saldos Bancários",        sienge: true  },
  { id: "estoque-critico",   titulo: "Estoque Crítico",         sienge: true  },
  { id: "fluxo-caixa",       titulo: "Fluxo de Caixa",          sienge: true  },
  { id: "top-fornecedores",  titulo: "Top Fornecedores",        sienge: true  },
  { id: "inadimplencia",     titulo: "Inadimplência",           sienge: true  },
  { id: "contas-vencimento", titulo: "Vencimentos por Prazo",   sienge: true  },
  { id: "comercial",         titulo: "Contratos de Venda",      sienge: true  },
  { id: "patrimonio",        titulo: "Patrimônio",              sienge: true  },
]

function defaultWidgets(): WidgetConfig[] {
  return WIDGET_DEFS.map((w, i) => ({ id: w.id, visivel: true, ordem: i }))
}

function useDashboardConfig() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets)
  const [loaded, setLoaded] = useState(false)
  const { data: serverConfig, isLoading } = trpc.dashboardConfig.buscar.useQuery()
  const salvar = trpc.dashboardConfig.salvar.useMutation()

  useEffect(() => {
    if (isLoading) return
    if (serverConfig) {
      const saved = serverConfig as WidgetConfig[]
      const knownIds = new Set(saved.map(w => w.id))
      const merged: WidgetConfig[] = [
        ...saved,
        ...WIDGET_DEFS.filter(w => !knownIds.has(w.id)).map((w, i) => ({
          id: w.id,
          visivel: true,
          ordem: saved.length + i,
        })),
      ].sort((a, b) => a.ordem - b.ordem)
      setWidgets(merged)
    }
    setLoaded(true)
  }, [serverConfig, isLoading])

  const persist = useCallback((next: WidgetConfig[]) => {
    setWidgets(next)
    salvar.mutate({ widgets: next })
  }, [salvar])

  function toggle(id: WidgetId) {
    const next = widgets.map(w => w.id === id ? { ...w, visivel: !w.visivel } : w)
    persist(next)
  }

  function reorder(fromIndex: number, toIndex: number) {
    const next = [...widgets]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    persist(next.map((w, i) => ({ ...w, ordem: i })))
  }

  function resetToDefault() {
    persist(defaultWidgets())
  }

  const visibleIds = new Set(widgets.filter(w => w.visivel).map(w => w.id))
  const orderedIds = widgets.filter(w => w.visivel).map(w => w.id)

  return { widgets, visibleIds, orderedIds, toggle, reorder, resetToDefault, loaded }
}

// ── Widgets ──────────────────────────────────────────────────────────────────

function WidgetKPIs({ resumo }: { resumo: { kpis: { totalObras: number; obrasAtivas: number; rdosMes: number; ocAbertas: number; membrosAtivos: number } } | undefined }) {
  if (!resumo) return <SkeletonCard rows={2} />
  const { kpis } = resumo
  const items = [
    { label: "Obras Ativas",     value: kpis.obrasAtivas,  total: kpis.totalObras, color: "text-orange-600", bg: "bg-orange-50", icon: HardHat },
    { label: "RDOs este mês",    value: kpis.rdosMes,      total: null,            color: "text-blue-600",   bg: "bg-blue-50",   icon: ClipboardList },
    { label: "Ocorrências",      value: kpis.ocAbertas,    total: null,            color: "text-red-600",    bg: "bg-red-50",    icon: AlertTriangle },
    { label: "Membros Ativos",   value: kpis.membrosAtivos,total: null,            color: "text-teal-600",   bg: "bg-teal-50",   icon: TrendingUp },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ label, value, total, color, bg, icon: Icon }) => (
        <div key={label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
          <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
            <Icon size={16} className={color} />
          </div>
          <p className="text-2xl font-extrabold text-[var(--text-primary)]">{value}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{label}</p>
          {total !== null && <p className="text-[10px] text-[var(--text-muted)] opacity-70">de {total} total</p>}
        </div>
      ))}
    </div>
  )
}

function WidgetObrasProgresso({ obras }: { obras: Array<{ id: string; nome: string; status: string; progresso: number | null; cidade: string | null }> | undefined }) {
  if (!obras) return <SkeletonCard rows={4} />
  const ativas = obras.filter(o => o.status === "EM_ANDAMENTO").slice(0, 8)
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <HardHat size={15} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Avanço das Obras</h3>
        </div>
        <Link href="/obras" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          Ver todas <ArrowRight size={11} />
        </Link>
      </div>
      {ativas.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhuma obra ativa.</p>
      ) : (
        <div className="divide-y divide-border">
          {ativas.map(o => {
            const pct = o.progresso ?? 0
            return (
              <Link key={o.id} href={`/obras/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{o.nome}</p>
                  {o.cidade && <p className="text-[10px] text-[var(--text-muted)]">{o.cidade}</p>}
                  <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)] shrink-0">{pct}%</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WidgetOcorrencias({ ocorrencias }: { ocorrencias: Array<{ id: string; tipo: string; titulo: string; obraId: string; prioridade: number; data: Date }> | undefined }) {
  if (!ocorrencias) return <SkeletonCard rows={3} />
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ocorrências Abertas</h3>
        </div>
      </div>
      {ocorrencias.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhuma ocorrência aberta.</p>
      ) : (
        <div className="divide-y divide-border">
          {ocorrencias.map(oc => (
            <Link key={oc.id} href={`/obras/${oc.obraId}/ocorrencias/${oc.id}`} className="flex items-start gap-2.5 px-5 py-3 hover:bg-muted/30 transition-colors">
              <span className={cn(
                "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                oc.prioridade === 3 ? "bg-red-500" : oc.prioridade === 2 ? "bg-amber-400" : "bg-slate-300"
              )} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{oc.titulo}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{oc.tipo} · {formatDataCurta(oc.data)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function WidgetContasPagar({ contas }: { contas: Array<{ dueDate?: string; amount?: number; supplierName?: string }> | undefined; isLoading: boolean }) {
  if (!contas) return <SkeletonCard rows={4} />
  const hoje = new Date()
  const em30 = new Date(); em30.setDate(hoje.getDate() + 30)
  const proximas = contas
    .filter(c => c.dueDate && new Date(c.dueDate) <= em30)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 6)
  const total = proximas.reduce((s, c) => s + (c.amount ?? 0), 0)
  const vencidas = proximas.filter(c => c.dueDate && new Date(c.dueDate) < hoje)
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <DollarSign size={15} className="text-red-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Contas a Pagar <span className="text-[10px] text-[var(--text-muted)] font-normal">(próximos 30 dias)</span></h3>
        </div>
        {vencidas.length > 0 && (
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">{vencidas.length} vencida{vencidas.length > 1 ? "s" : ""}</span>
        )}
      </div>
      {proximas.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhuma conta nos próximos 30 dias.</p>
      ) : (
        <>
          <div className="divide-y divide-border">
            {proximas.map((c, i) => {
              const vencida = c.dueDate && new Date(c.dueDate) < hoje
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{c.supplierName ?? "—"}</p>
                    <p className={cn("text-[10px]", vencida ? "text-red-500 font-semibold" : "text-[var(--text-muted)]")}>
                      {c.dueDate ? formatDataCurta(new Date(c.dueDate)) : "—"}
                      {vencida && " · Vencida"}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[var(--text-primary)]">{formatMoeda(c.amount ?? 0)}</span>
                </div>
              )
            })}
          </div>
          <div className="px-5 py-3 border-t border-border flex justify-between items-center">
            <span className="text-xs text-[var(--text-muted)]">Total</span>
            <span className="text-sm font-extrabold text-red-600">{formatMoeda(total)}</span>
          </div>
        </>
      )}
    </div>
  )
}

function WidgetSaldos({ saldos }: { saldos: Array<{ bankName?: string; bankCode?: string; balance?: number; accountType?: string }> | undefined; isLoading: boolean }) {
  if (!saldos) return <SkeletonCard rows={3} />
  const totalPositivo = saldos.filter(s => (s.balance ?? 0) >= 0).reduce((sum, s) => sum + (s.balance ?? 0), 0)
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Landmark size={15} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Saldos Bancários</h3>
        </div>
        <span className="text-sm font-extrabold text-emerald-600">{formatMoeda(totalPositivo)}</span>
      </div>
      {saldos.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhuma conta bancária encontrada.</p>
      ) : (
        <div className="divide-y divide-border">
          {saldos.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-2.5">
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">{s.bankName ?? s.bankCode ?? "Banco"}</p>
                {s.accountType && <p className="text-[10px] text-[var(--text-muted)]">{s.accountType}</p>}
              </div>
              <span className={cn("text-sm font-bold", (s.balance ?? 0) >= 0 ? "text-emerald-600" : "text-red-500")}>
                {formatMoeda(s.balance ?? 0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WidgetEstoqueCritico({ estoque }: { estoque: Array<{ materialNome?: string; saldoAtual?: number; saldoMinimo?: number; unidade?: string; obraId?: string }> | undefined; isLoading: boolean }) {
  if (!estoque) return <SkeletonCard rows={3} />
  const criticos = estoque.filter(e => (e.saldoAtual ?? 0) <= (e.saldoMinimo ?? 0)).slice(0, 8)
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Package size={15} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Estoque Crítico</h3>
        </div>
        {criticos.length > 0 && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{criticos.length} item{criticos.length > 1 ? "s" : ""}</span>
        )}
      </div>
      {criticos.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhum item com estoque crítico.</p>
      ) : (
        <div className="divide-y divide-border">
          {criticos.map((e, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-2.5">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate flex-1 mr-2">{e.materialNome ?? "—"}</p>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                (e.saldoAtual ?? 0) === 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
              )}>
                {e.saldoAtual ?? 0} {e.unidade ?? ""} {(e.saldoAtual ?? 0) === 0 ? "· Zerado" : "· Baixo"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Novos Widgets BI ─────────────────────────────────────────────────────────

function WidgetTendencia({ financeiroPorMes }: { financeiroPorMes?: Array<{ mes: string; receitas: number; despesas: number }> }) {
  if (!financeiroPorMes) return <SkeletonCard rows={4} />
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} className="text-blue-500" />
        <p className="text-sm font-bold text-[var(--text-primary)]">Tendência Financeira</p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={financeiroPorMes} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatMoeda(Number(v ?? 0))} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#22c55e" fill="url(#gRec)" strokeWidth={2} />
          <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" fill="url(#gDesp)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

type ContratoVenda = { id: number; status?: string; totalValue?: number; clientName?: string }

function WidgetComercial({ contratos, isLoading }: { contratos?: ContratoVenda[]; isLoading: boolean }) {
  if (isLoading) return <SkeletonCard rows={4} />
  if (!contratos || contratos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={15} className="text-blue-500" />
          <p className="text-sm font-bold text-[var(--text-primary)]">Contratos de Venda</p>
        </div>
        <p className="text-xs text-[var(--text-muted)] py-6 text-center">Nenhum contrato — configure o Sienge.</p>
      </div>
    )
  }
  const totalValor = contratos.reduce((s, c) => s + (c.totalValue ?? 0), 0)
  const ativos = contratos.filter(c => {
    const s = (c.status ?? "").toUpperCase()
    return s.includes("ATIVO") || s === "ACTIVE" || s === "SIGNED"
  }).length
  const recentes = contratos.slice(0, 4)
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-blue-500" />
          <p className="text-sm font-bold text-[var(--text-primary)]">Contratos de Venda</p>
        </div>
        <Link href="/comercial/contratos" className="text-[10px] text-orange-500 hover:underline flex items-center gap-0.5">
          Ver todos <ArrowRight size={10} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-muted rounded-xl p-3">
          <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Total</p>
          <p className="text-lg font-bold text-[var(--text-primary)]">{contratos.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-[10px] text-green-600 mb-0.5">Ativos</p>
          <p className="text-lg font-bold text-green-700">{ativos}</p>
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-2 font-semibold">Valor total: <span className="text-[var(--text-primary)]">{formatMoeda(totalValor)}</span></p>
      <div className="divide-y divide-border">
        {recentes.map(c => (
          <div key={c.id} className="flex items-center justify-between py-1.5">
            <p className="text-xs text-[var(--text-primary)] truncate max-w-[120px]">{c.clientName ?? "—"}</p>
            <p className="text-xs font-semibold text-[var(--text-primary)]">{formatMoeda(c.totalValue ?? 0)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

type PatrimonioData = { imoveis: Array<{ bookValue?: number }>; moveis: Array<{ bookValue?: number }> }

function WidgetPatrimonio({ data, isLoading }: { data?: PatrimonioData; isLoading: boolean }) {
  if (isLoading) return <SkeletonCard rows={4} />
  if (!data || (data.imoveis.length === 0 && data.moveis.length === 0)) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Warehouse size={15} className="text-purple-500" />
          <p className="text-sm font-bold text-[var(--text-primary)]">Patrimônio</p>
        </div>
        <p className="text-xs text-[var(--text-muted)] py-6 text-center">Nenhum dado — configure o Sienge.</p>
      </div>
    )
  }
  const totalImoveis = data.imoveis.reduce((s, b) => s + (b.bookValue ?? 0), 0)
  const totalMoveis  = data.moveis.reduce((s, b) => s + (b.bookValue ?? 0), 0)
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Warehouse size={15} className="text-purple-500" />
          <p className="text-sm font-bold text-[var(--text-primary)]">Patrimônio</p>
        </div>
        <Link href="/patrimonio" className="text-[10px] text-orange-500 hover:underline flex items-center gap-0.5">
          Ver <ArrowRight size={10} />
        </Link>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
          <div>
            <p className="text-[10px] text-blue-600 font-semibold">Bens Imóveis</p>
            <p className="text-xs text-blue-500">{data.imoveis.length} bens</p>
          </div>
          <p className="text-sm font-bold text-blue-700">{formatMoeda(totalImoveis)}</p>
        </div>
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
          <div>
            <p className="text-[10px] text-purple-600 font-semibold">Bens Móveis</p>
            <p className="text-xs text-purple-500">{data.moveis.length} bens</p>
          </div>
          <p className="text-sm font-bold text-purple-700">{formatMoeda(totalMoveis)}</p>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
          <p className="text-xs font-semibold text-[var(--text-muted)]">Total Patrimônio</p>
          <p className="text-sm font-bold text-[var(--text-primary)]">{formatMoeda(totalImoveis + totalMoveis)}</p>
        </div>
      </div>
    </div>
  )
}

// ── Novos Widgets BI (Fase 2D) ───────────────────────────────────────────────

function WidgetCustoOrcamento({ obras }: { obras: Array<{ id: string; nome: string; orcamento: number | null; custoAtual: number | null; status: string }> | undefined }) {
  if (!obras) return <SkeletonCard rows={4} />
  const ativas = obras
    .filter(o => o.status === "EM_ANDAMENTO" && (o.orcamento ?? 0) > 0)
    .slice(0, 6)
    .map(o => ({
      nome: o.nome.length > 18 ? o.nome.slice(0, 18) + "…" : o.nome,
      orcamento: o.orcamento ?? 0,
      custo: o.custoAtual ?? 0,
      excedido: (o.custoAtual ?? 0) > (o.orcamento ?? 0),
    }))
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Custo vs Orçamento por Obra</h3>
        </div>
        <Link href="/obras" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          Ver obras <ArrowRight size={11} />
        </Link>
      </div>
      {ativas.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhuma obra ativa com orçamento definido.</p>
      ) : (
        <div className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ativas} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nome" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatMoeda(Number(v ?? 0))} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="orcamento" name="Orçamento" fill="#93c5fd" radius={[3,3,0,0]} />
              <Bar dataKey="custo" name="Custo Atual" radius={[3,3,0,0]}>
                {ativas.map((entry, i) => (
                  <Cell key={i} fill={entry.excedido ? "#ef4444" : "#f97316"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {ativas.some(o => o.excedido) && (
            <p className="text-[10px] text-red-500 mt-1 text-center font-semibold">⚠ Obras em vermelho excederam o orçamento</p>
          )}
        </div>
      )}
    </div>
  )
}

type ContaReceber = { dueDate?: string; amount?: number; clientName?: string; status?: string }

function WidgetFluxoCaixa({
  contasPagar,
  contasReceber,
  isLoading,
}: {
  contasPagar: Array<{ dueDate?: string; amount?: number }> | undefined
  contasReceber: ContaReceber[] | undefined
  isLoading: boolean
}) {
  if (isLoading) return <SkeletonCard rows={5} />
  if (!contasPagar && !contasReceber) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-emerald-500" />
          <p className="text-sm font-bold text-[var(--text-primary)]">Fluxo de Caixa</p>
        </div>
        <p className="text-xs text-[var(--text-muted)] py-6 text-center">Nenhum dado — configure o Sienge.</p>
      </div>
    )
  }
  const hoje = new Date()
  const meses = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      pagar: 0,
      receber: 0,
    }
  })
  ;(contasPagar ?? []).forEach(c => {
    if (!c.dueDate) return
    const key = c.dueDate.slice(0, 7)
    const m = meses.find(m => m.key === key)
    if (m) m.pagar += c.amount ?? 0
  })
  ;(contasReceber ?? []).forEach(c => {
    if (!c.dueDate) return
    const key = c.dueDate.slice(0, 7)
    const m = meses.find(m => m.key === key)
    if (m) m.receber += c.amount ?? 0
  })
  const saldoTotal = meses.reduce((s, m) => s + m.receber - m.pagar, 0)
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-500" />
          <p className="text-sm font-bold text-[var(--text-primary)]">Fluxo de Caixa (3 meses)</p>
        </div>
        <Link href="/financeiro" className="text-[10px] text-orange-500 hover:underline flex items-center gap-0.5">
          Ver <ArrowRight size={10} />
        </Link>
      </div>
      <p className={cn("text-[11px] font-semibold mb-3", saldoTotal >= 0 ? "text-emerald-600" : "text-red-500")}>
        Saldo projetado: {formatMoeda(saldoTotal)}
      </p>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={meses} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatMoeda(Number(v ?? 0))} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="receber" name="A Receber" fill="#22c55e" radius={[3,3,0,0]} />
          <Bar dataKey="pagar" name="A Pagar" fill="#ef4444" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function WidgetTopFornecedores({ contasPagar }: { contasPagar: Array<{ supplierName?: string; amount?: number }> | undefined }) {
  if (!contasPagar) return <SkeletonCard rows={4} />
  const map: Record<string, number> = {}
  contasPagar.forEach(c => {
    const nome = c.supplierName ?? "Sem nome"
    map[nome] = (map[nome] ?? 0) + (c.amount ?? 0)
  })
  const top = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([nome, total]) => ({ nome: nome.length > 22 ? nome.slice(0, 22) + "…" : nome, total }))
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-violet-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Top Fornecedores por Gasto</h3>
        </div>
        <Link href="/suprimentos/fornecedores" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          Ver todos <ArrowRight size={11} />
        </Link>
      </div>
      {top.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhum dado de fornecedores.</p>
      ) : (
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 9 }} width={110} />
              <Tooltip formatter={(v) => formatMoeda(Number(v ?? 0))} />
              <Bar dataKey="total" name="Total" fill="#8b5cf6" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

type Inadimplente = { clientName?: string; amount?: number; dueDate?: string; installmentNumber?: number }

function WidgetInadimplencia({ inadimplentes, isLoading }: { inadimplentes: Inadimplente[] | undefined; isLoading: boolean }) {
  if (isLoading) return <SkeletonCard rows={4} />
  if (!inadimplentes) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} className="text-red-500" />
          <p className="text-sm font-bold text-[var(--text-primary)]">Inadimplência</p>
        </div>
        <p className="text-xs text-[var(--text-muted)] py-6 text-center">Nenhum dado — configure o Sienge.</p>
      </div>
    )
  }
  const totalValor = inadimplentes.reduce((s, i) => s + (i.amount ?? 0), 0)
  const clientes = [...new Set(inadimplentes.map(i => i.clientName).filter(Boolean))].length
  const hoje = new Date()
  const lista = inadimplentes.slice(0, 5)
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Inadimplência</h3>
        </div>
        <Link href="/financeiro/recebimentos" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          Ver <ArrowRight size={11} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 py-3 border-b border-border">
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-[10px] text-red-500 font-semibold mb-0.5">Total em Atraso</p>
          <p className="text-base font-extrabold text-red-600">{formatMoeda(totalValor)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-[10px] text-amber-600 font-semibold mb-0.5">Clientes</p>
          <p className="text-base font-extrabold text-amber-700">{clientes}</p>
        </div>
      </div>
      {lista.length === 0 ? (
        <p className="px-5 py-4 text-sm text-emerald-600 font-medium">Nenhuma inadimplência.</p>
      ) : (
        <div className="divide-y divide-border">
          {lista.map((item, i) => {
            const dias = item.dueDate
              ? Math.floor((hoje.getTime() - new Date(item.dueDate).getTime()) / 86400000)
              : null
            return (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">{item.clientName ?? "—"}</p>
                  {dias !== null && (
                    <p className="text-[10px] text-red-400">{dias} dia{dias !== 1 ? "s" : ""} em atraso</p>
                  )}
                </div>
                <span className="text-xs font-bold text-red-600">{formatMoeda(item.amount ?? 0)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WidgetContasVencimento({ contasPagar }: { contasPagar: Array<{ dueDate?: string; amount?: number }> | undefined }) {
  if (!contasPagar) return <SkeletonCard rows={3} />
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const em7 = new Date(hoje); em7.setDate(hoje.getDate() + 7)
  const em15 = new Date(hoje); em15.setDate(hoje.getDate() + 15)
  const em30 = new Date(hoje); em30.setDate(hoje.getDate() + 30)
  const pendentes = contasPagar.filter(c => c.dueDate && new Date(c.dueDate) >= hoje)
  const faixas = [
    { label: "Próx. 7 dias",  cor: "bg-red-50 border-red-100",    text: "text-red-600",    items: pendentes.filter(c => new Date(c.dueDate!) <= em7) },
    { label: "Próx. 15 dias", cor: "bg-amber-50 border-amber-100", text: "text-amber-700",  items: pendentes.filter(c => new Date(c.dueDate!) <= em15) },
    { label: "Próx. 30 dias", cor: "bg-blue-50 border-blue-100",   text: "text-blue-700",   items: pendentes.filter(c => new Date(c.dueDate!) <= em30) },
  ]
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Vencimentos por Prazo</h3>
        </div>
        <Link href="/financeiro/contas-pagar" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          Ver todos <ArrowRight size={11} />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4">
        {faixas.map(({ label, cor, text, items }) => {
          const total = items.reduce((s, c) => s + (c.amount ?? 0), 0)
          return (
            <div key={label} className={`rounded-xl border p-3 ${cor}`}>
              <p className={`text-[10px] font-semibold mb-1 ${text}`}>{label}</p>
              <p className={`text-sm font-extrabold ${text}`}>{formatMoeda(total)}</p>
              <p className={`text-[10px] mt-0.5 opacity-70 ${text}`}>{items.length} título{items.length !== 1 ? "s" : ""}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type PedidoItem = {
  id: string
  status: string
  total: number | null
  createdAt: Date
  fornecedor: { nome: string }
}

const STATUS_PEDIDO_MAP: Record<string, { label: string; cls: string }> = {
  RASCUNHO:         { label: "Rascunho",   cls: "bg-slate-100 text-slate-600" },
  ENVIADO:          { label: "Enviado",    cls: "bg-blue-100 text-blue-700" },
  CONFIRMADO:       { label: "Confirmado", cls: "bg-purple-100 text-purple-700" },
  ENTREGUE_PARCIAL: { label: "Parcial",    cls: "bg-amber-100 text-amber-700" },
  ENTREGUE:         { label: "Entregue",   cls: "bg-green-100 text-green-700" },
  CANCELADO:        { label: "Cancelado",  cls: "bg-red-100 text-red-700" },
}

function WidgetPedidosRecentes({ pedidos }: { pedidos: PedidoItem[] | undefined }) {
  if (!pedidos) return <SkeletonCard rows={4} />
  const recentes = pedidos.slice(0, 6)
  const pendentes = pedidos.filter(p => p.status !== "ENTREGUE" && p.status !== "CANCELADO").length
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart size={15} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Pedidos Recentes</h3>
        </div>
        <div className="flex items-center gap-2">
          {pendentes > 0 && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full">{pendentes} em aberto</span>
          )}
          <Link href="/suprimentos/pedidos" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            Ver todos <ArrowRight size={11} />
          </Link>
        </div>
      </div>
      {recentes.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhum pedido de compra registrado.</p>
      ) : (
        <div className="divide-y divide-border">
          {recentes.map(p => {
            const s = STATUS_PEDIDO_MAP[p.status] ?? STATUS_PEDIDO_MAP.RASCUNHO
            return (
              <Link key={p.id} href={`/suprimentos/pedidos/${p.id}`}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">{p.fornecedor.nome}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{formatDataCurta(p.createdAt)}</p>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0", s.cls)}>{s.label}</span>
                <span className="text-xs font-bold text-[var(--text-primary)] shrink-0">{formatMoeda(p.total ?? 0)}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SkeletonCard({ rows }: { rows: number }) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  )
}

// ── Render widget by ID ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RenderWidget({ id, data }: { id: WidgetId; data: Record<string, any> }) {
  const { resumo, analises, obras, contasPagar, saldos, estoque, contratos, patrimonio, contasReceber, inadimplentes, pedidos, loadingCP, loadingSaldos, loadingEstoque, loadingContratos, loadingPatrimonio, loadingCR, loadingInad } = data

  switch (id) {
    case "kpis":
      return <WidgetKPIs resumo={resumo} />
    case "obras-progresso":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <WidgetObrasProgresso obras={obras?.map((o: any) => ({ ...o, progresso: o.progresso ?? 0 }))} />
    case "ocorrencias":
      return <WidgetOcorrencias ocorrencias={resumo?.ocorrenciasRecentes as Array<{ id: string; tipo: string; titulo: string; obraId: string; prioridade: number; data: Date }> | undefined} />
    case "tendencia":
      return <WidgetTendencia financeiroPorMes={analises?.financeiroPorMes} />
    case "custo-orcamento":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <WidgetCustoOrcamento obras={obras?.map((o: any) => ({ id: o.id, nome: o.nome, orcamento: o.orcamento ?? null, custoAtual: o.custoAtual ?? null, status: o.status }))} />
    case "pedidos-recentes":
      return <WidgetPedidosRecentes pedidos={pedidos as PedidoItem[] | undefined} />
    case "contas-pagar":
      return <WidgetContasPagar contas={contasPagar as Array<{ dueDate?: string; amount?: number; supplierName?: string }> | undefined} isLoading={loadingCP} />
    case "saldos":
      return <WidgetSaldos saldos={saldos as Array<{ bankName?: string; bankCode?: string; balance?: number; accountType?: string }> | undefined} isLoading={loadingSaldos} />
    case "estoque-critico":
      return <WidgetEstoqueCritico estoque={estoque as Array<{ materialNome?: string; saldoAtual?: number; saldoMinimo?: number; unidade?: string }> | undefined} isLoading={loadingEstoque} />
    case "fluxo-caixa":
      return <WidgetFluxoCaixa contasPagar={contasPagar as Array<{ dueDate?: string; amount?: number }> | undefined} contasReceber={contasReceber as ContaReceber[] | undefined} isLoading={loadingCP || loadingCR} />
    case "top-fornecedores":
      return <WidgetTopFornecedores contasPagar={contasPagar as Array<{ supplierName?: string; amount?: number }> | undefined} />
    case "inadimplencia":
      return <WidgetInadimplencia inadimplentes={inadimplentes as Inadimplente[] | undefined} isLoading={loadingInad} />
    case "contas-vencimento":
      return <WidgetContasVencimento contasPagar={contasPagar as Array<{ dueDate?: string; amount?: number }> | undefined} />
    case "comercial":
      return <WidgetComercial contratos={contratos as ContratoVenda[] | undefined} isLoading={loadingContratos} />
    case "patrimonio":
      return <WidgetPatrimonio data={patrimonio as PatrimonioData | undefined} isLoading={loadingPatrimonio} />
    default:
      return null
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PaineisPage() {
  const { widgets, visibleIds, orderedIds, toggle, reorder, resetToDefault, loaded } = useDashboardConfig()
  const [configOpen, setConfigOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const { data: resumo } = trpc.painel.resumo.useQuery()
  const { data: analises } = trpc.analises.resumo.useQuery()
  const { data: obras } = trpc.obra.listar.useQuery()
  const { data: contasPagar, isLoading: loadingCP } = trpc.sienge.listarContasPagar.useQuery(undefined, { retry: false })
  const { data: saldos, isLoading: loadingSaldos } = trpc.sienge.listarSaldos.useQuery(undefined, { retry: false })
  const { data: estoque, isLoading: loadingEstoque } = trpc.sienge.listarEstoque.useQuery({ obraId: undefined }, { retry: false })
  const { data: contratos, isLoading: loadingContratos } = trpc.sienge.listarContratosVenda.useQuery(undefined, { retry: false })
  const { data: patrimonio, isLoading: loadingPatrimonio } = trpc.sienge.listarPatrimonio.useQuery(undefined, { retry: false })
  const { data: contasReceber, isLoading: loadingCR } = trpc.sienge.listarContasReceber.useQuery({}, { retry: false })
  const { data: inadimplentes, isLoading: loadingInad } = trpc.sienge.listarInadimplentes.useQuery(undefined, { retry: false })
  const { data: pedidos } = trpc.pedido.listar.useQuery()

  const temSienge = !!(contasPagar || saldos || estoque)

  const widgetData = { resumo, analises, obras, contasPagar, saldos, estoque, contratos, patrimonio, contasReceber, inadimplentes, pedidos, loadingCP, loadingSaldos, loadingEstoque, loadingContratos, loadingPatrimonio, loadingCR, loadingInad }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Painéis</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Visão consolidada de todas as suas obras e indicadores. Arraste para reordenar.</p>
        </div>
        <button
          onClick={() => setConfigOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-white text-sm font-medium text-[var(--text-primary)] hover:bg-muted transition-colors shadow-sm"
        >
          <Settings2 size={15} />
          Configurar Widgets
        </button>
      </div>

      {/* Widgets — rendered in user-defined order */}
      <div className="space-y-5">
        {orderedIds.map((wid) => (
          <div key={wid}>
            <RenderWidget id={wid} data={widgetData} />
          </div>
        ))}
      </div>

      {/* Painel de configuração com drag-and-drop */}
      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-orange-500" />
                <h3 className="font-bold text-[var(--text-primary)]">Configurar Widgets</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetToDefault}
                  title="Restaurar padrão"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <RotateCcw size={13} />
                </button>
                <button onClick={() => setConfigOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] px-5 pt-3">Arraste para reordenar. Clique no olho para mostrar/ocultar.</p>
            <div className="p-5 pt-2 space-y-1.5 overflow-y-auto flex-1">
              {widgets.filter(w => {
                const def = WIDGET_DEFS.find(d => d.id === w.id)
                return def && (!def.sienge || temSienge)
              }).map((w, idx) => {
                const def = WIDGET_DEFS.find(d => d.id === w.id)!
                return (
                  <div
                    key={w.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx) }}
                    onDragEnd={() => {
                      if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
                        reorder(dragIdx, dragOverIdx)
                      }
                      setDragIdx(null)
                      setDragOverIdx(null)
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm select-none",
                      w.visivel ? "border-orange-200 bg-orange-50/50" : "border-border bg-white text-[var(--text-muted)]",
                      dragOverIdx === idx && "border-orange-400 shadow-md scale-[1.02]",
                      dragIdx === idx && "opacity-40",
                    )}
                  >
                    <GripVertical size={14} className="text-[var(--text-muted)] cursor-grab shrink-0" />
                    <span className="font-medium flex-1 truncate">{def.titulo}</span>
                    {def.sienge && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold shrink-0">Sienge</span>}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(w.id) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/80 transition-colors shrink-0"
                    >
                      {w.visivel ? <Eye size={14} className="text-orange-500" /> : <EyeOff size={14} />}
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="px-5 pb-5 shrink-0">
              <button onClick={() => setConfigOpen(false)} className="btn-orange w-full justify-center">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
