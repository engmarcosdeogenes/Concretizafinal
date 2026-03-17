"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  BookOpen,
  Settings,
  Search,
  Download,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda, formatDataCurta } from "@/lib/format"
import { cn } from "@/lib/utils"

function getDefaultDates() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  return { start: fmt(firstDay), end: fmt(lastDay) }
}

function DebitoCreditoBadge({ tipo }: { tipo?: "D" | "C" | string }) {
  if (tipo === "D")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
        <TrendingDown size={8} /> Débito
      </span>
    )
  if (tipo === "C")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
        <TrendingUp size={8} /> Crédito
      </span>
    )
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
      —
    </span>
  )
}

type Lancamento = {
  id?: number
  companyId?: number
  accountCode?: string
  costCenterCode?: string
  description?: string
  value?: number
  date?: string
  documentNumber?: string
  debitOrCredit?: "D" | "C"
  [key: string]: unknown
}

async function exportarExcel(lancamentos: Lancamento[], periodo: string) {
  const xlsx = await import("xlsx")
  const rows = lancamentos.map((l) => ({
    Data: l.date ? formatDataCurta(l.date) : "",
    "Tipo": l.debitOrCredit === "D" ? "Débito" : l.debitOrCredit === "C" ? "Crédito" : "",
    "Conta": l.accountCode ?? "",
    "Centro de Custo": l.costCenterCode ?? "",
    "Nº Documento": l.documentNumber ?? "",
    Descrição: l.description ?? "",
    "Valor (R$)": l.value ?? 0,
  }))
  const ws = xlsx.utils.json_to_sheet(rows)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, "Lançamentos")
  xlsx.writeFile(wb, `lancamentos_contabeis_${periodo}.xlsx`)
}

const POR_PAGINA = 50

