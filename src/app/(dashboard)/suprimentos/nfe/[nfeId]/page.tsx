"use client"

import { use, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, FileText, Building2, Calendar, Hash,
  CreditCard, Package, ChevronDown, ChevronRight,
  ExternalLink, AlertCircle, Loader2,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatDataCurta, formatMoeda, formatNumero } from "@/lib/format"

const STATUS_COLORS: Record<string, string> = {
  AUTORIZADA:  "bg-emerald-100 text-emerald-700",
  CANCELADA:   "bg-red-100 text-red-700",
  DENEGADA:    "bg-red-100 text-red-700",
  INUTILIZADA: "bg-slate-100 text-slate-600",
}

/* ─── Seção colapsável de impostos ─────────────────────────────────── */
function ImpostoRow({
  label, base, aliquota, valor,
}: {
  label: string
  base?: number
  aliquota?: number
  valor?: number
}) {
  if ((valor ?? 0) === 0) return null
  return (
    <div className="grid grid-cols-[100px_1fr_1fr_1fr] gap-2 text-sm py-2 border-b border-border last:border-0">
      <span className="font-semibold text-[var(--text-primary)]">{label}</span>
      <span className="text-right text-[var(--text-muted)]">{base !== undefined ? formatMoeda(base) : "—"}</span>
      <span className="text-right text-[var(--text-muted)]">{aliquota !== undefined ? `${formatNumero(aliquota, 2)}%` : "—"}</span>
      <span className="text-right font-semibold text-[var(--text-primary)]">{valor !== undefined ? formatMoeda(valor) : "—"}</span>
    </div>
  )
}

