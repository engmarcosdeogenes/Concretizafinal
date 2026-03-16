"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileSpreadsheet, ChevronDown, ChevronRight } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { useOrcamento, useOrcamentoPlanilhas } from "@/hooks/useOrcamento"
import { cn } from "@/lib/utils"

export default function PlanilhasOrcamentoPage() {
  const params = useParams()
  const obraId = params.id as string
  const { obra, orcamentos, isLoading: loadingOrc, hasSienge } = useOrcamento(obraId)

  const [selectedEstimation, setSelectedEstimation] = useState<number | null>(null)
  const { planilhas, isLoading: loadingPlan } = useOrcamentoPlanilhas(selectedEstimation)

  // Auto-select first estimation
  if (selectedEstimation == null && orcamentos.length > 0) {
    setSelectedEstimation(orcamentos[0].orcamento.id)
  }

  if (!hasSienge) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <FileSpreadsheet size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Obra não conectada ao Sienge</h2>
          <p className="text-sm text-[var(--text-muted)]">Conecte a obra ao Sienge para ver planilhas de orçamento.</p>
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
            <FileSpreadsheet size={20} className="text-orange-500 flex-shrink-0" />
            Planilhas de Orçamento
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Planilhas vinculadas às estimativas do Sienge</p>
        </div>
      </div>

      {/* Seletor de estimativa */}
      {orcamentos.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wide">Estimativa:</label>
          <select
            value={selectedEstimation ?? ""}
            onChange={(e) => setSelectedEstimation(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            {orcamentos.map((o) => (
              <option key={o.orcamento.id} value={o.orcamento.id}>
                {o.orcamento.name} (ID: {o.orcamento.id})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading */}
      {(loadingOrc || loadingPlan) && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Planilhas */}
      {!loadingPlan && planilhas.length === 0 && selectedEstimation != null && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <FileSpreadsheet size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Nenhuma planilha encontrada para esta estimativa.</p>
        </div>
      )}

      {planilhas.length > 0 && (
        <div className="space-y-2">
          {(planilhas as Array<Record<string, unknown>>).map((p, i) => (
            <PlanilhaRow key={i} planilha={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function PlanilhaRow({ planilha }: { planilha: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  const name = (planilha.description ?? planilha.name ?? `Planilha ${planilha.id ?? ""}`) as string
  const uid = planilha.uid as string | undefined

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        {open ? <ChevronDown size={16} className="text-[var(--text-muted)]" /> : <ChevronRight size={16} className="text-[var(--text-muted)]" />}
        <FileSpreadsheet size={16} className="text-orange-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-[var(--text-primary)] truncate flex-1">{name}</span>
        {uid && <span className="text-xs text-[var(--text-muted)] font-mono">{uid}</span>}
      </button>
      {open && (
        <div className="border-t border-border p-4">
          <pre className="text-xs text-[var(--text-muted)] whitespace-pre-wrap break-all">
            {JSON.stringify(planilha, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
