"use client"

import Link from "next/link"
import { TrendingDown, TrendingUp, AlertCircle, ArrowRight, Landmark } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"

export default function FinanceiroPage() {
  const { data: contasPagar = [] }   = trpc.sienge.listarContasPagar.useQuery()
  const { data: inadimplentes = [] } = trpc.sienge.listarInadimplentes.useQuery()
  const { data: saldos = [] }        = trpc.sienge.listarSaldos.useQuery()

  const totalPagar  = contasPagar.reduce((s: number, c) => s + (c.amount ?? 0), 0)
  const totalInad   = inadimplentes.reduce((s, i) => s + i.totalEmAberto, 0)
  const totalSaldos = saldos.reduce((s, c) => s + c.saldo, 0)

  const cards = [
    {
      title: "Contas a Pagar",
      desc:  "Pagamentos pendentes via Sienge",
      valor: formatMoeda(totalPagar),
      cor:   "bg-red-100",
      icorCor: "text-red-600",
      Icon:  TrendingDown,
      href:  "/financeiro/contas-pagar",
    },
    {
      title: "Contas a Receber",
      desc:  "Títulos e inadimplência via Sienge",
      valor: formatMoeda(totalInad) + " em atraso",
      cor:   "bg-emerald-100",
      icorCor: "text-emerald-600",
      Icon:  TrendingUp,
      href:  "/financeiro/recebimentos",
    },
    {
      title: "Inadimplência",
      desc:  `${inadimplentes.length} cliente(s) com atraso`,
      valor: inadimplentes.length > 0 ? `${inadimplentes.length} clientes` : "Nenhum",
      cor:   "bg-orange-100",
      icorCor: "text-orange-600",
      Icon:  AlertCircle,
      href:  "/financeiro/recebimentos",
    },
    {
      title: "Saldos Bancários",
      desc:  `${saldos.length} conta(s) via Sienge`,
      valor: formatMoeda(totalSaldos),
      cor:   totalSaldos >= 0 ? "bg-blue-100" : "bg-red-100",
      icorCor: totalSaldos >= 0 ? "text-blue-600" : "text-red-600",
      Icon:  Landmark,
      href:  "/financeiro/caixa",
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Financeiro</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Visão financeira consolidada da empresa</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white border border-border rounded-xl p-5 hover:border-orange-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${card.cor} rounded-xl flex items-center justify-center`}>
                <card.Icon size={18} className={card.icorCor} />
              </div>
              <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-orange-500 transition-colors" />
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-1">{card.desc}</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{card.valor}</p>
            <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{card.title}</p>
          </Link>
        ))}
      </div>

      <div className="bg-slate-50 border border-border rounded-xl p-5 text-sm text-[var(--text-muted)]">
        <p className="font-medium text-[var(--text-primary)] mb-1">Financeiro por Obra</p>
        <p>Para ver o financeiro detalhado de uma obra específica (DRE, contas a pagar, fluxo de caixa), acesse a obra e clique na aba "Financeiro".</p>
      </div>
    </div>
  )
}
