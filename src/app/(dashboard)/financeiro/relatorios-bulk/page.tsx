"use client"

import { useState } from "react"
import {
  BarChart3, Loader2, Search, Download, Building2,
  Wallet, ArrowDownUp, FileText, Users, Calculator,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

/* ─── Types ──────────────────────────────────────────────────── */

type ReportType =
  | "accountBalances"
  | "bankMovements"
  | "billPayables"
  | "receivables"
  | "customerExtract"
  | "invoiceItens"

interface ReportTab {
  id: ReportType
  label: string
  icon: typeof Wallet
  description: string
}

const TABS: ReportTab[] = [
  { id: "accountBalances", label: "Saldos Contábeis", icon: Calculator, description: "Saldos de contas contábeis por centro de custo" },
  { id: "bankMovements", label: "Movimentos Bancários", icon: ArrowDownUp, description: "Movimentações de caixa e bancos" },
  { id: "billPayables", label: "Parcelas a Pagar", icon: Wallet, description: "Parcelas de títulos a pagar" },
  { id: "receivables", label: "Parcelas a Receber", icon: BarChart3, description: "Parcelas de títulos a receber" },
  { id: "customerExtract", label: "Extrato de Clientes", icon: Users, description: "Histórico de extrato por cliente" },
  { id: "invoiceItens", label: "Itens de NF", icon: FileText, description: "Itens de notas fiscais" },
]

/* ─── Filtros ─────────────────────────────────────────────────── */

function DateRangeFilter({
  startDate, endDate, onStartChange, onEndChange,
}: {
  startDate: string; endDate: string
  onStartChange: (v: string) => void; onEndChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-[var(--text-muted)]">De:</label>
      <input
        type="date"
        value={startDate}
        onChange={e => onStartChange(e.target.value)}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm"
      />
      <label className="text-sm text-[var(--text-muted)]">Até:</label>
      <input
        type="date"
        value={endDate}
        onChange={e => onEndChange(e.target.value)}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm"
      />
    </div>
  )
}

/* ─── Saldos Contábeis ──────────────────────────────────────── */

function AccountBalancesReport() {
  const [companyId, setCompanyId] = useState("")
  const [costCenterId, setCostCenterId] = useState("")
  const [referenceDate, setReferenceDate] = useState("")
  const [enabled, setEnabled] = useState(false)

  const query = trpc.sienge.listarBulkAccountBalances.useQuery(
    {
      companyId: companyId ? Number(companyId) : undefined,
      costCenterId: costCenterId ? Number(costCenterId) : undefined,
      referenceDate: referenceDate || undefined,
    },
    { enabled, retry: false },
  )

  const rows = (query.data as Record<string, unknown>[] | undefined) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Empresa</label>
          <input type="number" placeholder="ID" value={companyId} onChange={e => setCompanyId(e.target.value)}
            className="w-24 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Centro de Custo</label>
          <input type="number" placeholder="ID" value={costCenterId} onChange={e => setCostCenterId(e.target.value)}
            className="w-24 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Data Referência</label>
          <input type="date" value={referenceDate} onChange={e => setReferenceDate(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm" />
        </div>
        <button onClick={() => setEnabled(true)}
          className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90">
          <Search className="h-4 w-4" /> Consultar
        </button>
      </div>

      {query.isPending && (
        <div className="flex items-center justify-center py-12 text-[var(--text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando saldos contábeis...
        </div>
      )}

      {enabled && !query.isPending && rows.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">Nenhum resultado encontrado.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-surface)]">
              <tr>
                {Object.keys(rows[0]).map(key => (
                  <th key={key} className="px-3 py-2 text-left font-medium text-[var(--text-muted)] whitespace-nowrap">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-[var(--bg-surface-hover)]">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-3 py-2 whitespace-nowrap">
                      {typeof val === "number" ? formatMoeda(val) : String(val ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── Relatório Genérico com filtro de período ──────────────── */

function DateRangeReport({
  hookName, hasCustomerId,
}: {
  hookName: "listarBulkBankMovements" | "listarBulkBillPayablesInstallments" | "listarBulkReceivableInstallments" | "listarBulkCustomerExtractHistory" | "listarBulkInvoiceItens"
  hasCustomerId?: boolean
}) {
  const [companyId, setCompanyId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [enabled, setEnabled] = useState(false)

  const input: Record<string, unknown> = {
    companyId: companyId ? Number(companyId) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }
  if (hasCustomerId) {
    input.customerId = customerId ? Number(customerId) : undefined
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = (trpc.sienge as any)[hookName].useQuery(input, { enabled, retry: false })

  const rows = (query.data as Record<string, unknown>[] | undefined) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Empresa</label>
          <input type="number" placeholder="ID" value={companyId} onChange={e => setCompanyId(e.target.value)}
            className="w-24 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm" />
        </div>
        {hasCustomerId && (
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Cliente</label>
            <input type="number" placeholder="ID" value={customerId} onChange={e => setCustomerId(e.target.value)}
              className="w-24 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm" />
          </div>
        )}
        <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
        <button onClick={() => setEnabled(true)}
          className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90">
          <Search className="h-4 w-4" /> Consultar
        </button>
      </div>

      {query.isPending && (
        <div className="flex items-center justify-center py-12 text-[var(--text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando dados...
        </div>
      )}

      {enabled && !query.isPending && rows.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">Nenhum resultado encontrado.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-surface)]">
              <tr>
                {Object.keys(rows[0]).map(key => (
                  <th key={key} className="px-3 py-2 text-left font-medium text-[var(--text-muted)] whitespace-nowrap">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-[var(--bg-surface-hover)]">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-3 py-2 whitespace-nowrap">
                      {typeof val === "number" ? formatMoeda(val) : String(val ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── Componente de Export CSV ───────────────────────────────── */

function ExportCsvButton({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return null

  function handleExport() {
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(";"),
      ...rows.map(row => headers.map(h => String(row[h] ?? "")).join(";")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "relatorio-bulk.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleExport}
      className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--bg-surface-hover)]">
      <Download className="h-4 w-4" /> Exportar CSV
    </button>
  )
}

/* ─── Página Principal ──────────────────────────────────────── */

export default function RelatoriosBulkPage() {
  const [activeTab, setActiveTab] = useState<ReportType>("accountBalances")

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Relatórios Financeiros Bulk</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Consultas em lote de dados financeiros do Sienge para análise e exportação.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-t-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab description */}
      <p className="text-sm text-[var(--text-muted)]">
        {TABS.find(t => t.id === activeTab)?.description}
      </p>

      {/* Tab content */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        {activeTab === "accountBalances" && <AccountBalancesReport />}
        {activeTab === "bankMovements" && (
          <DateRangeReport hookName="listarBulkBankMovements" />
        )}
        {activeTab === "billPayables" && (
          <DateRangeReport hookName="listarBulkBillPayablesInstallments" />
        )}
        {activeTab === "receivables" && (
          <DateRangeReport hookName="listarBulkReceivableInstallments" />
        )}
        {activeTab === "customerExtract" && (
          <DateRangeReport hookName="listarBulkCustomerExtractHistory" hasCustomerId />
        )}
        {activeTab === "invoiceItens" && (
          <DateRangeReport hookName="listarBulkInvoiceItens" />
        )}
      </div>
    </div>
  )
}
