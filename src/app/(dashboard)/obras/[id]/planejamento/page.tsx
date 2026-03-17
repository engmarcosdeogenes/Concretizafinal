"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ClipboardList, ListTodo, Package, ChevronDown, ChevronRight,
  Plus, Upload, AlertCircle, ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  useTarefasSienge,
  useTarefasObra,
  useInserirTarefasPlanilha,
} from "@/hooks/usePlanejamento"

type Tab = "tarefas" | "sienge"

export default function PlanejamentoPage() {
  const params = useParams()
  const obraId = params.id as string
  const [tab, setTab] = useState<Tab>("tarefas")

  const { tarefas, isLoading: loadingTarefas } = useTarefasObra(obraId)
  const { projetos, isLoading: loadingSienge, hasSienge } = useTarefasSienge(obraId)
  const inserirTarefas = useInserirTarefasPlanilha()

  // KPIs das tarefas internas
  const flat = tarefas.flatMap((t: { filhos?: unknown[] }) => {
    const filhos = (t as Record<string, unknown>).filhos as Array<Record<string, unknown>> | undefined
    return [t, ...(filhos ?? [])]
  }) as Array<Record<string, unknown>>
  const total = flat.length
  const concluidas = flat.filter(t => t.status === "CONCLUIDO").length
  const emAndamento = flat.filter(t => t.status === "EM_ANDAMENTO").length
  const avgPct = total > 0
    ? Math.round(flat.reduce((s, t) => s + (Number(t.percentual) || 0), 0) / total)
    : 0

  // KPIs Sienge
  const totalTarefasSienge = projetos.reduce(
    (s: number, p: { tarefas?: unknown[] }) => s + ((p.tarefas as unknown[])?.length ?? 0),
    0,
  )

  const [projetoAberto, setProjetoAberto] = useState<Record<number, boolean>>({})
  function toggleProjeto(id: number) {
    setProjetoAberto(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ClipboardList size={20} className="text-orange-500" />
            Planejamento
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Tarefas, materiais e integração Sienge
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/obras/${obraId}/tarefas`}
            className="btn-ghost min-h-[44px] flex-shrink-0 flex items-center gap-2"
          >
            <ListTodo size={14} />
            Gerenciar Tarefas
          </Link>
          <Link
            href={`/obras/${obraId}/materiais`}
            className="btn-ghost min-h-[44px] flex-shrink-0 flex items-center gap-2"
          >
            <Package size={14} />
            Materiais
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Tarefas", value: total, color: "text-blue-600", bg: "bg-blue-50", sub: "WBS interno" },
          { label: "Concluídas", value: concluidas, color: "text-green-600", bg: "bg-green-50", sub: "100% executadas" },
          { label: "Em andamento", value: emAndamento, color: "text-amber-600", bg: "bg-amber-50", sub: "execução parcial" },
          { label: "Avanço médio", value: `${avgPct}%`, color: "text-purple-600", bg: "bg-purple-50", sub: "percentual geral" },
          { label: "Sienge", value: totalTarefasSienge, color: "text-indigo-600", bg: "bg-indigo-50", sub: hasSienge ? "tarefas importadas" : "não conectado" },
        ].map(({ label, value, color, bg, sub }) => (
          <div key={label} className={cn("rounded-2xl border border-border shadow-sm p-4", bg)}>
            <p className={cn("text-2xl font-extrabold", color)}>{value}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{label}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: "tarefas" as Tab, label: "Tarefas WBS" },
          { key: "sienge" as Tab, label: "Tarefas Sienge" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer",
              tab === key
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-[var(--text-primary)] border-border hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Tarefas internas WBS */}
      {tab === "tarefas" && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted border-b border-border text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            <span className="w-14 flex-shrink-0">WBS</span>
            <span className="flex-1">Nome / Serviço</span>
            <span className="w-24 text-right flex-shrink-0">Qtd</span>
            <span className="w-20 text-right flex-shrink-0">Avanço</span>
            <span className="w-24 flex-shrink-0 text-center">Status</span>
          </div>

          {loadingTarefas && (
            <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando…</div>
          )}

          {!loadingTarefas && tarefas.length === 0 && (
            <div className="py-14 text-center">
              <ListTodo size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
              <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma tarefa cadastrada</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Acesse &quot;Gerenciar Tarefas&quot; para criar ou importar
              </p>
            </div>
          )}

          {(tarefas as Array<Record<string, unknown>>).map((t) => {
            const STATUS_COLORS: Record<string, string> = {
              CONCLUIDO: "bg-green-50 text-green-700 border-green-200",
              EM_ANDAMENTO: "bg-blue-50 text-blue-700 border-blue-200",
              SUSPENSO: "bg-amber-50 text-amber-700 border-amber-200",
              NAO_INICIADO: "bg-slate-50 text-slate-500 border-slate-200",
            }
            const status = String(t.status ?? "NAO_INICIADO")
            return (
              <div
                key={String(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 border-b border-border hover:bg-muted/30 transition-colors"
              >
                <span className="text-[11px] font-mono text-[var(--text-muted)] w-14 flex-shrink-0">
                  {String(t.codigo ?? "—")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {String(t.nome)}
                  </p>
                  {t.setor != null && (
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{String(t.setor)}</p>
                  )}
                </div>
                <span className="text-xs text-[var(--text-muted)] w-24 text-right flex-shrink-0">
                  {String(t.quantidadeTotal ?? 0)} {String(t.unidade ?? "")}
                </span>
                <span className="text-xs font-semibold w-20 text-right flex-shrink-0 text-[var(--text-primary)]">
                  {Math.round(Number(t.percentual) || 0)}%
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border w-24 text-center flex-shrink-0",
                    STATUS_COLORS[status] ?? STATUS_COLORS.NAO_INICIADO,
                  )}
                >
                  {status === "CONCLUIDO" ? "Concluído" : status === "EM_ANDAMENTO" ? "Em andamento" : status === "SUSPENSO" ? "Suspenso" : "Não iniciado"}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Tarefas Sienge */}
      {tab === "sienge" && (
        <div className="space-y-3">
          {!hasSienge && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Integração Sienge não configurada</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Configure o ID Sienge nas configurações da obra para importar tarefas de planejamento.
                </p>
              </div>
            </div>
          )}

          {loadingSienge && hasSienge && (
            <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando tarefas do Sienge…</div>
          )}

          {hasSienge && !loadingSienge && projetos.length === 0 && (
            <div className="bg-white rounded-2xl border border-border shadow-sm py-14 text-center">
              <ClipboardList size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
              <p className="text-sm font-medium text-[var(--text-primary)]">Nenhum projeto encontrado no Sienge</p>
            </div>
          )}

          {(projetos as unknown as Array<{ projeto: Record<string, unknown>; tarefas: Array<Record<string, unknown>> }>).map((item) => {
            const proj = item.projeto
            const id = Number(proj.id)
            const aberto = projetoAberto[id] ?? false
            return (
              <div key={id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleProjeto(id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {String(proj.name ?? proj.nome ?? `Projeto #${id}`)}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-semibold border border-indigo-200">
                      {item.tarefas.length} tarefas
                    </span>
                  </div>
                </button>

                {aberto && (
                  <div className="border-t border-border">
                    {item.tarefas.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhuma tarefa neste projeto.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {item.tarefas.slice(0, 50).map((t, idx) => (
                          <div key={idx} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                            <span className="font-mono text-[11px] text-[var(--text-muted)] w-16 flex-shrink-0">
                              {String(t.id ?? idx + 1)}
                            </span>
                            <span className="flex-1 text-[var(--text-primary)] truncate">
                              {String(t.description ?? t.nome ?? t.name ?? "—")}
                            </span>
                          </div>
                        ))}
                        {item.tarefas.length > 50 && (
                          <p className="px-5 py-2 text-xs text-[var(--text-muted)] text-center">
                            … e mais {item.tarefas.length - 50} tarefas
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
