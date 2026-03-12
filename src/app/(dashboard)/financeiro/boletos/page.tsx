"use client"

import { useState, useMemo } from "react"
import { Receipt, Send, DollarSign, AlertCircle, CheckCircle2, Clock, Loader2, Search } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda, formatDataCurta } from "@/lib/format"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Parcela = {
  id?: number
  clientId?: number
  clientName?: string
  dueDate?: string
  amount?: number
  status?: string
  documentNumber?: string
}

type StatusFiltro = "todos" | "aberto" | "vencido" | "pago"

function statusLabel(s: string | undefined) {
  const u = (s ?? "").toUpperCase()
  if (u.includes("PAG") || u === "PAID") return { label: "Pago", cor: "bg-emerald-100 text-emerald-700" }
  if (u.includes("VENC") || u === "OVERDUE") return { label: "Vencido", cor: "bg-red-100 text-red-600" }
  return { label: "Em aberto", cor: "bg-blue-100 text-blue-700" }
}

function isVencido(dueDate?: string) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

export default function BoletosPage() {
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos")
  const [enviando, setEnviando] = useState<number | null>(null)
  const [emailModal, setEmailModal] = useState<{ parcela: Parcela } | null>(null)
  const [emailInput, setEmailInput] = useState("")

  const { data: parcelas = [], isLoading } = trpc.sienge.listarContasReceber.useQuery(
    {},
    { retry: false },
  )
  const enviarBoleto = trpc.sienge.enviarBoleto2Via.useMutation({
    onSuccess: () => { toast.success("2ª via enviada com sucesso!"); setEmailModal(null); setEmailInput("") },
    onError: () => toast.error("Erro ao enviar 2ª via"),
  })

  const lista = useMemo(() => {
    let itens = (parcelas as Parcela[])
    if (busca) itens = itens.filter(p => (p.clientName ?? "").toLowerCase().includes(busca.toLowerCase()) || (p.documentNumber ?? "").includes(busca))
    if (statusFiltro === "aberto")  itens = itens.filter(p => !isVencido(p.dueDate) && !(p.status ?? "").toUpperCase().includes("PAG"))
    if (statusFiltro === "vencido") itens = itens.filter(p => isVencido(p.dueDate) && !(p.status ?? "").toUpperCase().includes("PAG"))
    if (statusFiltro === "pago")    itens = itens.filter(p => (p.status ?? "").toUpperCase().includes("PAG") || (p.status ?? "").toUpperCase() === "PAID")
    return itens
  }, [parcelas, busca, statusFiltro])

  const totalAberto  = (parcelas as Parcela[]).filter(p => !isVencido(p.dueDate) && !(p.status ?? "").toUpperCase().includes("PAG")).reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalVencido = (parcelas as Parcela[]).filter(p => isVencido(p.dueDate) && !(p.status ?? "").toUpperCase().includes("PAG")).reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalMes = useMemo(() => {
    const inicio = new Date(); inicio.setDate(1); inicio.setHours(0,0,0,0)
    return (parcelas as Parcela[]).filter(p => p.dueDate && new Date(p.dueDate) >= inicio).reduce((s, p) => s + (p.amount ?? 0), 0)
  }, [parcelas])

  async function handleEnviar(parcela: Parcela) {
    if (!parcela.clientId) { toast.error("Cliente sem ID Sienge"); return }
    setEmailModal({ parcela })
  }

  const kpis = [
    { label: "Em aberto",      valor: formatMoeda(totalAberto),  cor: "bg-blue-50",   text: "text-blue-700",  Icon: Clock },
    { label: "Vencidos",       valor: formatMoeda(totalVencido), cor: "bg-red-50",    text: "text-red-600",   Icon: AlertCircle },
    { label: "Emitidos no mês",valor: formatMoeda(totalMes),     cor: "bg-emerald-50",text: "text-emerald-700",Icon: CheckCircle2 },
  ]

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Boletos / 2ª Via</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Títulos de cobrança e envio de segunda via via Sienge</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(({ label, valor, cor, text, Icon }) => (
          <div key={label} className={`rounded-2xl border border-border p-5 ${cor}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={text} />
              <span className={`text-xs font-semibold ${text}`}>{label}</span>
            </div>
            <p className={`text-2xl font-extrabold ${text}`}>{valor}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar cliente ou número..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "aberto", "vencido", "pago"] as StatusFiltro[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFiltro(s)}
              className={cn(
                "px-3 py-2 text-xs font-medium rounded-xl border transition-colors capitalize",
                statusFiltro === s ? "bg-orange-500 text-white border-orange-500" : "bg-white border-border text-[var(--text-muted)] hover:bg-muted"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>
      ) : lista.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <Receipt size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-[var(--text-muted)]">
            {(parcelas as Parcela[]).length === 0 ? "Nenhum boleto encontrado. Configure o Sienge em Configurações." : "Nenhum resultado para os filtros aplicados."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            <span>Cliente</span>
            <span>Documento</span>
            <span>Vencimento</span>
            <span>Valor</span>
            <span>Ação</span>
          </div>
          <div className="divide-y divide-border">
            {lista.map((parcela, i) => {
              const { label, cor } = statusLabel(isVencido(parcela.dueDate) && !(parcela.status ?? "").toUpperCase().includes("PAG") ? "VENCIDO" : parcela.status)
              return (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 sm:gap-4 px-5 py-3 items-center hover:bg-muted/20 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{parcela.clientName ?? "—"}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cor}`}>{label}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{parcela.documentNumber ?? "—"}</p>
                  <p className={cn("text-xs font-medium", isVencido(parcela.dueDate) ? "text-red-500" : "text-[var(--text-primary)]")}>
                    {parcela.dueDate ? formatDataCurta(new Date(parcela.dueDate)) : "—"}
                  </p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{formatMoeda(parcela.amount ?? 0)}</p>
                  <button
                    onClick={() => handleEnviar(parcela)}
                    disabled={enviando === i}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {enviando === i ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    2ª via
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal envio email */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Send size={18} className="text-blue-500" />
              <h3 className="font-bold text-[var(--text-primary)]">Enviar 2ª via</h3>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-1">Cliente: <strong className="text-[var(--text-primary)]">{emailModal.parcela.clientName}</strong></p>
              <p className="text-sm text-[var(--text-muted)] mb-3">Valor: <strong className="text-[var(--text-primary)]">{formatMoeda(emailModal.parcela.amount ?? 0)}</strong></p>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">E-mail do cliente (opcional)</label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEmailModal(null)} className="flex-1 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors">Cancelar</button>
              <button
                onClick={() => {
                  if (!emailModal.parcela.clientId) return
                  enviarBoleto.mutate({ customerId: emailModal.parcela.clientId, email: emailInput || undefined })
                }}
                disabled={enviarBoleto.isPending}
                className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {enviarBoleto.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
