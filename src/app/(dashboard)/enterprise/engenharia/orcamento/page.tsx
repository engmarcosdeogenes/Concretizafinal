"use client"

import { useState, Fragment } from "react"
import {
  BarChart3,
  Plus,
  Search,
  Loader2,
  Package,
  ChevronDown,
  ChevronRight,
  X,
  Pencil,
  DollarSign,
  Hash,
  Layers,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { toast } from "sonner"

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const fmt = (v?: number | null) =>
  v != null
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "---"

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface OrcamentoItem {
  orcamento: { id: number; name: string; totalCost: number }
  itens: Array<Record<string, unknown>>
}

interface PlanilhaItem {
  code?: string
  description?: string
  unit?: string
  quantity?: number
  unitPrice?: number
  totalPrice?: number
  id?: number
  [key: string]: unknown
}

interface ObraOption {
  id: string
  name?: string
  [key: string]: unknown
}

/* ------------------------------------------------------------------ */
/*  Add / Edit Insumo Modal                                           */
/* ------------------------------------------------------------------ */

function InsumoModal({
  estimationId,
  resourceId,
  onClose,
}: {
  estimationId: number
  resourceId?: number
  onClose: () => void
}) {
  const utils = trpc.useUtils()

  const { data: existing, isLoading: loadingExisting } =
    trpc.sienge.buscarInsumoOrcamento.useQuery(
      { estimationId, resourceId: resourceId! },
      { enabled: !!resourceId },
    )

  const addMutation = trpc.sienge.adicionarInsumoOrcamento.useMutation({
    onSuccess: () => {
      toast.success("Insumo adicionado com sucesso")
      utils.sienge.listarOrcamento.invalidate()
      onClose()
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = trpc.sienge.atualizarInsumoOrcamento.useMutation({
    onSuccess: () => {
      toast.success("Insumo atualizado com sucesso")
      utils.sienge.listarOrcamento.invalidate()
      onClose()
    },
    onError: (err) => toast.error(err.message),
  })

  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [initialized, setInitialized] = useState(false)

  if (resourceId && existing && !initialized) {
    const e = existing as Record<string, unknown>
    setDescription(String(e.description ?? ""))
    setQuantity(String(e.quantity ?? ""))
    setUnit(String(e.unit ?? ""))
    setUnitPrice(String(e.unitPrice ?? ""))
    setInitialized(true)
  }

  const isBusy = addMutation.isPending || updateMutation.isPending

  const handleSubmit = () => {
    const payload: Record<string, unknown> = {
      description,
      quantity: Number(quantity),
      unit,
      unitPrice: Number(unitPrice),
    }

    if (resourceId) {
      updateMutation.mutate({ estimationId, resourceId, payload })
    } else {
      addMutation.mutate({ estimationId, payload })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X size={16} />
        </button>

        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">
          {resourceId ? "Editar Insumo" : "Adicionar Insumo"}
        </h3>

        {resourceId && loadingExisting ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Descricao" value={description} onChange={setDescription} />
            <Field label="Quantidade" value={quantity} onChange={setQuantity} type="number" />
            <Field label="Unidade" value={unit} onChange={setUnit} />
            <Field label="Preco Unitario" value={unitPrice} onChange={setUnitPrice} type="number" />

            <button
              onClick={handleSubmit}
              disabled={isBusy || !description}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {isBusy && <Loader2 size={14} className="animate-spin" />}
              {resourceId ? "Salvar Alteracoes" : "Adicionar"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-violet-300"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Estimativa card (collapsible)                                     */
/* ------------------------------------------------------------------ */

function EstimativaCard({ item }: { item: OrcamentoItem }) {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<{ estimationId: number; resourceId?: number } | null>(null)

  const { data: planilhas, isLoading: loadingPlanilhas } =
    trpc.sienge.listarPlanilhasOrcamento.useQuery(
      { estimationId: item.orcamento.id },
      { enabled: open },
    )

  return (
    <>
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {item.orcamento.name}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Total: {fmt(item.orcamento.totalCost)} &middot; {item.itens.length} iten(s)
              </p>
            </div>
          </div>
          {open ? <ChevronDown size={16} className="text-[var(--text-muted)]" /> : <ChevronRight size={16} className="text-[var(--text-muted)]" />}
        </button>

        {open && (
          <div className="border-t border-border px-5 py-4 space-y-4">
            {/* Add Insumo button */}
            <div className="flex justify-end">
              <button
                onClick={() => setModal({ estimationId: item.orcamento.id })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
              >
                <Plus size={12} /> Adicionar Insumo
              </button>
            </div>

            {/* Planilhas */}
            {loadingPlanilhas ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {planilhas && Array.isArray(planilhas) && planilhas.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-2">
                      Planilhas
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-[var(--text-muted)]">Codigo</th>
                            <th className="text-left px-3 py-2 font-semibold text-[var(--text-muted)]">Descricao</th>
                            <th className="text-left px-3 py-2 font-semibold text-[var(--text-muted)]">Unidade</th>
                            <th className="text-right px-3 py-2 font-semibold text-[var(--text-muted)]">Qtd</th>
                            <th className="text-right px-3 py-2 font-semibold text-[var(--text-muted)]">P. Unit.</th>
                            <th className="text-right px-3 py-2 font-semibold text-[var(--text-muted)]">Total</th>
                            <th className="px-3 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(planilhas as PlanilhaItem[]).map((p, idx) => (
                            <tr key={p.id ?? idx} className="hover:bg-muted/20">
                              <td className="px-3 py-2 font-mono text-[var(--text-primary)]">{String(p.code ?? "—")}</td>
                              <td className="px-3 py-2 text-[var(--text-primary)]">{String(p.description ?? "—")}</td>
                              <td className="px-3 py-2 text-[var(--text-muted)]">{String(p.unit ?? "—")}</td>
                              <td className="px-3 py-2 text-right text-[var(--text-primary)]">
                                {p.quantity != null ? Number(p.quantity).toLocaleString("pt-BR") : "—"}
                              </td>
                              <td className="px-3 py-2 text-right text-[var(--text-primary)]">{fmt(p.unitPrice as number | undefined)}</td>
                              <td className="px-3 py-2 text-right font-semibold text-[var(--text-primary)]">{fmt(p.totalPrice as number | undefined)}</td>
                              <td className="px-3 py-2 text-center">
                                {p.id != null && (
                                  <button
                                    onClick={() =>
                                      setModal({ estimationId: item.orcamento.id, resourceId: Number(p.id) })
                                    }
                                    className="text-[var(--text-muted)] hover:text-violet-600 transition-colors"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {modal && (
        <InsumoModal
          estimationId={modal.estimationId}
          resourceId={modal.resourceId}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Bulk Data Section                                                 */
/* ------------------------------------------------------------------ */

function BulkSection() {
  const [activeTab, setActiveTab] = useState<"items" | "budgets" | "resources">("items")
  const [open, setOpen] = useState(false)

  const { data: bulkItems, isLoading: loadingItems } =
    trpc.sienge.listarBulkBudgetItems.useQuery({}, { enabled: open && activeTab === "items" })
  const { data: bulkBudgets, isLoading: loadingBudgets } =
    trpc.sienge.listarBulkBusinessBudgets.useQuery({}, { enabled: open && activeTab === "budgets" })
  const { data: bulkResources, isLoading: loadingResources } =
    trpc.sienge.listarBulkBuildingResources.useQuery({}, { enabled: open && activeTab === "resources" })

  const isLoading =
    (activeTab === "items" && loadingItems) ||
    (activeTab === "budgets" && loadingBudgets) ||
    (activeTab === "resources" && loadingResources)

  const currentData =
    activeTab === "items"
      ? bulkItems
      : activeTab === "budgets"
        ? bulkBudgets
        : bulkResources

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "items", label: "Budget Items" },
    { key: "budgets", label: "Business Budgets" },
    { key: "resources", label: "Building Resources" },
  ]

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
            <Layers size={16} className="text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Dados em Lote (Bulk)</p>
            <p className="text-xs text-[var(--text-muted)]">
              Budget Items, Business Budgets, Building Resources
            </p>
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-[var(--text-muted)]" /> : <ChevronRight size={16} className="text-[var(--text-muted)]" />}
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === t.key
                    ? "bg-violet-600 text-white"
                    : "bg-muted/40 text-[var(--text-muted)] hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : currentData && Array.isArray(currentData) && currentData.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    {Object.keys((currentData as Record<string, unknown>[])[0]).slice(0, 6).map((key) => (
                      <th key={key} className="text-left px-3 py-2 font-semibold text-[var(--text-muted)]">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(currentData as Record<string, unknown>[]).slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      {Object.values(row).slice(0, 6).map((val, ci) => (
                        <td key={ci} className="px-3 py-2 text-[var(--text-primary)] truncate max-w-[200px]">
                          {val != null ? String(val) : "---"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] text-center py-6">Nenhum dado disponivel.</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function OrcamentoPage() {
  const [obraId, setObraId] = useState<string>("")
  const [search, setSearch] = useState("")

  const { data: obras = [], isLoading: loadingObras } = trpc.obra.listar.useQuery()

  const { data: orcamentos = [], isLoading: loadingOrcamento } =
    trpc.sienge.listarOrcamento.useQuery(
      { obraId },
      { enabled: !!obraId },
    )

  const orcamentoList = orcamentos as OrcamentoItem[]

  const filtered = search
    ? orcamentoList.filter((o) =>
        o.orcamento.name.toLowerCase().includes(search.toLowerCase()),
      )
    : orcamentoList

  const totalOrcado = orcamentoList.reduce((s, o) => s + (o.orcamento.totalCost ?? 0), 0)
  const totalInsumos = orcamentoList.reduce((s, o) => s + (o.itens?.length ?? 0), 0)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <BarChart3 size={18} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Gestao de Orcamento &mdash; Sienge
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Estimativas, insumos e planilhas de orcamento
          </p>
        </div>
      </div>

      {/* Obra selector */}
      <div className="bg-white rounded-2xl border border-border shadow-sm px-5 py-4">
        <label className="block text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
          Selecione a Obra
        </label>
        {loadingObras ? (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Loader2 size={14} className="animate-spin" /> Carregando obras...
          </div>
        ) : (
          <select
            value={obraId}
            onChange={(e) => setObraId(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-violet-300"
          >
            <option value="">-- Escolha uma obra --</option>
            {(obras as ObraOption[]).map((o) => (
              <option key={o.id} value={o.id}>
                {o.name ?? `Obra ${o.id}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content after obra selected */}
      {obraId && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard
              label="Total Orcado"
              value={loadingOrcamento ? "..." : fmt(totalOrcado)}
              icon={DollarSign}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <KpiCard
              label="Qtd Estimativas"
              value={loadingOrcamento ? "..." : String(orcamentoList.length)}
              icon={Hash}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
            />
            <KpiCard
              label="Qtd Insumos"
              value={loadingOrcamento ? "..." : String(totalInsumos)}
              icon={Package}
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar estimativa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-white pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Estimativas list */}
          {loadingOrcamento ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BarChart3 size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Nenhuma estimativa encontrada
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {search
                  ? "Tente outro termo de busca."
                  : "Esta obra ainda nao possui orcamentos no Sienge."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <EstimativaCard key={item.orcamento.id} item={item} />
              ))}
            </div>
          )}

          {/* Bulk data section */}
          <BulkSection />
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared components                                                 */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}
