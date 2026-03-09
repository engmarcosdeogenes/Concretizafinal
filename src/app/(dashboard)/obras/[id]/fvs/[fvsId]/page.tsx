"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft, CheckSquare, CheckCircle2, XCircle, Clock,
  RefreshCw, Minus, Play, ThumbsUp, ThumbsDown, Download, Camera, Edit2,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataLonga } from "@/lib/format"
import { UploadFotos } from "@/components/obras/UploadFotos"

type StatusFVS = "PENDENTE" | "EM_INSPECAO" | "APROVADO" | "REJEITADO" | "RETRABALHO"

const STATUS_MAP = {
  PENDENTE:    { label: "Pendente",     cls: "bg-amber-50 text-amber-700 border border-amber-200",    Icon: Clock },
  EM_INSPECAO: { label: "Em Inspeção",  cls: "bg-blue-50 text-blue-700 border border-blue-200",       Icon: Clock },
  APROVADO:    { label: "Aprovado",     cls: "bg-green-50 text-green-700 border border-green-200",    Icon: CheckCircle2 },
  REJEITADO:   { label: "Não Conforme", cls: "bg-red-50 text-red-700 border border-red-200",          Icon: XCircle },
  RETRABALHO:  { label: "Retrabalho",   cls: "bg-orange-50 text-orange-700 border border-orange-200", Icon: RefreshCw },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as keyof typeof STATUS_MAP] ?? STATUS_MAP.PENDENTE
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      <s.Icon size={12} />
      {s.label}
    </span>
  )
}

