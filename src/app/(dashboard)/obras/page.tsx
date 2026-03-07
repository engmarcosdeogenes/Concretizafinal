"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus, HardHat, FileText, Image, MessageSquare, MapPin, Search, LayoutGrid, List, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

const STATUS_MAP = {
  EM_ANDAMENTO: { label: "Ativa", badgeClass: "badge badge-blue" },
  PAUSADA: { label: "Em Espera", badgeClass: "badge badge-yellow" },
  CONCLUIDA: { label: "Concluída", badgeClass: "badge badge-green" },
  PLANEJAMENTO: { label: "Planejamento", badgeClass: "badge badge-gray" },
  CANCELADA: { label: "Cancelada", badgeClass: "badge badge-red" },
}

const TABS = [
  { label: "Todas", value: null },
  { label: "Ativas", value: "EM_ANDAMENTO" },
  { label: "Em Espera", value: "PAUSADA" },
  { label: "Concluídas", value: "CONCLUIDA" },
] as const

function getProgressColorClass(p: number) {
  if (p >= 100) return "bg-green-500"
  return "bg-orange-500"
}

export default function ObrasPage() {
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null)
  const [viewGrid, setViewGrid] = useState(true)

  const { data: obras, isLoading } = trpc.obra.listar.useQuery()

  const obrasFiltradas = (obras ?? []).filter((obra) => {
    const matchBusca = obra.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (obra.cidade ?? "").toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus ? obra.status === filtroStatus : true
    return matchBusca && matchStatus
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Obras</h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-1">
            Gerencie todas as suas obras em um só lugar
          </p>
        </div>
        <Link href="/obras/nova" className="btn-orange min-h-[44px]">
          <Plus size={16} />
          Adicionar Obra
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <label className="flex items-center gap-2 px-3.5 h-[44px] bg-white border border-[var(--border)] rounded-[var(--radius)] flex-1 max-w-md focus-within:ring-2 focus-within:ring-[var(--blue)] focus-within:border-transparent transition-all">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar obras..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </label>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {TABS.map((tab) => {
            const active = filtroStatus === tab.value
            return (
              <button
                key={tab.label}
                onClick={() => setFiltroStatus(tab.value)}
                className={cn(
                  "px-4 h-[44px] rounded-[var(--radius)] text-sm font-semibold transition-colors border whitespace-nowrap",
                  active
                    ? "bg-[var(--blue)] text-white border-[var(--blue)]"
                    : "bg-white text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--muted)]"
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="hidden sm:flex items-center bg-white border border-[var(--border)] rounded-[var(--radius)] p-1 ml-auto shrink-0 h-[44px]">
          <button
            onClick={() => setViewGrid(true)}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewGrid ? "bg-[var(--blue)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
            aria-label="Visualização em grade"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewGrid(false)}
            className={cn(
              "p-2 rounded-md transition-colors",
              !viewGrid ? "bg-[var(--blue)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
            aria-label="Visualização em lista"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && obrasFiltradas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white border border-[var(--border)] rounded-2xl">
          <HardHat size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
            {busca || filtroStatus ? "Nenhuma obra encontrada" : "Nenhuma obra cadastrada"}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm">
            {busca || filtroStatus
              ? "Tente ajustar seus filtros para encontrar a obra desejada."
              : "Crie sua primeira obra para começar a usar a plataforma."}
          </p>
          {!busca && !filtroStatus && (
            <Link href="/obras/nova" className="btn-orange">
              <Plus size={16} />
              Adicionar Obra
            </Link>
          )}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && obrasFiltradas.length > 0 && viewGrid && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {obrasFiltradas.map((obra) => {
            const status = STATUS_MAP[obra.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.PLANEJAMENTO
            return (
              <Link
                key={obra.id}
                href={`/obras/${obra.id}`}
                className="group flex flex-col bg-white border border-[var(--border)] rounded-2xl overflow-hidden hover:shadow-md transition-all no-underline"
              >
                {/* Imagem Cover */}
                <div className="relative h-[200px] w-full bg-slate-100 flex-shrink-0">
                  {obra.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={obra.imagemUrl} alt={obra.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                      <HardHat size={32} className="text-slate-300" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={status.badgeClass}>{status.label}</span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-[17px] font-bold text-[var(--text-primary)] mb-4">
                    {obra.nome}
                  </h3>

                  {/* Progress */}
                  <div className="mt-auto mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-[var(--text-muted)] text-[var(--text-secondary)]">Progresso</span>
                      <span className="text-[13px] font-bold text-[var(--text-primary)]">{obra.progresso}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", getProgressColorClass(obra.progresso))}
                        style={{ width: `${obra.progresso}%` }}
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <hr className="border-[var(--border)] mb-4" />

                  {/* Stats & Locale */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <FileText size={15} className="text-[var(--text-muted)]" />
                        <span className="text-[13px] font-medium">{obra._count.rdos}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <Image size={15} className="text-[var(--text-muted)]" />
                        <span className="text-[13px] font-medium">{obra._count.midias}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <MessageSquare size={15} className="text-[var(--text-muted)]" />
                        <span className="text-[13px] font-medium">{obra._count.ocorrencias}</span>
                      </div>
                    </div>

                    {(obra.cidade || obra.estado) && (
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)] shrink-0">
                        <MapPin size={14} />
                        <span className="text-[12px] font-medium">
                          {[obra.cidade, obra.estado].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* List View */}
      {!isLoading && obrasFiltradas.length > 0 && !viewGrid && (
        <div className="flex flex-col gap-3">
          {obrasFiltradas.map((obra) => {
            const status = STATUS_MAP[obra.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.PLANEJAMENTO
            return (
              <Link
                key={obra.id}
                href={`/obras/${obra.id}`}
                className="flex items-center gap-5 p-4 bg-white border border-[var(--border)] rounded-2xl hover:bg-[var(--muted)] transition-colors no-underline"
              >
                {/* Imagem Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                  {obra.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={obra.imagemUrl} alt={obra.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HardHat size={20} className="text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                      {obra.nome}
                    </h3>
                    <span className={status.badgeClass}>{status.label}</span>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Progress */}
                    <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                      <span className="text-xs font-semibold w-8">{obra.progresso}%</span>
                      <div className="h-1.5 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", getProgressColorClass(obra.progresso))}
                          style={{ width: `${obra.progresso}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 border-l border-[var(--border)] pl-6">
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <FileText size={14} className="text-[var(--text-muted)]" />
                        <span className="text-[12px] font-medium">{obra._count.rdos} RDOs</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <MessageSquare size={14} className="text-[var(--text-muted)]" />
                        <span className="text-[12px] font-medium">{obra._count.ocorrencias} Ocorrências</span>
                      </div>
                    </div>

                    {/* Local */}
                    {(obra.cidade || obra.estado) && (
                      <div className="hidden md:flex items-center gap-1.5 text-[var(--text-muted)] border-l border-[var(--border)] pl-6 ml-auto">
                        <MapPin size={14} />
                        <span className="text-[12px] font-medium">
                          {[obra.cidade, obra.estado].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
