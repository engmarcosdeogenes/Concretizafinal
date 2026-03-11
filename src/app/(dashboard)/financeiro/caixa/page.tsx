"use client"

import Link from "next/link"
import { Landmark, Settings, TrendingUp, TrendingDown } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function CaixaPage() {
  const { data: contas = [], isLoading } = trpc.sienge.listarSaldos.useQuery()

  const totalSaldo = contas.reduce((s, c) => s + c.saldo, 0)
  const positivas  = contas.filter((c) => c.saldo > 0).length
  const negativas  = contas.filter((c) => c.saldo < 0).length

  const semSienge = !isLoading && contas.length === 0

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Landmark size={22} className="text-blue-500" />
          Saldos Bancários
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
          Saldos em tempo real via integração
        </p>
      </div>

      {/* Empty state */}
      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Landmark size={36} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
            Configure a integração para visualizar os saldos bancários da empresa.
          </p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} />
            Configurar Sienge
          </Link>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && contas.length > 0 && (
        <>
          {/* KPI Total */}
          <div className={cn(
            "rounded-xl border p-5 flex items-center justify-between",
            totalSaldo >= 0
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          )}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">
                Saldo Total Consolidado
              </p>
              <p className={cn(
                "text-3xl font-extrabold",
                totalSaldo >= 0 ? "text-green-700" : "text-red-700"
              )}>
                {formatMoeda(totalSaldo)}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {contas.length} conta(s) · {positivas} positiva(s) · {negativas} negativa(s)
              </p>
            </div>
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              totalSaldo >= 0 ? "bg-green-100" : "bg-red-100"
            )}>
              {totalSaldo >= 0
                ? <TrendingUp size={26} className="text-green-600" />
                : <TrendingDown size={26} className="text-red-600" />
              }
            </div>
          </div>

          {/* Grid de contas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contas.map((c) => {
              const positivo = c.saldo >= 0
              return (
                <div
                  key={c.id}
                  className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.name}</p>
                      {c.bankName && (
                        <p className="text-xs text-[var(--text-muted)] truncate">{c.bankName}</p>
                      )}
                      {c.accountNumber && (
                        <p className="text-xs text-[var(--text-muted)] font-mono">Ag/Cc: {c.accountNumber}</p>
                      )}
                    </div>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0",
                      positivo
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}>
                      {positivo ? "+" : ""}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xl font-bold",
                    positivo ? "text-green-700" : "text-red-700"
                  )}>
                    {formatMoeda(c.saldo)}
                  </p>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-center text-[var(--text-muted)]">
            Dados fornecidos em tempo real pelo Sienge
          </p>
        </>
      )}
    </div>
  )
}
