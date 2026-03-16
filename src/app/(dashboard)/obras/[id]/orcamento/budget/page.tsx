"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, DollarSign, Search, Building2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { useBulkBudgetItems, useBulkBusinessBudgets, useBulkBuildingResources } from "@/hooks/useOrcamento"
import { cn } from "@/lib/utils"

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

type TabId = "budget-items" | "business-budgets" | "building-resources"

const TABS: { id: TabId; label: string }[] = [
  { id: "budget-items", label: "Itens de Orçamento" },
  { id: "business-budgets", label: "Orçamentos Empresariais" },
  { id: "building-resources", label: "Recursos da Obra" },
]

export default function BudgetBulkPage() {
  const params = useParams()
  const obraId = params.id as string
  const [tab, setTab] = useState<TabId>("budget-items")
  const [search, setSearch] = useState("")

  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const buildingId = obra?.siengeId ? parseInt(obra.siengeId) : null

  const { items, isLoading: loadingItems } = useBulkBudgetItems(tab === "budget-items" ? buildingId : null)
  const { budgets, isLoading: loadingBudgets } = useBulkBusinessBudgets(tab === "business-budgets" ? buildingId : null)
  const { resources, isLoading: loadingResources } = useBulkBuildingResources(tab === "building-resources" ? buildingId : null)

  const isLoading = loadingItems || loadingBudgets || loadingResources

  if (!obra?.siengeId) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <Building2 size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Obra não conectada ao Sienge</h2>
          <p className="text-sm text-[var(--text-muted)]">Conecte a obra para acessar dados de orçamento em bulk.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/obras/${obraId}/orcamento`} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <DollarSign size={20} className="text-orange-500 flex-shrink-0" />
            Budget — Dados Bulk
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Itens de orçamento, budgets empresariais e recursos da obra</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setSearch("") }}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              tab === t.id ? "bg-white text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-sm bg-white"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />)}
        </div>
      )}

      {/* Tab content */}
      {!isLoading && tab === "budget-items" && (
        <BulkDataTable
          data={items as Array<Record<string, unknown>>}
          search={search}
          columns={["id", "description", "unit", "quantity", "unitPrice", "totalPrice"]}
          headers={["ID", "Descrição", "Un.", "Qtd", "Preço Unit.", "Total"]}
        />
      )}

      {!isLoading && tab === "business-budgets" && (
        <BulkDataTable
          data={budgets as Array<Record<string, unknown>>}
          search={search}
          columns={["id", "description", "value", "status"]}
          headers={["ID", "Descrição", "Valor", "Status"]}
        />
      )}

      {!isLoading && tab === "building-resources" && (
        <BulkDataTable
          data={resources as Array<Record<string, unknown>>}
          search={search}
          columns={["id", "description", "unit", "quantity", "unitPrice"]}
          headers={["ID", "Descrição", "Un.", "Qtd", "Preço Unit."]}
        />
      )}
    </div>
  )
}

function BulkDataTable({ data, search, columns, headers }: {
  data: Array<Record<string, unknown>>
  search: string
  columns: string[]
  headers: string[]
}) {
  const lowerSearch = search.toLowerCase()
  const filtered = search.trim()
    ? data.filter(row =>
        columns.some(col => String(row[col] ?? "").toLowerCase().includes(lowerSearch))
      )
    : data

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
        <DollarSign size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-sm text-[var(--text-muted)]">
          {search ? "Nenhum resultado para essa busca." : "Nenhum dado disponível."}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              {headers.map((h, i) => (
                <th key={i} className={cn(
                  "px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide",
                  i >= 3 ? "text-right" : "text-left",
                )}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((row, i) => (
              <tr key={i} className={cn("border-t border-border", i % 2 === 1 ? "bg-muted/30" : "")}>
                {columns.map((col, ci) => {
                  const val = row[col]
                  const display = val == null ? "—" : typeof val === "number"
                    ? (col.toLowerCase().includes("price") || col === "value" || col === "totalPrice")
                      ? fmt(val)
                      : val.toLocaleString("pt-BR")
                    : String(val)
                  return (
                    <td key={ci} className={cn(
                      "px-4 py-2.5",
                      ci >= 3 ? "text-right" : "text-left",
                      ci === 0 ? "text-xs text-[var(--text-muted)] font-mono" : "text-[var(--text-primary)]",
                    )}>
                      {display}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-4 py-2.5 text-xs text-[var(--text-muted)]">
        {filtered.length > 100 ? `Mostrando 100 de ${filtered.length}` : `${filtered.length} registro${filtered.length !== 1 ? "s" : ""}`}
        {search && data.length !== filtered.length && ` (filtrado de ${data.length})`}
      </div>
    </div>
  )
}
