"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { FileText, Settings, TrendingUp, CheckCircle, XCircle, FileDown, Plus, Trash2, Ban, ChevronDown, ChevronUp, Paperclip, Users, Upload, X, AlertTriangle } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function formatDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function getStatusConfig(status?: string) {
  const s = (status ?? "").toUpperCase()
  if (s.includes("ATIVO") || s === "ACTIVE" || s === "SIGNED") return { label: "Ativo", badge: "bg-green-100 text-green-700" }
  if (s.includes("CANCEL") || s === "CANCELLED") return { label: "Cancelado", badge: "bg-red-100 text-red-700" }
  if (s.includes("DISTRAT") || s === "RESCINDED") return { label: "Distratado", badge: "bg-orange-100 text-orange-700" }
  if (s.includes("CONCLU") || s === "COMPLETED") return { label: "Concluído", badge: "bg-blue-100 text-blue-700" }
  return { label: status ?? "—", badge: "bg-gray-100 text-gray-600" }
}

type Contrato = { id: number; clientName?: string | null; buildingName?: string | null; unitName?: string | null; totalValue?: number | null; signatureDate?: string | null; status?: string | null }

function ContratoRowExpanded({ contratoId, onClose }: { contratoId: number; onClose: () => void }) {
  const { data: avalistas = [], isLoading: loadAv } = trpc.sienge.listarAvalistasContratoVenda.useQuery({ contratoId })
  const { data: anexos = [], isLoading: loadAn, refetch: refetchAnexos } = trpc.sienge.listarAnexosContratoVenda.useQuery({ contratoId })
  const addAvalista = trpc.sienge.adicionarAvalistaContratoVenda.useMutation({ onSuccess: () => {} })
  const uploadAnexo = trpc.sienge.uploadAnexoContratoVenda.useMutation({ onSuccess: () => refetchAnexos() })

  const [avForm, setAvForm] = useState({ customerId: "" })
  const [avMsg, setAvMsg] = useState("")
  const [anexoFile, setAnexoFile] = useState<File | null>(null)
  const [anexoDesc, setAnexoDesc] = useState("")
  const [uploadMsg, setUploadMsg] = useState("")

  async function handleAddAvalista(e: React.FormEvent) {
    e.preventDefault()
    setAvMsg("")
    try {
      await addAvalista.mutateAsync({ contratoId, customerId: Number(avForm.customerId) })
      setAvForm({ customerId: "" })
      setAvMsg("Avalista adicionado!")
    } catch { setAvMsg("Erro ao adicionar avalista.") }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!anexoFile) return
    setUploadMsg("")
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1]
        await uploadAnexo.mutateAsync({ contratoId, fileBase64: base64, fileName: anexoFile.name, description: anexoDesc })
        setAnexoFile(null)
        setAnexoDesc("")
        setUploadMsg("Anexo enviado!")
      }
      reader.readAsDataURL(anexoFile)
    } catch { setUploadMsg("Erro ao enviar anexo.") }
  }

  return (
    <div className="col-span-full px-5 pb-4 pt-2 bg-blue-50/40 border-t border-blue-100 space-y-4">
      {/* Avalistas */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5"><Users size={12} /> Avalistas</p>
        {loadAv ? <p className="text-xs text-[var(--text-muted)]">Carregando...</p> : avalistas.length === 0 ? <p className="text-xs text-[var(--text-muted)]">Nenhum avalista</p> : (
          <div className="flex flex-wrap gap-2">
            {avalistas.map((av: { id: number; name?: string | null }) => (
              <span key={av.id} className="px-2 py-1 bg-white border border-border rounded text-xs text-[var(--text-primary)]">{av.name ?? `ID ${av.id}`}</span>
            ))}
          </div>
        )}
        <form onSubmit={handleAddAvalista} className="flex gap-2 mt-2">
          <input value={avForm.customerId} onChange={e => setAvForm({ customerId: e.target.value })}
            placeholder="ID Cliente Sienge" type="number"
            className="border border-border rounded-lg px-3 py-1.5 text-xs w-40 bg-white" />
          <button type="submit" disabled={!avForm.customerId || addAvalista.isPending}
            className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 disabled:opacity-50">
            {addAvalista.isPending ? "Salvando..." : "+ Avalista"}
          </button>
          {avMsg && <span className={cn("text-xs self-center", avMsg.includes("Erro") ? "text-red-500" : "text-green-600")}>{avMsg}</span>}
        </form>
      </div>

      {/* Anexos */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5"><Paperclip size={12} /> Anexos</p>
        {loadAn ? <p className="text-xs text-[var(--text-muted)]">Carregando...</p> : anexos.length === 0 ? <p className="text-xs text-[var(--text-muted)]">Nenhum anexo</p> : (
          <div className="flex flex-wrap gap-2">
            {anexos.map((a: { id: number; description?: string | null; fileName?: string | null }) => (
              <span key={a.id} className="px-2 py-1 bg-white border border-border rounded text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                <Paperclip size={10} />
                {a.fileName ?? a.description ?? `Anexo ${a.id}`}
              </span>
            ))}
          </div>
        )}
        <form onSubmit={handleUpload} className="flex gap-2 mt-2 items-center">
          <label className="cursor-pointer px-3 py-1.5 border border-dashed border-orange-400 rounded-lg text-xs text-orange-500 hover:bg-orange-50 flex items-center gap-1.5">
            <Upload size={12} />
            {anexoFile ? anexoFile.name : "Escolher arquivo"}
            <input type="file" className="hidden" onChange={e => setAnexoFile(e.target.files?.[0] ?? null)} />
          </label>
          <input value={anexoDesc} onChange={e => setAnexoDesc(e.target.value)} placeholder="Descrição (opcional)"
            className="border border-border rounded-lg px-3 py-1.5 text-xs w-40 bg-white" />
          <button type="submit" disabled={!anexoFile || uploadAnexo.isPending}
            className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 disabled:opacity-50">
            {uploadAnexo.isPending ? "Enviando..." : "Enviar"}
          </button>
          {uploadMsg && <span className={cn("text-xs", uploadMsg.includes("Erro") ? "text-red-500" : "text-green-600")}>{uploadMsg}</span>}
        </form>
      </div>

      <button onClick={onClose} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">Recolher</button>
    </div>
  )
}

export default function ContratosVendaPage() {
  const utils = trpc.useUtils()
  const { data: contratos = [], isLoading } = trpc.sienge.listarContratosVenda.useQuery()
  const [filtroStatus, setFiltroStatus] = useState("TODOS")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Modal criar
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({
    enterpriseId: "", unitId: "", customerId: "",
    signatureDate: "", totalValue: "", installmentsCount: "", firstInstallmentDate: "", observations: ""
  })
  const [novoMsg, setNovoMsg] = useState("")
  const criarMutation = trpc.sienge.criarContratoVenda.useMutation({
    onSuccess: () => { utils.sienge.listarContratosVenda.invalidate(); setShowNovo(false); setNovoForm({ enterpriseId:"",unitId:"",customerId:"",signatureDate:"",totalValue:"",installmentsCount:"",firstInstallmentDate:"",observations:"" }) }
  })

  // Cancelar / Excluir
  const cancelarMutation = trpc.sienge.cancelarContratoVenda.useMutation({ onSuccess: () => utils.sienge.listarContratosVenda.invalidate() })
  const excluirMutation = trpc.sienge.excluirContratoVenda.useMutation({ onSuccess: () => utils.sienge.listarContratosVenda.invalidate() })
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const semSienge = !isLoading && contratos.length === 0

  const filtrados = useMemo(() => {
    if (filtroStatus === "TODOS") return contratos as Contrato[]
    return (contratos as Contrato[]).filter(c => {
      const s = getStatusConfig(c.status ?? undefined).label
      if (filtroStatus === "ATIVO") return s === "Ativo"
      if (filtroStatus === "CANCELADO") return s === "Cancelado"
      if (filtroStatus === "DISTRATADO") return s === "Distratado"
      return true
    })
  }, [contratos, filtroStatus])

  const totalValor = (contratos as Contrato[]).reduce((s, c) => s + (c.totalValue ?? 0), 0)
  const totalAtivos = (contratos as Contrato[]).filter(c => getStatusConfig(c.status ?? undefined).label === "Ativo").length

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setNovoMsg("")
    try {
      await criarMutation.mutateAsync({
        enterpriseId: Number(novoForm.enterpriseId),
        unitId: Number(novoForm.unitId),
        customerId: Number(novoForm.customerId),
        ...(novoForm.signatureDate && { signatureDate: novoForm.signatureDate }),
        ...(novoForm.totalValue && { totalValue: Number(novoForm.totalValue) }),
        ...(novoForm.installmentsCount && { installmentsCount: Number(novoForm.installmentsCount) }),
        ...(novoForm.firstInstallmentDate && { firstInstallmentDate: novoForm.firstInstallmentDate }),
        ...(novoForm.observations && { observations: novoForm.observations }),
      })
    } catch (err: unknown) {
      setNovoMsg(err instanceof Error ? err.message : "Erro ao criar contrato.")
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={22} className="text-blue-500" />
            Contratos de Venda
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
            Contratos de venda de unidades por empreendimento
          </p>
        </div>
        {!semSienge && !isLoading && (
          <button onClick={() => setShowNovo(true)}
            className="btn-orange flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Novo Contrato
          </button>
        )}
      </div>

      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <FileText size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">Configure a integração para visualizar os contratos de venda.</p>
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

      {!isLoading && contratos.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Total Contratos</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{contratos.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1 flex items-center gap-1">
                <CheckCircle size={10} /> Ativos
              </p>
              <p className="text-2xl font-bold text-green-700">{totalAtivos}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <TrendingUp size={10} /> Valor Total
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatMoeda(totalValor)}</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {["TODOS", "ATIVO", "CANCELADO", "DISTRATADO"].map(s => (
              <button key={s} type="button" onClick={() => setFiltroStatus(s)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  filtroStatus === s ? "bg-orange-500 text-white border-orange-500" : "bg-white text-[var(--text-muted)] border-border hover:border-orange-300"
                )}>
                {s === "TODOS" ? "Todos" : s === "ATIVO" ? "Ativos" : s === "CANCELADO" ? "Cancelados" : "Distratados"}
              </button>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_1fr_120px_100px_80px_80px] gap-3 px-5 py-2.5 border-b border-border bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>Cliente</span><span>Empreendimento</span><span>Unidade</span>
              <span className="text-right">Valor</span><span>Assinatura</span><span className="text-center">Status</span><span />
            </div>
            <div className="divide-y divide-border">
              {filtrados.map(c => {
                const cfg = getStatusConfig(c.status ?? undefined)
                const expanded = expandedId === c.id
                return (
                  <div key={c.id}>
                    <div className="grid grid-cols-[2fr_1.5fr_1fr_120px_100px_80px_80px] gap-3 px-5 py-3 items-center text-sm hover:bg-muted/20">
                      <p className="font-medium text-[var(--text-primary)] truncate">{c.clientName ?? "—"}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{c.buildingName ?? "—"}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{c.unitName ?? "—"}</p>
                      <p className="text-right text-xs font-semibold text-[var(--text-primary)]">{formatMoeda(c.totalValue ?? 0)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatDate(c.signatureDate)}</p>
                      <div className="flex justify-center">
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", cfg.badge)}>{cfg.label}</span>
                      </div>
                      <div className="flex justify-end items-center gap-1">
                        {/* Extrato PDF */}
                        <a href={`/api/sienge/pdf/extrato/${c.id}`} target="_blank" rel="noopener noreferrer"
                          title="Extrato financeiro PDF"
                          className="p-1.5 rounded border border-border text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-300 transition-all">
                          <FileDown size={11} />
                        </a>
                        {/* Cancelar */}
                        {cfg.label === "Ativo" && (
                          <button onClick={() => setConfirmCancel(c.id)} title="Cancelar contrato"
                            className="p-1.5 rounded border border-border text-[var(--text-muted)] hover:text-amber-500 hover:border-amber-300 transition-all">
                            <Ban size={11} />
                          </button>
                        )}
                        {/* Excluir */}
                        <button onClick={() => setConfirmDelete(c.id)} title="Excluir contrato"
                          className="p-1.5 rounded border border-border text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-all">
                          <Trash2 size={11} />
                        </button>
                        {/* Expandir */}
                        <button onClick={() => setExpandedId(expanded ? null : c.id)}
                          className="p-1.5 rounded border border-border text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-300 transition-all">
                          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      </div>
                    </div>
                    {expanded && <ContratoRowExpanded contratoId={c.id} onClose={() => setExpandedId(null)} />}
                  </div>
                )
              })}
            </div>
          </div>
          {filtrados.length === 0 && <p className="text-center text-sm text-[var(--text-muted)] py-8">Nenhum contrato com esse filtro.</p>}
          <p className="text-xs text-center text-[var(--text-muted)]">{filtrados.length} de {contratos.length} contratos · Dados via Sienge</p>
        </>
      )}

      {/* Modal Novo Contrato */}
      {showNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Novo Contrato de Venda</h3>
              <button onClick={() => { setShowNovo(false); setNovoMsg("") }} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">ID Empreendimento *</label>
                  <input type="number" required value={novoForm.enterpriseId} onChange={e => setNovoForm(f => ({ ...f, enterpriseId: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">ID Unidade *</label>
                  <input type="number" required value={novoForm.unitId} onChange={e => setNovoForm(f => ({ ...f, unitId: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 42" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">ID Cliente *</label>
                  <input type="number" required value={novoForm.customerId} onChange={e => setNovoForm(f => ({ ...f, customerId: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 123" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Data de Assinatura</label>
                  <input type="date" value={novoForm.signatureDate} onChange={e => setNovoForm(f => ({ ...f, signatureDate: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Valor Total (R$)</label>
                  <input type="number" step="0.01" value={novoForm.totalValue} onChange={e => setNovoForm(f => ({ ...f, totalValue: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 250000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Nº de Parcelas</label>
                  <input type="number" value={novoForm.installmentsCount} onChange={e => setNovoForm(f => ({ ...f, installmentsCount: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 120" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">1ª Parcela em</label>
                  <input type="date" value={novoForm.firstInstallmentDate} onChange={e => setNovoForm(f => ({ ...f, firstInstallmentDate: e.target.value }))}
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
                <button type="submit" disabled={criarMutation.isPending}
                  className="flex-1 btn-orange">{criarMutation.isPending ? "Criando..." : "Criar Contrato"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Cancelar */}
      {confirmCancel !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <AlertTriangle size={32} className="mx-auto text-amber-500" />
            <p className="font-semibold text-[var(--text-primary)]">Cancelar contrato #{confirmCancel}?</p>
            <p className="text-xs text-[var(--text-muted)]">Esta ação cancela o contrato no Sienge. Não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCancel(null)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted">Voltar</button>
              <button onClick={async () => { await cancelarMutation.mutateAsync({ id: confirmCancel }); setConfirmCancel(null) }}
                disabled={cancelarMutation.isPending}
                className="flex-1 bg-amber-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                {cancelarMutation.isPending ? "Cancelando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Excluir */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <XCircle size={32} className="mx-auto text-red-500" />
            <p className="font-semibold text-[var(--text-primary)]">Excluir contrato #{confirmDelete}?</p>
            <p className="text-xs text-[var(--text-muted)]">Esta ação remove o contrato do Sienge permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted">Voltar</button>
              <button onClick={async () => { await excluirMutation.mutateAsync({ id: confirmDelete }); setConfirmDelete(null) }}
                disabled={excluirMutation.isPending}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {excluirMutation.isPending ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
