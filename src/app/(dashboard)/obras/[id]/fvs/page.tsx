"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { CheckCircle2, XCircle, Clock, Plus, Search, Filter, FileText, Calendar, Eye, Edit2, Trash2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { cn } from "@/lib/utils"

const STATUS_MAP = {
  PENDENTE: { label: "Pendente", badgeClass: "badge badge-gray", Icon: Clock },
  EM_INSPECAO: { label: "Em Inspeção", badgeClass: "badge badge-yellow", Icon: Clock },
  APROVADO: { label: "Aprovado", badgeClass: "badge badge-green", Icon: CheckCircle2 },
  REJEITADO: { label: "Rejeitado", badgeClass: "badge badge-red", Icon: XCircle },
  RETRABALHO: { label: "Retrabalho", badgeClass: "badge badge-gray", Icon: Clock },
}

export default function FvsPage() {
  const params = useParams()
  const obraId = params.id as string

  const { data: fvsList = [], isLoading } = trpc.fvs.listar.useQuery({ obraId })

  const total = fvsList.length
  const aprovados = fvsList.filter(f => f.status === "APROVADO").length
  const inspecao = fvsList.filter(f => f.status === "EM_INSPECAO" || f.status === "PENDENTE").length
  const rejeitados = fvsList.filter(f => f.status === "REJEITADO" || f.status === "RETRABALHO").length

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Fichas de Verificação de Serviço (FVS)</h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-1">
            Gerencie as inspeções de qualidade dos serviços executados
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">Aprovados</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{aprovados}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Clock size={24} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">Em Inspeção</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{inspecao}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <XCircle size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">Rejeitados</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{rejeitados}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <FileText size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">Total FVS</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{total}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white border border-[var(--border)] p-2 rounded-[var(--radius-lg)] shadow-sm">
        <label className="flex items-center gap-2 px-3 h-[40px] flex-1">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar fichas de serviço..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </label>

        <div className="hidden md:block w-px h-6 bg-[var(--border)]" />

        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center w-10 h-10 rounded-[var(--radius)] text-[var(--text-secondary)] hover:bg-[var(--muted)] transition-colors">
            <Filter size={18} />
          </button>

          <select className="h-10 px-3 bg-transparent border border-[var(--border)] rounded-[var(--radius)] text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer">
            <option>Todos</option>
            <option>Aprovados</option>
            <option>Em Inspeção</option>
            <option>Rejeitados</option>
          </select>

          <Link href={`/obras/${obraId}/fvs/nova`} className="btn-primary h-10 ml-2">
            <Plus size={16} />
            Nova FVS
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] shadow-sm overflow-x-auto">
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-slate-50/50">
              <th className="px-6 py-4 text-[13px] font-semibold text-[var(--text-muted)] whitespace-nowrap">Código</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-[var(--text-muted)] whitespace-nowrap">Serviço</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-[var(--text-muted)] whitespace-nowrap">Responsável</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-[var(--text-muted)] whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-[var(--text-muted)] whitespace-nowrap">Data</th>
              <th className="px-6 py-4 text-[13px] font-semibold text-[var(--text-muted)] whitespace-nowrap text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-[var(--text-muted)]">
                  Carregando fichas...
                </td>
              </tr>
            )}

            {!isLoading && fvsList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <FileText size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma FVS encontrada</p>
                </td>
              </tr>
            )}

            {fvsList.map((fvs) => {
              const status = STATUS_MAP[fvs.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.PENDENTE
              const StatusIcon = status.Icon

              // Avatar Generation
              const initials = fvs.responsavel.nome
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()

              return (
                <tr key={fvs.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-[14px] font-medium text-[var(--blue)]">
                      {fvs.codigo || "—"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <FileText size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                      <span className="text-[14px] font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                        {fvs.servico}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-700 flex-shrink-0">
                        {initials}
                      </div>
                      <span className="text-[14px] text-[var(--text-secondary)] truncate max-w-[150px]">
                        {fvs.responsavel.nome}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={cn(status.badgeClass, "inline-flex items-center gap-1.5")}>
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Calendar size={14} className="text-[var(--text-muted)]" />
                      <span className="text-[13px]">{formatDataCurta(fvs.data)}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/obras/${obraId}/fvs/${fvs.id}`} className="p-2 text-[var(--text-secondary)] hover:text-[var(--blue)] rounded-md hover:bg-blue-50 transition-colors" title="Visualizar">
                        <Eye size={16} />
                      </Link>
                      <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-slate-100 transition-colors" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 text-[var(--text-secondary)] hover:text-red-600 rounded-md hover:bg-red-50 transition-colors" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
