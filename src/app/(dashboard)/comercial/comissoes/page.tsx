"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { UserCheck, Settings, TrendingUp, CheckCircle, Trash2, Plus, X, AlertTriangle, BadgeCheck, XCircle, Banknote } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function formatDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function getStatusConfig(status?: string) {
  const s = (status ?? "").toUpperCase()
  if (s.includes("PAGO") || s === "PAID" || s === "AUTHORIZED") return { label: "Pago", badge: "bg-green-100 text-green-700" }
  if (s.includes("PEND") || s === "PENDING") return { label: "Pendente", badge: "bg-amber-100 text-amber-700" }
  if (s.includes("CANCEL") || s === "CANCELLED") return { label: "Cancelado", badge: "bg-red-100 text-red-700" }
  if (s.includes("LIBER") || s === "RELEASED") return { label: "Liberado", badge: "bg-blue-100 text-blue-700" }
  if (s.includes("PARCIAL") || s === "PARTIAL") return { label: "Parcial", badge: "bg-purple-100 text-purple-700" }
  return { label: status ?? "—", badge: "bg-gray-100 text-gray-600" }
}

type Comissao = { id: number; sellerName?: string | null; buildingName?: string | null; unitName?: string | null; value?: number | null; paymentDate?: string | null; status?: string | null | undefined }

