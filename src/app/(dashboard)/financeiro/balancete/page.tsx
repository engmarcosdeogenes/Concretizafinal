"use client"

import { useState } from "react"
import Link from "next/link"
import { BarChart2, Settings, Download, TrendingUp, TrendingDown } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function getMesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function competenciaParaLabel(c: string) {
  const [ano, mes] = c.split("-")
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  return `${meses[parseInt(mes) - 1]} / ${ano}`
}

function competenciaParaApi(c: string) {
  const [ano, mes] = c.split("-")
  const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate()
  return `${ultimoDia}/${mes}/${ano}`
}

type BalanceteRow = { accountCode?: string; accountName?: string; previousDebitBalance?: number; previousCreditBalance?: number; currentDebit?: number; currentCredit?: number; finalDebitBalance?: number; finalCreditBalance?: number }

async function exportarExcel(dados: BalanceteRow[], competencia: string) {
  const xlsx = await import("xlsx")
  const rows = (dados ?? []).map(r => ({
    "Código": r.accountCode ?? "",
    "Conta": r.accountName ?? "",
    "Saldo Ant. Déb.": r.previousDebitBalance ?? 0,
    "Saldo Ant. Créd.": r.previousCreditBalance ?? 0,
    "Movimento Déb.": r.currentDebit ?? 0,
    "Movimento Créd.": r.currentCredit ?? 0,
    "Saldo Final Déb.": r.finalDebitBalance ?? 0,
    "Saldo Final Créd.": r.finalCreditBalance ?? 0,
  }))
  const ws = xlsx.utils.json_to_sheet(rows)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, "Balancete")
  xlsx.writeFile(wb, `balancete_${competencia}.xlsx`)
}

export default function BalancetePage() {
  const [competencia, setCompetencia] = useState(getMesAtual())
  const { data: contas = [], isLoading } = trpc.sienge.listarBalancete.useQuery({ competencia: competenciaParaApi(competencia) })

  const semSienge = !isLoading && contas.length === 0

  const totalDebito = contas.reduce((s, c) => s + (c.finalDebitBalance ?? 0), 0)
  const totalCredito = contas.reduce((s, c) => s + (c.finalCreditBalance ?? 0), 0)
  const totalMovDebit = contas.reduce((s, c) => s + (c.currentDebit ?? 0), 0)
  const totalMovCredit = contas.reduce((s, c) => s + (c.currentCredit ?? 0), 0)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart2 size={22} className="text-blue-500" />
            Balancete
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
            Balancete de verificação contábil por competência
          </p>
        </div>
        {contas.length > 0 && (
          <button
            type="button"
            onClick={() => exportarExcel(contas, competencia)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-xs font-medium text-[var(--text-primary)] hover:border-orange-300 transition-all"
          >
            <Download size={14} /> Exportar Excel
          </button>
        )}
      </div>

      {/* Filtro de competência */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Competência:</label>
        <input
          type="month"
          value={competencia}
          onChange={e => setCompetencia(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:border-orange-400"
        />
        <span className="text-sm text-[var(--text-muted)]">{competenciaParaLabel(competencia)}</span>
      </div>

      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <BarChart2 size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">Configure a integração para visualizar o balancete.</p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} /> Configurar Sienge
          </Link>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      )}

      {!isLoading && contas.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 mb-1 flex items-center gap-1">
                <TrendingDown size={10} /> Mov. Débito
              </p>
              <p className="text-xl font-bold text-blue-700">{formatMoeda(totalMovDebit)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1 flex items-center gap-1">
                <TrendingUp size={10} /> Mov. Crédito
              </p>
              <p className="text-xl font-bold text-green-700">{formatMoeda(totalMovCredit)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Saldo Final Déb.</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{formatMoeda(totalDebito)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Saldo Final Créd.</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{formatMoeda(totalCredito)}</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[80px_2fr_120px_120px_120px_120px_120px_120px] gap-2 px-4 py-2.5 border-b border-border bg-muted text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>Código</span><span>Conta</span>
              <span className="text-right">S.Ant. Déb.</span><span className="text-right">S.Ant. Créd.</span>
              <span className="text-right">Mov. Déb.</span><span className="text-right">Mov. Créd.</span>
              <span className="text-right">S.Final Déb.</span><span className="text-right">S.Final Créd.</span>
            </div>
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {contas.map((c, i) => (
                <div key={i} className="grid grid-cols-[80px_2fr_120px_120px_120px_120px_120px_120px] gap-2 px-4 py-2.5 items-center text-xs hover:bg-muted/30">
                  <p className="font-mono text-[var(--text-muted)] truncate">{c.accountCode ?? "—"}</p>
                  <p className="font-medium text-[var(--text-primary)] truncate">{c.accountName ?? "—"}</p>
                  <p className="text-right text-[var(--text-muted)]">{formatMoeda(c.previousDebitBalance ?? 0)}</p>
                  <p className="text-right text-[var(--text-muted)]">{formatMoeda(c.previousCreditBalance ?? 0)}</p>
                  <p className={cn("text-right font-medium", (c.currentDebit ?? 0) > 0 ? "text-blue-600" : "text-[var(--text-muted)]")}>
                    {formatMoeda(c.currentDebit ?? 0)}
                  </p>
                  <p className={cn("text-right font-medium", (c.currentCredit ?? 0) > 0 ? "text-green-600" : "text-[var(--text-muted)]")}>
                    {formatMoeda(c.currentCredit ?? 0)}
                  </p>
                  <p className="text-right font-semibold text-[var(--text-primary)]">{formatMoeda(c.finalDebitBalance ?? 0)}</p>
                  <p className="text-right font-semibold text-[var(--text-primary)]">{formatMoeda(c.finalCreditBalance ?? 0)}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-center text-[var(--text-muted)]">{contas.length} contas · Competência: {competenciaParaLabel(competencia)} · Dados via Sienge</p>
        </>
      )}
    </div>
  )
}
