"use client"

import Link from "next/link"
import { Key, Settings, CheckCircle, Clock } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

function formatDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function getStatusConfig(status?: string) {
  const s = (status ?? "").toUpperCase()
  if (s.includes("REALIZ") || s === "DONE" || s === "COMPLETED") return { label: "Realizada", badge: "bg-green-100 text-green-700" }
  if (s.includes("PEND") || s === "PENDING") return { label: "Pendente", badge: "bg-amber-100 text-amber-700" }
  if (s.includes("CANCEL") || s === "CANCELLED") return { label: "Cancelada", badge: "bg-red-100 text-red-700" }
  if (s.includes("AGEND") || s === "SCHEDULED") return { label: "Agendada", badge: "bg-blue-100 text-blue-700" }
  return { label: status ?? "—", badge: "bg-gray-100 text-gray-600" }
}

export default function EntregaChavesPage() {
  const { data: entregas = [], isLoading } = trpc.sienge.listarEntregaChaves.useQuery()

  const semSienge = !isLoading && entregas.length === 0
  const realizadas = entregas.filter(e => getStatusConfig(e.status).label === "Realizada").length
  const pendentes  = entregas.filter(e => getStatusConfig(e.status).label === "Pendente").length

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Key size={22} className="text-blue-500" />
          Entrega de Chaves
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
          Registros de entrega de chaves de unidades
        </p>
      </div>

      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Key size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">Configure a integração para visualizar as entregas de chaves.</p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} /> Configurar Sienge
          </Link>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      )}

      {!isLoading && entregas.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Total Entregas</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{entregas.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1 flex items-center gap-1">
                <CheckCircle size={10} /> Realizadas
              </p>
              <p className="text-2xl font-bold text-green-700">{realizadas}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-1 flex items-center gap-1">
                <Clock size={10} /> Pendentes
              </p>
              <p className="text-2xl font-bold text-amber-700">{pendentes}</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1.5fr_2fr_100px_120px_80px] gap-3 px-5 py-2.5 border-b border-border bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>Unidade</span><span>Empreendimento</span><span>Cliente</span>
              <span>Data</span><span>Responsável</span><span className="text-center">Status</span>
            </div>
            <div className="divide-y divide-border">
              {entregas.map(e => {
                const cfg = getStatusConfig(e.status)
                return (
                  <div key={e.id} className="grid grid-cols-[1.5fr_1.5fr_2fr_100px_120px_80px] gap-3 px-5 py-3 items-center text-sm hover:bg-muted/30">
                    <p className="font-medium text-[var(--text-primary)] truncate">{e.unitName ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{e.buildingName ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{e.clientName ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDate(e.deliveryDate)}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{e.responsible ?? "—"}</p>
                    <div className="flex justify-center">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", cfg.badge)}>{cfg.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <p className="text-xs text-center text-[var(--text-muted)]">{entregas.length} entregas · Dados via Sienge</p>
        </>
      )}
    </div>
  )
}