/* ─── Página principal ─────────────────────────────────────────────── */
export default function NFeDetalhePage({ params }: { params: Promise<{ nfeId: string }> }) {
  const { nfeId: nfeIdStr } = use(params)
  const nfeId = Number(nfeIdStr)

  const [acordionOpen, setAcordionOpen] = useState(false)

  const { data: nfe, isLoading, isError } = trpc.sienge.buscarNFeDetalhe.useQuery(
    { nfeId },
    { enabled: !isNaN(nfeId), retry: false },
  )

  const { data: pagamentos = [], isLoading: loadingPag } = trpc.sienge.buscarNFePayments.useQuery(
    { chaveAcesso: nfe?.chaveAcesso ?? "" },
    { enabled: !!nfe?.chaveAcesso },
  )

  /* ── Loading ───────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Link
          href="/suprimentos/nfe"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Notas Fiscais
        </Link>
        <div className="flex items-center justify-center py-24 text-[var(--text-muted)]">
          <Loader2 size={24} className="animate-spin mr-3" />
          Carregando nota fiscal...
        </div>
      </div>
    )
  }

  /* ── Erro ──────────────────────────────────────────────────────── */
  if (isError || !nfe) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        <Link
          href="/suprimentos/nfe"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Notas Fiscais
        </Link>
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} />
          <div>
            <p className="font-semibold">Nota fiscal não encontrada</p>
            <p className="text-xs mt-0.5 text-red-500">
              Verifique se a integração com o Sienge está configurada e se o ID {nfeId} é válido.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const temImpostos =
    nfe.totalIcms > 0 || nfe.totalIpi > 0 ||
    nfe.totalPis > 0 || nfe.totalCofins > 0 || nfe.totalIssqn > 0

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Voltar */}
      <Link
        href="/suprimentos/nfe"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Notas Fiscais
      </Link>

      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <FileText size={20} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Nota Fiscal #{nfeId}
            </h1>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-semibold",
              STATUS_COLORS[nfe.status] ?? "bg-slate-100 text-slate-600"
            )}>
              {nfe.status}
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
              via Sienge
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            NF-e {nfe.numero}{nfe.serie ? ` · Série ${nfe.serie}` : ""}
            {nfe.naturezaOperacao ? ` · ${nfe.naturezaOperacao}` : ""}
          </p>
        </div>
        {nfe.chaveAcesso && (
          <a
            href={`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&nfe=${nfe.chaveAcesso}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-lg text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 transition-all"
            title="Consultar na SEFAZ"
          >
            <ExternalLink size={12} /> SEFAZ
          </a>
        )}
      </div>

      {/* Dados Gerais */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Hash size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Dados Gerais</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Número / Série</p>
            <p className="font-semibold text-[var(--text-primary)]">
              {nfe.numero}{nfe.serie ? ` / ${nfe.serie}` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Emissão</p>
            <p className="flex items-center gap-1 text-[var(--text-primary)]">
              <Calendar size={12} className="text-slate-400" />
              {nfe.dataEmissao ? formatDataCurta(nfe.dataEmissao) : "—"}
            </p>
          </div>
          {nfe.dataEntrada && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-0.5">Entrada</p>
              <p className="flex items-center gap-1 text-[var(--text-primary)]">
                <Calendar size={12} className="text-slate-400" />
                {formatDataCurta(nfe.dataEntrada)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Fornecedor</p>
            <p className="flex items-center gap-1 text-[var(--text-primary)] font-semibold">
              <Building2 size={12} className="text-slate-400 flex-shrink-0" />
              <span className="truncate">{nfe.fornecedorNome || "—"}</span>
            </p>
          </div>
          {nfe.fornecedorCnpj && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-0.5">CNPJ Fornecedor</p>
              <p className="font-mono text-[var(--text-primary)]">{nfe.fornecedorCnpj}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Valor Total</p>
            <p className="text-lg font-extrabold text-[var(--text-primary)]">{formatMoeda(nfe.valor)}</p>
          </div>
        </div>
        {nfe.chaveAcesso && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-[var(--text-muted)] mb-1">Chave de Acesso</p>
            <p className="font-mono text-xs text-[var(--text-primary)] break-all bg-slate-50 p-2 rounded-lg">
              {nfe.chaveAcesso}
            </p>
          </div>
        )}
      </div>

      {/* Itens */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <Package size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Itens da Nota</h2>
          <span className="ml-auto text-xs text-[var(--text-muted)] bg-slate-100 px-2 py-0.5 rounded-full">
            {nfe.itens.length} {nfe.itens.length === 1 ? "item" : "itens"}
          </span>
        </div>

        {nfe.itens.length === 0 ? (
          <div className="flex items-center gap-2 p-5 text-sm text-[var(--text-muted)]">
            <AlertCircle size={14} />
            Nenhum item encontrado para esta nota fiscal.
          </div>
        ) : (
          <div>
            {/* Cabeçalho */}
            <div className="hidden md:grid grid-cols-[1fr_80px_100px_100px_120px] gap-3 px-5 py-2.5 bg-slate-50 border-b border-border text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>Produto / NCM</span>
              <span className="text-right">Qtd</span>
              <span className="text-right">Vl. Unit.</span>
              <span className="text-right">Vl. Total</span>
              <span className="text-right">ICMS / IPI</span>
            </div>
            <div className="divide-y divide-border">
              {nfe.itens.map((item) => (
                <div
                  key={item.itemId}
                  className="px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="grid md:grid-cols-[1fr_80px_100px_100px_120px] gap-3 items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.materialNome}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.ncm && (
                          <span className="text-[10px] text-[var(--text-muted)] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            NCM {item.ncm}
                          </span>
                        )}
                        {item.cfop && (
                          <span className="text-[10px] text-[var(--text-muted)] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            CFOP {item.cfop}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--text-muted)]">{item.unidade}</span>
                      </div>
                    </div>
                    <p className="text-sm text-right text-[var(--text-primary)]">
                      {formatNumero(item.quantidade, 2)}
                    </p>
                    <p className="text-sm text-right text-[var(--text-primary)]">
                      {formatMoeda(item.valorUnitario)}
                    </p>
                    <p className="text-sm text-right font-semibold text-[var(--text-primary)]">
                      {formatMoeda(item.valorTotal)}
                    </p>
                    <div className="text-right text-xs text-[var(--text-muted)]">
                      {item.icms && item.icms.valor > 0 && (
                        <p>ICMS {formatMoeda(item.icms.valor)}</p>
                      )}
                      {item.ipi && item.ipi.valor > 0 && (
                        <p>IPI {formatMoeda(item.ipi.valor)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Totais dos itens */}
            <div className="px-5 py-3 bg-slate-50 border-t border-border flex items-center justify-end gap-6 text-sm">
              <span className="text-[var(--text-muted)]">Total dos itens:</span>
              <span className="font-extrabold text-[var(--text-primary)] text-base">
                {formatMoeda(nfe.itens.reduce((s, i) => s + i.valorTotal, 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pagamentos */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <CreditCard size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Formas de Pagamento</h2>
          {loadingPag && <Loader2 size={13} className="animate-spin text-[var(--text-muted)] ml-auto" />}
        </div>

        {!nfe.chaveAcesso ? (
          <div className="flex items-center gap-2 p-5 text-sm text-[var(--text-muted)]">
            <AlertCircle size={14} />
            Chave de acesso não disponível — não é possível buscar formas de pagamento.
          </div>
        ) : loadingPag ? (
          <div className="divide-y divide-border">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : pagamentos.length === 0 ? (
          <div className="p-5 text-sm text-[var(--text-muted)]">
            Nenhuma forma de pagamento registrada.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pagamentos.map((p, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {p.description ?? p.paymentMethod ?? "Pagamento"}
                  </p>
                  {p.dueDate && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Vencimento: {formatDataCurta(p.dueDate)}
                    </p>
                  )}
                </div>
                {p.value !== undefined && (
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {formatMoeda(p.value)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ICMS / Impostos — accordion */}
      {temImpostos && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setAcordionOpen(o => !o)}
            className="w-full flex items-center gap-2 px-5 py-3.5 border-b border-border hover:bg-slate-50 transition-colors"
          >
            <FileText size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">ICMS / Impostos</h2>
            <span className="ml-auto text-xs text-[var(--text-muted)] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
              Total: {formatMoeda(nfe.totalIcms + nfe.totalIpi + nfe.totalPis + nfe.totalCofins + nfe.totalIssqn)}
            </span>
            {acordionOpen
              ? <ChevronDown size={15} className="text-[var(--text-muted)] ml-1" />
              : <ChevronRight size={15} className="text-[var(--text-muted)] ml-1" />
            }
          </button>

          {acordionOpen && (
            <div className="px-5 py-4">
              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-[100px_1fr_1fr_1fr] gap-2 pb-1 mb-1 border-b border-border text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                <span>Imposto</span>
                <span className="text-right">Base Cálculo</span>
                <span className="text-right">Alíquota</span>
                <span className="text-right">Valor</span>
              </div>
              <ImpostoRow
                label="ICMS"
                base={nfe.totalBaseIcms}
                valor={nfe.totalIcms}
              />
              <ImpostoRow
                label="IPI"
                valor={nfe.totalIpi}
              />
              <ImpostoRow
                label="PIS"
                valor={nfe.totalPis}
              />
              <ImpostoRow
                label="COFINS"
                valor={nfe.totalCofins}
              />
              <ImpostoRow
                label="ISSQN"
                valor={nfe.totalIssqn}
              />
            </div>
          )}
        </div>
      )}

    </div>
  )
}
