"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ClipboardList, Clock, CheckCircle2, XCircle, Send, ThumbsUp, ThumbsDown } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataLonga } from "@/lib/format"

type StatusSolicitacao = "RASCUNHO" | "PENDENTE" | "APROVADA" | "REJEITADA" | "CANCELADA"

const STATUS_MAP: Record<StatusSolicitacao, { label: string; cls: string; Icon: React.ElementType }> = {
  RASCUNHO:  { label: "Rascunho",  cls: "bg-slate-50 text-slate-600 border border-slate-200",  Icon: Clock },
  PENDENTE:  { label: "Pendente",  cls: "bg-amber-50 text-amber-700 border border-amber-200",  Icon: Clock },
  APROVADA:  { label: "Aprovada",  cls: "bg-green-50 text-green-700 border border-green-200",  Icon: CheckCircle2 },
  REJEITADA: { label: "Rejeitada", cls: "bg-red-50 text-red-700 border border-red-200",        Icon: XCircle },
  CANCELADA: { label: "Cancelada", cls: "bg-slate-50 text-slate-500 border border-slate-200",  Icon: XCircle },
}

const URGENCIA_LABEL: Record<number, string> = { 1: "Baixa", 2: "Média", 3: "Alta" }
const URGENCIA_CLS: Record<number, string>   = {
  1: "bg-slate-50 text-slate-600 border border-slate-200",
  2: "bg-amber-50 text-amber-700 border border-amber-200",
  3: "bg-red-50 text-red-700 border border-red-200",
}

export default function SolicitacaoDetalhePage() {
  const params = useParams()
  const id = params.id as string

  const utils = trpc.useUtils()
  const { data: sol, isLoading, error } = trpc.solicitacao.buscarPorId.useQuery({ id })

  const atualizarStatus = trpc.solicitacao.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.solicitacao.buscarPorId.invalidate({ id })
      utils.solicitacao.listar.invalidate({})
    },
  })

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center h-64">
      <p className="text-sm text-[var(--text-muted)]">Carregando solicitação...</p>
    </div>
  }

  if (error || !sol) {
    return <div className="p-6">
      <p className="text-sm text-red-500">Solicitação não encontrada.</p>
      <Link href="/suprimentos/solicitacoes" className="text-sm text-orange-500 mt-2 inline-block">
        ← Voltar para lista
      </Link>
    </div>
  }

  const status   = STATUS_MAP[sol.status as StatusSolicitacao] ?? STATUS_MAP.RASCUNHO
  const mutating = atualizarStatus.isPending

  const nextActions: { label: string; status: StatusSolicitacao; icon: React.ReactNode; cls: string }[] = []
  if (sol.status === "RASCUNHO") {
    nextActions.push({ label: "Enviar para aprovação", status: "PENDENTE",  icon: <Send size={14} />,       cls: "btn-orange" })
  }
  if (sol.status === "PENDENTE") {
    nextActions.push({ label: "Aprovar",   status: "APROVADA",  icon: <ThumbsUp size={14} />,   cls: "btn-orange" })
    nextActions.push({ label: "Rejeitar",  status: "REJEITADA", icon: <ThumbsDown size={14} />, cls: "btn-danger" })
  }
  if (sol.status !== "CANCELADA" && sol.status !== "APROVADA" && sol.status !== "REJEITADA") {
    nextActions.push({ label: "Cancelar", status: "CANCELADA", icon: <XCircle size={14} />, cls: "btn-ghost" })
  }

  const totalItens = sol.itens.reduce((sum, i) => sum + i.quantidade, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/suprimentos/solicitacoes"
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer">
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <ClipboardList size={20} className="text-orange-500 flex-shrink-0" />
            Solicitação de Compra
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {sol.obra.nome} · {formatDataLonga(sol.createdAt)}
          </p>
        </div>
      </div>

      {/* Status + info card */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.cls}`}>
            <status.Icon size={12} />
            {status.label}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${URGENCIA_CLS[sol.urgencia] ?? URGENCIA_CLS[2]}`}>
            Urgência {URGENCIA_LABEL[sol.urgencia] ?? "Média"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Solicitante</p>
            <p className="text-sm text-[var(--text-primary)]">{sol.solicitante.nome}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Obra</p>
            <p className="text-sm text-[var(--text-primary)]">{sol.obra.nome}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Total de Itens</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{sol.itens.length} {sol.itens.length === 1 ? "item" : "itens"}</p>
          </div>
          {sol.pedidos.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Pedidos vinculados</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{sol.pedidos.length}</p>
            </div>
          )}
        </div>

        {/* Ações */}
        {nextActions.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)] flex gap-2 flex-wrap">
            {nextActions.map(action => (
              <button
                key={action.status}
                type="button"
                disabled={mutating}
                onClick={() => atualizarStatus.mutate({ id, status: action.status })}
                className={`${action.cls} min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {action.icon}
                {mutating ? "..." : action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Itens */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Itens solicitados
          <span className="text-[var(--text-muted)] font-normal ml-2">({sol.itens.length})</span>
        </h3>

        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--muted)]">
                <th className="text-left px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Material</th>
                <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Quantidade</th>
                <th className="text-left px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {sol.itens.map(item => (
                <tr key={item.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2.5 text-[var(--text-primary)]">{item.material.nome}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">
                    {item.quantidade} {item.unidade ?? item.material.unidade}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{item.observacao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observações */}
      {sol.observacoes && (
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Observações</h3>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{sol.observacoes}</p>
        </div>
      )}

      {/* Pedidos vinculados */}
      {sol.pedidos.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Pedidos de Compra vinculados</h3>
          <div className="space-y-2">
            {sol.pedidos.map(p => (
              <Link
                key={p.id}
                href={`/suprimentos/pedidos/${p.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-colors no-underline"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{p.fornecedor.nome}</p>
                  <p className="text-xs text-[var(--text-muted)]">{p.status}</p>
                </div>
                {p.total != null && (
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    R$ {p.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
