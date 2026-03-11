"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ShoppingCart, Truck, Phone, Mail, Send, CheckCircle2, Package, RotateCcw, XCircle, FileText, Upload, DollarSign, Loader2, Pencil, Save, Trash2, Plus, ExternalLink, Star } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatDataLonga } from "@/lib/format"

type StatusPedido = "RASCUNHO" | "ENVIADO" | "CONFIRMADO" | "ENTREGUE_PARCIAL" | "ENTREGUE" | "CANCELADO"

const STATUS_MAP: Record<StatusPedido, { label: string; cls: string; Icon: React.ElementType }> = {
  RASCUNHO:         { label: "Rascunho",        cls: "bg-slate-50 text-slate-600 border border-slate-200",    Icon: ShoppingCart },
  ENVIADO:          { label: "Enviado",          cls: "bg-blue-50 text-blue-700 border border-blue-200",       Icon: Send },
  CONFIRMADO:       { label: "Confirmado",       cls: "bg-indigo-50 text-indigo-700 border border-indigo-200", Icon: CheckCircle2 },
  ENTREGUE_PARCIAL: { label: "Parc. Entregue",   cls: "bg-amber-50 text-amber-700 border border-amber-200",   Icon: Package },
  ENTREGUE:         { label: "Entregue",         cls: "bg-green-50 text-green-700 border border-green-200",   Icon: CheckCircle2 },
  CANCELADO:        { label: "Cancelado",        cls: "bg-slate-50 text-slate-500 border border-slate-200",   Icon: XCircle },
}

type NfeData = {
  numero: string
  dataEmissao: string
  valorTotal: number
  emitente: { cnpj: string; nome: string }
  itens: Array<{ descricao: string; quantidade: number; unidade: string; valorTotal: number }>
}

type ItemEdit = { materialId: string; quantidade: number; precoUnit: string; unidade: string }

