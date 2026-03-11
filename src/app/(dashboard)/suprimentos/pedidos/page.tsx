"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, Plus, Truck, Search, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { toast } from "sonner"

const STATUS_MAP = {
  RASCUNHO:       { label: "Rascunho",       cls: "bg-slate-50 text-slate-600 border border-slate-200" },
  ENVIADO:        { label: "Enviado",         cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  CONFIRMADO:     { label: "Confirmado",      cls: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  ENTREGUE_PARCIAL: { label: "Parc. Entregue", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  ENTREGUE:       { label: "Entregue",        cls: "bg-green-50 text-green-700 border border-green-200" },
  CANCELADO:      { label: "Cancelado",       cls: "bg-slate-50 text-slate-500 border border-slate-200" },
}

export default function PedidosPage() {
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")

  const utils = trpc.useUtils()
  const { data: pedidos = [], isLoading } = trpc.pedido.listar.useQuery()
  const { data: pedidosSienge = [], isLoading: loadingSienge } = trpc.integracoes.pedidosSienge.useQuery({})

  const autorizarPedido = trpc.sienge.autorizarPedido.useMutation({
    onSuccess: () => {
      toast.success("Pedido autorizado no Sienge!")
      void utils.integracoes.pedidosSienge.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const filtered = pedidos.filter(p => {
    const q = busca.toLowerCase()
    const matchBusca = !busca ||
      p.fornecedor.nome.toLowerCase().includes(q) ||
      p.itens.some(i => i.material.nome.toLowerCase().includes(q))
    const matchStatus = !filtroStatus || p.status === filtroStatus
    return matchBusca && matchStatus
  })

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
          <div key={s.label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <p className={`text-xl font-extrabold ${s.color}`}>{s.display}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Busca + Filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por fornecedor ou material..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-white outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="px-3 py-2.5 text-sm border border-border rounded-xl bg-white outline-none focus:border-[var(--blue)] transition-all cursor-pointer"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_MAP).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_140px_100px_120px_100px] gap-3 px-5 py-3 bg-muted border-b border-border">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Data</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Itens</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Fornecedor</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Previsão</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</span>
        </div>

        {isLoading && <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando...</div>}

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <ShoppingCart size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {busca || filtroStatus ? "Nenhum pedido encontrado" : "Nenhum pedido de compra"}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {busca || filtroStatus ? "Tente outros filtros" : "Crie o primeiro pedido para um fornecedor"}
            </p>
          </div>
        )}

        {filtered.map(pedido => {
          const status = STATUS_MAP[pedido.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.RASCUNHO
          return (
            <Link
              key={pedido.id}
              href={`/suprimentos/pedidos/${pedido.id}`}
              className="grid grid-cols-[80px_1fr_140px_100px_120px_100px] gap-3 px-5 py-4 border-b border-border last:border-0 hover:bg-muted transition-colors items-center no-underline"
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

      {/* Pedidos Sienge */}
      {(pedidosSienge.length > 0 || loadingSienge) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Pedidos no Sienge</h2>
            {loadingSienge && <RefreshCw size={13} className="text-[var(--text-muted)] animate-spin" />}
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_80px_120px_100px] gap-3 px-5 py-3 bg-muted border-b border-border">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Pedido</span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Data</span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total</span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Ação</span>
            </div>

            {pedidosSienge.map(p => (
              <div key={p.id} className="grid grid-cols-[1fr_100px_80px_120px_100px] gap-3 px-5 py-4 border-b border-border last:border-0 items-center">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {p.formattedPurchaseOrderId ?? `#${p.id}`}
                  </p>
                  {p.notes && <p className="text-xs text-[var(--text-muted)] truncate">{p.notes}</p>}
                </div>
                <span className="text-xs text-[var(--text-muted)]">{p.date ? formatDataCurta(new Date(p.date)) : "—"}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {p.totalAmount != null ? `R$ ${p.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                </span>
                <div>
                  {p.authorized ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle2 size={10} />Autorizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle size={10} />Pendente
                    </span>
                  )}
                </div>
                <div>
                  {!p.authorized && (
                    <button
                      type="button"
                      disabled={autorizarPedido.isPending}
                      onClick={() => {
                        if (confirm(`Autorizar pedido ${p.formattedPurchaseOrderId ?? `#${p.id}`} no Sienge?`)) {
                          autorizarPedido.mutate({ pedidoId: p.id })
                        }
                      }}
                      className="btn-orange text-xs py-1.5 px-3 min-h-0 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Autorizar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
