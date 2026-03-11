"use client"

import { useState } from "react"
import Link from "next/link"
import { Warehouse, Settings, TrendingUp, Building2, Truck } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function getStatusConfig(status?: string) {
  const s = (status ?? "").toUpperCase()
  if (s.includes("ATIVO") || s === "ACTIVE") return { label: "Ativo", badge: "bg-green-100 text-green-700" }
  if (s.includes("INATIV") || s === "INACTIVE") return { label: "Inativo", badge: "bg-gray-100 text-gray-500" }
  if (s.includes("MANUT") || s === "MAINTENANCE") return { label: "Manutenção", badge: "bg-amber-100 text-amber-700" }
  if (s.includes("BAIXAD") || s === "WRITTEN_OFF") return { label: "Baixado", badge: "bg-red-100 text-red-700" }
  return { label: status ?? "—", badge: "bg-gray-100 text-gray-600" }
}

type Tab = "imoveis" | "moveis"

export default function PatrimonioPage() {
  const { data, isLoading } = trpc.sienge.listarPatrimonio.useQuery()
  const [tab, setTab] = useState<Tab>("imoveis")

  const imoveis = data?.imoveis ?? []
  const moveis = data?.moveis ?? []
  const semSienge = !isLoading && imoveis.length === 0 && moveis.length === 0

  const totalImoveis = imoveis.reduce((s, b) => s + (b.bookValue ?? 0), 0)
  const totalMoveis = moveis.reduce((s, b) => s + (b.bookValue ?? 0), 0)
  const totalPatrimonio = totalImoveis + totalMoveis

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Warehouse size={22} className="text-blue-500" />
          Patrimônio
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
          Bens imóveis e móveis cadastrados na empresa
        </p>
      </div>

      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Warehouse size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">Configure a integração para visualizar o patrimônio.</p>
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

      {!isLoading && (imoveis.length > 0 || moveis.length > 0) && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <TrendingUp size={10} /> Valor Total Patrimônio
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatMoeda(totalPatrimonio)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 mb-1 flex items-center gap-1">
                <Building2 size={10} /> Bens Imóveis
              </p>
              <p className="text-2xl font-bold text-blue-700">{imoveis.length}</p>
              <p className="text-xs text-blue-500 mt-0.5">{formatMoeda(totalImoveis)}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-600 mb-1 flex items-center gap-1">
                <Truck size={10} /> Bens Móveis
              </p>
              <p className="text-2xl font-bold text-purple-700">{moveis.length}</p>
              <p className="text-xs text-purple-500 mt-0.5">{formatMoeda(totalMoveis)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["imoveis", "moveis"] as Tab[]).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={cn("px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
                  tab === t ? "border-orange-500 text-orange-600" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}>
                {t === "imoveis" ? `Bens Imóveis (${imoveis.length})` : `Bens Móveis (${moveis.length})`}
              </button>
            ))}
          </div>

          {/* Bens Imóveis */}
          {tab === "imoveis" && (
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_150px_2fr] gap-3 px-5 py-2.5 border-b border-border bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                <span>Nome</span><span>Tipo</span><span className="text-right">Valor Contábil</span><span>Localização</span>
              </div>
              <div className="divide-y divide-border">
                {imoveis.length === 0
                  ? <p className="text-center text-sm text-[var(--text-muted)] py-8">Nenhum bem imóvel cadastrado.</p>
                  : imoveis.map(b => (
                    <div key={b.id} className="grid grid-cols-[2fr_1fr_150px_2fr] gap-3 px-5 py-3 items-center text-sm hover:bg-muted/30">
                      <p className="font-medium text-[var(--text-primary)] truncate">{b.name ?? "—"}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{b.type ?? "—"}</p>
                      <p className="text-right text-xs font-semibold text-[var(--text-primary)]">{formatMoeda(b.bookValue ?? 0)}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{b.location ?? "—"}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Bens Móveis */}
          {tab === "moveis" && (
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_150px_80px] gap-3 px-5 py-2.5 border-b border-border bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                <span>Nome</span><span>Tipo</span><span>Placa / Série</span><span className="text-right">Valor Contábil</span><span className="text-center">Status</span>
              </div>
              <div className="divide-y divide-border">
                {moveis.length === 0
                  ? <p className="text-center text-sm text-[var(--text-muted)] py-8">Nenhum bem móvel cadastrado.</p>
                  : moveis.map(b => {
                    const cfg = getStatusConfig(b.status)
                    return (
                      <div key={b.id} className="grid grid-cols-[2fr_1fr_1fr_150px_80px] gap-3 px-5 py-3 items-center text-sm hover:bg-muted/30">
                        <p className="font-medium text-[var(--text-primary)] truncate">{b.name ?? "—"}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{b.type ?? "—"}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{b.plate ?? "—"}</p>
                        <p className="text-right text-xs font-semibold text-[var(--text-primary)]">{formatMoeda(b.bookValue ?? 0)}</p>
                        <div className="flex justify-center">
                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", cfg.badge)}>{cfg.label}</span>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          )}

          <p className="text-xs text-center text-[var(--text-muted)]">
            {tab === "imoveis" ? imoveis.length : moveis.length} bens · Dados via Sienge
          </p>
        </>
      )}
    </div>
  )
}
