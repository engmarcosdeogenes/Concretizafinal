"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { FileText, Settings, TrendingUp, CheckCircle, XCircle, FileDown } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function formatDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function getStatusConfig(status?: string) {
  const s = (status ?? "").toUpperCase()
  if (s.includes("ATIVO") || s === "ACTIVE" || s === "SIGNED") return { label: "Ativo", badge: "bg-green-100 text-green-700" }
  if (s.includes("CANCEL") || s === "CANCELLED") return { label: "Cancelado", badge: "bg-red-100 text-red-700" }
  if (s.includes("DISTRAT") || s === "RESCINDED") return { label: "Distratado", badge: "bg-orange-100 text-orange-700" }
  if (s.includes("CONCLU") || s === "COMPLETED") return { label: "Concluído", badge: "bg-blue-100 text-blue-700" }
  return { label: status ?? "—", badge: "bg-gray-100 text-gray-600" }
}

export default function ContratosVendaPage() {
  const { data: contratos = [], isLoading } = trpc.sienge.listarContratosVenda.useQuery()
  const [filtroStatus, setFiltroStatus] = useState("TODOS")

  const semSienge = !isLoading && contratos.length === 0

  const filtrados = useMemo(() => {
    if (filtroStatus === "TODOS") return contratos
    return contratos.filter(c => {
      const s = getStatusConfig(c.status).label
      if (filtroStatus === "ATIVO") return s === "Ativo"
      if (filtroStatus === "CANCELADO") return s === "Cancelado"
      if (filtroStatus === "DISTRATADO") return s === "Distratado"
      return true
    })
  }, [contratos, filtroStatus])

  const totalValor = contratos.reduce((s, c) => s + (c.totalValue ?? 0), 0)
  const totalAtivos = contratos.filter(c => getStatusConfig(c.status).label === "Ativo").length

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <FileText size={22} className="text-blue-500" />
          Contratos de Venda
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
          Contratos de venda de unidades por empreendimento
        </p>
      </div>

      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <FileText size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">Configure a integração para visualizar os contratos de venda.</p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} /> Configurar Sienge
          </Link>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      )}

      {!isLoading && contratos.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Total Contratos</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{contratos.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1 flex items-center gap-1">
                <CheckCircle size={10} /> Ativos
              </p>
              <p className="text-2xl font-bold text-green-700">{totalAtivos}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <TrendingUp size={10} /> Valor Total
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatMoeda(totalValor)}</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {["TODOS", "ATIVO", "CANCELADO", "DISTRATADO"].map(s => (
              <button key={s} type="button" onClick={() => setFiltroStatus(s)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  filtroStatus === s ? "bg-orange-500 text-white border-orange-500" : "bg-white text-[var(--text-muted)] border-border hover:border-orange-300"
                )}>
                {s === "TODOS" ? "Todos" : s === "ATIVO" ? "Ativos" : s === "CANCELADO" ? "Cancelados" : "Distratados"}
              </button>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_1fr_120px_100px_80px_36px] gap-3 px-5 py-2.5 border-b border-border bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>Cliente</span><span>Empreendimento</span><span>Unidade</span>
              <span className="text-right">Valor</span><span>Assinatura</span><span className="text-center">Status</span><span />
            </div>
            <div className="divide-y divide-border">
              {filtrados.map(c => {
                const cfg = getStatusConfig(c.status)
                return (
                  <div key={c.id} className="grid grid-cols-[2fr_1.5fr_1fr_120px_100px_80px_36px] gap-3 px-5 py-3 items-center text-sm hover:bg-muted/30">
                    <p className="font-medium text-[var(--text-primary)] truncate">{c.clientName ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{c.buildingName ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{c.unitName ?? "—"}</p>
                    <p className="text-right text-xs font-semibold text-[var(--text-primary)]">{formatMoeda(c.totalValue ?? 0)}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDate(c.signatureDate)}</p>
                    <div className="flex justify-center">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", cfg.badge)}>{cfg.label}</span>
                    </div>
                    <div className="flex justify-center">
                      <a href={`/api/sienge/pdf/extrato/${c.id}`} target="_blank" rel="noopener noreferrer"
                        title="Extrato financeiro PDF"
                        className="p-1.5 rounded border border-border text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-300 transition-all">
                        <FileDown size={12} />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {filtrados.length === 0 && <p className="text-center text-sm text-[var(--text-muted)] py-8">Nenhum contrato com esse filtro.</p>}
          <p className="text-xs text-center text-[var(--text-muted)]">{filtrados.length} de {contratos.length} contratos · Dados via Sienge</p>
        </>
      )}
    </div>
  )
}
