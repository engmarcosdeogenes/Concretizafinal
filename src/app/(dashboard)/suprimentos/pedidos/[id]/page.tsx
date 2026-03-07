"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ShoppingCart, Truck, Phone, Mail, Send, CheckCircle2, Package, RotateCcw, XCircle } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataLonga, formatDataCurta } from "@/lib/format"

type StatusPedido = "RASCUNHO" | "ENVIADO" | "CONFIRMADO" | "ENTREGUE_PARCIAL" | "ENTREGUE" | "CANCELADO"

const STATUS_MAP: Record<StatusPedido, { label: string; cls: string; Icon: React.ElementType }> = {
  RASCUNHO:         { label: "Rascunho",        cls: "bg-slate-50 text-slate-600 border border-slate-200",    Icon: ShoppingCart },
  ENVIADO:          { label: "Enviado",          cls: "bg-blue-50 text-blue-700 border border-blue-200",       Icon: Send },
  CONFIRMADO:       { label: "Confirmado",       cls: "bg-indigo-50 text-indigo-700 border border-indigo-200", Icon: CheckCircle2 },
  ENTREGUE_PARCIAL: { label: "Parc. Entregue",   cls: "bg-amber-50 text-amber-700 border border-amber-200",   Icon: Package },
  ENTREGUE:         { label: "Entregue",         cls: "bg-green-50 text-green-700 border border-green-200",   Icon: CheckCircle2 },
  CANCELADO:        { label: "Cancelado",        cls: "bg-slate-50 text-slate-500 border border-slate-200",   Icon: XCircle },
}

export default function PedidoDetalhePage() {
  const params = useParams()
  const id = params.id as string

  const utils = trpc.useUtils()
  const { data: pedido, isLoading, error } = trpc.pedido.buscarPorId.useQuery({ id })

  const atualizarStatus = trpc.pedido.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.pedido.buscarPorId.invalidate({ id })
      utils.pedido.listar.invalidate()
    },
  })

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center h-64">
      <p className="text-sm text-[var(--text-muted)]">Carregando pedido...</p>
    </div>
  }

  if (error || !pedido) {
    return <div className="p-6">
      <p className="text-sm text-red-500">Pedido não encontrado.</p>
      <Link href="/suprimentos/pedidos" className="text-sm text-orange-500 mt-2 inline-block">← Voltar</Link>
    </div>
  }

  const status   = STATUS_MAP[pedido.status as StatusPedido] ?? STATUS_MAP.RASCUNHO
  const mutating = atualizarStatus.isPending

  const nextActions: { label: string; status: StatusPedido; icon: React.ReactNode; cls: string }[] = []
  if (pedido.status === "RASCUNHO") {
    nextActions.push({ label: "Enviar ao Fornecedor", status: "ENVIADO",    icon: <Send size={14} />,          cls: "btn-orange" })
  }
  if (pedido.status === "ENVIADO") {
    nextActions.push({ label: "Confirmar",            status: "CONFIRMADO", icon: <CheckCircle2 size={14} />,  cls: "btn-orange" })
  }
  if (pedido.status === "CONFIRMADO") {
    nextActions.push({ label: "Registrar Entrega",    status: "ENTREGUE",   icon: <Package size={14} />,       cls: "btn-orange" })
    nextActions.push({ label: "Entrega Parcial",      status: "ENTREGUE_PARCIAL", icon: <RotateCcw size={14} />, cls: "btn-ghost" })
  }
  if (pedido.status === "ENTREGUE_PARCIAL") {
    nextActions.push({ label: "Finalizar Entrega",    status: "ENTREGUE",   icon: <Package size={14} />,       cls: "btn-orange" })
  }
  if (pedido.status !== "CANCELADO" && pedido.status !== "ENTREGUE") {
    nextActions.push({ label: "Cancelar",             status: "CANCELADO",  icon: <XCircle size={14} />,       cls: "btn-danger" })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/suprimentos/pedidos"
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer">
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <ShoppingCart size={20} className="text-orange-500 flex-shrink-0" />
            Pedido de Compra
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {pedido.fornecedor.nome} · {formatDataLonga(pedido.createdAt)}
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
          {pedido.total != null && (
            <span className="text-sm font-bold text-[var(--text-primary)]">
              R$ {pedido.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
          {/* Fornecedor */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Fornecedor</p>
            <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Truck size={13} className="text-[var(--text-muted)]" />
              {pedido.fornecedor.nome}
            </p>
            {pedido.fornecedor.telefone && (
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                <Phone size={10} />{pedido.fornecedor.telefone}
              </p>
            )}
            {pedido.fornecedor.email && (
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                <Mail size={10} />{pedido.fornecedor.email}
              </p>
            )}
          </div>

          {/* Previsão + vinculada */}
          <div>
            {pedido.previsaoEntrega && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Previsão de Entrega</p>
                <p className="text-sm text-[var(--text-primary)]">{formatDataLonga(pedido.previsaoEntrega)}</p>
              </div>
            )}
            {pedido.solicitacao && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Solicitação vinculada</p>
                <Link
                  href={`/suprimentos/solicitacoes/${pedido.solicitacao.id}`}
                  className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                >
                  {pedido.solicitacao.obra.nome}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Ações de status */}
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
          Itens do pedido
          <span className="text-[var(--text-muted)] font-normal ml-2">({pedido.itens.length})</span>
        </h3>

        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--muted)]">
                <th className="text-left px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Material</th>
                <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Qtd.</th>
                <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Preço Unit.</th>
                <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.itens.map(item => (
                <tr key={item.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2.5 text-[var(--text-primary)]">{item.material.nome}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-primary)]">
                    {item.quantidade} {item.unidade ?? item.material.unidade}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-muted)]">
                    {item.precoUnit != null
                      ? `R$ ${item.precoUnit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">
                    {item.total != null
                      ? `R$ ${item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                </tr>
              ))}
              {pedido.total != null && (
                <tr className="border-t-2 border-[var(--border)] bg-[var(--muted)]">
                  <td colSpan={3} className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total</td>
                  <td className="px-4 py-2.5 text-right font-bold text-[var(--text-primary)]">
                    R$ {pedido.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observações */}
      {pedido.observacoes && (
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Observações</h3>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{pedido.observacoes}</p>
        </div>
      )}
    </div>
  )
}
