"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, FileBarChart, Download, Settings, TrendingDown } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function formatDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function exportarExcel(dados: { credor: string; qtd: number; total: number }[], titulo: string) {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(
      dados.map((d) => ({
        Credor: d.credor,
        "Qtd. Títulos": d.qtd,
        "Total (R$)": d.total.toFixed(2),
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Gastos por Fornecedor")
    XLSX.writeFile(wb, `gastos-${titulo.replace(/\s+/g, "-").toLowerCase()}.xlsx`)
  })
}

export default function GastosObraPage() {
  const [obraId, setObraId] = useState("")

  const { data: obras = [] }  = trpc.obra.listar.useQuery()
  const { data: contas = [], isLoading } = trpc.sienge.listarContasPagar.useQuery()

  const obraSelecionada = obras.find((o) => o.id === obraId)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // KPIs globais (todos os títulos, independente de obra — Sienge não filtra por obra no endpoint)
  const totalGeral   = contas.reduce((s, c) => s + (c.amount ?? 0), 0)
  const totalPago    = contas.filter((c) => {
    const s = (c.status ?? "").toUpperCase()
    return s.includes("PAG") || s === "PAID"
  }).reduce((s, c) => s + (c.amount ?? 0), 0)
  const totalVencido = contas.filter((c) => {
    const due = c.dueDate ? new Date(c.dueDate) : null
    const s   = (c.status ?? "").toUpperCase()
    const pago = s.includes("PAG") || s === "PAID"
    return due && due < hoje && !pago
  }).reduce((s, c) => s + (c.amount ?? 0), 0)

  // Agrupar por credor/fornecedor
  const porCredor = useMemo(() => {
    const map = new Map<string, { credor: string; qtd: number; total: number }>()
    contas.forEach((c) => {
      const nome = c.creditorName ?? "Sem credor"
      const entry = map.get(nome) ?? { credor: nome, qtd: 0, total: 0 }
      entry.qtd++
      entry.total += c.amount ?? 0
      map.set(nome, entry)
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [contas])

  const semSienge = !isLoading && contas.length === 0

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/relatorios"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileBarChart size={22} className="text-orange-500" />
            Relatório de Gastos
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
            Contas a pagar consolidadas por fornecedor
          </p>
        </div>
        {!semSienge && porCredor.length > 0 && (
          <button
            type="button"
            onClick={() => exportarExcel(porCredor, obraSelecionada?.nome ?? "empresa")}
            className="btn-ghost flex items-center gap-2"
          >
            <Download size={14} />
            Exportar Excel
          </button>
        )}
      </div>

      {/* Seletor de obra */}
      <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
        <label className="text-sm font-medium text-[var(--text-primary)] whitespace-nowrap">Filtrar por obra:</label>
        <select
          value={obraId}
          onChange={(e) => setObraId(e.target.value)}
          className="flex-1 h-9 px-3 border border-border rounded-lg text-sm text-[var(--text-primary)] bg-white outline-none focus:border-orange-400"
        >
          <option value="">Toda a empresa</option>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
        {obraId && obraSelecionada && (
          <span className="text-xs text-[var(--text-muted)]">
            Sienge ID: {obraSelecionada.siengeId ?? "—"}
          </span>
        )}
      </div>

      {/* Empty state Sienge */}
      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <FileBarChart size={36} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
            Configure a integração para gerar o relatório de gastos.
          </p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} />
            Configurar Sienge
          </Link>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && contas.length > 0 && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide font-semibold mb-1">Total a Pagar</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{formatMoeda(totalGeral)}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{contas.length} títulos</p>
            </div>
            <div className="bg-white border border-green-200 rounded-xl p-4">
              <p className="text-[10px] text-green-600 uppercase tracking-wide font-semibold mb-1">Total Pago</p>
              <p className="text-xl font-bold text-green-700">{formatMoeda(totalPago)}</p>
            </div>
            <div className="bg-white border border-red-200 rounded-xl p-4">
              <p className="text-[10px] text-red-600 uppercase tracking-wide font-semibold mb-1">Total Vencido</p>
              <p className="text-xl font-bold text-red-700">{formatMoeda(totalVencido)}</p>
            </div>
          </div>

          {/* Tabela por fornecedor */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                Por Fornecedor / Credor — top {porCredor.length}
              </p>
            </div>
            <div className="grid grid-cols-[1fr_80px_130px] gap-4 px-5 py-2.5 border-b border-border text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>Credor</span>
              <span className="text-center">Títulos</span>
              <span className="text-right">Total</span>
            </div>
            <div className="divide-y divide-border">
              {porCredor.map((item, i) => (
                <div key={item.credor} className={cn(
                  "grid grid-cols-[1fr_80px_130px] gap-4 px-5 py-3 items-center text-sm",
                  i % 2 === 1 ? "bg-muted/30" : ""
                )}>
                  <p className="font-medium text-[var(--text-primary)] truncate">{item.credor}</p>
                  <p className="text-center text-[var(--text-muted)]">{item.qtd}</p>
                  <p className="text-right font-semibold text-[var(--text-primary)]">{formatMoeda(item.total)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Títulos individuais */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                Todos os Títulos ({contas.length})
              </p>
            </div>
            <div className="grid grid-cols-[1fr_1fr_130px_110px_90px] gap-3 px-4 py-2.5 border-b border-border text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>Credor</span>
              <span>Documento</span>
              <span>Vencimento</span>
              <span className="text-right">Valor</span>
              <span className="text-center">Status</span>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {contas.map((c) => {
                const due = c.dueDate ? new Date(c.dueDate) : null
                const s   = (c.status ?? "").toUpperCase()
                const pago = s.includes("PAG") || s === "PAID"
                const vencido = due && due < hoje && !pago
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "grid grid-cols-[1fr_1fr_130px_110px_90px] gap-3 px-4 py-2.5 items-center text-sm",
                      vencido ? "bg-red-50/40" : pago ? "opacity-60" : "hover:bg-muted/30"
                    )}
                  >
                    <p className="font-medium text-[var(--text-primary)] truncate text-xs">{c.creditorName ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono truncate">{c.documentNumber ?? "—"}</p>
                    <p className={cn("text-xs", vencido ? "text-red-600 font-semibold" : "text-[var(--text-muted)]")}>
                      {formatDate(c.dueDate)}
                    </p>
                    <p className="text-right text-xs font-semibold text-[var(--text-primary)]">{formatMoeda(c.amount ?? 0)}</p>
                    <div className="flex justify-center">
                      {pago ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Pago</span>
                      ) : vencido ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Vencido</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Aberto</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">
              Dados via Sienge · {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <button
              type="button"
              onClick={() => exportarExcel(porCredor, obraSelecionada?.nome ?? "empresa")}
              className="btn-ghost flex items-center gap-2 text-xs"
            >
              <Download size={13} />
              Exportar Excel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
