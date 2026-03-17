"use client"

import Link from "next/link"
import { Building2, Settings, CheckCircle2, XCircle } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

function formatCnpj(cnpj?: string) {
  if (!cnpj) return null
  const d = cnpj.replace(/\D/g, "")
  if (d.length !== 14) return cnpj
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

export default function EmpresasSiengePage() {
  const { data: empresas = [], isLoading } = trpc.sienge.listarEmpresas.useQuery()

  const semSienge = !isLoading && empresas.length === 0
  const ativas = empresas.filter(e => e.active !== false)
  const inativas = empresas.filter(e => e.active === false)

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Building2 size={22} className="text-blue-500" />
            Empresas (Sienge)
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">
              Sienge
            </span>
            Empresas cadastradas na plataforma Sienge
          </p>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty / Sienge not configured */}
      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Building2 size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Sienge não configurado
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            Configure a integração com o Sienge para visualizar as empresas.
          </p>
          <Link
            href="/configuracoes/integracoes"
            className="btn-orange inline-flex items-center gap-2"
          >
            <Settings size={14} /> Configurar Sienge
          </Link>
        </div>
      )}

      {/* KPI + cards */}
      {!isLoading && empresas.length > 0 && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">
                Total de Empresas
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{empresas.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1 flex items-center gap-1">
                <CheckCircle2 size={10} /> Ativas
              </p>
              <p className="text-2xl font-bold text-green-700">{ativas.length}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 mb-1 flex items-center gap-1">
                <XCircle size={10} /> Inativas
              </p>
              <p className="text-2xl font-bold text-red-600">{inativas.length}</p>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {empresas.map(empresa => (
              <div
                key={empresa.id}
                className={cn(
                  "bg-white border rounded-xl p-5 space-y-3 hover:shadow-sm transition-shadow",
                  empresa.active === false
                    ? "border-border opacity-60"
                    : "border-border"
                )}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#0055A5]/10 flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-[#0055A5]" />
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight">
                      {empresa.name}
                    </p>
                  </div>
                  {empresa.active === false ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-500 flex-shrink-0">
                      <XCircle size={9} /> Inativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-600 flex-shrink-0">
                      <CheckCircle2 size={9} /> Ativa
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-muted)] w-10 flex-shrink-0">ID</span>
                    <span className="font-mono text-[var(--text-primary)] bg-muted px-1.5 py-0.5 rounded text-[11px]">
                      #{empresa.id}
                    </span>
                  </div>
                  {empresa.cnpj && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-muted)] w-10 flex-shrink-0">CNPJ</span>
                      <span className="font-mono text-[var(--text-primary)]">
                        {formatCnpj(empresa.cnpj)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-[var(--text-muted)]">
            {empresas.length} {empresas.length === 1 ? "empresa" : "empresas"} · Dados via Sienge
          </p>
        </>
      )}
    </div>
  )
}
