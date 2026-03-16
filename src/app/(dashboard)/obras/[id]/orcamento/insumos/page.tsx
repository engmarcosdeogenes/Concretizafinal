"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, Plus, Search, Edit2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc/client"
import { useOrcamento, useAdicionarInsumo, useAtualizarInsumo } from "@/hooks/useOrcamento"
import { cn } from "@/lib/utils"

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function InsumosOrcamentoPage() {
  const params = useParams()
  const obraId = params.id as string
  const { obra, orcamentos, isLoading, hasSienge } = useOrcamento(obraId)

  const [selectedEstimation, setSelectedEstimation] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)

  // Auto-select first estimation
  if (selectedEstimation == null && orcamentos.length > 0) {
    setSelectedEstimation(orcamentos[0].orcamento.id)
  }

  const selectedOrc = orcamentos.find(o => o.orcamento.id === selectedEstimation)
  const itens = selectedOrc?.itens ?? []
  const filtered = search.trim()
    ? itens.filter(i =>
        i.description.toLowerCase().includes(search.toLowerCase()) ||
        (i.code ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : itens

  if (!hasSienge) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <Package size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Obra não conectada ao Sienge</h2>
          <p className="text-sm text-[var(--text-muted)]">Conecte a obra ao Sienge para gerenciar insumos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/obras/${obraId}/orcamento`} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
              <Package size={20} className="text-orange-500 flex-shrink-0" />
              Insumos do Orçamento
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">Gerenciar insumos e recursos das estimativas</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(v => !v)}
          className="btn-orange inline-flex items-center gap-1.5 text-sm"
        >
          <Plus size={14} />
          Adicionar Insumo
        </button>
      </div>

      {/* Seletor de estimativa */}
      {orcamentos.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wide">Estimativa:</label>
            <select
              value={selectedEstimation ?? ""}
              onChange={(e) => setSelectedEstimation(Number(e.target.value))}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              {orcamentos.map((o) => (
                <option key={o.orcamento.id} value={o.orcamento.id}>
                  {o.orcamento.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-sm bg-white"
            />
          </div>
        </div>
      )}

      {/* Formulário adicionar */}
      {showAddForm && selectedEstimation != null && (
        <AddInsumoForm
          estimationId={selectedEstimation}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}
        </div>
      )}

      {/* Tabela de insumos */}
      {!isLoading && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-20">Código</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Descrição</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-14">Un.</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-20">Qtd</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28">Preço Unit.</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28">Total</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-16">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <InsumoRow
                    key={item.id}
                    item={item}
                    estimationId={selectedEstimation!}
                    even={i % 2 === 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-2.5 text-xs text-[var(--text-muted)]">
            {filtered.length} insumo{filtered.length !== 1 ? "s" : ""}
            {search && ` (filtrado de ${itens.length})`}
          </div>
        </div>
      )}

      {!isLoading && filtered.length === 0 && !showAddForm && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <Package size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">
            {search ? "Nenhum insumo encontrado para essa busca." : "Nenhum insumo cadastrado nesta estimativa."}
          </p>
        </div>
      )}
    </div>
  )
}

function InsumoRow({ item, estimationId, even }: {
  item: { id: number; code?: string | null; description: string; unit?: string | null; quantity?: number | null; unitPrice?: number | null; totalPrice?: number | null }
  estimationId: number
  even: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [auxCode, setAuxCode] = useState(item.code ?? "")
  const atualizar = useAtualizarInsumo()

  const handleSave = async () => {
    try {
      await atualizar.mutateAsync({
        estimationId,
        resourceId: item.id,
        payload: { auxiliaryCode: auxCode },
      })
      toast.success("Insumo atualizado")
      setEditing(false)
    } catch {
      toast.error("Erro ao atualizar insumo")
    }
  }

  return (
    <tr className={cn("border-t border-border", even ? "bg-muted/30" : "")}>
      <td className="px-4 py-2.5 text-xs text-[var(--text-muted)] font-mono">
        {editing ? (
          <input
            value={auxCode}
            onChange={(e) => setAuxCode(e.target.value)}
            className="w-full border border-border rounded px-1.5 py-0.5 text-xs"
            autoFocus
          />
        ) : (
          item.code ?? "—"
        )}
      </td>
      <td className="px-4 py-2.5 text-[var(--text-primary)]">{item.description}</td>
      <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{item.unit ?? "—"}</td>
      <td className="px-4 py-2.5 text-right text-[var(--text-primary)]">
        {item.quantity != null ? item.quantity.toLocaleString("pt-BR") : "—"}
      </td>
      <td className="px-4 py-2.5 text-right text-[var(--text-primary)]">
        {item.unitPrice != null ? fmt(item.unitPrice) : "—"}
      </td>
      <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">
        {item.totalPrice != null ? fmt(item.totalPrice) : "—"}
      </td>
      <td className="px-4 py-2.5 text-center">
        {editing ? (
          <div className="flex items-center justify-center gap-1">
            <button type="button" onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded" disabled={atualizar.isPending}>
              <Save size={14} />
            </button>
            <button type="button" onClick={() => setEditing(false)} className="p-1 text-red-500 hover:bg-red-50 rounded">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="p-1 text-[var(--text-muted)] hover:text-orange-500 hover:bg-orange-50 rounded transition-colors">
            <Edit2 size={14} />
          </button>
        )}
      </td>
    </tr>
  )
}

function AddInsumoForm({ estimationId, onClose }: { estimationId: number; onClose: () => void }) {
  const [description, setDescription] = useState("")
  const [unit, setUnit] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const adicionar = useAdicionarInsumo()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error("Descrição é obrigatória")
      return
    }
    try {
      await adicionar.mutateAsync({
        estimationId,
        payload: {
          description: description.trim(),
          unit: unit.trim() || undefined,
          quantity: quantity ? parseFloat(quantity) : undefined,
          unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        },
      })
      toast.success("Insumo adicionado")
      onClose()
    } catch {
      toast.error("Erro ao adicionar insumo")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Adicionar Insumo</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-[var(--text-muted)] font-semibold block mb-1">Descrição *</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="Ex: Cimento CP-II"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] font-semibold block mb-1">Unidade</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="Ex: kg"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] font-semibold block mb-1">Quantidade</label>
          <input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] font-semibold block mb-1">Preço Unitário</label>
          <input
            type="number"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="0,00"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={adicionar.isPending} className="btn-orange inline-flex items-center gap-1.5 text-sm">
          <Plus size={14} />
          {adicionar.isPending ? "Salvando..." : "Adicionar"}
        </button>
      </div>
    </form>
  )
}
