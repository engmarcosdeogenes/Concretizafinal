"use client"

import { useState } from "react"
import Link from "next/link"
import { ClipboardList, Plus, Search } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

const STATUS_MAP = {
  RASCUNHO:  { label: "Rascunho",   cls: "bg-slate-50 text-slate-600 border border-slate-200" },
  PENDENTE:  { label: "Pendente",   cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  APROVADA:  { label: "Aprovada",   cls: "bg-green-50 text-green-700 border border-green-200" },
  REJEITADA: { label: "Rejeitada",  cls: "bg-red-50 text-red-700 border border-red-200" },
  CANCELADA: { label: "Cancelada",  cls: "bg-slate-50 text-slate-500 border border-slate-200" },
}

const URGENCIA_MAP: Record<number, { label: string; cls: string }> = {
  1: { label: "Baixa",  cls: "bg-slate-50 text-slate-600 border border-slate-200" },
  2: { label: "Média",  cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  3: { label: "Alta",   cls: "bg-red-50 text-red-700 border border-red-200" },
}

export default function SolicitacoesPage() {
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")

  const { data: solicitacoes = [], isLoading } = trpc.solicitacao.listar.useQuery({})

  const filtered = solicitacoes.filter(s => {
    const q = busca.toLowerCase()
    const matchBusca = !busca ||
      s.obra.nome.toLowerCase().includes(q) ||
      s.solicitante.nome.toLowerCase().includes(q) ||
      s.itens.some(i => i.material.nome.toLowerCase().includes(q))
    const matchStatus = !filtroStatus || s.status === filtroStatus
    return matchBusca && matchStatus
  })

  const stats = {
    total:    solicitacoes.length,
    pendente: solicitacoes.filter(s => s.status === "PENDENTE").length,
    aprovada: solicitacoes.filter(s => s.status === "APROVADA").length,
    alta:     solicitacoes.filter(s => s.urgencia === 3).length,
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Solicitações de Compra"
        subtitle="Pedidos internos de materiais e insumos"
        actions={
          <Link href="/suprimentos/solicitacoes/nova" className="btn-orange min-h-[44px]">
            <Plus size={15} />
            Nova Solicitação
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",         value: stats.total,    color: "text-slate-600" },
          { label: "Pendentes",     value: stats.pendente, color: "text-amber-600" },
          { label: "Aprovadas",     value: stats.aprovada, color: "text-green-600" },
          { label: "Urgência Alta", value: stats.alta,     color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
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
            placeholder="Buscar por obra, material ou solicitante..."
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
        <div className="grid grid-cols-[80px_1fr_120px_80px_100px_100px] gap-3 px-5 py-3 bg-muted border-b border-border">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Data</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Itens</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Obra</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Urgência</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Solicitante</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</span>
        </div>

        {isLoading && (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando...</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <ClipboardList size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {busca || filtroStatus ? "Nenhuma solicitação encontrada" : "Nenhuma solicitação"}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {busca || filtroStatus ? "Tente outros filtros" : "Crie a primeira solicitação de compra"}
            </p>
          </div>
        )}

        {filtered.map(sol => {
          const status   = STATUS_MAP[sol.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.RASCUNHO
          const urgencia = URGENCIA_MAP[sol.urgencia] ?? URGENCIA_MAP[2]
          return (
            <Link
              key={sol.id}
              href={`/suprimentos/solicitacoes/${sol.id}`}
              className="grid grid-cols-[80px_1fr_120px_80px_100px_100px] gap-3 px-5 py-4 border-b border-border last:border-0 hover:bg-muted transition-colors items-center no-underline"
            >
              <span className="text-xs text-[var(--text-muted)]">
                {formatDataCurta(sol.createdAt)}
              </span>

              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {sol.itens.length} {sol.itens.length === 1 ? "item" : "itens"}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {sol.itens.slice(0, 2).map(i => i.material.nome).join(", ")}
                  {sol.itens.length > 2 && ` +${sol.itens.length - 2}`}
                </p>
              </div>

              <p className="text-xs text-[var(--text-muted)] truncate">{sol.obra.nome}</p>

              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${urgencia.cls}`}>
                {urgencia.label}
              </span>

              <p className="text-xs text-[var(--text-muted)] truncate">{sol.solicitante.nome}</p>

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