export default function PedidoDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const utils = trpc.useUtils()
  const { data: pedido, isLoading, error } = trpc.pedido.buscarPorId.useQuery({ id })
  const { data: materiais } = trpc.material.listar.useQuery()

  const [editando,     setEditando]     = useState(false)
  const [itensEdit,    setItensEdit]    = useState<ItemEdit[]>([])
  const [prevEdit,     setPrevEdit]     = useState("")
  const [obsEditPed,   setObsEditPed]   = useState("")
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [notasAvaliacao, setNotasAvaliacao] = useState<Record<number, number>>({})
  const [obsAvaliacao,   setObsAvaliacao]   = useState("")
  const [avaliacaoSalva, setAvaliacaoSalva] = useState(false)

  const atualizarStatus = trpc.pedido.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.pedido.buscarPorId.invalidate({ id })
      utils.pedido.listar.invalidate()
    },
  })

  const atualizarMut = trpc.pedido.atualizar.useMutation({
    onSuccess: () => {
      utils.pedido.buscarPorId.invalidate({ id })
      utils.pedido.listar.invalidate()
      setEditando(false)
    },
  })

  const excluirMut = trpc.pedido.excluir.useMutation({
    onSuccess: () => router.push("/suprimentos/pedidos"),
  })

  function iniciarEdicao() {
    if (!pedido) return
    setItensEdit(pedido.itens.map((i) => ({
      materialId: i.material.id,
      quantidade: i.quantidade,
      precoUnit:  i.precoUnit != null ? String(i.precoUnit) : "",
      unidade:    i.unidade ?? i.material.unidade,
    })))
    setPrevEdit(pedido.previsaoEntrega ? new Date(pedido.previsaoEntrega).toISOString().split("T")[0] : "")
    setObsEditPed(pedido.observacoes ?? "")
    setEditando(true)
  }

  function addItemPed() {
    setItensEdit((prev) => [...prev, { materialId: "", quantidade: 1, precoUnit: "", unidade: "" }])
  }

  function removeItemPed(idx: number) {
    setItensEdit((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItemPed(idx: number, field: keyof ItemEdit, value: string | number) {
    setItensEdit((prev) => prev.map((item, i) => {
      if (i !== idx) return item
      if (field === "materialId") {
        const mat = materiais?.find((m) => m.id === value)
        return { ...item, materialId: value as string, unidade: mat?.unidade ?? item.unidade }
      }
      return { ...item, [field]: value }
    }))
  }

  function handleSalvarPedido() {
    const validItens = itensEdit.filter((i) => i.materialId && i.quantidade > 0)
    if (!validItens.length) return
    atualizarMut.mutate({
      id,
      previsaoEntrega: prevEdit || undefined,
      observacoes:     obsEditPed,
      itens: validItens.map((i) => ({
        materialId: i.materialId,
        quantidade: i.quantidade,
        precoUnit:  i.precoUnit ? parseFloat(i.precoUnit) : undefined,
        unidade:    i.unidade || undefined,
      })),
    })
  }

  // Sienge: pedido ID (numeric) via siengePurchaseOrderId ou fallback
  const siengePedidoId = (pedido as unknown as { siengePurchaseOrderId?: number | null })?.siengePurchaseOrderId ?? null

  const { data: criterios = [] } = trpc.sienge.listarCriteriosAvaliacao.useQuery(
    { pedidoId: siengePedidoId! },
    { enabled: !!siengePedidoId && pedido?.status === "ENTREGUE" },
  )

  const salvarAvaliacaoMut = trpc.sienge.salvarAvaliacao.useMutation({
    onSuccess: () => setAvaliacaoSalva(true),
  })

  const salvarNf = trpc.pedido.salvarNotaFiscal.useMutation({
    onSuccess: () => {
      utils.pedido.buscarPorId.invalidate({ id })
      setNfSalva(true)
    },
  })

  const lancarDespesa = trpc.pedido.lancarDespesa.useMutation({
    onSuccess: () => setDespesaLancada(true),
  })

  // NF-e upload state
  const fileRef  = useRef<HTMLInputElement>(null)
  const [nfe, setNfe]                   = useState<NfeData | null>(null)
  const [parseando, setParseando]       = useState(false)
  const [nfeErro, setNfeErro]           = useState("")
  const [nfSalva, setNfSalva]           = useState(false)
  const [despesaLancada, setDespesaLancada] = useState(false)

  async function handleNfeFile(file: File) {
    if (!file.name.endsWith(".xml")) {
      setNfeErro("Selecione um arquivo XML de NF-e.")
      return
    }
    setParseando(true)
    setNfeErro("")
    setNfe(null)
    setNfSalva(false)
    setDespesaLancada(false)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/nfe/parse", { method: "POST", body: formData })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "Erro ao processar XML.")
      }
      const data: NfeData = await res.json()
      setNfe(data)
    } catch (e: unknown) {
      setNfeErro(e instanceof Error ? e.message : "Erro ao processar XML.")
    } finally {
      setParseando(false)
    }
  }

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center h-64">
      <p className="text-sm text-[var(--text-muted)]">Carregando pedido...</p>
    </div>
  }

  if (error || !pedido) {
    return <div className="p-6">
      <p className="text-sm text-red-500">Pedido não encontrado.</p>
      <Link href="/suprimentos/pedidos" className="text-sm text-orange-500 mt-2 inline-block">← Voltar</Link>
    </div>
  }

  const status     = STATUS_MAP[pedido.status as StatusPedido] ?? STATUS_MAP.RASCUNHO
  const mutating   = atualizarStatus.isPending
  const isRascunho = pedido.status === "RASCUNHO"

  const nextActions: { label: string; status: StatusPedido; icon: React.ReactNode; cls: string }[] = []
  if (pedido.status === "RASCUNHO") {
    nextActions.push({ label: "Enviar ao Fornecedor", status: "ENVIADO",    icon: <Send size={14} />,          cls: "btn-orange" })
  }
  if (pedido.status === "ENVIADO") {
    nextActions.push({ label: "Confirmar",            status: "CONFIRMADO", icon: <CheckCircle2 size={14} />,  cls: "btn-orange" })
  }
  if (pedido.status === "CONFIRMADO") {
    nextActions.push({ label: "Registrar Entrega",    status: "ENTREGUE",   icon: <Package size={14} />,       cls: "btn-orange" })
    nextActions.push({ label: "Entrega Parcial",      status: "ENTREGUE_PARCIAL", icon: <RotateCcw size={14} />, cls: "btn-ghost" })
  }
  if (pedido.status === "ENTREGUE_PARCIAL") {
    nextActions.push({ label: "Finalizar Entrega",    status: "ENTREGUE",   icon: <Package size={14} />,       cls: "btn-orange" })
  }
  if (pedido.status !== "CANCELADO" && pedido.status !== "ENTREGUE") {
    nextActions.push({ label: "Cancelar",             status: "CANCELADO",  icon: <XCircle size={14} />,       cls: "btn-danger" })
  }

  const obraId = pedido.solicitacao?.obra?.id

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/suprimentos/pedidos"
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors cursor-pointer">
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <ShoppingCart size={20} className="text-orange-500 flex-shrink-0" />
            Pedido de Compra
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {pedido.fornecedor.nome} · {formatDataLonga(pedido.createdAt)}
          </p>
        </div>

        {/* Ações rascunho */}
        {isRascunho && !editando && (
          <div className="flex items-center gap-2">
            <button
              onClick={iniciarEdicao}
              className="flex items-center gap-1.5 px-3 py-2 border border-border bg-white hover:bg-muted rounded-xl text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              <Pencil size={14} /> Editar
            </button>
            {confirmDel ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500 font-medium">Confirmar?</span>
                <button
                  onClick={() => excluirMut.mutate({ id })}
                  disabled={excluirMut.isPending}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                  {excluirMut.isPending ? <Loader2 size={14} className="animate-spin" /> : "Excluir"}
                </button>
                <button onClick={() => setConfirmDel(false)} className="px-3 py-2 border border-border rounded-xl text-sm hover:bg-muted transition-colors">Não</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDel(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium text-red-600 transition-colors"
              >
                <Trash2 size={14} /> Excluir
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODO EDIÇÃO */}
      {editando && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Editando pedido (rascunho)</h2>
            <button onClick={() => setEditando(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Cancelar</button>
          </div>

          {/* Previsão entrega */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Previsão de entrega</label>
            <input
              type="date"
              value={prevEdit}
              onChange={(e) => setPrevEdit(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Itens</label>
              <button onClick={addItemPed} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 transition-colors">
                <Plus size={13} /> Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              {itensEdit.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end p-3 bg-muted/40 rounded-xl border border-border">
                  <div className="flex-1">
                    <label className="text-[10px] text-[var(--text-muted)] font-medium mb-1 block">Material</label>
                    <select
                      value={item.materialId}
                      onChange={(e) => updateItemPed(idx, "materialId", e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white outline-none focus:border-orange-400 transition-colors"
                    >
                      <option value="">Selecione...</option>
                      {materiais?.map((m) => (
                        <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-[var(--text-muted)] font-medium mb-1 block">Qtd.</label>
                    <input
                      type="number" min={0.01} step={0.01}
                      value={item.quantidade}
                      onChange={(e) => updateItemPed(idx, "quantidade", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 border border-border rounded-lg text-sm outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-[10px] text-[var(--text-muted)] font-medium mb-1 block">Preço unit. (R$)</label>
                    <input
                      type="number" min={0} step={0.01}
                      value={item.precoUnit}
                      onChange={(e) => updateItemPed(idx, "precoUnit", e.target.value)}
                      className="w-full px-2 py-2 border border-border rounded-lg text-sm outline-none focus:border-orange-400 transition-colors"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="w-16">
                    <label className="text-[10px] text-[var(--text-muted)] font-medium mb-1 block">Unid.</label>
                    <input
                      type="text"
                      value={item.unidade}
                      onChange={(e) => updateItemPed(idx, "unidade", e.target.value)}
                      className="w-full px-2 py-2 border border-border rounded-lg text-sm outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>
                  <button onClick={() => removeItemPed(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Observações</label>
            <textarea
              value={obsEditPed}
              onChange={(e) => setObsEditPed(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm resize-none outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setEditando(false)} className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-muted transition-colors">Cancelar</button>
            <button
              onClick={handleSalvarPedido}
              disabled={atualizarMut.isPending || itensEdit.filter(i => i.materialId).length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {atualizarMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar alterações
            </button>
          </div>
        </div>
      )}

      {/* Status + info card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.cls}`}>
            <status.Icon size={12} />
            {status.label}
          </span>
          {pedido.total != null && (
            <span className="text-sm font-bold text-[var(--text-primary)]">
              R$ {pedido.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          {/* Fornecedor */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Fornecedor</p>
            <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Truck size={13} className="text-[var(--text-muted)]" />
              {pedido.fornecedor.nome}
            </p>
            {pedido.fornecedor.telefone && (
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                <Phone size={10} />{pedido.fornecedor.telefone}
              </p>
            )}
            {pedido.fornecedor.email && (
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                <Mail size={10} />{pedido.fornecedor.email}
              </p>
            )}
          </div>

          {/* Previsão + vinculada */}
          <div>
            {pedido.previsaoEntrega && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Previsão de Entrega</p>
                <p className="text-sm text-[var(--text-primary)]">{formatDataLonga(pedido.previsaoEntrega)}</p>
              </div>
            )}
            {pedido.solicitacao && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Solicitação vinculada</p>
                <Link
                  href={`/suprimentos/solicitacoes/${pedido.solicitacao.id}`}
                  className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                >
                  {pedido.solicitacao.obra.nome}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* NF-e salva */}
        {(pedido as { notaFiscalNumero?: string | null }).notaFiscalNumero && (
          <div className="pt-2 border-t border-border flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <FileText size={13} className="text-orange-400" />
            NF-e nº {(pedido as { notaFiscalNumero?: string | null }).notaFiscalNumero}
            {(pedido as { notaFiscalValor?: number | null }).notaFiscalValor != null && (
              <span className="font-semibold text-[var(--text-primary)]">
                · R$ {((pedido as { notaFiscalValor?: number | null }).notaFiscalValor as number).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        )}

        {/* Ações de status */}
        {nextActions.length > 0 && (
          <div className="pt-4 border-t border-border flex gap-2 flex-wrap">
            {nextActions.map(action => (
              <button
                key={action.status}
                type="button"
                disabled={mutating}
                onClick={() => atualizarStatus.mutate({ id, status: action.status })}
                className={`${action.cls} min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {action.icon}
                {mutating ? "..." : action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Itens */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Itens do pedido
          <span className="text-[var(--text-muted)] font-normal ml-2">({pedido.itens.length})</span>
        </h3>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Material</th>
                <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Qtd.</th>
                <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Preço Unit.</th>
                <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.itens.map(item => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-2.5 text-[var(--text-primary)]">{item.material.nome}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-primary)]">
                    {item.quantidade} {item.unidade ?? item.material.unidade}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-muted)]">
                    {item.precoUnit != null
                      ? `R$ ${item.precoUnit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">
                    {item.total != null
                      ? `R$ ${item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                </tr>
              ))}
              {pedido.total != null && (
                <tr className="border-t-2 border-border bg-muted">
                  <td colSpan={3} className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total</td>
                  <td className="px-4 py-2.5 text-right font-bold text-[var(--text-primary)]">
                    R$ {pedido.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota Fiscal (XML) */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Nota Fiscal (NF-e)</h3>
        </div>

        {/* Upload area */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {parseando
            ? <Loader2 size={20} className="mx-auto animate-spin text-orange-500 mb-1.5" />
            : <Upload size={20} className="mx-auto text-[var(--text-muted)] mb-1.5" />}
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {parseando ? "Processando XML..." : "Clique para importar XML da NF-e"}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Arquivo .xml do SEFAZ</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xml"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleNfeFile(f) }}
          />
        </div>

        {nfeErro && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{nfeErro}</p>
        )}

        {/* NF-e parsed preview */}
        {nfe && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">NF-e nº {nfe.numero}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{nfe.emitente.nome} · {nfe.emitente.cnpj}</p>
              </div>
              <p className="text-sm font-bold text-green-700">
                R$ {nfe.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="divide-y divide-border">
              {nfe.itens.slice(0, 5).map((item, i) => (
                <div key={i} className="px-4 py-2 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-primary)] truncate flex-1 mr-4">{item.descricao}</span>
                  <span className="text-[var(--text-muted)] shrink-0">{item.quantidade} {item.unidade}</span>
                </div>
              ))}
              {nfe.itens.length > 5 && (
                <div className="px-4 py-2 text-xs text-[var(--text-muted)] italic">
                  +{nfe.itens.length - 5} itens
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ações NF-e */}
        {nfe && (
          <div className="flex gap-2 flex-wrap">
            {!nfSalva ? (
              <button
                type="button"
                disabled={salvarNf.isPending}
                onClick={() => salvarNf.mutate({
                  id,
                  notaFiscalNumero: nfe.numero,
                  notaFiscalValor:  nfe.valorTotal,
                })}
                className="btn-ghost min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileText size={14} />
                {salvarNf.isPending ? "Salvando..." : "Salvar NF no pedido"}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-medium">
                <CheckCircle2 size={14} /> NF-e salva no pedido
              </div>
            )}

            {obraId && !despesaLancada && (
              <button
                type="button"
                disabled={lancarDespesa.isPending}
                onClick={() => lancarDespesa.mutate({
                  pedidoId:  id,
                  obraId,
                  descricao: `Pedido de compra — NF-e ${nfe.numero}`,
                  valor:     nfe.valorTotal,
                })}
                className="btn-orange min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <DollarSign size={14} />
                {lancarDespesa.isPending ? "Lançando..." : `Lançar R$ ${nfe.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} como despesa`}
              </button>
            )}

            {despesaLancada && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-medium">
                <DollarSign size={14} /> Despesa lançada no financeiro!
              </div>
            )}
          </div>
        )}

        {!obraId && nfe && (
          <p className="text-xs text-[var(--text-muted)]">
            Este pedido não está vinculado a uma obra — não é possível lançar a despesa diretamente.
          </p>
        )}
      </div>

      {/* Observações */}
      {pedido.observacoes && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Observações</h3>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{pedido.observacoes}</p>
        </div>
      )}

      {/* PDF Análise de Pedido (Sienge) */}
      {siengePedidoId && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Análise de Pedido (Sienge)</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">PDF oficial gerado pelo Sienge</p>
            </div>
            <a
              href={`/api/sienge/pdf/pedido/${siengePedidoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <ExternalLink size={14} /> Abrir PDF
            </a>
          </div>
        </div>
      )}

      {/* Avaliação de Fornecedor (só quando ENTREGUE e tem Sienge) */}
      {pedido.status === "ENTREGUE" && siengePedidoId && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Avaliar Fornecedor</h3>
          </div>

          {avaliacaoSalva ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
              <CheckCircle2 size={14} /> Avaliação enviada ao Sienge!
            </div>
          ) : criterios.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nenhum critério de avaliação disponível no Sienge para este pedido.</p>
          ) : (
            <>
              <div className="space-y-3">
                {criterios.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-[var(--text-primary)]">
                        {c.nome}
                        {c.descricao && <span className="text-[var(--text-muted)] font-normal"> — {c.descricao}</span>}
                      </label>
                      <span className="text-xs font-bold text-orange-500">{notasAvaliacao[c.id] ?? "—"}/10</span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNotasAvaliacao(prev => ({ ...prev, [c.id]: n }))}
                          className={cn(
                            "w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                            notasAvaliacao[c.id] === n
                              ? "bg-orange-500 text-white"
                              : "bg-slate-100 text-[var(--text-muted)] hover:bg-orange-100 hover:text-orange-600"
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                value={obsAvaliacao}
                onChange={e => setObsAvaliacao(e.target.value)}
                placeholder="Observações sobre a entrega (opcional)..."
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm resize-none outline-none focus:border-orange-400 transition-colors"
              />
              <button
                type="button"
                disabled={
                  salvarAvaliacaoMut.isPending ||
                  criterios.some(c => notasAvaliacao[c.id] == null)
                }
                onClick={() => salvarAvaliacaoMut.mutate({
                  pedidoId:   siengePedidoId!,
                  criterios:  criterios.map(c => ({ criterioId: c.id, nota: notasAvaliacao[c.id] })),
                  observacao: obsAvaliacao || undefined,
                })}
                className="btn-orange min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Star size={14} />
                {salvarAvaliacaoMut.isPending ? "Enviando..." : "Enviar avaliação"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
