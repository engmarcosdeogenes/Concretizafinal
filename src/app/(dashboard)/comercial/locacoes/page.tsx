"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Home, Settings, TrendingUp, CheckCircle, AlertTriangle, Plus, X } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function formatDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function getStatusConfig(status?: string) {
  const s = (status ?? "").toUpperCase()
  if (s.includes("ATIVO") || s === "ACTIVE") return { label: "Ativo", badge: "bg-green-100 text-green-700" }
  if (s.includes("VENCID") || s === "EXPIRED") return { label: "Vencido", badge: "bg-red-100 text-red-700" }
  if (s.includes("CANCEL") || s === "CANCELLED") return { label: "Cancelado", badge: "bg-gray-100 text-gray-600" }
  if (s.includes("RENOVAC") || s === "RENEWAL") return { label: "Em Renovação", badge: "bg-amber-100 text-amber-700" }
  return { label: status ?? "—", badge: "bg-gray-100 text-gray-600" }
}

function isVencendoEm30Dias(endDate?: string | null) {
  if (!endDate) return false
  const hoje = new Date()
  const venc = new Date(endDate)
  const diff = (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 30
}

export default function LocacoesPage() {
  const utils = trpc.useUtils()
  const { data: locacoes = [], isLoading } = trpc.sienge.listarLocacoes.useQuery()
  const [filtroStatus, setFiltroStatus] = useState("TODOS")

  // Nova Locação
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({ propertyId:"", tenantId:"", monthlyRent:"", startDate:"", endDate:"", observation:"" })
  const [novoMsg, setNovoMsg] = useState("")
  const criarMut = trpc.sienge.criarLocacao.useMutation({
    onSuccess: () => { utils.sienge.listarLocacoes.invalidate(); setShowNovo(false); setNovoForm({ propertyId:"",tenantId:"",monthlyRent:"",startDate:"",endDate:"",observation:"" }) }
  })

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setNovoMsg("")
    try {
      await criarMut.mutateAsync({
        propertyId: Number(novoForm.propertyId),
        tenantId: Number(novoForm.tenantId),
        monthlyRent: Number(novoForm.monthlyRent),
        startDate: novoForm.startDate,
        ...(novoForm.endDate && { endDate: novoForm.endDate }),
        ...(novoForm.observation && { observation: novoForm.observation }),
      })
    } catch (err: unknown) {
      setNovoMsg(err instanceof Error ? err.message : "Erro ao criar locação.")
    }
  }

  const semSienge = !isLoading && locacoes.length === 0

  const filtrados = useMemo(() => {
    if (filtroStatus === "TODOS") return locacoes
    return locacoes.filter(l => {
      const s = getStatusConfig(l.status).label
      if (filtroStatus === "ATIVO") return s === "Ativo"
      if (filtroStatus === "VENCIDO") return s === "Vencido"
      if (filtroStatus === "VENCENDO") return isVencendoEm30Dias(l.endDate)
      return true
    })
  }, [locacoes, filtroStatus])

  const totalAtivos = locacoes.filter(l => getStatusConfig(l.status).label === "Ativo").length
  const receitaMensal = locacoes
    .filter(l => getStatusConfig(l.status).label === "Ativo")
    .reduce((s, l) => s + (l.monthlyRent ?? 0), 0)
  const vencendo30 = locacoes.filter(l => isVencendoEm30Dias(l.endDate)).length

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Home size={22} className="text-blue-500" />
            Locação de Imóveis
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
            Contratos de locação de imóveis ativos e histórico
          </p>
        </div>
        {!isLoading && locacoes.length > 0 && (
          <button onClick={() => setShowNovo(true)} className="btn-orange flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Nova Locação
          </button>
        )}
      </div>

      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Home size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">Configure a integração para visualizar as locações.</p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} /> Configurar Sienge
          </Link>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      )}

      {!isLoading && locacoes.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Total Locações</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{locacoes.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1 flex items-center gap-1">
                <CheckCircle size={10} /> Ativas
              </p>
              <p className="text-2xl font-bold text-green-700">{totalAtivos}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <TrendingUp size={10} /> Receita Mensal
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatMoeda(receitaMensal)}</p>
            </div>
            <div className={cn("rounded-xl p-4 border", vencendo30 > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-border")}>
              <p className={cn("text-[10px] font-semibold uppercase tracking-wide mb-1 flex items-center gap-1",
                vencendo30 > 0 ? "text-amber-600" : "text-[var(--text-muted)]")}>
                <AlertTriangle size={10} /> Vencendo em 30d
              </p>
              <p className={cn("text-2xl font-bold", vencendo30 > 0 ? "text-amber-700" : "text-[var(--text-primary)]")}>{vencendo30}</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {["TODOS", "ATIVO", "VENCENDO", "VENCIDO"].map(s => (
              <button key={s} type="button" onClick={() => setFiltroStatus(s)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  filtroStatus === s ? "bg-orange-500 text-white border-orange-500" : "bg-white text-[var(--text-muted)] border-border hover:border-orange-300"
                )}>
                {s === "TODOS" ? "Todos" : s === "ATIVO" ? "Ativos" : s === "VENCENDO" ? "Vencendo em 30d" : "Vencidos"}
              </button>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_2fr_130px_110px_90px] gap-3 px-5 py-2.5 border-b border-border bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>Imóvel / Unidade</span><span>Locatário</span>
              <span className="text-right">Aluguel Mensal</span><span>Vencimento</span><span className="text-center">Status</span>
            </div>
            <div className="divide-y divide-border">
              {filtrados.map(l => {
                const cfg = getStatusConfig(l.status)
                const alertaVenc = isVencendoEm30Dias(l.endDate)
                return (
                  <div key={l.id} className={cn("grid grid-cols-[2fr_2fr_130px_110px_90px] gap-3 px-5 py-3 items-center text-sm",
                    alertaVenc ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-muted/30")}>
                    <p className="font-medium text-[var(--text-primary)] truncate">{l.propertyName ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{l.tenantName ?? "—"}</p>
                    <p className="text-right text-xs font-semibold text-[var(--text-primary)]">{formatMoeda(l.monthlyRent ?? 0)}</p>
                    <p className={cn("text-xs", alertaVenc ? "text-amber-600 font-semibold" : "text-[var(--text-muted)]")}>
                      {alertaVenc && <AlertTriangle size={10} className="inline mr-1" />}
                      {formatDate(l.endDate)}
                    </p>
                    <div className="flex justify-center">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", cfg.badge)}>{cfg.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {filtrados.length === 0 && <p className="text-center text-sm text-[var(--text-muted)] py-8">Nenhuma locação com esse filtro.</p>}
          <p className="text-xs text-center text-[var(--text-muted)]">{filtrados.length} de {locacoes.length} locações · Dados via Sienge</p>
        </>
      )}

      {/* Modal Nova Locação */}
      {showNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Nova Locação</h3>
              <button onClick={() => { setShowNovo(false); setNovoMsg("") }} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">ID Imóvel Sienge *</label>
                  <input type="number" required value={novoForm.propertyId} onChange={e => setNovoForm(f => ({ ...f, propertyId: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 10" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">ID Locatário Sienge *</label>
                  <input type="number" required value={novoForm.tenantId} onChange={e => setNovoForm(f => ({ ...f, tenantId: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 55" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Aluguel Mensal (R$) *</label>
                  <input type="number" step="0.01" required value={novoForm.monthlyRent} onChange={e => setNovoForm(f => ({ ...f, monthlyRent: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 3500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Data de Início *</label>
                  <input type="date" required value={novoForm.startDate} onChange={e => setNovoForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Data de Término</label>
                  <input type="date" value={novoForm.endDate} onChange={e => setNovoForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Observação</label>
                  <textarea rows={2} value={novoForm.observation} onChange={e => setNovoForm(f => ({ ...f, observation: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
              </div>
              {novoMsg && <p className="text-xs text-red-500">{novoMsg}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowNovo(false); setNovoMsg("") }}
                  className="flex-1 border border-border rounded-lg py-2 text-sm text-[var(--text-muted)] hover:bg-muted">Cancelar</button>
                <button type="submit" disabled={criarMut.isPending}
                  className="flex-1 btn-orange">{criarMut.isPending ? "Criando..." : "Criar Locação"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
