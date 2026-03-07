"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Package, CheckCircle2, XCircle, Clock, RotateCcw, Truck, FileText, Send, ThumbsDown } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataLonga } from "@/lib/format"

type StatusFVM = "PENDENTE" | "RECEBIDO" | "APROVADO" | "REJEITADO" | "DEVOLVIDO"

const STATUS_MAP: Record<StatusFVM, { label: string; cls: string; Icon: React.ElementType }> = {
  PENDENTE:  { label: "Pendente",  cls: "bg-slate-50 text-slate-600 border border-slate-200",    Icon: Clock },
  RECEBIDO:  { label: "Recebido",  cls: "bg-blue-50 text-blue-700 border border-blue-200",       Icon: Package },
  APROVADO:  { label: "Aprovado",  cls: "bg-green-50 text-green-700 border border-green-200",    Icon: CheckCircle2 },
  REJEITADO: { label: "Rejeitado", cls: "bg-red-50 text-red-700 border border-red-200",          Icon: XCircle },
  DEVOLVIDO: { label: "Devolvido", cls: "bg-orange-50 text-orange-700 border border-orange-200", Icon: RotateCcw },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as StatusFVM] ?? STATUS_MAP.PENDENTE
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      <s.Icon size={12} />
      {s.label}
    </span>
  )
}

export default function FvmDetalhePage() {
  const params = useParams()
  const obraId = params.id as string
  const fvmId  = params.fvmId as string

  const utils = trpc.useUtils()

  const { data: fvm, isLoading, error } = trpc.fvm.buscarPorId.useQuery({ id: fvmId })

  const atualizarStatus = trpc.fvm.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.fvm.buscarPorId.invalidate({ id: fvmId })
      utils.fvm.listar.invalidate({ obraId })
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Carregando FVM...</p>
      </div>
    )
  }

  if (error || !fvm) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">FVM não encontrada.</p>
        <Link href={`/obras/${obraId}/fvm`} className="text-sm text-orange-500 mt-2 inline-block cursor-pointer">
          ← Voltar para lista
        </Link>
      </div>
    )
  }

  const mutating = atualizarStatus.isPending

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/obras/${obraId}/fvm`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <Package size={20} className="text-orange-500 flex-shrink-0" />
            <span className="truncate">{fvm.material}</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {fvm.codigo && <span className="font-mono mr-2">{fvm.codigo} ·</span>}
            {formatDataLonga(fvm.data)}
          </p>
        </div>
      </div>

      {/* Info + Status card */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <StatusBadge status={fvm.status} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Quantidade</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {fvm.quantidade}{fvm.unidade ? ` ${fvm.unidade}` : ""}
            </p>
          </div>
          {fvm.fornecedorNome && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Fornecedor</p>
              <p className="text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                <Truck size={13} className="text-[var(--text-muted)]" />
                {fvm.fornecedorNome}
              </p>
            </div>
          )}
          {fvm.notaFiscal && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Nota Fiscal</p>
              <p className="text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                <FileText size={13} className="text-[var(--text-muted)]" />
                {fvm.notaFiscal}
              </p>
            </div>
          )}
        </div>

        {/* Status actions */}
        {fvm.status !== "APROVADO" && fvm.status !== "REJEITADO" && fvm.status !== "DEVOLVIDO" && (
          <div className="pt-4 border-t border-[var(--border)] flex gap-2 flex-wrap">
            {fvm.status === "PENDENTE" && (
              <button
                type="button"
                disabled={mutating}
                onClick={() => atualizarStatus.mutate({ id: fvmId, status: "RECEBIDO" })}
                className="btn-orange min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {mutating ? "..." : "Registrar Recebimento"}
              </button>
            )}
            {fvm.status === "RECEBIDO" && (
              <>
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => atualizarStatus.mutate({ id: fvmId, status: "APROVADO" })}
                  className="btn-orange min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={14} />
                  {mutating ? "..." : "Aprovar"}
                </button>
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => atualizarStatus.mutate({ id: fvmId, status: "REJEITADO" })}
                  className="btn-danger min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ThumbsDown size={14} />
                  {mutating ? "..." : "Rejeitar"}
                </button>
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => atualizarStatus.mutate({ id: fvmId, status: "DEVOLVIDO" })}
                  className="btn-ghost min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RotateCcw size={14} />
                  {mutating ? "..." : "Devolver"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Observações */}
      {fvm.observacoes && (
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Observações</h3>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{fvm.observacoes}</p>
        </div>
      )}

    </div>
  )
}
