"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { TrendingDown, Settings, AlertTriangle, Clock, CheckCircle2, Filter } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function formatDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase()
  if (s.includes("PAG") || s === "PAID")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Pago</span>
  if (s.includes("VENCID") || s === "OVERDUE")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Vencido</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Aberto</span>
}

const FILTROS = [
  { label: "Todos",    value: "todos" },
  { label: "Abertos",  value: "aberto" },
  { label: "Vencidos", value: "vencido" },
  { label: "Pagos",    value: "pago" },
]

export default function ContasPagarPage() {
  const [filtro,     setFiltro]     = useState("todos")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim,    setDataFim]    = useState("")

  const { data: contas = [], isLoading } = trpc.sienge.listarContasPagar.useQuery()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const em30 = new Date(hoje)
  em30.setDate(em30.getDate() + 30)
  const em7  = new Date(hoje)
  em7.setDate(em7.getDate() + 7)

  const filtradas = useMemo(() => {
    return contas.filter((c) => {
      const due = c.dueDate ? new Date(c.dueDate) : null
      const s   = (c.status ?? "").toUpperCase()
      const pago = s.includes("PAG") || s === "PAID"
      const vencido = due && due < hoje && !pago

      if (filtro === "aberto"  && (pago || vencido)) return false
      if (filtro === "vencido" && !vencido)           return false
      if (filtro === "pago"    && !pago)               return false

      if (dataInicio && due && due < new Date(dataInicio)) return false
      if (dataFim    && due && due > new Date(dataFim))    return false

      return true
    })
  }, [contas, filtro, dataInicio, dataFim, hoje])

  const totalGeral   = contas.reduce((s, c) => s + (c.amount ?? 0), 0)
  const totalVencido = contas.filter((c) => {
    const due = c.dueDate ? new Date(c.dueDate) : null
    const s   = (c.status ?? "").toUpperCase()
    const pago = s.includes("PAG") || s === "PAID"
    return due && due < hoje && !pago
  }).reduce((s, c) => s + (c.amount ?? 0), 0)
  const vencendo30 = contas.filter((c) => {
    const due = c.dueDate ? new Date(c.dueDate) : null
    const s   = (c.status ?? "").toUpperCase()
    const pago = s.includes("PAG") || s === "PAID"
    return due && due >= hoje && due <= em30 && !pago
  }).reduce((s, c) => s + (c.amount ?? 0), 0)

  const semSienge = !isLoading && contas.length === 0

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <TrendingDown size={22} className="text-red-500" />
            Contas a Pagar
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
            Títulos a pagar via integração
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <TrendingDown size={15} className="text-slate-500" />
            </div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Total a Pagar</p>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{formatMoeda(totalGeral)}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{contas.length} título(s)</p>
        </div>

        <div className="bg-white border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={15} className="text-red-500" />
            </div>
            <p className="text-xs text-red-600 uppercase tracking-wide font-semibold">Vencidas</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatMoeda(totalVencido)}</p>
          <p className="text-xs text-red-400 mt-0.5">Em atraso</p>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock size={15} className="text-amber-600" />
            </div>
            <p className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Vencendo em 30d</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{formatMoeda(vencendo30)}</p>
          <p className="text-xs text-amber-500 mt-0.5">Próximos 30 dias</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-[var(--text-muted)]" />
        <div className="flex gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                filtro === f.value
                  ? "bg-orange-500 text-white"
                  : "bg-muted text-[var(--text-muted)] hover:bg-muted/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-8 px-3 border border-border rounded-lg text-xs text-[var(--text-primary)] bg-white outline-none focus:border-orange-400"
          />
          <span className="text-xs text-[var(--text-muted)]">até</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="h-8 px-3 border border-border rounded-lg text-xs text-[var(--text-primary)] bg-white outline-none focus:border-orange-400"
          />
        </div>
      </div>

      {/* Empty state — Sienge não configurado */}
      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <TrendingDown size={36} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
            Configure a integração para ver as contas a pagar da empresa.
          </p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} />
            Configurar Sienge
          </Link>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Tabela */}
      {!isLoading && filtradas.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_130px_110px_90px] gap-3 px-4 py-2.5 bg-muted border-b border-border text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            <span>Credor</span>
            <span>Documento</span>
            <span>Vencimento</span>
            <span className="text-right">Valor</span>
            <span className="text-center">Status</span>
          </div>
          <div className="divide-y divide-border">
            {filtradas.map((c) => {
              const due  = c.dueDate ? new Date(c.dueDate) : null
              const s    = (c.status ?? "").toUpperCase()
              const pago = s.includes("PAG") || s === "PAID"
              const vencido = due && due < hoje && !pago
              const breve   = due && due >= hoje && due <= em7 && !pago
              return (
                <div
                  key={c.id}
                  className={cn(
                    "grid grid-cols-[1fr_1fr_130px_110px_90px] gap-3 px-4 py-3 items-center text-sm transition-colors",
                    vencido ? "bg-red-50/50"
                    : breve  ? "bg-amber-50/40"
                    : pago   ? "opacity-60"
                    : "hover:bg-muted/40"
                  )}
                >
                  <p className="font-medium text-[var(--text-primary)] truncate">
                    {c.creditorName ?? "—"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate font-mono">
                    {c.documentNumber ?? "—"}
                  </p>
                  <p className={cn(
                    "text-xs",
                    vencido ? "text-red-600 font-semibold"
                    : breve  ? "text-amber-700 font-semibold"
                    : "text-[var(--text-muted)]"
                  )}>
                    {formatDate(c.dueDate)}
                    {vencido && <span className="ml-1 text-[10px]">(atrasado)</span>}
                  </p>
                  <p className="text-right font-semibold text-[var(--text-primary)]">
                    {formatMoeda(c.amount ?? 0)}
                  </p>
                  <div className="flex justify-center">
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sem resultados filtrados */}
      {!isLoading && !semSienge && filtradas.length === 0 && (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-green-500 opacity-60" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhum título encontrado</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Tente ajustar os filtros aplicados.</p>
        </div>
      )}
    </div>
  )
}
