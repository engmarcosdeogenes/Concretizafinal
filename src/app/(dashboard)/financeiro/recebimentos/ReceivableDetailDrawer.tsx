"use client"

import { useState } from "react"
import { X, DollarSign, Tag, Calendar, Loader2, Check } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

interface ReceivableDetailDrawerProps {
  billId: number
  onClose: () => void
}

type Tab = "parcelas" | "categorias"

export default function ReceivableDetailDrawer({ billId, onClose }: ReceivableDetailDrawerProps) {
  const [tab, setTab] = useState<Tab>("parcelas")
  const [editingInstallment, setEditingInstallment] = useState<number | null>(null)
  const [newDueDate, setNewDueDate] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const utils = trpc.useUtils()

  const { data: bill, isLoading: loadingBill } = trpc.sienge.buscarReceivableBill.useQuery({ billId })
  const { data: parcelas = [], isLoading: loadingParcelas } = trpc.sienge.listarParcReceivableBill.useQuery(
    { billId },
    { enabled: tab === "parcelas" },
  )
  const { data: categorias = [], isLoading: loadingCategorias } = trpc.sienge.listarBudgetCategoriesReceivable.useQuery(
    { billId },
    { enabled: tab === "categorias" },
  )

  const alterarVencimento = trpc.sienge.alterarVencimentoReceivableBill.useMutation({
    onSuccess: () => {
      setSuccessMsg("Vencimento alterado!")
      setEditingInstallment(null)
      setNewDueDate("")
      utils.sienge.listarParcReceivableBill.invalidate({ billId })
      setTimeout(() => setSuccessMsg(""), 2500)
    },
  })

  function handleSaveDueDate(installmentId: number) {
    if (!newDueDate) return
    alterarVencimento.mutate({ billId, installmentId, dueDate: newDueDate })
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "parcelas", label: "Parcelas", icon: <DollarSign size={13} /> },
    { key: "categorias", label: "Categorias", icon: <Tag size={13} /> },
  ]

  const parcelasList: any[] = Array.isArray(parcelas) ? parcelas : (parcelas as any)?.results ?? []
  const categoriasList: any[] = Array.isArray(categorias) ? categorias : (categorias as any)?.results ?? []

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Titulo a Receber #{billId}
            </h2>
            {bill && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {(bill as any).customerName ?? (bill as any).creditorName ?? "Cliente"} &middot; {formatMoeda((bill as any).amount ?? (bill as any).originalAmount ?? 0)}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        {/* Bill summary */}
        {loadingBill && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-orange-500" />
          </div>
        )}
        {bill && !loadingBill && (
          <div className="px-5 py-3 border-b border-border grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[var(--text-muted)] block">Documento</span>
              <span className="font-semibold text-[var(--text-primary)]">{(bill as any).documentNumber ?? "—"}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Vencimento</span>
              <span className="font-semibold text-[var(--text-primary)]">{fmtDate((bill as any).dueDate)}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Valor</span>
              <span className="font-semibold text-[var(--text-primary)]">{formatMoeda((bill as any).amount ?? (bill as any).originalAmount ?? 0)}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Status</span>
              <span className="font-semibold text-[var(--text-primary)]">{(bill as any).status ?? "—"}</span>
            </div>
            {(bill as any).enterpriseName && (
              <div className="col-span-2">
                <span className="text-[var(--text-muted)] block">Empreendimento</span>
                <span className="font-semibold text-[var(--text-primary)]">{(bill as any).enterpriseName}</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                tab === t.key
                  ? "bg-orange-500 text-white"
                  : "text-[var(--text-muted)] hover:bg-muted",
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-semibold flex items-center gap-1.5">
            <Check size={13} /> {successMsg}
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Parcelas */}
          {tab === "parcelas" && (
            <>
              {loadingParcelas && <Loader2 size={18} className="animate-spin text-orange-400 mx-auto" />}
              {!loadingParcelas && parcelasList.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">Nenhuma parcela encontrada.</p>
              )}
              {parcelasList.map((p: any, i: number) => {
                const installmentId = p.id ?? p.installmentId ?? i
                const isEditing = editingInstallment === installmentId
                return (
                  <div key={installmentId} className="bg-muted/50 rounded-lg p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">Parcela {p.installmentNumber ?? i + 1}</p>
                        <p className="text-[var(--text-muted)]">Vence: {fmtDate(p.dueDate)}</p>
                        {p.paymentDate && (
                          <p className="text-emerald-600">Pago: {fmtDate(p.paymentDate)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[var(--text-primary)]">{formatMoeda(p.amount ?? p.originalAmount ?? 0)}</p>
                        {p.balance != null && p.balance !== p.amount && (
                          <p className="text-[var(--text-muted)]">Saldo: {formatMoeda(p.balance)}</p>
                        )}
                      </div>
                    </div>
                    {/* Alterar vencimento */}
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => { setEditingInstallment(installmentId); setNewDueDate(p.dueDate?.slice(0, 10) ?? "") }}
                        className="flex items-center gap-1 text-orange-600 hover:text-orange-700 text-[11px] font-semibold"
                      >
                        <Calendar size={11} /> Alterar vencimento
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                          className="px-2 py-1 border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveDueDate(installmentId)}
                          disabled={alterarVencimento.isPending}
                          className="px-2 py-1 rounded-lg bg-orange-500 text-white text-[11px] font-semibold hover:bg-orange-600 disabled:opacity-50"
                        >
                          {alterarVencimento.isPending ? <Loader2 size={11} className="animate-spin" /> : "Salvar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingInstallment(null); setNewDueDate("") }}
                          className="px-2 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:bg-muted"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* Categorias */}
          {tab === "categorias" && (
            <>
              {loadingCategorias && <Loader2 size={18} className="animate-spin text-orange-400 mx-auto" />}
              {!loadingCategorias && categoriasList.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">Nenhuma categoria encontrada.</p>
              )}
              {categoriasList.map((c: any, i: number) => (
                <div key={c.id ?? i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-xs">
                  <p className="font-semibold text-[var(--text-primary)]">{c.name ?? c.description ?? `Categoria ${i + 1}`}</p>
                  <div className="flex items-center gap-3">
                    {c.percentage != null && <p className="text-[var(--text-muted)]">{c.percentage}%</p>}
                    {c.value != null && <p className="font-bold text-[var(--text-primary)]">{formatMoeda(c.value)}</p>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
