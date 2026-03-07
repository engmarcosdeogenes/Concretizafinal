"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AlertTriangle, Plus, ShieldAlert, Star, Gauge, DollarSign, Leaf, Circle, CheckCircle2, Search, Clock } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

type TipoOcorrencia = "SEGURANCA" | "QUALIDADE" | "PRAZO" | "CUSTO" | "AMBIENTAL" | "OUTRO"
type StatusOcorrencia = "ABERTA" | "EM_ANALISE" | "RESOLVIDA" | "FECHADA"

const TIPO_MAP: Record<TipoOcorrencia, { label: string; cls: string; Icon: React.ElementType }> = {
  SEGURANCA: { label: "Segurança",  cls: "bg-red-50 text-red-700 border-red-200",      Icon: ShieldAlert },
  QUALIDADE: { label: "Qualidade",  cls: "bg-blue-50 text-blue-700 border-blue-200",   Icon: Star },
  PRAZO:     { label: "Prazo",      cls: "bg-amber-50 text-amber-700 border-amber-200",Icon: Gauge },
  CUSTO:     { label: "Custo",      cls: "bg-purple-50 text-purple-700 border-purple-200", Icon: DollarSign },
  AMBIENTAL: { label: "Ambiental",  cls: "bg-green-50 text-green-700 border-green-200",Icon: Leaf },
  OUTRO:     { label: "Outro",      cls: "bg-slate-50 text-slate-600 border-slate-200",Icon: Circle },
}

const STATUS_MAP: Record<StatusOcorrencia, { label: string; cls: string }> = {
  ABERTA:     { label: "Aberta",     cls: "bg-red-50 text-red-700 border border-red-200" },
  EM_ANALISE: { label: "Em Análise", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  RESOLVIDA:  { label: "Resolvida",  cls: "bg-green-50 text-green-700 border border-green-200" },
  FECHADA:    { label: "Fechada",    cls: "bg-slate-50 text-slate-600 border border-slate-200" },
}

const PRIORIDADE_MAP: Record<number, { label: string; cls: string }> = {
  1: { label: "Baixa",  cls: "text-slate-500" },
  2: { label: "Média",  cls: "text-amber-600" },
  3: { label: "Alta",   cls: "text-red-600 font-semibold" },
}

function TipoBadge({ tipo }: { tipo: string }) {
  const t = TIPO_MAP[tipo as TipoOcorrencia] ?? TIPO_MAP.OUTRO
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${t.cls}`}>
      <t.Icon size={9} />
      {t.label}
    </span>
  )
}

function StatusChip({ status }: { status: string }) {
  const s = STATUS_MAP[status as StatusOcorrencia] ?? STATUS_MAP.ABERTA
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  )
}

export default function OcorrenciasPage() {
  const params = useParams()
  const obraId = params.id as string

  const { data: ocorrencias = [], isLoading } = trpc.ocorrencia.listar.useQuery({ obraId })

  const total     = ocorrencias.length
  const abertas   = ocorrencias.filter(o => o.status === "ABERTA").length
  const analise   = ocorrencias.filter(o => o.status === "EM_ANALISE").length
  const resolvidas = ocorrencias.filter(o => o.status === "RESOLVIDA" || o.status === "FECHADA").length

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Ocorrências</h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Registro e acompanhamento de não conformidades, problemas de segurança e atrasos
          </p>
        </div>
        <Link href={`/obras/${obraId}/ocorrencias/nova`} className="btn-orange min-h-[44px] flex-shrink-0 cursor-pointer">
          <Plus size={15} />
          Nova Ocorrência
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",        value: total,     color: "text-blue-600",  sub: "registradas" },
          { label: "Abertas",      value: abertas,   color: "text-red-500",   sub: "aguardando ação" },
          { label: "Em Análise",   value: analise,   color: "text-amber-600", sub: "em andamento" },
          { label: "Resolvidas",   value: resolvidas,color: "text-green-600", sub: "encerradas" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-4">
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{label}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_80px_90px_100px] gap-3 px-5 py-3 bg-[var(--muted)] border-b border-[var(--border)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Tipo</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Ocorrência</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Prioridade</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Data</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</span>
        </div>

        {isLoading && (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando...</div>
        )}

        {!isLoading && ocorrencias.length === 0 && (
          <div className="py-12 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma ocorrência registrada</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Registre não conformidades, problemas de segurança ou atrasos</p>
          </div>
        )}

        {ocorrencias.map((oc) => {
          const prioridade = PRIORIDADE_MAP[oc.prioridade] ?? PRIORIDADE_MAP[2]
          return (
            <Link
              key={oc.id}
              href={`/obras/${obraId}/ocorrencias/${oc.id}`}
              className="grid grid-cols-[110px_1fr_80px_90px_100px] gap-3 px-5 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors items-center no-underline cursor-pointer"
            >
              <TipoBadge tipo={oc.tipo} />

              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{oc.titulo}</p>
                {oc.responsavel && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{oc.responsavel.nome}</p>
                )}
              </div>

              <span className={`text-xs ${prioridade.cls}`}>{prioridade.label}</span>

              <p className="text-xs text-[var(--text-muted)]">{formatDataCurta(oc.data)}</p>

              <StatusChip status={oc.status} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