export default function ComissoesPage() {
  const utils = trpc.useUtils()
  const { data: comissoes = [], isLoading } = trpc.sienge.listarComissoes.useQuery()
  const [filtroStatus, setFiltroStatus] = useState("TODOS")

  // Multi-select
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const toggleSelect = (id: number) => setSelected(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })
  const allFiltered = useMemo(() => {
    if (filtroStatus === "TODOS") return comissoes as Comissao[]
    return (comissoes as Comissao[]).filter(c => {
      const s = getStatusConfig(c.status ?? undefined).label
      if (filtroStatus === "PAGO") return s === "Pago"
      if (filtroStatus === "PENDENTE") return s === "Pendente"
      if (filtroStatus === "LIBERADO") return s === "Liberado"
      return true
    })
  }, [comissoes, filtroStatus])
  const allIds = allFiltered.map(c => c.id)
  const allChecked = allIds.length > 0 && allIds.every(id => selected.has(id))
  const toggleAll = () => {
    if (allChecked) setSelected(prev => { const s = new Set(prev); allIds.forEach(id => s.delete(id)); return s })
    else setSelected(prev => { const s = new Set(prev); allIds.forEach(id => s.add(id)); return s })
  }
  const selectedIds = Array.from(selected).filter(id => allIds.includes(id))

  // Mutations
  const autorizarMut = trpc.sienge.autorizarComissoes.useMutation({ onSuccess: () => { utils.sienge.listarComissoes.invalidate(); setSelected(new Set()) } })
  const cancelarMut = trpc.sienge.cancelarComissoes.useMutation({ onSuccess: () => { utils.sienge.listarComissoes.invalidate(); setSelected(new Set()) } })
  const liberarMut = trpc.sienge.liberarComissoes.useMutation({ onSuccess: () => { utils.sienge.listarComissoes.invalidate(); setSelected(new Set()) } })
  const excluirMut = trpc.sienge.excluirComissao.useMutation({ onSuccess: () => utils.sienge.listarComissoes.invalidate() })
  const criarMut = trpc.sienge.criarComissao.useMutation({ onSuccess: () => { utils.sienge.listarComissoes.invalidate(); setShowNovo(false); setNovoForm({ salesContractId:"",installmentNumber:"",brokerId:"",commissionValue:"",dueDate:"",observations:"" }) } })

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [confirmBulk, setConfirmBulk] = useState<"autorizar"|"cancelar"|"liberar"|null>(null)
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({ salesContractId:"",installmentNumber:"",brokerId:"",commissionValue:"",dueDate:"",observations:"" })
  const [novoMsg, setNovoMsg] = useState("")

  const semSienge = !isLoading && comissoes.length === 0

  const totalPago = (comissoes as Comissao[]).filter(c => getStatusConfig(c.status ?? undefined).label === "Pago").reduce((s, c) => s + (c.value ?? 0), 0)
  const totalPendente = (comissoes as Comissao[]).filter(c => getStatusConfig(c.status ?? undefined).label === "Pendente").reduce((s, c) => s + (c.value ?? 0), 0)

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setNovoMsg("")
    try {
      await criarMut.mutateAsync({
        salesContractId: Number(novoForm.salesContractId),
        installmentNumber: Number(novoForm.installmentNumber),
        brokerId: Number(novoForm.brokerId),
        commissionValue: Number(novoForm.commissionValue),
        dueDate: novoForm.dueDate,
        ...(novoForm.observations && { observations: novoForm.observations }),
      })
    } catch (err: unknown) {
      setNovoMsg(err instanceof Error ? err.message : "Erro ao criar comissão.")
    }
  }

  async function executeBulk(action: "autorizar"|"cancelar"|"liberar") {
    if (selectedIds.length === 0) return
    if (action === "autorizar") await autorizarMut.mutateAsync({ ids: selectedIds })
    else if (action === "cancelar") await cancelarMut.mutateAsync({ ids: selectedIds })
    else await liberarMut.mutateAsync({ ids: selectedIds })
    setConfirmBulk(null)
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <UserCheck size={22} className="text-blue-500" />
            Comissões de Corretores
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
            Comissões de venda por corretor e empreendimento
          </p>
        </div>
        {!semSienge && !isLoading && (
          <button onClick={() => setShowNovo(true)} className="btn-orange flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Nova Comissão
          </button>
        )}
      </div>

      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <UserCheck size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">Configure a integração para visualizar as comissões.</p>
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

      {!isLoading && comissoes.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Total Comissões</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{comissoes.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1 flex items-center gap-1">
                <CheckCircle size={10} /> Valor Pago
              </p>
              <p className="text-2xl font-bold text-green-700">{formatMoeda(totalPago)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-1 flex items-center gap-1">
                <TrendingUp size={10} /> A Pagar
              </p>
              <p className="text-2xl font-bold text-amber-700">{formatMoeda(totalPendente)}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {["TODOS", "PAGO", "PENDENTE", "LIBERADO"].map(s => (
              <button key={s} type="button" onClick={() => { setFiltroStatus(s); setSelected(new Set()) }}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  filtroStatus === s ? "bg-orange-500 text-white border-orange-500" : "bg-white text-[var(--text-muted)] border-border hover:border-orange-300"
                )}>
                {s === "TODOS" ? "Todos" : s === "PAGO" ? "Pagos" : s === "PENDENTE" ? "Pendentes" : "Liberados"}
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <span className="text-xs font-medium text-blue-700">{selectedIds.length} selecionada(s)</span>
              <button onClick={() => setConfirmBulk("autorizar")} disabled={autorizarMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 disabled:opacity-50">
                <BadgeCheck size={12} /> Autorizar
              </button>
              <button onClick={() => setConfirmBulk("liberar")} disabled={liberarMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 disabled:opacity-50">
                <Banknote size={12} /> Liberar
              </button>
              <button onClick={() => setConfirmBulk("cancelar")} disabled={cancelarMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50">
                <XCircle size={12} /> Cancelar
              </button>
              <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                Limpar seleção
              </button>
            </div>
          )}

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[32px_2fr_1.5fr_1fr_110px_100px_80px_36px] gap-3 px-5 py-2.5 border-b border-border bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <div className="flex items-center">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded" />
              </div>
              <span>Corretor</span><span>Empreendimento</span><span>Unidade</span>
              <span className="text-right">Valor</span><span>Pagamento</span><span className="text-center">Status</span><span />
            </div>
            <div className="divide-y divide-border">
              {allFiltered.map(c => {
                const cfg = getStatusConfig(c.status ?? undefined)
                const isSelected = selected.has(c.id)
                return (
                  <div key={c.id} className={cn("grid grid-cols-[32px_2fr_1.5fr_1fr_110px_100px_80px_36px] gap-3 px-5 py-3 items-center text-sm hover:bg-muted/20 transition-colors", isSelected && "bg-blue-50/40")}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(c.id)} className="rounded" />
                    <p className="font-medium text-[var(--text-primary)] truncate">{c.sellerName ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{c.buildingName ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{c.unitName ?? "—"}</p>
                    <p className="text-right text-xs font-semibold text-[var(--text-primary)]">{formatMoeda(c.value ?? 0)}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDate(c.paymentDate)}</p>
                    <div className="flex justify-center">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", cfg.badge)}>{cfg.label}</span>
                    </div>
                    <button onClick={() => setConfirmDelete(c.id)} title="Excluir comissão"
                      className="p-1.5 rounded border border-border text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-all">
                      <Trash2 size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          {allFiltered.length === 0 && <p className="text-center text-sm text-[var(--text-muted)] py-8">Nenhuma comissão com esse filtro.</p>}
          <p className="text-xs text-center text-[var(--text-muted)]">{allFiltered.length} de {comissoes.length} comissões · Dados via Sienge</p>
        </>
      )}

      {/* Modal Nova Comissão */}
      {showNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Nova Comissão</h3>
              <button onClick={() => { setShowNovo(false); setNovoMsg("") }} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">ID Contrato Venda *</label>
                  <input type="number" required value={novoForm.salesContractId} onChange={e => setNovoForm(f => ({ ...f, salesContractId: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 100" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Nº da Parcela *</label>
                  <input type="number" required value={novoForm.installmentNumber} onChange={e => setNovoForm(f => ({ ...f, installmentNumber: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">ID Corretor *</label>
                  <input type="number" required value={novoForm.brokerId} onChange={e => setNovoForm(f => ({ ...f, brokerId: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Valor (R$) *</label>
                  <input type="number" step="0.01" required value={novoForm.commissionValue} onChange={e => setNovoForm(f => ({ ...f, commissionValue: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 5000" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Vencimento *</label>
                  <input type="date" required value={novoForm.dueDate} onChange={e => setNovoForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Observações</label>
                  <textarea rows={2} value={novoForm.observations} onChange={e => setNovoForm(f => ({ ...f, observations: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
              </div>
              {novoMsg && <p className="text-xs text-red-500">{novoMsg}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowNovo(false); setNovoMsg("") }}
                  className="flex-1 border border-border rounded-lg py-2 text-sm text-[var(--text-muted)] hover:bg-muted">Cancelar</button>
                <button type="submit" disabled={criarMut.isPending}
                  className="flex-1 btn-orange">{criarMut.isPending ? "Criando..." : "Criar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Excluir */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <Trash2 size={32} className="mx-auto text-red-500" />
            <p className="font-semibold text-[var(--text-primary)]">Excluir comissão #{confirmDelete}?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted">Voltar</button>
              <button onClick={async () => { await excluirMut.mutateAsync({ id: confirmDelete }); setConfirmDelete(null) }}
                disabled={excluirMut.isPending}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {excluirMut.isPending ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Bulk Action */}
      {confirmBulk !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <AlertTriangle size={32} className="mx-auto text-amber-500" />
            <p className="font-semibold text-[var(--text-primary)]">
              {confirmBulk === "autorizar" ? "Autorizar" : confirmBulk === "liberar" ? "Liberar" : "Cancelar"} {selectedIds.length} comissão(ões)?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBulk(null)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted">Voltar</button>
              <button onClick={() => executeBulk(confirmBulk)}
                disabled={autorizarMut.isPending || liberarMut.isPending || cancelarMut.isPending}
                className={cn("flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50",
                  confirmBulk === "autorizar" ? "bg-green-500 hover:bg-green-600" :
                  confirmBulk === "liberar" ? "bg-blue-500 hover:bg-blue-600" :
                  "bg-red-500 hover:bg-red-600"
                )}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
