"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileSignature, ChevronDown, ChevronRight, Calendar, Plus, AlertTriangle } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatDataCurta, formatMoeda } from "@/lib/format"

export default function ContratosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: obraId } = use(params)
  const [expandido, setExpandido] = useState<number | null>(null)

  const utils = trpc.useUtils()
  const { data: contratos = [], isLoading } = trpc.sienge.listarContratos.useQuery({ obraId })
  const [confirmNovaM, setConfirmNovaM] = useState<{ id: number; numero: string } | null>(null)

  const { data: medicoes = [] } = trpc.sienge.listarMedicoes.useQuery(
    { contratoId: expandido! },
    { enabled: expandido !== null },
  )

  const criarMedicaoMut = trpc.sienge.criarMedicaoSupplyContract.useMutation({
    onSuccess: () => {
      if (expandido !== null) utils.sienge.listarMedicoes.invalidate({ contratoId: expandido })
      setConfirmNovaM(null)
    }
  })

  const totalContratos = contratos.reduce((s, c) => s + c.valorTotal, 0)
  const totalMedido    = contratos.reduce((s, c) => s + c.valorMedido, 0)
  const pctMedido      = totalContratos > 0 ? (totalMedido / totalContratos) * 100 : 0

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Link
        href={`/obras/${obraId}`}
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Voltar
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <FileSignature size={20} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Contratos de Suprimentos</h1>
          <p className="text-sm text-[var(--text-muted)]">{contratos.length} contrato(s) via Sienge</p>
        </div>
      </div>

      {/* KPIs */}
      {contratos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Total Contratado</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{formatMoeda(totalContratos)}</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Total Medido</p>
            <p className="text-xl font-bold text-purple-600">{formatMoeda(totalMedido)}</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">% Medido</p>
            <p className="text-xl font-bold text-orange-600">{pctMedido.toFixed(1)}%</p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min(100, pctMedido)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Lista de contratos */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))
        ) : contratos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-border rounded-xl">
            <FileSignature size={32} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhum contrato</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Configure o Sienge para ver contratos desta obra.
            </p>
          </div>
        ) : contratos.map((c) => {
          const pct = c.valorTotal > 0 ? (c.valorMedido / c.valorTotal) * 100 : 0
          const open = expandido === c.id
          return (
            <div key={c.id} className="bg-white border border-border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandido(open ? null : c.id)}
                className="w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[var(--text-muted)]">#{c.numero}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[10px] font-semibold",
                        c.status === "ATIVO" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.objeto}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{c.fornecedorNome}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><Calendar size={10} />{formatDataCurta(c.dataInicio)}</span>
                      <span>→</span>
                      <span>{formatDataCurta(c.dataFim)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-[var(--text-primary)]">{formatMoeda(c.valorTotal)}</p>
                    <p className="text-xs text-purple-600">{formatMoeda(c.valorMedido)} medido</p>
                    <p className="text-xs text-[var(--text-muted)]">{pct.toFixed(1)}%</p>
                  </div>
                  {open
                    ? <ChevronDown size={16} className="text-[var(--text-muted)] flex-shrink-0 mt-1" />
                    : <ChevronRight size={16} className="text-[var(--text-muted)] flex-shrink-0 mt-1" />
                  }
                </div>
                {/* Barra de progresso */}
                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </button>

              {/* Medições */}
              {open && (
                <div className="border-t border-border bg-slate-50/50">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Medições</span>
                    <button onClick={() => setConfirmNovaM({ id: c.id, numero: c.numero })}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-[10px] font-medium hover:bg-purple-200 transition-colors">
                      <Plus size={10} /> Nova Medição
                    </button>
                  </div>
                  {medicoes.length === 0 ? (
                    <p className="px-4 pb-3 text-xs text-[var(--text-muted)]">Nenhuma medição registrada.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {medicoes.map((m) => (
                        <div key={m.id} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                          <span className="text-[var(--text-muted)] text-xs w-16">Medição {m.numero}</span>
                          <span className="flex-1 text-xs text-[var(--text-muted)]">
                            {formatDataCurta(m.dataInicio)} → {formatDataCurta(m.dataFim)}
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[10px] font-semibold",
                            m.status === "APROVADA" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          )}>{m.status}</span>
                          <span className="font-semibold text-[var(--text-primary)]">{formatMoeda(m.valor)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Confirm Nova Medição */}
      {confirmNovaM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <AlertTriangle size={32} className="mx-auto text-purple-500" />
            <p className="font-semibold text-[var(--text-primary)]">Criar nova medição para o contrato #{confirmNovaM.numero}?</p>
            <p className="text-xs text-[var(--text-muted)]">Uma nova medição será registrada no Sienge para este contrato.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmNovaM(null)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted">Cancelar</button>
              <button onClick={async () => { await criarMedicaoMut.mutateAsync({ supplyContractId: confirmNovaM.id }) }}
                disabled={criarMedicaoMut.isPending}
                className="flex-1 bg-purple-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-purple-600 disabled:opacity-50">
                {criarMedicaoMut.isPending ? "Criando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
