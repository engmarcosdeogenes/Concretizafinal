"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, AlertTriangle, ShieldAlert, Star, Gauge, DollarSign, Leaf, Circle, Search, CheckCircle2, XCircle } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataLonga } from "@/lib/format"

type TipoOcorrencia    = "SEGURANCA" | "QUALIDADE" | "PRAZO" | "CUSTO" | "AMBIENTAL" | "OUTRO"
type StatusOcorrencia  = "ABERTA" | "EM_ANALISE" | "RESOLVIDA" | "FECHADA"

const TIPO_MAP: Record<TipoOcorrencia, { label: string; cls: string; Icon: React.ElementType }> = {
  SEGURANCA: { label: "Segurança",  cls: "bg-red-50 text-red-700 border border-red-200",        Icon: ShieldAlert },
  QUALIDADE: { label: "Qualidade",  cls: "bg-blue-50 text-blue-700 border border-blue-200",     Icon: Star },
  PRAZO:     { label: "Prazo",      cls: "bg-amber-50 text-amber-700 border border-amber-200",  Icon: Gauge },
  CUSTO:     { label: "Custo",      cls: "bg-purple-50 text-purple-700 border border-purple-200",Icon: DollarSign },
  AMBIENTAL: { label: "Ambiental",  cls: "bg-green-50 text-green-700 border border-green-200",  Icon: Leaf },
  OUTRO:     { label: "Outro",      cls: "bg-slate-50 text-slate-600 border border-slate-200",  Icon: Circle },
}

const STATUS_MAP: Record<StatusOcorrencia, { label: string; cls: string }> = {
  ABERTA:     { label: "Aberta",     cls: "bg-red-50 text-red-700 border border-red-200" },
  EM_ANALISE: { label: "Em Análise", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  RESOLVIDA:  { label: "Resolvida",  cls: "bg-green-50 text-green-700 border border-green-200" },
  FECHADA:    { label: "Fechada",    cls: "bg-slate-50 text-slate-600 border border-slate-200" },
}

const PRIORIDADE_LABEL: Record<number, string> = { 1: "Baixa", 2: "Média", 3: "Alta" }
const PRIORIDADE_CLS:   Record<number, string> = {
  1: "bg-slate-50 text-slate-600 border border-slate-200",
  2: "bg-amber-50 text-amber-700 border border-amber-200",
  3: "bg-red-50 text-red-700 border border-red-200",
}

export default function OcorrenciaDetalhePage() {
  const params        = useParams()
  const obraId        = params.id as string
  const ocorrenciaId  = params.ocorrenciaId as string

  const utils = trpc.useUtils()

  const { data: oc, isLoading, error } = trpc.ocorrencia.buscarPorId.useQuery({ id: ocorrenciaId })

  const atualizarStatus = trpc.ocorrencia.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.ocorrencia.buscarPorId.invalidate({ id: ocorrenciaId })
      utils.ocorrencia.listar.invalidate({ obraId })
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Carregando ocorrência...</p>
      </div>
    )
  }

  if (error || !oc) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">Ocorrência não encontrada.</p>
        <Link href={`/obras/${obraId}/ocorrencias`} className="text-sm text-orange-500 mt-2 inline-block cursor-pointer">
          ← Voltar para lista
        </Link>
      </div>
    )
  }

  const tipo      = TIPO_MAP[oc.tipo as TipoOcorrencia] ?? TIPO_MAP.OUTRO
  const statusCls = STATUS_MAP[oc.status as StatusOcorrencia]?.cls ?? STATUS_MAP.ABERTA.cls
  const mutating  = atualizarStatus.isPending

  // Status actions
  const nextActions: { label: string; status: StatusOcorrencia; cls: string }[] = []
  if (oc.status === "ABERTA")     nextActions.push({ label: "Iniciar Análise",  status: "EM_ANALISE", cls: "btn-orange" })
  if (oc.status === "EM_ANALISE") nextActions.push({ label: "Marcar Resolvida", status: "RESOLVIDA",  cls: "btn-orange" })
  if (oc.status === "RESOLVIDA")  nextActions.push({ label: "Fechar",           status: "FECHADA",    cls: "btn-ghost" })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/obras/${obraId}/ocorrencias`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500 flex-shrink-0" />
            <span className="truncate">{oc.titulo}</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{formatDataLonga(oc.data)}</p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tipo */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tipo.cls}`}>
            <tipo.Icon size={12} />
            {tipo.label}
          </span>

          {/* Status */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusCls}`}>
            {STATUS_MAP[oc.status as StatusOcorrencia]?.label ?? oc.status}
          </span>

          {/* Prioridade */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${PRIORIDADE_CLS[oc.prioridade] ?? PRIORIDADE_CLS[2]}`}>
            Prioridade {PRIORIDADE_LABEL[oc.prioridade] ?? "Média"}
          </span>
        </div>

        {/* Responsável */}
        {oc.responsavel && (
          <p className="text-xs text-[var(--text-muted)]">
            Responsável: <span className="font-medium text-[var(--text-primary)]">{oc.responsavel.nome}</span>
          </p>
        )}

        {/* Status actions */}
        {nextActions.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)] flex gap-2 flex-wrap">
            {nextActions.map(action => (
              <button
                key={action.status}
                type="button"
                disabled={mutating}
                onClick={() => atualizarStatus.mutate({ id: ocorrenciaId, status: action.status })}
                className={`${action.cls} min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {action.status === "RESOLVIDA" ? <CheckCircle2 size={14} /> : action.status === "FECHADA" ? <XCircle size={14} /> : <Search size={14} />}
                {mutating ? "..." : action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Descrição */}
      {oc.descricao && (
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Descrição</h3>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{oc.descricao}</p>
        </div>
      )}

    </div>
  )
}