export default function ContabilidadePage() {
  const defaults = getDefaultDates()
  const [dataInicio, setDataInicio] = useState(defaults.start)
  const [dataFim, setDataFim] = useState(defaults.end)
  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<"" | "D" | "C">("")
  const [pagina, setPagina] = useState(1)

  // listarEmpresas to get the companyId
  const { data: empresas = [] } = trpc.sienge.listarEmpresas.useQuery()
  const companyId = empresas[0]?.id ?? 0

  const enabled = companyId > 0
  const { data: lancamentos = [], isLoading } =
    trpc.sienge.listarLancamentosContabeis.useQuery(
      {
        companyId,
        startDate: dataInicio || undefined,
        endDate: dataFim || undefined,
      },
      { enabled }
    )

  const semSienge = !isLoading && !enabled && empresas.length === 0

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase()
    return lancamentos.filter((l) => {
      const matchBusca =
        !busca ||
        (l.description ?? "").toLowerCase().includes(q) ||
        (l.accountCode ?? "").toLowerCase().includes(q) ||
        (l.documentNumber ?? "").toLowerCase().includes(q) ||
        (l.costCenterCode ?? "").toLowerCase().includes(q)
      const matchTipo = !filtroTipo || l.debitOrCredit === filtroTipo
      return matchBusca && matchTipo
    })
  }, [lancamentos, busca, filtroTipo])

  const totalDebito = filtrados
    .filter((l) => l.debitOrCredit === "D")
    .reduce((s, l) => s + (l.value ?? 0), 0)
  const totalCredito = filtrados
    .filter((l) => l.debitOrCredit === "C")
    .reduce((s, l) => s + (l.value ?? 0), 0)
  const totalGeral = filtrados.reduce((s, l) => s + (l.value ?? 0), 0)

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const periodoLabel = `${dataInicio}_${dataFim}`

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen size={22} className="text-violet-500" />
            Lançamentos Contábeis
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">
              Sienge
            </span>
            Consulta e exportação de lançamentos do razão contábil
          </p>
        </div>
        {filtrados.length > 0 && (
          <button
            type="button"
            onClick={() => exportarExcel(filtrados, periodoLabel)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-xs font-medium text-[var(--text-primary)] hover:border-orange-300 transition-all"
          >
            <Download size={14} /> Exportar Excel
          </button>
        )}
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-4 bg-white border border-border rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
            De:
          </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => { setDataInicio(e.target.value); setPagina(1) }}
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:border-orange-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
            Até:
          </label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => { setDataFim(e.target.value); setPagina(1) }}
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:border-orange-400"
          />
        </div>

        <div className="hidden md:block w-px h-5 bg-border" />

        <div className="flex-1 relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar descrição, conta..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-orange-400"
          />
        </div>

        <div className="flex items-center border border-border rounded-lg h-9 px-3 bg-white text-sm">
          <select
            value={filtroTipo}
            onChange={(e) => { setFiltroTipo(e.target.value as "" | "D" | "C"); setPagina(1) }}
            className="bg-transparent border-none outline-none cursor-pointer text-[var(--text-primary)] text-sm"
          >
            <option value="">Déb. e Créd.</option>
            <option value="D">Débitos</option>
            <option value="C">Créditos</option>
          </select>
        </div>
      </div>

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

      {/* Empty — Sienge not configured */}
      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <BookOpen
            size={40}
            className="mx-auto mb-3 text-[var(--text-muted)] opacity-30"
          />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Sienge não configurado
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            Configure a integração com o Sienge para acessar os lançamentos
            contábeis.
          </p>
          <Link
            href="/configuracoes/integracoes"
            className="btn-orange inline-flex gap-2"
          >
            <Settings size={14} /> Configurar Sienge
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      {!isLoading && enabled && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1 flex items-center gap-1">
              <FileText size={10} /> Total de Lançamentos
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {filtrados.length}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {lancamentos.length} no período
            </p>
          </div>

          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 mb-1 flex items-center gap-1">
              <DollarSign size={10} /> Valor Total
            </p>
            <p className="text-xl font-bold text-violet-700">
              {formatMoeda(totalGeral)}
            </p>
            <p className="text-xs text-violet-500 mt-0.5">soma dos lançamentos</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600 mb-1 flex items-center gap-1">
              <TrendingDown size={10} /> Total Débitos
            </p>
            <p className="text-xl font-bold text-red-700">
              {formatMoeda(totalDebito)}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              {filtrados.filter((l) => l.debitOrCredit === "D").length} lançamentos
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1 flex items-center gap-1">
              <TrendingUp size={10} /> Total Créditos
            </p>
            <p className="text-xl font-bold text-green-700">
              {formatMoeda(totalCredito)}
            </p>
            <p className="text-xs text-green-500 mt-0.5">
              {filtrados.filter((l) => l.debitOrCredit === "C").length} lançamentos
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && enabled && filtrados.length > 0 && (
        <>
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Data
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Conta
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Centro de Custo
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Nº Documento
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Descrição
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginados.map((l, i) => (
                    <tr
                      key={l.id ?? i}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {l.date ? formatDataCurta(l.date) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <DebitoCreditoBadge tipo={l.debitOrCredit} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">
                        {l.accountCode || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                        {l.costCenterCode || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                        {l.documentNumber || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className={cn(
                            "text-sm truncate max-w-[280px]",
                            l.description
                              ? "text-[var(--text-primary)]"
                              : "text-[var(--text-muted)]"
                          )}
                        >
                          {l.description || "—"}
                        </p>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-semibold whitespace-nowrap",
                          l.debitOrCredit === "D"
                            ? "text-red-600"
                            : l.debitOrCredit === "C"
                              ? "text-green-600"
                              : "text-[var(--text-primary)]"
                        )}
                      >
                        {formatMoeda(l.value ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>
                {filtrados.length} lançamento{filtrados.length !== 1 ? "s" : ""}
                {busca || filtroTipo ? " (filtrado)" : ""}
              </span>
              <span>Dados via Sienge · Empresa ID: {companyId}</span>
            </div>
          </div>

          {/* Pagination */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-[var(--text-muted)]">
                Mostrando {(pagina - 1) * POR_PAGINA + 1}–
                {Math.min(pagina * POR_PAGINA, filtrados.length)} de{" "}
                {filtrados.length} lançamentos
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(1)}
                  disabled={pagina === 1}
                  className="px-2 py-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  «
                </button>
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="p-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from(
                  { length: Math.min(5, totalPaginas) },
                  (_, i) => {
                    const start = Math.max(
                      1,
                      Math.min(pagina - 2, totalPaginas - 4)
                    )
                    const pg = start + i
                    return (
                      <button
                        key={pg}
                        onClick={() => setPagina(pg)}
                        className={cn(
                          "w-8 h-7 text-xs rounded-lg border transition-colors",
                          pg === pagina
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {pg}
                      </button>
                    )
                  }
                )}
                <button
                  onClick={() =>
                    setPagina((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={pagina === totalPaginas}
                  className="p-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setPagina(totalPaginas)}
                  disabled={pagina === totalPaginas}
                  className="px-2 py-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty — no data for period */}
      {!isLoading && enabled && lancamentos.length === 0 && (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <BookOpen
            size={32}
            className="mx-auto mb-3 text-[var(--text-muted)] opacity-30"
          />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Nenhum lançamento encontrado
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Não há lançamentos contábeis para o período selecionado.
          </p>
        </div>
      )}

      {/* Empty — filtered */}
      {!isLoading && enabled && lancamentos.length > 0 && filtrados.length === 0 && (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Search
            size={32}
            className="mx-auto mb-3 text-[var(--text-muted)] opacity-30"
          />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Nenhum resultado para o filtro
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Tente ajustar os filtros de busca ou tipo de lançamento.
          </p>
        </div>
      )}
    </div>
  )
}
