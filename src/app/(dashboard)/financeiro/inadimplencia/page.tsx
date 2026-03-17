"use client"

import { useState } from "react"
import {
  AlertTriangle, DollarSign, Users, Loader2, Search,
  Building2, TrendingDown, ChevronDown, ChevronUp,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

/* ─── Types ──────────────────────────────────────────────────── */

interface Inadimplente {
  clienteNome: string
  clienteDocumento: string
  totalEmAberto: number
  quantidadeTitulos: number
  maiorAtraso: number
  titulos: Array<Record<string, unknown>>
}

interface BulkDefaulter {
  customerId: number
  customerName: string
  customerDocument: string
  companyId: number
  buildingId: number
  unitId: number
  contractId: number
  installmentId: number
  dueDate: string
  daysOverdue: number
  originalValue: number
  correctedValue: number
  openBalance: number
}

interface Saldo {
  id: number
  name: string
  bankName?: string
  saldo: number
}

type Tab = "resumo" | "inadimplentes" | "bulk"

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "resumo", label: "Resumo & Saldos", icon: DollarSign },
  { id: "inadimplentes", label: "Inadimplentes", icon: AlertTriangle },
  { id: "bulk", label: "Detalhamento Bulk", icon: Building2 },
]

/* ─── Resumo & Saldos Tab ──────────────────────────────────── */
function ResumoTab() {
  const saldos = trpc.sienge.listarSaldos.useQuery(undefined, { retry: false })
  const inadimplentes = trpc.sienge.listarInadimplentes.useQuery(undefined, { retry: false })

  const accounts = (saldos.data as Saldo[] | undefined) ?? []
  const debtors = (inadimplentes.data as Inadimplente[] | undefined) ?? []

  const totalSaldos = accounts.reduce((sum, a) => sum + (a.saldo ?? 0), 0)
  const totalInadimplencia = debtors.reduce((sum, d) => sum + d.totalEmAberto, 0)
  const totalTitulos = debtors.reduce((sum, d) => sum + d.quantidadeTitulos, 0)
  const maiorAtrasoGeral = debtors.length > 0 ? Math.max(...debtors.map(d => d.maiorAtraso)) : 0

  const loading = saldos.isPending || inadimplentes.isPending

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando resumo...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Saldo Total em Contas"
          value={formatMoeda(totalSaldos)}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <KpiCard
          label="Total Inadimplência"
          value={formatMoeda(totalInadimplencia)}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          color="red"
        />
        <KpiCard
          label="Títulos em Aberto"
          value={totalTitulos.toString()}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          color="amber"
        />
        <KpiCard
          label="Maior Atraso (dias)"
          value={maiorAtrasoGeral.toString()}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
      </div>

      {/* Saldos Bancários Table */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Saldos Bancários</h3>
        {accounts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nenhuma conta bancária encontrada.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                <tr>
                  <th className="text-left px-4 py-2">ID</th>
                  <th className="text-left px-4 py-2">Conta</th>
                  <th className="text-left px-4 py-2">Banco</th>
                  <th className="text-right px-4 py-2">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-t border-border hover:bg-[var(--bg-secondary)]/50">
                    <td className="px-4 py-2">{a.id}</td>
                    <td className="px-4 py-2 font-medium">{a.name}</td>
                    <td className="px-4 py-2">{a.bankName ?? "—"}</td>
                    <td className={cn("px-4 py-2 text-right font-mono", a.saldo >= 0 ? "text-green-600" : "text-red-600")}>
                      {formatMoeda(a.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Inadimplentes Tab ────────────────────────────────────── */
function InadimplentesTab() {
  const [search, setSearch] = useState("")
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const inadimplentes = trpc.sienge.listarInadimplentes.useQuery(undefined, { retry: false })
  const debtors = (inadimplentes.data as Inadimplente[] | undefined) ?? []

  const filtered = debtors.filter(d =>
    d.clienteNome.toLowerCase().includes(search.toLowerCase()) ||
    d.clienteDocumento.includes(search),
  )

  if (inadimplentes.isPending) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando inadimplentes...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou documento..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <span className="text-xs text-[var(--text-muted)]">{filtered.length} inadimplente(s)</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">Nenhum inadimplente encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const isExpanded = expandedDoc === d.clienteDocumento
            return (
              <div key={d.clienteDocumento} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedDoc(isExpanded ? null : d.clienteDocumento)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)]/50 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{d.clienteNome}</p>
                    <p className="text-xs text-[var(--text-muted)]">Doc: {d.clienteDocumento}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <p className="text-sm font-mono text-red-600">{formatMoeda(d.totalEmAberto)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{d.quantidadeTitulos} título(s) · {d.maiorAtraso}d atraso</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {isExpanded && d.titulos && d.titulos.length > 0 && (
                  <div className="border-t border-border bg-[var(--bg-secondary)]/30 px-4 py-3">
                    <table className="w-full text-xs">
                      <thead className="text-[var(--text-muted)]">
                        <tr>
                          <th className="text-left py-1">Título</th>
                          <th className="text-left py-1">Vencimento</th>
                          <th className="text-right py-1">Valor</th>
                          <th className="text-right py-1">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.titulos.map((t, i) => (
                          <tr key={i} className="border-t border-border/50">
                            <td className="py-1">{(t as Record<string, unknown>).id?.toString() ?? `#${i + 1}`}</td>
                            <td className="py-1">{(t as Record<string, unknown>).dueDate?.toString() ?? "—"}</td>
                            <td className="py-1 text-right font-mono">
                              {formatMoeda(Number((t as Record<string, unknown>).originalValue ?? (t as Record<string, unknown>).balance ?? 0))}
                            </td>
                            <td className="py-1 text-right">
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium">
                                {((t as Record<string, unknown>).status as string) ?? "VENCIDO"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Bulk Defaulters Tab ──────────────────────────────────── */
function BulkTab() {
  const [companyId, setCompanyId] = useState("")
  const [buildingId, setBuildingId] = useState("")
  const [searched, setSearched] = useState(false)

  const bulk = trpc.sienge.listarBulkDefaulters.useQuery(
    {
      companyId: companyId ? Number(companyId) : undefined,
      buildingId: buildingId ? Number(buildingId) : undefined,
    },
    { enabled: searched, retry: false },
  )

  const records = (bulk.data as BulkDefaulter[] | undefined) ?? []

  const totalOpen = records.reduce((sum, r) => sum + (r.openBalance ?? 0), 0)

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">ID Empresa</label>
          <input
            type="number"
            value={companyId}
            onChange={e => { setCompanyId(e.target.value); setSearched(false) }}
            placeholder="Opcional"
            className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">ID Obra</label>
          <input
            type="number"
            value={buildingId}
            onChange={e => { setBuildingId(e.target.value); setSearched(false) }}
            placeholder="Opcional"
            className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setSearched(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition"
          >
            <Search className="h-4 w-4" /> Buscar Inadimplentes
          </button>
        </div>
      </div>

      {/* Results */}
      {!searched ? (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">Use os filtros acima para buscar dados bulk de inadimplentes.</p>
      ) : bulk.isPending ? (
        <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
        </div>
      ) : bulk.isError ? (
        <p className="text-sm text-red-500 py-8 text-center">Erro ao carregar dados bulk.</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">Nenhum inadimplente encontrado.</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">{records.length} registro(s)</span>
            <span className="text-sm font-mono font-semibold text-red-600">Total em aberto: {formatMoeda(totalOpen)}</span>
          </div>
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                <tr>
                  <th className="text-left px-3 py-2">Cliente</th>
                  <th className="text-left px-3 py-2">Documento</th>
                  <th className="text-left px-3 py-2">Obra</th>
                  <th className="text-left px-3 py-2">Vencimento</th>
                  <th className="text-right px-3 py-2">Dias Atraso</th>
                  <th className="text-right px-3 py-2">Valor Original</th>
                  <th className="text-right px-3 py-2">Valor Corrigido</th>
                  <th className="text-right px-3 py-2">Saldo Aberto</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={`${r.customerId}-${r.installmentId}-${i}`} className="border-t border-border hover:bg-[var(--bg-secondary)]/50">
                    <td className="px-3 py-2 font-medium">{r.customerName}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.customerDocument}</td>
                    <td className="px-3 py-2">{r.buildingId}</td>
                    <td className="px-3 py-2">{r.dueDate}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                        r.daysOverdue > 90 ? "bg-red-100 text-red-700" :
                        r.daysOverdue > 30 ? "bg-amber-100 text-amber-700" :
                        "bg-yellow-100 text-yellow-700",
                      )}>
                        {r.daysOverdue}d
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{formatMoeda(r.originalValue)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatMoeda(r.correctedValue)}</td>
                    <td className="px-3 py-2 text-right font-mono text-red-600">{formatMoeda(r.openBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ label, value, icon, color }: {
  label: string
  value: string
  icon: React.ReactNode
  color: "green" | "red" | "amber" | "blue"
}) {
  const bg: Record<string, string> = {
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    amber: "bg-amber-50 border-amber-200",
    blue: "bg-blue-50 border-blue-200",
  }
  return (
    <div className={cn("border rounded-xl p-4", bg[color])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-semibold text-[var(--text-muted)]">{label}</span>
      </div>
      <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function InadimplenciaPage() {
  const [tab, setTab] = useState<Tab>("resumo")

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Inadimplência & Saldos</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Dashboard consolidado de inadimplentes, saldos bancários e detalhamento bulk.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition",
              tab === t.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "resumo" && <ResumoTab />}
      {tab === "inadimplentes" && <InadimplentesTab />}
      {tab === "bulk" && <BulkTab />}
    </div>
  )
}
