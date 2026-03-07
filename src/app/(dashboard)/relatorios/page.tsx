"use client"

import { useState } from "react"
import Link from "next/link"
import {
  FileText, ClipboardList, AlertTriangle, CheckSquare,
  DollarSign, Printer, ChevronRight, HardHat,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

const TIPOS_RELATORIO = [
  {
    id: "rdo",
    title: "Diário de Obra (RDO)",
    description: "Atividades, equipe e clima registrados por data",
    icon: ClipboardList,
    color: "#16a34a",
    bg: "#dcfce7",
  },
  {
    id: "ocorrencias",
    title: "Ocorrências",
    description: "Registro de ocorrências abertas e resolvidas",
    icon: AlertTriangle,
    color: "#dc2626",
    bg: "#fef2f2",
  },
  {
    id: "fvs",
    title: "Inspeções FVS",
    description: "Fichas de verificação de serviço por obra",
    icon: CheckSquare,
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Receitas, despesas e saldo por obra",
    icon: DollarSign,
    color: "#2563eb",
    bg: "#eff6ff",
  },
]

export default function RelatoriosPage() {
  const [obraId, setObraId]   = useState("")
  const [tipo, setTipo]       = useState<string | null>(null)

  const { data: obras = [] }  = trpc.obra.listar.useQuery()
  const obraSel               = obras.find(o => o.id === obraId)

  function gerarRelatorio() {
    if (!tipo) return
    const url = obraId
      ? `/relatorios/preview?tipo=${tipo}&obraId=${obraId}`
      : `/relatorios/preview?tipo=${tipo}`
    window.open(url, "_blank")
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[var(--text-primary)] font-bold text-xl">Relatórios</h1>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">Gere relatórios prontos para impressão</p>
      </div>

      {/* Tipo de relatório */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">1. Escolha o tipo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIPOS_RELATORIO.map(({ id, title, description, icon: Icon, color, bg }) => (
            <button key={id} onClick={() => setTipo(id)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                tipo === id
                  ? "border-orange-500 bg-orange-50"
                  : "border-[var(--border)] hover:bg-[var(--muted)]"
              }`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de obra */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">2. Filtrar por obra (opcional)</h2>
        <select
          value={obraId}
          onChange={e => setObraId(e.target.value)}
          className="w-full sm:max-w-sm px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all">
          <option value="">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        {obraSel && (
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Obra selecionada: <span className="font-medium text-[var(--text-primary)]">{obraSel.nome}</span>
          </p>
        )}
      </div>

      {/* Gerar */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">3. Gerar relatório</h2>
        <div className="flex items-center gap-3">
          <button onClick={gerarRelatorio} disabled={!tipo}
            className="btn-orange min-h-[44px] disabled:opacity-50 cursor-pointer">
            <Printer size={15} />
            Gerar e Imprimir
          </button>
          {!tipo && (
            <p className="text-xs text-[var(--text-muted)]">Selecione o tipo de relatório primeiro</p>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          O relatório será aberto em uma nova aba pronto para impressão ou exportação como PDF pelo navegador.
        </p>
      </div>

      {/* Atalhos por obra */}
      {obras.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Acesso rápido por obra</h2>
          </div>
          {obras.slice(0, 6).map(obra => (
            <div key={obra.id} className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                  <HardHat size={14} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{obra.nome}</p>
                  {obra.dataFim && <p className="text-[11px] text-[var(--text-muted)]">Entrega: {formatDataCurta(obra.dataFim)}</p>}
                </div>
              </div>
              <div className="flex gap-1.5">
                {[
                  { label: "RDO",  href: `/obras/${obra.id}/rdo` },
                  { label: "FVS",  href: `/obras/${obra.id}/fvs` },
                  { label: "R$",   href: `/obras/${obra.id}/financeiro` },
                ].map(({ label, href }) => (
                  <Link key={label} href={href}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors cursor-pointer">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
