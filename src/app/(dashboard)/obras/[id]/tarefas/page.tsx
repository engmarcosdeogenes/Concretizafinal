"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ChevronDown, ChevronRight, ListTodo, Settings, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

function formatDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function BarraProgresso({ pct, className }: { pct: number; className?: string }) {
  const cor = pct >= 100 ? "bg-green-500" : pct >= 70 ? "bg-amber-400" : pct > 0 ? "bg-blue-500" : "bg-slate-200"
  return (
    <div className={cn("h-1.5 bg-muted rounded-full overflow-hidden flex-1", className)}>
      <div className={cn("h-full rounded-full transition-all", cor)} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

function TarefaRow({ tarefa, isLast }: { tarefa: { id: number; wbsCode?: string | null; name: string; percentageExecuted?: number | null; percentagePlanned?: number | null; startDate?: string | null; endDate?: string | null }; isLast: boolean }) {
  const exec = tarefa.percentageExecuted ?? 0
  const plan = tarefa.percentagePlanned ?? 0
  const hoje = new Date()
  const fimDate = tarefa.endDate ? new Date(tarefa.endDate) : null
  const atrasada = fimDate && fimDate < hoje && exec < 100
  const noProgress = exec === 0 && atrasada

  const statusColor = exec >= plan
    ? "text-green-600"
    : exec > 0
    ? "text-amber-600"
    : noProgress ? "text-red-600" : "text-slate-400"

  return (
    <tr className={cn("border-t border-border text-sm", isLast ? "" : "")}>
      <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs font-mono w-20">{tarefa.wbsCode ?? "—"}</td>
      <td className="px-4 py-2.5 text-[var(--text-primary)]">{tarefa.name}</td>
      <td className="px-4 py-2.5 w-48">
        <div className="flex items-center gap-2">
          <BarraProgresso pct={exec} />
          <span className={cn("text-xs font-semibold w-10 text-right", statusColor)}>{exec}%</span>
        </div>
        {plan > 0 && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Previsto: {plan}%</p>}
      </td>
      <td className="px-4 py-2.5 text-xs text-[var(--text-muted)] w-32">{formatDate(tarefa.startDate)}</td>
      <td className="px-4 py-2.5 text-xs w-32">
        <span className={cn(atrasada ? "text-red-600 font-semibold" : "text-[var(--text-muted)]")}>
          {formatDate(tarefa.endDate)}
        </span>
      </td>
    </tr>
  )
}

function ProjetoCard({ item }: { item: { projeto: { id: number; name: string; percentageExecuted?: number | null }; tarefas: { id: number; wbsCode?: string | null; name: string; percentageExecuted?: number | null; percentagePlanned?: number | null; startDate?: string | null; endDate?: string | null }[] } }) {
  const [open, setOpen] = useState(true)
  const pct = item.projeto.percentageExecuted ?? 0

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {open ? <ChevronDown size={16} className="text-[var(--text-muted)] flex-shrink-0" /> : <ChevronRight size={16} className="text-[var(--text-muted)] flex-shrink-0" />}
          <span className="font-semibold text-sm text-[var(--text-primary)] truncate">{item.projeto.name}</span>
          <span className="text-xs text-[var(--text-muted)] flex-shrink-0">({item.tarefas.length} tarefas)</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 w-36">
          <BarraProgresso pct={pct} />
          <span className="text-xs font-semibold text-[var(--text-primary)] w-8 text-right">{pct}%</span>
        </div>
      </button>

      {open && item.tarefas.length > 0 && (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-20">WBS</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-48">Progresso</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-32">Início</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-32">Fim</th>
              </tr>
            </thead>
            <tbody>
              {item.tarefas.map((t, i) => (
                <TarefaRow key={t.id} tarefa={t} isLast={i === item.tarefas.length - 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && item.tarefas.length === 0 && (
        <p className="px-4 py-3 text-sm text-[var(--text-muted)] italic border-t border-border">
          Nenhuma tarefa neste projeto.
        </p>
      )}
    </div>
  )
}

export default function TarefasPage() {
  const params = useParams()
  const obraId = params.id as string

  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const { data = [], isLoading, error } = trpc.sienge.listarTarefas.useQuery({ obraId })

  // Métricas rápidas
  const totalTarefas = data.reduce((s, d) => s + d.tarefas.length, 0)
  const tarefasConcluidas = data.reduce((s, d) => s + d.tarefas.filter(t => (t.percentageExecuted ?? 0) >= 100).length, 0)
  const tarefasAtrasadas = data.reduce((s, d) => s + d.tarefas.filter(t => {
    const fimDate = t.endDate ? new Date(t.endDate) : null
    return fimDate && fimDate < new Date() && (t.percentageExecuted ?? 0) < 100
  }).length, 0)

  if (!obra?.siengeId) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <ListTodo size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Obra não conectada ao Sienge</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Para visualizar o planejamento de tarefas, conecte esta obra a um empreendimento no Sienge.
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
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">Erro ao carregar tarefas do Sienge.</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <ListTodo size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Nenhum planejamento encontrado</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Nenhum projeto de planejamento foi encontrado para esta obra no Sienge.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <ListTodo size={20} className="text-orange-500 flex-shrink-0" />
            Planejamento de Tarefas
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Sincronizado com o Sienge</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <ListTodo size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{totalTarefas}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Concluídas</p>
            <p className="text-xl font-bold text-green-600">{tarefasConcluidas}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Atrasadas</p>
            <p className="text-xl font-bold text-red-500">{tarefasAtrasadas}</p>
          </div>
        </div>
      </div>

      {/* Projetos */}
      <div className="space-y-3">
        {data.map((item) => (
          <ProjetoCard key={item.projeto.id} item={item} />
        ))}
      </div>
    </div>
  )
}
