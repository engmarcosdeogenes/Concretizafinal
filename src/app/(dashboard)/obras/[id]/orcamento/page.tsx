"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ChevronDown, ChevronRight, BarChart3, Settings, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function DesvioChip({ desvio }: { desvio: number }) {
  if (desvio > 10) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">
      <TrendingUp size={10} />+{desvio.toFixed(1)}%
    </span>
  )
  if (desvio > 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
      <TrendingUp size={10} />+{desvio.toFixed(1)}%
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
      <TrendingDown size={10} />{desvio.toFixed(1)}%
    </span>
  )
}

function OrcamentoCard({ item }: { item: {
  orcamento: { id: number; name: string; totalCost?: number | null }
  itens: { id: number; code?: string | null; description: string; unit?: string | null; quantity?: number | null; unitPrice?: number | null; totalPrice?: number | null; group?: string | null }[]
}}) {
  const [open, setOpen] = useState(false)
  const total = item.orcamento.totalCost ?? 0

  // Agrupar itens por grupo
  const grupos = item.itens.reduce<Record<string, typeof item.itens>>((acc, it) => {
    const g = it.group ?? "Geral"
    if (!acc[g]) acc[g] = []
    acc[g].push(it)
    return acc
  }, {})

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {open ? <ChevronDown size={16} className="text-[var(--text-muted)] flex-shrink-0" /> : <ChevronRight size={16} className="text-[var(--text-muted)] flex-shrink-0" />}
          <span className="font-semibold text-sm text-[var(--text-primary)] truncate">{item.orcamento.name}</span>
          <span className="text-xs text-[var(--text-muted)] flex-shrink-0">({item.itens.length} itens)</span>
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)] flex-shrink-0">{fmt(total)}</span>
      </button>

      {open && (
        <div className="border-t border-border">
          {Object.entries(grupos).map(([grupo, itens]) => (
            <div key={grupo}>
              {Object.keys(grupos).length > 1 && (
                <div className="px-4 py-2 bg-muted/60 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  {grupo}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-t border-border">
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-20">Código</th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Descrição</th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-16">Un.</th>
                      <th className="text-right px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-20">Qtd</th>
                      <th className="text-right px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28">Preço Unit.</th>
                      <th className="text-right px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item, i) => (
                      <tr key={item.id} className={cn("border-t border-border", i % 2 === 1 ? "bg-muted/30" : "")}>
                        <td className="px-4 py-2.5 text-xs text-[var(--text-muted)] font-mono">{item.code ?? "—"}</td>
                        <td className="px-4 py-2.5 text-[var(--text-primary)]">{item.description}</td>
                        <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{item.unit ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right text-[var(--text-primary)]">{item.quantity != null ? item.quantity.toLocaleString("pt-BR") : "—"}</td>
                        <td className="px-4 py-2.5 text-right text-[var(--text-primary)]">{item.unitPrice != null ? fmt(item.unitPrice) : "—"}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">{item.totalPrice != null ? fmt(item.totalPrice) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {item.itens.length === 0 && (
            <p className="px-4 py-3 text-sm text-[var(--text-muted)] italic">Nenhum item nesta estimativa.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function OrcamentoPage() {
  const params = useParams()
  const obraId = params.id as string

  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const { data = [], isLoading, error } = trpc.sienge.listarOrcamento.useQuery({ obraId })
  const { data: resumo } = trpc.financeiro.resumo.useQuery({ obraId })

  const totalOrcado = data.reduce((s, d) => s + (d.orcamento.totalCost ?? 0), 0)
  const gastoReal = resumo?.totalDespesas ?? 0
  const desvio = totalOrcado > 0 ? ((gastoReal - totalOrcado) / totalOrcado) * 100 : 0
  const pctGasto = totalOrcado > 0 ? Math.min(100, (gastoReal / totalOrcado) * 100) : 0

  if (!obra?.siengeId) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <BarChart3 size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Obra não conectada ao Sienge</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Para visualizar o orçamento, conecte esta obra a um empreendimento no Sienge.
          </p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex">
            <Settings size={14} />
            Configurar integração
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        <div className="h-28 bg-muted rounded-2xl animate-pulse" />
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">Erro ao carregar orçamento do Sienge.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <BarChart3 size={20} className="text-orange-500 flex-shrink-0" />
            Orçamento
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Estimativas do Sienge</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/obras/${obraId}/orcamento/planilhas`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted/50 transition-colors text-[var(--text-primary)]">
            <Settings size={14} />
            Planilhas
          </Link>
          <Link href={`/obras/${obraId}/orcamento/insumos`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted/50 transition-colors text-[var(--text-primary)]">
            <Settings size={14} />
            Insumos
          </Link>
          <Link href={`/obras/${obraId}/orcamento/budget`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted/50 transition-colors text-[var(--text-primary)]">
            <Settings size={14} />
            Budget
          </Link>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Orçado Total</p>
          <p className="text-lg font-bold text-[var(--text-primary)]">{fmt(totalOrcado)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Gasto Real</p>
          <p className="text-lg font-bold text-[var(--text-primary)]">{fmt(gastoReal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Desvio</p>
          <div className="flex items-center gap-2">
            {totalOrcado > 0 ? <DesvioChip desvio={desvio} /> : <span className="text-sm text-[var(--text-muted)]">—</span>}
          </div>
        </div>
      </div>

      {/* Barra de progresso do gasto */}
      {totalOrcado > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)]">Gasto vs Orçado</span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">{pctGasto.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", pctGasto >= 100 ? "bg-red-500" : pctGasto >= 80 ? "bg-amber-400" : "bg-green-500")}
              style={{ width: `${Math.min(100, pctGasto)}%` }}
            />
          </div>
        </div>
      )}

      {/* Gráfico por grupo */}
      {data.length > 0 && (() => {
        const gruposMap: Record<string, number> = {}
        data.flatMap(d => d.itens).forEach(item => {
          const g = item.group ?? "Geral"
          gruposMap[g] = (gruposMap[g] ?? 0) + (item.totalPrice ?? 0)
        })
        const chartData = Object.entries(gruposMap)
          .map(([grupo, orcado]) => ({ grupo: grupo.length > 16 ? grupo.slice(0, 16) + "…" : grupo, orcado }))
          .sort((a, b) => b.orcado - a.orcado)
          .slice(0, 10)
        if (chartData.length <= 1) return null
        return (
          <div className="bg-white rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Orçamento por Grupo</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="grupo" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${((v as number) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                <Bar dataKey="orcado" name="Orçado" radius={[3, 3, 0, 0]} fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      })()}

      {/* Estimativas */}
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <BarChart3 size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Nenhuma estimativa de orçamento encontrada no Sienge.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <OrcamentoCard key={item.orcamento.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
