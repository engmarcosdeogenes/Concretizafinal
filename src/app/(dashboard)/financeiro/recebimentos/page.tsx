"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, AlertCircle, ChevronDown, ChevronRight } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatDataCurta, formatMoeda } from "@/lib/format"

const STATUS_COLORS: Record<string, string> = {
  ABERTO:    "bg-blue-100 text-blue-700",
  PAGO:      "bg-emerald-100 text-emerald-700",
  VENCIDO:   "bg-red-100 text-red-700",
  CANCELADO: "bg-slate-100 text-slate-600",
}

export default function RecebimentosPage() {
  const [aba, setAba]             = useState<"contas" | "inadimplentes">("contas")
  const [status, setStatus]       = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim]     = useState("")
  const [expandido, setExpandido] = useState<string | null>(null)

  const { data: contas = [], isLoading: loadingContas } = trpc.sienge.listarContasReceber.useQuery(
    { status: status || undefined, dataInicio: dataInicio || undefined, dataFim: dataFim || undefined },
    { enabled: aba === "contas" },
  )

  const { data: inadimplentes = [], isLoading: loadingInad } = trpc.sienge.listarInadimplentes.useQuery(
    undefined,
    { enabled: aba === "inadimplentes" },
  )

  const totalReceber  = contas.filter(c => c.status === "ABERTO" || c.status === "VENCIDO").reduce((s, c) => s + c.valor, 0)
  const totalVencido  = contas.filter(c => c.status === "VENCIDO").reduce((s, c) => s + c.valor, 0)
  const totalInad     = inadimplentes.reduce((s, i) => s + i.totalEmAberto, 0)

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Link
        href="/financeiro"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Financeiro
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <TrendingUp size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Contas a Receber</h1>
          <p className="text-sm text-[var(--text-muted)]">Recebimentos e inadimplência via Sienge</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">A Receber</p>
          <p className="text-xl font-bold text-blue-600">{formatMoeda(totalReceber)}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Vencido</p>
          <p className="text-xl font-bold text-red-600">{formatMoeda(totalVencido)}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Inadimplência Total</p>
          <p className="text-xl font-bold text-orange-600">{formatMoeda(totalInad)}</p>
          <p className="text-xs text-[var(--text-muted)]">{inadimplentes.length} clientes</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["contas", "inadimplentes"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              aba === a ? "bg-white text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {a === "contas" ? "Contas a Receber" : "Inadimplentes"}
          </button>
        ))}
      </div>

      {/* Contas a Receber */}
      {aba === "contas" && (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            {(["", "ABERTO", "VENCIDO", "PAGO"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  status === s
                    ? "bg-orange-500 text-white"
                    : "bg-white border border-border text-[var(--text-muted)] hover:bg-slate-50"
                )}
              >
                {s === "" ? "Todos" : s === "ABERTO" ? "Abertos" : s === "VENCIDO" ? "Vencidos" : "Pagos"}
              </button>
            ))}
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400"
            />
            <span className="text-xs text-[var(--text-muted)]">até</span>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            {loadingContas ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <div className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
                    <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : contas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp size={32} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhum título encontrado</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Configure a integração Sienge ou ajuste os filtros.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[1fr_1fr_80px_100px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-border text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  <span>Título / Cliente</span>
                  <span>Vencimento</span>
                  <span className="text-right">Valor</span>
                  <span className="text-center">Status</span>
                </div>
                <div className="divide-y divide-border">
                  {contas.map((conta) => (
                    <div key={conta.id} className="grid grid-cols-[1fr_1fr_80px_100px] gap-4 px-4 py-3 items-center hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{conta.titulo}</p>
                        <p className="text-xs text-[var(--text-muted)]">{conta.clienteNome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-primary)]">{formatDataCurta(conta.dataVencimento)}</p>
                        {conta.dataPagamento && (
                          <p className="text-xs text-emerald-600">Pago: {formatDataCurta(conta.dataPagamento)}</p>
                        )}
                      </div>
                      <p className="text-right text-sm font-semibold">{formatMoeda(conta.valor)}</p>
                      <div className="flex justify-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-semibold",
                          STATUS_COLORS[conta.status] ?? "bg-slate-100 text-slate-600"
                        )}>
                          {conta.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Inadimplentes */}
      {aba === "inadimplentes" && (
        <div className="space-y-2">
          {loadingInad ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))
          ) : inadimplentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-border rounded-xl">
              <AlertCircle size={32} className="text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhum inadimplente</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Todos os títulos estão em dia.</p>
            </div>
          ) : inadimplentes.map((inad) => (
            <div key={inad.clienteDocumento} className="bg-white border border-border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandido(expandido === inad.clienteDocumento ? null : inad.clienteDocumento)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{inad.clienteNome}</p>
                  <p className="text-xs text-[var(--text-muted)]">{inad.clienteDocumento} · {inad.quantidadeTitulos} título(s) · Maior atraso: {inad.maiorAtraso} dias</p>
                </div>
                <p className="text-sm font-bold text-red-600">{formatMoeda(inad.totalEmAberto)}</p>
                {expandido === inad.clienteDocumento
                  ? <ChevronDown size={14} className="text-[var(--text-muted)]" />
                  : <ChevronRight size={14} className="text-[var(--text-muted)]" />
                }
              </button>
              {expandido === inad.clienteDocumento && (
                <div className="border-t border-border divide-y divide-border bg-slate-50/50">
                  {inad.titulos.map((t) => (
                    <div key={t.id} className="flex items-center gap-4 px-4 py-2.5 text-xs">
                      <span className="flex-1 text-[var(--text-primary)]">{t.titulo}</span>
                      <span className="text-[var(--text-muted)]">Venc: {formatDataCurta(t.dataVencimento)}</span>
                      <span className="font-semibold text-red-600">{formatMoeda(t.valor)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
