"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, ExternalLink, Calendar, Building2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatDataCurta, formatMoeda } from "@/lib/format"

const STATUS_COLORS: Record<string, string> = {
  AUTORIZADA:  "bg-emerald-100 text-emerald-700",
  CANCELADA:   "bg-red-100 text-red-700",
  DENEGADA:    "bg-red-100 text-red-700",
  INUTILIZADA: "bg-slate-100 text-slate-600",
}

export default function NFePage() {
  const [obraFiltro, setObraFiltro] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim,    setDataFim]    = useState("")

  const { data: obras = [] } = trpc.obra.listar.useQuery({ grupo: undefined })

  const { data: nfes = [], isLoading } = trpc.sienge.listarNFe.useQuery({
    obraId:     obraFiltro || undefined,
    dataInicio: dataInicio || undefined,
    dataFim:    dataFim    || undefined,
  })

  const totalNFes  = nfes.length
  const totalValor = nfes.reduce((s, n) => s + n.valor, 0)

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <FileText size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notas Fiscais</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {totalNFes} NFe{totalNFes !== 1 ? "s" : ""} · Total {formatMoeda(totalValor)} via Sienge
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={obraFiltro}
          onChange={e => setObraFiltro(e.target.value)}
          className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-orange-400 cursor-pointer"
        >
          <option value="">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>

        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-[var(--text-muted)]" />
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-orange-400"
          />
          <span className="text-xs text-[var(--text-muted)]">até</span>
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : nfes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={32} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhuma nota fiscal encontrada</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Configure a integração com o Sienge ou ajuste os filtros.
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_1fr_80px_100px_32px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-border text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>NFe / Fornecedor</span>
              <span>Emissão</span>
              <span className="text-right">Valor</span>
              <span className="text-center">Status</span>
              <span />
            </div>
            <div className="divide-y divide-border">
              {nfes.map((nfe) => (
                <div key={nfe.id} className="grid grid-cols-[1fr_1fr_80px_100px_32px] gap-4 px-4 py-3 items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <Link
                      href={`/suprimentos/nfe/${nfe.id}`}
                      className="text-sm font-medium text-[var(--text-primary)] hover:text-orange-500 transition-colors"
                    >
                      NF-e {nfe.numero}{nfe.serie ? ` · Série ${nfe.serie}` : ""}
                    </Link>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                      <Building2 size={11} />
                      {nfe.fornecedorNome}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">{formatDataCurta(nfe.dataEmissao)}</p>
                    {nfe.dataEntrada && (
                      <p className="text-xs text-[var(--text-muted)]">Entrada: {formatDataCurta(nfe.dataEntrada)}</p>
                    )}
                  </div>
                  <p className="text-right text-sm font-semibold text-[var(--text-primary)]">
                    {formatMoeda(nfe.valor)}
                  </p>
                  <div className="flex justify-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      STATUS_COLORS[nfe.status] ?? "bg-slate-100 text-slate-600"
                    )}>
                      {nfe.status}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    {nfe.chaveAcesso && (
                      <a
                        href={`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&nfe=${nfe.chaveAcesso}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-orange-500 hover:bg-orange-50 transition-colors"
                        title="Consultar na SEFAZ"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
