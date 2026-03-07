"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Sun, Cloud, CloudRain, Wind, CheckCircle2, Clock, AlertCircle, Users, ClipboardList, Send, ThumbsUp } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataLonga, diaSemanaNome } from "@/lib/format"

function ClimaIcon({ clima }: { clima?: string | null }) {
  if (clima === "chuva")   return <CloudRain size={18} className="text-blue-400" />
  if (clima === "nublado") return <Cloud size={18} className="text-slate-400" />
  if (clima === "vento")   return <Wind size={18} className="text-slate-500" />
  return <Sun size={18} className="text-amber-400" />
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    APROVADO:  { label: "Aprovado",  cls: "bg-green-50 text-green-700 border border-green-200", Icon: CheckCircle2 },
    ENVIADO:   { label: "Enviado",   cls: "bg-blue-50 text-blue-700 border border-blue-200",   Icon: Clock },
    RASCUNHO:  { label: "Rascunho",  cls: "bg-slate-50 text-slate-600 border border-slate-200", Icon: AlertCircle },
    REJEITADO: { label: "Rejeitado", cls: "bg-red-50 text-red-700 border border-red-200",      Icon: AlertCircle },
  }
  const s = map[status as keyof typeof map] ?? map.RASCUNHO
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      <s.Icon size={12} />
      {s.label}
    </span>
  )
}

export default function RdoDetalhePage() {
  const params = useParams()
  const obraId = params.id as string
  const rdoId  = params.rdoId as string
  const router = useRouter()

  const utils = trpc.useUtils()

  const { data: rdo, isLoading, error } = trpc.rdo.buscarPorId.useQuery({ id: rdoId })

  const atualizarStatus = trpc.rdo.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.rdo.buscarPorId.invalidate({ id: rdoId })
      utils.rdo.listar.invalidate({ obraId })
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Carregando RDO...</p>
      </div>
    )
  }

  if (error || !rdo) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">RDO não encontrado.</p>
        <Link href={`/obras/${obraId}/rdo`} className="text-sm text-orange-500 mt-2 inline-block">← Voltar para lista</Link>
      </div>
    )
  }

  const totalEquipe = rdo.equipe.reduce((sum, e) => sum + e.quantidade, 0)
  const nextStatus = rdo.status === "RASCUNHO" ? "ENVIADO" : rdo.status === "ENVIADO" ? "APROVADO" : null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/obras/${obraId}/rdo`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <ClipboardList size={20} className="text-orange-500 flex-shrink-0" />
            RDO — {diaSemanaNome(rdo.data)}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{formatDataLonga(rdo.data)}</p>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Clima */}
            <div className="flex items-center gap-2">
              <ClimaIcon clima={rdo.clima} />
              <span className="text-sm font-medium text-[var(--text-primary)] capitalize">
                {rdo.clima ?? "—"}
              </span>
            </div>

            {/* Temperatura */}
            {(rdo.temperaturaMin != null || rdo.temperaturaMax != null) && (
              <span className="text-sm text-[var(--text-muted)]">
                {rdo.temperaturaMin != null && rdo.temperaturaMax != null
                  ? `${rdo.temperaturaMin}°C / ${rdo.temperaturaMax}°C`
                  : rdo.temperaturaMax != null
                  ? `${rdo.temperaturaMax}°C`
                  : `${rdo.temperaturaMin}°C`}
              </span>
            )}

            {/* Chuva */}
            {rdo.ocorreuChuva && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                🌧️ Ocorreu chuva
              </span>
            )}

            {/* Status */}
            <StatusBadge status={rdo.status} />
          </div>

          {/* Responsável */}
          <p className="text-xs text-[var(--text-muted)]">
            Responsável: <span className="font-medium text-[var(--text-primary)]">{rdo.responsavel.nome}</span>
          </p>
        </div>

        {/* Status action */}
        {nextStatus && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              disabled={atualizarStatus.isPending}
              onClick={() => atualizarStatus.mutate({ id: rdoId, status: nextStatus })}
              className="btn-orange min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {nextStatus === "ENVIADO" ? <Send size={14} /> : <ThumbsUp size={14} />}
              {atualizarStatus.isPending
                ? "Salvando..."
                : nextStatus === "ENVIADO"
                ? "Enviar RDO"
                : "Aprovar RDO"}
            </button>
          </div>
        )}
      </div>

      {/* Atividades */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Atividades realizadas</h3>
        {rdo.atividades.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic">Nenhuma atividade registrada.</p>
        ) : (
          <div className="space-y-2">
            {rdo.atividades.map((a, i) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5 w-5 text-right flex-shrink-0">{i + 1}.</span>
                <p className="text-sm text-[var(--text-primary)] flex-1">{a.descricao}</p>
                {(a.quantidade != null || a.unidade) && (
                  <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                    {a.quantidade != null ? a.quantidade : ""}{a.unidade ? ` ${a.unidade}` : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipe */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Equipe</h3>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            <Users size={14} className="text-orange-500" />
            {totalEquipe} total
          </div>
        </div>
        {rdo.equipe.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic">Nenhum membro registrado.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)]">
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Função</th>
                  <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Qtd.</th>
                </tr>
              </thead>
              <tbody>
                {rdo.equipe.map((e) => (
                  <tr key={e.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2.5 text-[var(--text-primary)]">{e.funcao}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">{e.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Observações */}
      {rdo.observacoes && (
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Observações</h3>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{rdo.observacoes}</p>
        </div>
      )}

    </div>
  )
}
