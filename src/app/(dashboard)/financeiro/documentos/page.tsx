"use client"

import { useState } from "react"
import {
  FileText, Send, Download, Loader2, Search,
  DollarSign, Calendar, Mail, User, AlertCircle,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Tab = "extrato" | "informe-ir" | "saldo-devedor"

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: "extrato", label: "Extrato do Cliente", icon: FileText },
  { id: "informe-ir", label: "Informe de IR", icon: Calendar },
  { id: "saldo-devedor", label: "Saldo Devedor", icon: DollarSign },
]

/* ─── Extrato do Cliente ──────────────────────────────────────── */
function ExtratoTab() {
  const [customerId, setCustomerId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searched, setSearched] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [emailInput, setEmailInput] = useState("")

  const cid = Number(customerId) || 0
  const extrato = trpc.sienge.listarExtratoCliente.useQuery(
    { customerId: cid, startDate: startDate || undefined, endDate: endDate || undefined },
    { enabled: searched && cid > 0, retry: false },
  )
  const pdfUrl = trpc.sienge.getExtratoPdfUrl.useQuery(
    { contratoId: cid },
    { enabled: searched && cid > 0, retry: false },
  )
  const enviarEmail = trpc.sienge.enviarExtratoClienteEmail.useMutation({
    onSuccess: () => { toast.success("Extrato enviado por e-mail!"); setEmailModal(false); setEmailInput("") },
    onError: () => toast.error("Erro ao enviar extrato por e-mail"),
  })

  const items = (extrato.data as Array<Record<string, unknown>>) ?? []

  return (
    <div className="space-y-5">
      {/* Busca */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">ID do Cliente *</label>
          <input
            type="number"
            value={customerId}
            onChange={e => { setCustomerId(e.target.value); setSearched(false) }}
            placeholder="Ex: 1234"
            className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">Data Início</label>
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setSearched(false) }}
            className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">Data Fim</label>
          <input
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setSearched(false) }}
            className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={() => setSearched(true)}
            disabled={!cid}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Search size={14} /> Consultar
          </button>
        </div>
      </div>

      {/* Ações */}
      {searched && cid > 0 && (
        <div className="flex gap-2">
          {pdfUrl.data?.url && (
            <a
              href={pdfUrl.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <Download size={12} /> Baixar PDF
            </a>
          )}
          <button
            onClick={() => setEmailModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Mail size={12} /> Enviar por E-mail
          </button>
        </div>
      )}

      {/* Resultado */}
      {extrato.isLoading && (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      )}
      {searched && !extrato.isLoading && items.length === 0 && (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <AlertCircle size={28} className="mx-auto mb-2 text-muted-foreground opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">Nenhum registro de extrato encontrado.</p>
        </div>
      )}
      {items.length > 0 && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-5 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            <span>Data</span><span>Descrição</span><span>Tipo</span><span>Valor</span>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr_1fr] gap-2 sm:gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                <p className="text-xs text-[var(--text-muted)]">{String(item.date ?? item.data ?? "—")}</p>
                <p className="text-sm text-[var(--text-primary)]">{String(item.description ?? item.descricao ?? "—")}</p>
                <p className="text-xs text-[var(--text-muted)]">{String(item.type ?? item.tipo ?? "—")}</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">{formatMoeda(Number(item.amount ?? item.valor ?? 0))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Email */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-blue-500" />
              <h3 className="font-bold text-[var(--text-primary)]">Enviar Extrato por E-mail</h3>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">E-mail do cliente</label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEmailModal(false)} className="flex-1 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors">Cancelar</button>
              <button
                onClick={() => {
                  if (!emailInput) { toast.error("Informe o e-mail"); return }
                  enviarEmail.mutate({ customerId: cid, email: emailInput, startDate: startDate || undefined, endDate: endDate || undefined })
                }}
                disabled={enviarEmail.isPending}
                className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {enviarEmail.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Informe de IR ───────────────────────────────────────────── */
function InformeIRTab() {
  const [clienteId, setClienteId] = useState("")
  const [ano, setAno] = useState(String(new Date().getFullYear() - 1))
  const [searched, setSearched] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [emailInput, setEmailInput] = useState("")

  const cid = Number(clienteId) || 0
  const anoNum = Number(ano) || new Date().getFullYear() - 1
  const pdfUrl = trpc.sienge.getInformeIRPdfUrl.useQuery(
    { clienteId: cid, ano: anoNum },
    { enabled: searched && cid > 0, retry: false },
  )
  const enviarEmail = trpc.sienge.enviarInformeIREmail.useMutation({
    onSuccess: () => { toast.success("Informe de IR enviado por e-mail!"); setEmailModal(false); setEmailInput("") },
    onError: () => toast.error("Erro ao enviar informe de IR"),
  })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">ID do Cliente *</label>
          <input
            type="number"
            value={clienteId}
            onChange={e => { setClienteId(e.target.value); setSearched(false) }}
            placeholder="Ex: 1234"
            className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">Ano-base *</label>
          <input
            type="number"
            value={ano}
            onChange={e => { setAno(e.target.value); setSearched(false) }}
            min={2000}
            max={new Date().getFullYear()}
            className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={() => setSearched(true)}
            disabled={!cid || !anoNum}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Search size={14} /> Gerar Informe
          </button>
        </div>
      </div>

      {searched && cid > 0 && (
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Calendar size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)]">Informe de Rendimentos {anoNum}</h3>
              <p className="text-xs text-[var(--text-muted)]">Cliente ID: {cid}</p>
            </div>
          </div>

          {pdfUrl.isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="flex gap-2">
              {pdfUrl.data?.url && (
                <a
                  href={pdfUrl.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  <Download size={14} /> Baixar PDF
                </a>
              )}
              <button
                onClick={() => setEmailModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl transition-colors"
              >
                <Mail size={14} /> Enviar por E-mail
              </button>
            </div>
          )}
        </div>
      )}

      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-blue-500" />
              <h3 className="font-bold text-[var(--text-primary)]">Enviar Informe IR {anoNum}</h3>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">E-mail do cliente</label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEmailModal(false)} className="flex-1 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors">Cancelar</button>
              <button
                onClick={() => {
                  if (!emailInput) { toast.error("Informe o e-mail"); return }
                  enviarEmail.mutate({ clienteId: cid, ano: anoNum, email: emailInput })
                }}
                disabled={enviarEmail.isPending}
                className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {enviarEmail.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Saldo Devedor ───────────────────────────────────────────── */
function SaldoDevedorTab() {
  const [customerId, setCustomerId] = useState("")
  const [searched, setSearched] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [emailInput, setEmailInput] = useState("")

  const cid = Number(customerId) || 0
  const saldo = trpc.sienge.obterSaldoDevedor.useQuery(
    { customerId: cid },
    { enabled: searched && cid > 0, retry: false },
  )
  const enviarEmail = trpc.sienge.enviarSaldoDevedorEmail.useMutation({
    onSuccess: () => { toast.success("Saldo devedor enviado por e-mail!"); setEmailModal(false); setEmailInput("") },
    onError: () => toast.error("Erro ao enviar saldo devedor"),
  })

  const data = saldo.data as Record<string, unknown> | null | undefined

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">ID do Cliente *</label>
          <input
            type="number"
            value={customerId}
            onChange={e => { setCustomerId(e.target.value); setSearched(false) }}
            placeholder="Ex: 1234"
            className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={() => setSearched(true)}
            disabled={!cid}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Search size={14} /> Consultar
          </button>
        </div>
      </div>

      {saldo.isLoading && (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      )}

      {searched && !saldo.isLoading && !data && (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <AlertCircle size={28} className="mx-auto mb-2 text-muted-foreground opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">Nenhum saldo devedor encontrado para este cliente.</p>
        </div>
      )}

      {data && (
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <DollarSign size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)]">Saldo Devedor</h3>
              <p className="text-xs text-[var(--text-muted)]">Cliente ID: {cid}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(data).map(([key, val]) => (
              <div key={key} className="rounded-xl border border-border p-4">
                <p className="text-xs text-[var(--text-muted)] mb-1 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {typeof val === "number" ? formatMoeda(val) : String(val ?? "—")}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setEmailModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl transition-colors"
            >
              <Mail size={14} /> Enviar por E-mail
            </button>
          </div>
        </div>
      )}

      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-blue-500" />
              <h3 className="font-bold text-[var(--text-primary)]">Enviar Saldo Devedor</h3>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">E-mail do cliente</label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEmailModal(false)} className="flex-1 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors">Cancelar</button>
              <button
                onClick={() => {
                  if (!emailInput) { toast.error("Informe o e-mail"); return }
                  enviarEmail.mutate({ customerId: cid, email: emailInput })
                }}
                disabled={enviarEmail.isPending}
                className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {enviarEmail.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Página Principal ────────────────────────────────────────── */
export default function DocumentosFinanceirosPage() {
  const [tab, setTab] = useState<Tab>("extrato")

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Documentos Financeiros</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Envio de boletos, extratos, informes de IR e saldo devedor por e-mail ou PDF
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 -mb-px",
              tab === id
                ? "border-orange-500 text-orange-600 bg-orange-50/50"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-muted/30"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tab === "extrato" && <ExtratoTab />}
        {tab === "informe-ir" && <InformeIRTab />}
        {tab === "saldo-devedor" && <SaldoDevedorTab />}
      </div>

      {/* Info: Boletos 2ª via */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Send size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-700">Envio de 2ª Via de Boletos</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Para enviar a 2ª via de boletos, acesse a página{" "}
            <a href="/financeiro/boletos" className="underline font-semibold hover:text-blue-800">Boletos / 2ª Via</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
