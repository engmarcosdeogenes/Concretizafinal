"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { CheckSquare, Plus, Calendar, CheckCircle2, XCircle, Circle, Trash2, ClipboardCheck } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { cn } from "@/lib/utils"

function ProgressBar({ conformes, total }: { conformes: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((conformes / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-green-500" : pct >= 70 ? "bg-amber-400" : "bg-red-400")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-medium text-[var(--text-muted)] w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function ChecklistPage() {
  const params = useParams()
  const obraId = params.id as string

  const [templateFiltro, setTemplateFiltro] = useState("")

  const utils = trpc.useUtils()
  const { data: respostas = [], isLoading } = trpc.checklist.listarRespostas.useQuery({ obraId })
  const { data: templates = [] } = trpc.checklist.listarTemplates.useQuery()

  const excluir = trpc.checklist.excluirResposta.useMutation({
    onSuccess: () => { utils.checklist.listarRespostas.invalidate({ obraId }); toast.success("Checklist excluído") },
    onError: (e) => toast.error(e.message),
  })

  const respostasFiltradas = respostas.filter((r) =>
    !templateFiltro || r.templateId === templateFiltro
  )

  const total      = respostas.length
  const concluidos = respostas.filter((r) => {
    const total = r._count?.itens ?? 0
    if (total === 0) return false
    return true // se tem itens, considera que pode estar feito
  }).length

  function handleExcluir(id: string) {
    if (!confirm("Excluir este checklist? Esta ação não pode ser desfeita.")) return
    excluir.mutate({ id })
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Checklists</h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-1">
            Listas de verificação rápida por obra
          </p>
        </div>
        <Link
          href={`/obras/${obraId}/checklist/novo`}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <Plus size={16} /> Iniciar Checklist
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[12px] text-[var(--text-muted)]">Total</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{total}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-[12px] text-[var(--text-muted)]">Templates</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{templates.length}</p>
          </div>
        </div>
        <div className="hidden sm:flex bg-white rounded-2xl border border-border shadow-sm p-4 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <CheckSquare size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="text-[12px] text-[var(--text-muted)]">Este mês</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {respostas.filter(r => {
                const d = new Date(r.data)
                const now = new Date()
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              }).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTemplateFiltro("")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              !templateFiltro ? "bg-orange-500 text-white" : "bg-white border border-border text-[var(--text-muted)] hover:bg-slate-50"
            )}
          >
            Todos
          </button>
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplateFiltro(templateFiltro === t.id ? "" : t.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                templateFiltro === t.id ? "bg-orange-500 text-white" : "bg-white border border-border text-[var(--text-muted)] hover:bg-slate-50"
              )}
            >
              {t.nome}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      ) : respostasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardCheck size={28} className="text-slate-400" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)] mb-1">Nenhum checklist ainda</p>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            {templates.length === 0
              ? "Crie um template de checklist em Configurações → Checklists"
              : "Clique em \"Iniciar Checklist\" para começar"}
          </p>
          {templates.length === 0 && (
            <Link
              href="/configuracoes/checklists"
              className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              Gerenciar templates →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {respostasFiltradas.map((r) => {
            const totalItens = r._count?.itens ?? 0
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck size={18} className="text-orange-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {r.template.nome}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDataCurta(r.data)}
                      </span>
                      <span>{totalItens} {totalItens === 1 ? "item" : "itens"}</span>
                    </div>
                    {totalItens > 0 && (
                      <div className="mt-2">
                        <ProgressBar conformes={0} total={totalItens} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/obras/${obraId}/checklist/${r.id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Preencher
                    </Link>
                    <button
                      onClick={() => handleExcluir(r.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Link para gerenciar templates */}
      {templates.length > 0 && (
        <p className="text-xs text-[var(--text-muted)] text-center">
          <Link href="/configuracoes/checklists" className="text-orange-500 hover:text-orange-600 transition-colors">
            Gerenciar templates de checklist
          </Link>
        </p>
      )}
    </div>
  )
}
