"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  FileSignature,
  Settings,
  Search,
  TrendingUp,
  FileText,
  DollarSign,
  BarChart2,
  Download,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda, formatDataCurta } from "@/lib/format"
import { cn } from "@/lib/utils"

type Contrato = {
  id: number
  number: string
  supplierId: number
  supplierName: string
  buildingId: number
  buildingName: string
  object: string
  startDate: string
  endDate: string
  totalValue: number
  measuredValue: number
  measuredPercentage: number
  status: string
}

function StatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toUpperCase()

  if (s === "ACTIVE" || s === "ATIVO" || s === "A")
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
        Ativo
      </span>
    )
  if (s === "FINISHED" || s === "CONCLUIDO" || s === "ENCERRADO" || s === "F")
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
        Concluído
      </span>
    )
  if (s === "CANCELLED" || s === "CANCELADO" || s === "C")
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
        Cancelado
      </span>
    )
  if (s === "SUSPENDED" || s === "SUSPENSO")
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
        Suspenso
      </span>
    )
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
      {status || "—"}
    </span>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent))
  const color =
    clamped >= 90
      ? "bg-green-500"
      : clamped >= 50
        ? "bg-blue-500"
        : clamped >= 25
          ? "bg-amber-500"
          : "bg-gray-300"

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[var(--text-muted)] w-9 text-right">
        {clamped.toFixed(0)}%
      </span>
    </div>
  )
}

async function exportarExcel(contratos: Contrato[]) {
  const xlsx = await import("xlsx")
  const rows = contratos.map((c) => ({
    Número: c.number,
    Objeto: c.object,
    Fornecedor: c.supplierName,
    Obra: c.buildingName,
    "Data Início": c.startDate ? formatDataCurta(c.startDate) : "",
    "Data Fim": c.endDate ? formatDataCurta(c.endDate) : "",
    "Valor Total": c.totalValue,
    "Valor Medido": c.measuredValue,
    "% Medido": c.measuredPercentage,
    Status: c.status,
  }))
  const ws = xlsx.utils.json_to_sheet(rows)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, "Contratos")
  xlsx.writeFile(wb, "contratos_suprimentos.xlsx")
}

export default function ContratosSuprimentosPage() {
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")

  const { data: contratos = [], isLoading } =
    trpc.sienge.listarTodosSupplyContracts.useQuery()

  const semSienge = !isLoading && contratos.length === 0

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase()
    return contratos.filter((c) => {
      const matchBusca =
        !busca ||
        c.number.toLowerCase().includes(q) ||
        c.object.toLowerCase().includes(q) ||
        c.supplierName.toLowerCase().includes(q) ||
        c.buildingName.toLowerCase().includes(q)
      const matchStatus =
        !filtroStatus ||
        (c.status ?? "").toUpperCase() === filtroStatus.toUpperCase()
      return matchBusca && matchStatus
    })
  }, [contratos, busca, filtroStatus])

  const totalContratado = filtrados.reduce((s, c) => s + (c.totalValue ?? 0), 0)
  const totalMedido = filtrados.reduce((s, c) => s + (c.measuredValue ?? 0), 0)
  const percentGeral =
    totalContratado > 0 ? (totalMedido / totalContratado) * 100 : 0

  const statusUnicos = Array.from(
    new Set(contratos.map((c) => c.status).filter(Boolean))
  ).sort()

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileSignature size={22} className="text-orange-500" />
            Contratos de Suprimentos
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">
              Sienge
            </span>
            Contratos de compra e fornecimento sincronizados
          </p>
        </div>
        {contratos.length > 0 && (
          <button
            type="button"
            onClick={() => exportarExcel(filtrados)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-xs font-medium text-[var(--text-primary)] hover:border-orange-300 transition-all"
          >
            <Download size={14} /> Exportar Excel
          </button>
        )}
      </div>

      {/* KPI Cards */}
      {!semSienge && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1 flex items-center gap-1">
              <FileText size={10} /> Total de Contratos
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {filtrados.length}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {contratos.length} no total
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 mb-1 flex items-center gap-1">
              <DollarSign size={10} /> Valor Contratado
            </p>
            <p className="text-xl font-bold text-blue-700">
              {formatMoeda(totalContratado)}
            </p>
            <p className="text-xs text-blue-500 mt-0.5">contratos filtrados</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1 flex items-center gap-1">
              <TrendingUp size={10} /> Valor Medido
            </p>
            <p className="text-xl font-bold text-green-700">
              {formatMoeda(totalMedido)}
            </p>
            <p className="text-xs text-green-500 mt-0.5">executado até hoje</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-600 mb-1 flex items-center gap-1">
              <BarChart2 size={10} /> % Medido Geral
            </p>
            <p className="text-xl font-bold text-orange-700">
              {percentGeral.toFixed(1)}%
            </p>
            <p className="text-xs text-orange-500 mt-0.5">do total contratado</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {!semSienge && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white border border-border rounded-xl px-4 py-3">
          <div className="flex-1 relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por número, objeto, fornecedor ou obra..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-orange-400"
            />
          </div>

          {statusUnicos.length > 0 && (
            <div className="flex items-center border border-border rounded-lg h-9 px-3 bg-white text-sm">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-transparent border-none outline-none cursor-pointer text-[var(--text-primary)] text-sm"
              >
                <option value="">Todos os status</option>
                {statusUnicos.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      )}

      {/* Empty state — Sienge not configured */}
      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <FileSignature
            size={40}
            className="mx-auto mb-3 text-[var(--text-muted)] opacity-30"
          />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Sienge não configurado
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            Configure a integração com o Sienge para visualizar os contratos de
            suprimentos.
          </p>
          <Link
            href="/configuracoes/integracoes"
            className="btn-orange inline-flex gap-2"
          >
            <Settings size={14} /> Configurar Sienge
          </Link>
        </div>
      )}

      {/* Table */}
      {!isLoading && filtrados.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Número
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Objeto
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Fornecedor
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Obra
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Vigência
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right">
                    Valor Total
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right">
                    Valor Medido
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-36">
                    % Medido
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrados.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--text-primary)]">
                      {c.number || `#${c.id}`}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">
                        {c.object || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] truncate max-w-[160px]">
                      {c.supplierName || "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] truncate max-w-[140px]">
                      {c.buildingName || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                      {c.startDate ? formatDataCurta(c.startDate) : "—"}
                      {c.endDate && (
                        <span className="text-[var(--text-muted)]/60">
                          {" "}
                          até{" "}
                        </span>
                      )}
                      {c.endDate ? formatDataCurta(c.endDate) : ""}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                      {formatMoeda(c.totalValue ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-muted)] whitespace-nowrap">
                      {formatMoeda(c.measuredValue ?? 0)}
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <ProgressBar percent={c.measuredPercentage ?? 0} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              {filtrados.length} contrato{filtrados.length !== 1 ? "s" : ""}
              {busca || filtroStatus ? " (filtrado)" : ""}
            </span>
            <span>Dados sincronizados via Sienge</span>
          </div>
        </div>
      )}

      {/* Empty state — no results for filter */}
      {!isLoading && contratos.length > 0 && filtrados.length === 0 && (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Search
            size={32}
            className="mx-auto mb-3 text-[var(--text-muted)] opacity-30"
          />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Nenhum contrato encontrado
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Tente ajustar os filtros de busca.
          </p>
        </div>
      )}
    </div>
  )
}
