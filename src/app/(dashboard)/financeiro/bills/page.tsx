"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { FileText, Settings, Filter, Plus, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"
import BillDetailDrawer from "./BillDetailDrawer"

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase()
  if (s.includes("PAG") || s === "PAID")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Pago</span>
  if (s.includes("VENCID") || s === "OVERDUE")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Vencido</span>
  if (s.includes("CANCEL"))
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">Cancelado</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Aberto</span>
}

function defaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 90)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const PAGE_SIZE = 20

export default function BillsPage() {
  const defaults = defaultDateRange()
  const [startDate, setStartDate] = useState(defaults.startDate)
  const [endDate, setEndDate] = useState(defaults.endDate)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null)

  const { data, isLoading } = trpc.sienge.listarBillsByChangeDate.useQuery(
    { startDate, endDate, offset: page * PAGE_SIZE, limit: PAGE_SIZE },
    { keepPreviousData: true }
  )

  const bills: any[] = Array.isArray(data) ? data : (data as any)?.results ?? (data as any)?.data ?? []

  const filtered = useMemo(() => {
    if (!search.trim()) return bills
    const q = search.toLowerCase()
    return bills.filter((b: any) =>
      (b.creditorName ?? "").toLowerCase().includes(q) ||
      (b.documentNumber ?? "").toLowerCase().includes(q) ||
      String(b.id ?? "").includes(q)
    )
  }, [bills, search])

  const semDados = !isLoading && bills.length === 0

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={22} className="text-orange-500" />
            Gestao de Titulos (Bills)
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
            Detalhes, parcelas, impostos, anexos e categorias
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-[var(--text-muted)]" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--text-muted)] font-semibold">De:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(0) }}
            className="h-8 px-3 border border-border rounded-lg text-xs text-[var(--text-primary)] bg-white outline-none focus:border-orange-400"
          />
          <label className="text-xs text-[var(--text-muted)] font-semibold">Ate:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(0) }}
            className="h-8 px-3 border border-border rounded-lg text-xs text-[var(--text-primary)] bg-white outline-none focus:border-orange-400"
          />
        </div>
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar credor, doc, ID..."
            className="h-8 pl-8 pr-3 border border-border rounded-lg text-xs text-[var(--text-primary)] bg-white outline-none focus:border-orange-400 w-56"
          />
        </div>
      </div>

      {/* Empty state */}
      {semDados && (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <FileText size={36} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhum titulo encontrado</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
            Verifique o periodo de datas ou a configuracao do Sienge.
          </p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} />
            Configurar Sienge
          </Link>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-orange-500" />
        </div>
      )}

      {/* Table */}
      {!isLoading && filtered.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_1fr_130px_110px_90px] gap-3 px-4 py-2.5 bg-muted border-b border-border text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            <span>ID</span>
            <span>Credor</span>
            <span>Documento</span>
            <span>Vencimento</span>
            <span className="text-right">Valor</span>
            <span className="text-center">Status</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((b: any) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBillId(b.id)}
                className="grid grid-cols-[60px_1fr_1fr_130px_110px_90px] gap-3 px-4 py-3 items-center text-sm w-full text-left hover:bg-orange-50/50 transition-colors cursor-pointer"
              >
                <span className="text-xs text-[var(--text-muted)] font-mono">#{b.id}</span>
                <p className="font-medium text-[var(--text-primary)] truncate">
                  {b.creditorName ?? "—"}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate font-mono">
                  {b.documentNumber ?? "—"}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {fmtDate(b.dueDate)}
                </p>
                <p className="text-right font-semibold text-[var(--text-primary)]">
                  {formatMoeda(b.amount ?? 0)}
                </p>
                <div className="flex justify-center">
                  <StatusBadge status={b.status} />
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50">
            <p className="text-xs text-[var(--text-muted)]">
              Pagina {page + 1} &middot; {filtered.length} resultado(s)
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={bills.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedBillId !== null && (
        <BillDetailDrawer billId={selectedBillId} onClose={() => setSelectedBillId(null)} />
      )}
    </div>
  )
}
