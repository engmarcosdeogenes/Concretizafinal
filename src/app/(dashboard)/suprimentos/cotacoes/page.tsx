"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Tags, Settings, CheckCircle2, Clock, XCircle, Trophy, ExternalLink, Plus, Trash2, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const fmt = (v?: number | null) => v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—"

type CotacaoStatus = string | null | undefined

function StatusBadge({ status }: { status: CotacaoStatus }) {
  const s = (status ?? "").toUpperCase()
  if (s === "OPEN" || s === "ABERTA") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      <Clock size={10} />Aberta
    </span>
  )
  if (s === "CLOSED" || s === "FECHADA" || s === "ENCERRADA") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
      <CheckCircle2 size={10} />Fechada
    </span>
  )
  if (s === "CANCELED" || s === "CANCELADA") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      <XCircle size={10} />Cancelada
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
      {status ?? "—"}
    </span>
  )
}

function CotacaoRow({ item }: { item: {
  cotacao: { id: number; formattedId?: string | null; status?: string | null; buildingId?: number | null; openDate?: string | null; closingDate?: string | null; totalAmount?: number | null; notes?: string | null }
  respostas: { id: number; supplierId: number; supplierName?: string | null; totalAmount?: number | null; status?: string | null; deliveryDays?: number | null }[]
}}) {
  const [open, setOpen] = useState(false)

  // Menor preço
  const menorPreco = item.respostas.length > 0
    ? Math.min(...item.respostas.filter(r => r.totalAmount != null).map(r => r.totalAmount!))
    : null

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full grid grid-cols-[16px_1fr_120px_120px_120px_120px] gap-4 px-4 py-3 hover:bg-muted/50 transition-colors text-left items-center"
      >
        {open ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />}
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {item.cotacao.formattedId ?? `#${item.cotacao.id}`}
        </span>
        <StatusBadge status={item.cotacao.status} />
        <span className="text-sm text-[var(--text-muted)]">{fmtDate(item.cotacao.openDate)}</span>
        <span className="text-sm text-[var(--text-muted)]">{fmtDate(item.cotacao.closingDate)}</span>
        <span className="text-sm font-semibold text-[var(--text-primary)] text-right">{fmt(item.cotacao.totalAmount)}</span>
      </button>

      {open && (
        <div className="bg-muted/30 border-t border-border px-4 pb-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            {item.cotacao.notes && (
              <p className="text-xs text-[var(--text-muted)] italic flex-1">{item.cotacao.notes}</p>
            )}
            <a
              href={`/api/sienge/pdf/cotacao/${item.cotacao.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border hover:border-orange-300 hover:text-orange-500 text-xs font-medium rounded-lg transition-colors ml-auto flex-shrink-0"
              title="Baixar mapa comparativo de cotações"
            >
              <ExternalLink size={12} /> Mapa Comparativo PDF
            </a>
          </div>

          {item.respostas.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] italic">Nenhuma proposta recebida.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Fornecedor</th>
                    <th className="text-right px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-32">Valor Total</th>
                    <th className="text-right px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28">Prazo Entrega</th>
                    <th className="text-center px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-24">Status</th>
                    <th className="px-4 py-2 w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {item.respostas.map((r, i) => {
                    const isMenor = r.totalAmount != null && r.totalAmount === menorPreco && item.respostas.filter(x => x.totalAmount != null).length > 1
                    return (
                      <tr key={r.id} className={cn("border-t border-border", i % 2 === 1 ? "bg-muted/20" : "")}>
                        <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">
                          {r.supplierName ?? `Fornecedor ${r.supplierId}`}
                        </td>
                        <td className={cn("px-4 py-2.5 text-right font-semibold", isMenor ? "text-green-600" : "text-[var(--text-primary)]")}>
                          {fmt(r.totalAmount)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[var(--text-muted)]">
                          {r.deliveryDays != null ? `${r.deliveryDays} dias` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs text-[var(--text-muted)]">
                          {r.status ?? "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {isMenor && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
                              <Trophy size={9} />Menor preço
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type ItemForm = { descricao: string; materialId: string; quantidade: string; unidade: string }

function NovaCotacaoModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const { data: obrasData = [] } = trpc.obra.listar.useQuery({})
  const { data: fornsData } = trpc.fornecedor.listar.useQuery()
  const criar = trpc.sienge.criarCotacao.useMutation({
    onSuccess: () => { toast.success("Cotação criada no Sienge!"); onRefresh(); onClose() },
    onError:   (e) => toast.error(e.message ?? "Erro ao criar cotação"),
  })

  const obrasComSienge = obrasData.filter((o) => o.siengeId)
  const fornsComSienge = (fornsData?.fornecedores ?? []).filter((f) => f.siengeCreditorId != null)

  const [obraId,     setObraId]     = useState("")
  const [descricao,  setDescricao]  = useState("")
  const [itens,      setItens]      = useState<ItemForm[]>([{ descricao: "", materialId: "", quantidade: "1", unidade: "UN" }])
  const [fornIds,    setFornIds]    = useState<number[]>([])

  function addItem() { setItens(p => [...p, { descricao: "", materialId: "", quantidade: "1", unidade: "UN" }]) }
  function removeItem(i: number) { setItens(p => p.filter((_, idx) => idx !== i)) }
  function setItem(i: number, field: keyof ItemForm, val: string) {
    setItens(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  }
  function toggleForn(id: number) {
    setFornIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  function handleSubmit() {
    if (!obraId) { toast.error("Selecione uma obra"); return }
    if (itens.some(i => !i.descricao && !i.materialId)) { toast.error("Preencha a descrição ou ID do material em cada item"); return }
    if (fornIds.length === 0) { toast.error("Selecione pelo menos um fornecedor"); return }
    criar.mutate({
      obraId,
      descricao: descricao || undefined,
      itens: itens.map(i => ({
        descricao:   i.descricao || undefined,
        materialId:  i.materialId ? parseInt(i.materialId) : undefined,
        quantidade:  parseFloat(i.quantidade) || 1,
        unidade:     i.unidade || "UN",
      })),
      fornecedoresIds: fornIds,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">Nova Cotação no Sienge</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Cria a cotação no Sienge e notifica os fornecedores</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 flex-1">
          {/* Obra + Descrição */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Obra *</label>
              <select
                value={obraId}
                onChange={e => setObraId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                <option value="">Selecione a obra…</option>
                {obrasComSienge.map(o => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
              {obrasComSienge.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">Nenhuma obra vinculada ao Sienge.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Descrição</label>
              <input
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="ex: Estrutura bloco B"
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              />
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Itens *</label>
              <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                <Plus size={12} /> Adicionar item
              </button>
            </div>
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_70px_70px_32px] gap-2 px-3 py-2 bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                <span>Descrição do item</span><span>Cód. Sienge</span><span>Qtd.</span><span>Unid.</span><span />
              </div>
              {itens.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_70px_70px_32px] gap-2 px-3 py-2 border-t border-border items-center">
                  <input value={it.descricao} onChange={e => setItem(i, "descricao", e.target.value)} placeholder="Cimento CP-II" className="px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white" />
                  <input value={it.materialId} onChange={e => setItem(i, "materialId", e.target.value)} placeholder="ID" type="number" className="px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white font-mono" />
                  <input value={it.quantidade} onChange={e => setItem(i, "quantidade", e.target.value)} type="number" min="0" step="any" className="px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white" />
                  <input value={it.unidade} onChange={e => setItem(i, "unidade", e.target.value)} placeholder="UN" className="px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white uppercase" />
                  <button type="button" onClick={() => removeItem(i)} disabled={itens.length === 1} className="p-1 rounded hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 disabled:opacity-30 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Fornecedores */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Fornecedores * <span className="text-[10px] font-normal normal-case">(apenas os vinculados ao Sienge)</span></label>
            {fornsComSienge.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] italic">Nenhum fornecedor vinculado ao Sienge. Cadastre fornecedores com CNPJ para sincronizar.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-border rounded-xl p-3">
                {fornsComSienge.map(f => (
                  <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/40 px-2 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={fornIds.includes(f.siengeCreditorId!)}
                      onChange={() => toggleForn(f.siengeCreditorId!)}
                      className="accent-orange-500"
                    />
                    <span className="text-[var(--text-primary)] truncate">{f.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={criar.isPending} className="btn-orange flex items-center gap-2">
            {criar.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Criar Cotação
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CotacoesPage() {
  const [showModal, setShowModal] = useState(false)
  const { data = [], isLoading, refetch } = trpc.sienge.listarCotacoes.useQuery({})

  const total   = data.length
  const abertas = data.filter(d => ["OPEN", "ABERTA"].includes((d.cotacao.status ?? "").toUpperCase())).length
  const fechadas = data.filter(d => ["CLOSED", "FECHADA", "ENCERRADA"].includes((d.cotacao.status ?? "").toUpperCase())).length

  if (!isLoading && data.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {showModal && <NovaCotacaoModal onClose={() => setShowModal(false)} onRefresh={refetch} />}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
              <Tags size={20} className="text-orange-500 flex-shrink-0" />
              Cotações
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">Cotações sincronizadas do Sienge</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-orange flex items-center gap-2">
            <Plus size={14} /> Nova Cotação
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <Tags size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Nenhuma cotação encontrada</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Configure a integração com o Sienge para visualizar cotações em andamento.
          </p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex">
            <Settings size={14} />
            Configurar Sienge
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {showModal && <NovaCotacaoModal onClose={() => setShowModal(false)} onRefresh={refetch} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <Tags size={20} className="text-orange-500 flex-shrink-0" />
            Cotações
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Cotações sincronizadas do Sienge</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-orange flex items-center gap-2">
          <Plus size={14} /> Nova Cotação
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Tags size={16} className="text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{isLoading ? "…" : total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Clock size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Abertas</p>
            <p className="text-xl font-bold text-blue-600">{isLoading ? "…" : abertas}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} className="text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Fechadas</p>
            <p className="text-xl font-bold text-slate-600">{isLoading ? "…" : fechadas}</p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header tabela */}
        <div className="grid grid-cols-[16px_1fr_120px_120px_120px_120px] gap-4 px-4 py-3 bg-muted border-b border-border">
          <div />
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">ID</span>
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</span>
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Abertura</span>
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Fechamento</span>
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right">Total</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="px-4 py-3 h-12 flex items-center gap-4">
                <div className="h-3 bg-muted rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          data.map((item) => <CotacaoRow key={item.cotacao.id} item={item} />)
        )}
      </div>
    </div>
  )
}
