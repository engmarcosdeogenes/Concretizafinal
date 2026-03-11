"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  BarChart3, Settings2, HardHat, AlertTriangle, ClipboardList,
  DollarSign, TrendingUp, TrendingDown, Package, Landmark,
  X, Eye, EyeOff, ArrowRight, Loader2, FileText, Warehouse,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta, formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

const STORAGE_KEY = "concretiza_paineis_visibilidade"

type WidgetId = "kpis" | "obras-progresso" | "ocorrencias" | "contas-pagar" | "saldos" | "estoque-critico" | "comercial" | "patrimonio" | "tendencia"

const WIDGET_DEFS: { id: WidgetId; titulo: string; sienge: boolean }[] = [
  { id: "kpis",           titulo: "KPIs Gerais",          sienge: false },
  { id: "obras-progresso",titulo: "Avanço das Obras",     sienge: false },
  { id: "ocorrencias",    titulo: "Ocorrências Abertas",  sienge: false },
  { id: "tendencia",      titulo: "Tendência Financeira", sienge: false },
  { id: "contas-pagar",   titulo: "Contas a Pagar",       sienge: true  },
  { id: "saldos",         titulo: "Saldos Bancários",     sienge: true  },
  { id: "estoque-critico",titulo: "Estoque Crítico",      sienge: true  },
  { id: "comercial",      titulo: "Contratos de Venda",   sienge: true  },
  { id: "patrimonio",     titulo: "Patrimônio",           sienge: true  },
]

function useVisibilidade() {
  const [vis, setVis] = useState<Set<WidgetId>>(new Set(WIDGET_DEFS.map(w => w.id)))
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setVis(new Set(JSON.parse(saved) as WidgetId[]))
    } catch { /* ignore */ }
    setLoaded(true)
  }, [])
  function toggle(id: WidgetId) {
    setVis(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }
  return { vis, toggle, loaded }
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
          <Tooltip formatter={(v: number | undefined) => formatMoeda(v ?? 0)} />
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

function SkeletonCard({ rows }: { rows: number }) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PaineisPage() {
  const { vis, toggle, loaded } = useVisibilidade()
  const [configOpen, setConfigOpen] = useState(false)

  const { data: resumo } = trpc.painel.resumo.useQuery()
  const { data: analises } = trpc.analises.resumo.useQuery()
  const { data: obras } = trpc.obra.listar.useQuery()
  const { data: contasPagar, isLoading: loadingCP } = trpc.sienge.listarContasPagar.useQuery(undefined, { retry: false })
  const { data: saldos, isLoading: loadingSaldos } = trpc.sienge.listarSaldos.useQuery(undefined, { retry: false })
  const { data: estoque, isLoading: loadingEstoque } = trpc.sienge.listarEstoque.useQuery({ obraId: undefined }, { retry: false })
  const { data: contratos, isLoading: loadingContratos } = trpc.sienge.listarContratosVenda.useQuery(undefined, { retry: false })
  const { data: patrimonio, isLoading: loadingPatrimonio } = trpc.sienge.listarPatrimonio.useQuery(undefined, { retry: false })

  const temSienge = !!(contasPagar || saldos || estoque)

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
          <p className="text-muted-foreground text-sm mt-0.5">Visão consolidada de todas as suas obras e indicadores.</p>
        </div>
        <button
          onClick={() => setConfigOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-white text-sm font-medium text-[var(--text-primary)] hover:bg-muted transition-colors shadow-sm"
        >
          <Settings2 size={15} />
          Configurar Widgets
        </button>
      </div>

      {/* Widgets */}
      <div className="space-y-5">
        {vis.has("kpis") && <WidgetKPIs resumo={resumo} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {vis.has("obras-progresso") && (
            <WidgetObrasProgresso obras={obras?.map(o => ({ ...o, progresso: o.progresso ?? 0 }))} />
          )}
          {vis.has("ocorrencias") && (
            <WidgetOcorrencias ocorrencias={resumo?.ocorrenciasRecentes as Array<{ id: string; tipo: string; titulo: string; obraId: string; prioridade: number; data: Date }> | undefined} />
          )}
        </div>

        {vis.has("tendencia") && (
          <WidgetTendencia financeiroPorMes={analises?.financeiroPorMes} />
        )}

        {(vis.has("contas-pagar") || vis.has("saldos") || vis.has("estoque-critico")) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {vis.has("contas-pagar") && (
              <WidgetContasPagar contas={contasPagar as Array<{ dueDate?: string; amount?: number; supplierName?: string }> | undefined} isLoading={loadingCP} />
            )}
            {vis.has("saldos") && (
              <WidgetSaldos saldos={saldos as Array<{ bankName?: string; bankCode?: string; balance?: number; accountType?: string }> | undefined} isLoading={loadingSaldos} />
            )}
            {vis.has("estoque-critico") && (
              <WidgetEstoqueCritico estoque={estoque as Array<{ materialNome?: string; saldoAtual?: number; saldoMinimo?: number; unidade?: string }> | undefined} isLoading={loadingEstoque} />
            )}
          </div>
        )}

        {(vis.has("comercial") || vis.has("patrimonio")) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {vis.has("comercial") && (
              <WidgetComercial contratos={contratos as ContratoVenda[] | undefined} isLoading={loadingContratos} />
            )}
            {vis.has("patrimonio") && (
              <WidgetPatrimonio data={patrimonio as PatrimonioData | undefined} isLoading={loadingPatrimonio} />
            )}
          </div>
        )}
      </div>

      {/* Painel de configuração */}
      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-orange-500" />
                <h3 className="font-bold text-[var(--text-primary)]">Configurar Widgets</h3>
              </div>
              <button onClick={() => setConfigOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {WIDGET_DEFS.filter(w => !w.sienge || temSienge).map(w => {
                const ativo = vis.has(w.id)
                return (
                  <button
                    key={w.id}
                    onClick={() => toggle(w.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-sm",
                      ativo ? "border-orange-200 bg-orange-50 text-[var(--text-primary)]" : "border-border text-[var(--text-muted)] hover:bg-muted"
                    )}
                  >
                    <span className="font-medium">{w.titulo}</span>
                    <div className="flex items-center gap-2">
                      {w.sienge && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">Sienge</span>}
                      {ativo ? <Eye size={14} className="text-orange-500" /> : <EyeOff size={14} />}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setConfigOpen(false)} className="btn-orange w-full justify-center">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
