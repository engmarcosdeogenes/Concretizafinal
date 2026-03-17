"use client"

import { useState } from "react"
import { CreditCard, Search, Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

const PAYMENT_TYPES = [
  { value: "bank-transfer", label: "Transferencia Bancaria" },
  { value: "boleto-bancario", label: "Boleto Bancario" },
  { value: "boleto-concessionaria", label: "Boleto Concessionaria" },
  { value: "boleto-tax", label: "Boleto Tributo" },
  { value: "dda", label: "DDA" },
  { value: "darf-tax", label: "DARF" },
  { value: "darj-tax", label: "DARJ" },
  { value: "fgts-tax", label: "FGTS" },
  { value: "gare-tax", label: "GARE" },
  { value: "inss-tax", label: "INSS" },
  { value: "pix", label: "PIX" },
] as const

type PaymentType = typeof PAYMENT_TYPES[number]["value"]

export default function PagamentosPage() {
  const [billId, setBillId] = useState("")
  const [installmentId, setInstallmentId] = useState("")
  const [type, setType] = useState<PaymentType>("pix")
  const [searched, setSearched] = useState(false)
  const [editData, setEditData] = useState<Record<string, string>>({})
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const billNum = Number(billId) || 0
  const instNum = Number(installmentId) || 0
  const canSearch = billNum > 0 && instNum > 0

  const { data, isLoading, refetch } = trpc.sienge.buscarPaymentInfo.useQuery(
    { billId: billNum, installmentId: instNum, type },
    { enabled: searched && canSearch, retry: false }
  )

  const mutation = trpc.sienge.atualizarPaymentInfo.useMutation({
    onSuccess: () => {
      setSaveMsg({ ok: true, text: "Informacoes de pagamento atualizadas com sucesso." })
      refetch()
    },
    onError: (err) => {
      setSaveMsg({ ok: false, text: err.message || "Erro ao atualizar." })
    },
  })

  function handleSearch() {
    if (!canSearch) return
    setSearched(true)
    setSaveMsg(null)
    setEditData({})
    refetch()
  }

  function handleFieldChange(key: string, value: string) {
    setEditData((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!canSearch || Object.keys(editData).length === 0) return
    setSaveMsg(null)
    mutation.mutate({
      billId: billNum,
      installmentId: instNum,
      type,
      data: editData,
    })
  }

  const infoEntries = data ? Object.entries(data).filter(([k]) => k !== "__typename") : []
  const hasEdits = Object.keys(editData).length > 0

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <CreditCard size={22} className="text-orange-500" />
          Pagamentos e Info Bancaria
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
          Consultar e atualizar informacoes de pagamento por parcela
        </p>
      </div>

      {/* Search form */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Buscar Parcela</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-muted)] font-semibold">ID do Titulo</label>
            <input
              type="number"
              min={1}
              value={billId}
              onChange={(e) => { setBillId(e.target.value); setSearched(false) }}
              placeholder="Ex: 1234"
              className="h-9 w-32 px-3 border border-border rounded-lg text-sm text-[var(--text-primary)] bg-white outline-none focus:border-orange-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-muted)] font-semibold">Parcela</label>
            <input
              type="number"
              min={1}
              value={installmentId}
              onChange={(e) => { setInstallmentId(e.target.value); setSearched(false) }}
              placeholder="Ex: 1"
              className="h-9 w-24 px-3 border border-border rounded-lg text-sm text-[var(--text-primary)] bg-white outline-none focus:border-orange-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-muted)] font-semibold">Tipo de Pagamento</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value as PaymentType); setSearched(false) }}
              className="h-9 px-3 border border-border rounded-lg text-sm text-[var(--text-primary)] bg-white outline-none focus:border-orange-400"
            >
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!canSearch}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors",
              canSearch
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <Search size={14} />
            Consultar
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && searched && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-orange-500" />
        </div>
      )}

      {/* No data */}
      {searched && !isLoading && !data && (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <AlertCircle size={36} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhuma informacao encontrada</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Verifique o ID do titulo, parcela e tipo de pagamento.
          </p>
        </div>
      )}

      {/* Payment info detail + edit */}
      {searched && !isLoading && data && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Info de Pagamento &mdash; {PAYMENT_TYPES.find((t) => t.value === type)?.label}
            </p>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              Titulo #{billNum} / Parcela #{instNum}
            </span>
          </div>

          {infoEntries.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--text-muted)]">
              Objeto retornado sem campos editaveis.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {infoEntries.map(([key, value]) => (
                <div key={key} className="grid grid-cols-[200px_1fr] gap-4 px-5 py-3 items-center">
                  <label className="text-xs font-semibold text-[var(--text-muted)] truncate" title={key}>
                    {key}
                  </label>
                  <input
                    type="text"
                    defaultValue={value != null ? String(value) : ""}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    className="h-8 px-3 border border-border rounded-lg text-sm text-[var(--text-primary)] bg-white outline-none focus:border-orange-400"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Save button */}
          {infoEntries.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-muted/50 flex items-center justify-between">
              {saveMsg && (
                <div className={cn("flex items-center gap-1.5 text-xs font-medium", saveMsg.ok ? "text-green-600" : "text-red-600")}>
                  {saveMsg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {saveMsg.text}
                </div>
              )}
              {!saveMsg && <span />}
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasEdits || mutation.isPending}
                className={cn(
                  "h-9 px-5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors",
                  hasEdits
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Salvar Alteracoes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
