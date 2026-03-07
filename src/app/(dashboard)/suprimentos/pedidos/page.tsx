"use client"

import Link from "next/link"
import { ShoppingCart, Plus, Truck } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

const STATUS_MAP = {
  RASCUNHO:       { label: "Rascunho",       cls: "bg-slate-50 text-slate-600 border border-slate-200" },
  ENVIADO:        { label: "Enviado",         cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  CONFIRMADO:     { label: "Confirmado",      cls: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  ENTREGUE_PARCIAL: { label: "Parc. Entregue", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  ENTREGUE:       { label: "Entregue",        cls: "bg-green-50 text-green-700 border border-green-200" },
  CANCELADO:      { label: "Cancelado",       cls: "bg-slate-50 text-slate-500 border border-slate-200" },
}

export default function PedidosPage() {
  const { data: pedidos = [], isLoading } = trpc.pedido.listar.useQuery()

  const stats = {
    total:     pedidos.length,
    enviado:   pedidos.filter(p => p.status === "ENVIADO" || p.status === "CONFIRMADO").length,
    entregue:  pedidos.filter(p => p.status === "ENTREGUE").length,
    totalR:    pedidos.reduce((sum, p) => sum + (p.total ?? 0), 0),
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Pedidos de Compra"
        subtitle="Ordens de compra emitidas para fornecedores"
        actions={
          <Link href="/suprimentos/pedidos/novo" className="btn-orange min-h-[44px]">
            <Plus size={15} />
            Novo Pedido
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",        value: stats.total,    display: String(stats.total),    color: "text-slate-600" },
          { label: "Em andamento", value: stats.enviado,  display: String(stats.enviado),  color: "text-blue-600" },
          { label: "Entregues",    value: stats.entregue, display: String(stats.entregue), color: "text-green-600" },
          { label: "Valor total",  value: stats.totalR,   display: `R$ ${stats.totalR.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, color: "text-orange-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-4">
            <p className={`text-xl font-extrabold ${s.color}`}>{s.display}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_140px_100px_120px_100px] gap-3 px-5 py-3 bg-[var(--muted)] border-b border-[var(--border)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Data</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Itens</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Fornecedor</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Previsão</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</span>
        </div>

        {isLoading && <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando...</div>}

        {!isLoading && pedidos.length === 0 && (
          <div className="py-12 text-center">
            <ShoppingCart size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Nenhum pedido de compra</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Crie o primeiro pedido para um fornecedor</p>
          </div>
        )}

        {pedidos.map(pedido => {
          const status = STATUS_MAP[pedido.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.RASCUNHO
          return (
            <Link
              key={pedido.id}
              href={`/suprimentos/pedidos/${pedido.id}`}
              className="grid grid-cols-[80px_1fr_140px_100px_120px_100px] gap-3 px-5 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors items-center no-underline"
            >
              <span className="text-xs text-[var(--text-muted)]">{formatDataCurta(pedido.createdAt)}</span>

              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {pedido.itens.length} {pedido.itens.length === 1 ? "item" : "itens"}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {pedido.itens.slice(0, 2).map(i => i.material.nome).join(", ")}
                  {pedido.itens.length > 2 && ` +${pedido.itens.length - 2}`}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] truncate">
                <Truck size={11} className="flex-shrink-0" />
                {pedido.fornecedor.nome}
              </div>

              <span className="text-xs text-[var(--text-muted)]">
                {pedido.previsaoEntrega ? formatDataCurta(pedido.previsaoEntrega) : "—"}
              </span>

              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {pedido.total != null
                  ? `R$ ${pedido.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "—"}
              </p>

              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${status.cls}`}>
                {status.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