export default function FvsDetalhePage() {
  const params = useParams()
  const obraId = params.id as string
  const fvsId  = params.fvsId as string

  const utils = trpc.useUtils()

  const { data: fvs, isLoading, error } = trpc.fvs.buscarPorId.useQuery({ id: fvsId })

  const atualizarStatus = trpc.fvs.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.fvs.buscarPorId.invalidate({ id: fvsId })
      utils.fvs.listar.invalidate({ obraId })
    },
  })

  const aprovarItem = trpc.fvs.aprovarItem.useMutation({
    onSuccess: () => {
      utils.fvs.buscarPorId.invalidate({ id: fvsId })
      utils.fvs.listar.invalidate({ obraId })
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Carregando FVS...</p>
      </div>
    )
  }

  if (error || !fvs) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">FVS não encontrada.</p>
        <Link href={`/obras/${obraId}/fvs`} className="text-sm text-orange-500 mt-2 inline-block cursor-pointer">
          ← Voltar para lista
        </Link>
      </div>
    )
  }

  const itensConformes  = fvs.itens.filter(i => i.aprovado === true).length
  const itensPendentes  = fvs.itens.filter(i => i.aprovado === null).length
  const itensTotal      = fvs.itens.length
  const progressPercent = itensTotal > 0 ? Math.round(itensConformes / itensTotal * 100) : 0

  // Próximas ações de status disponíveis
  const statusActions: { label: string; status: StatusFVS; icon: React.ReactNode; cls: string }[] = []
  if (fvs.status === "PENDENTE") {
    statusActions.push({ label: "Iniciar Inspeção", status: "EM_INSPECAO", icon: <Play size={14} />, cls: "btn-orange" })
  }
  if (fvs.status === "EM_INSPECAO") {
    statusActions.push({ label: "Aprovar",    status: "APROVADO",   icon: <ThumbsUp size={14} />,   cls: "btn-orange" })
    statusActions.push({ label: "Rejeitar",   status: "REJEITADO",  icon: <ThumbsDown size={14} />, cls: "btn-danger" })
    statusActions.push({ label: "Retrabalho", status: "RETRABALHO", icon: <RefreshCw size={14} />,  cls: "btn-ghost" })
  }
  if (fvs.status === "RETRABALHO") {
    statusActions.push({ label: "Iniciar Inspeção", status: "EM_INSPECAO", icon: <Play size={14} />, cls: "btn-orange" })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/obras/${obraId}/fvs`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <CheckSquare size={20} className="text-orange-500 flex-shrink-0" />
            <span className="truncate">{fvs.servico}</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {fvs.codigo && <span className="font-mono mr-2">{fvs.codigo} ·</span>}
            {formatDataLonga(fvs.data)}
          </p>
        </div>
        <a href={`/api/pdf/fvs/${fvsId}`} target="_blank" rel="noreferrer" className="btn-ghost min-h-[44px] flex-shrink-0">
          <Download size={15} />
          Baixar PDF
        </a>
        <Link href={`/obras/${obraId}/fvs/${fvsId}/editar`} className="btn-ghost min-h-[44px] flex-shrink-0">
          <Edit2 size={15} />
          Editar
        </Link>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={fvs.status} />
            <p className="text-xs text-[var(--text-muted)]">
              Responsável: <span className="font-medium text-[var(--text-primary)]">{fvs.responsavel.nome}</span>
            </p>
          </div>
          {itensTotal > 0 && (
            <p className="text-xs text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-primary)]">{itensConformes}</span>/{itensTotal} itens conformes
              {itensPendentes > 0 && <span className="text-amber-600 ml-2">{itensPendentes} pendentes</span>}
            </p>
          )}
        </div>

        {/* Progress bar */}
        {itensTotal > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-2 bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{progressPercent}% de conformidade</p>
          </div>
        )}

        {/* Status actions */}
        {statusActions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex gap-2 flex-wrap">
            {statusActions.map((action) => (
              <button
                key={action.status}
                type="button"
                disabled={atualizarStatus.isPending}
                onClick={() => atualizarStatus.mutate({ id: fvsId, status: action.status })}
                className={`${action.cls} min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {action.icon}
                {atualizarStatus.isPending ? "..." : action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Checklist interativo */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Checklist de verificação
        </h3>

        {fvs.itens.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic">Nenhum item cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {fvs.itens.map((item, i) => {
              const isAprovado    = item.aprovado === true
              const isRejeitado   = item.aprovado === false
              const isPending     = aprovarItem.isPending

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    isAprovado  ? "border-green-200 bg-green-50" :
                    isRejeitado ? "border-red-200 bg-red-50" :
                    "border-border bg-white"
                  }`}
                >
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] w-5 text-right flex-shrink-0">
                    {i + 1}.
                  </span>
                  <p className={`text-sm flex-1 ${isAprovado ? "text-green-800" : isRejeitado ? "text-red-700" : "text-[var(--text-primary)]"}`}>
                    {item.descricao}
                  </p>
                  {/* Botões de avaliação */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={isPending}
                      title="Conforme"
                      onClick={() => aprovarItem.mutate({ itemId: item.id, aprovado: isAprovado ? null : true })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 ${
                        isAprovado
                          ? "bg-green-500 text-white"
                          : "border border-border text-[var(--text-muted)] hover:border-green-400 hover:text-green-600"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      title="Não Conforme"
                      onClick={() => aprovarItem.mutate({ itemId: item.id, aprovado: isRejeitado ? null : false })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 ${
                        isRejeitado
                          ? "bg-red-500 text-white"
                          : "border border-border text-[var(--text-muted)] hover:border-red-400 hover:text-red-600"
                      }`}
                    >
                      <XCircle size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      title="Pendente"
                      onClick={() => aprovarItem.mutate({ itemId: item.id, aprovado: null })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 ${
                        item.aprovado === null
                          ? "bg-slate-300 text-white"
                          : "border border-border text-[var(--text-muted)] hover:border-slate-400"
                      }`}
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Observações */}
      {fvs.observacoes && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Observações</h3>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{fvs.observacoes}</p>
        </div>
      )}

      {/* Fotos */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Camera size={16} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Fotos da inspeção</h3>
        </div>
        <UploadFotos obraId={obraId} fvsId={fvsId} />
      </div>

    </div>
  )
}
