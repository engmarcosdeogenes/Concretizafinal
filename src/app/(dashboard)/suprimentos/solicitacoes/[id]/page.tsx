"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowLeft, ClipboardList, Clock, CheckCircle2, XCircle, Send, ThumbsUp, ThumbsDown,
  Pencil, Trash2, Plus, Loader2, Save,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataLonga } from "@/lib/format"

type StatusSolicitacao = "RASCUNHO" | "PENDENTE" | "APROVADA" | "REJEITADA" | "CANCELADA"

const STATUS_MAP: Record<StatusSolicitacao, { label: string; cls: string; Icon: React.ElementType }> = {
  RASCUNHO:  { label: "Rascunho",  cls: "bg-slate-50 text-slate-600 border border-slate-200",  Icon: Clock },
  PENDENTE:  { label: "Pendente",  cls: "bg-amber-50 text-amber-700 border border-amber-200",  Icon: Clock },
  APROVADA:  { label: "Aprovada",  cls: "bg-green-50 text-green-700 border border-green-200",  Icon: CheckCircle2 },
  REJEITADA: { label: "Rejeitada", cls: "bg-red-50 text-red-700 border border-red-200",        Icon: XCircle },
  CANCELADA: { label: "Cancelada", cls: "bg-slate-50 text-slate-500 border border-slate-200",  Icon: XCircle },
}

const URGENCIA_LABEL: Record<number, string> = { 1: "Baixa", 2: "Média", 3: "Alta" }
const URGENCIA_CLS: Record<number, string>   = {
  1: "bg-slate-50 text-slate-600 border border-slate-200",
  2: "bg-amber-50 text-amber-700 border border-amber-200",
  3: "bg-red-50 text-red-700 border border-red-200",
}

type ItemEdit = { materialId: string; quantidade: number; unidade: string; observacao: string }

export default function SolicitacaoDetalhePage() {
  const params  = useParams()
  const router  = useRouter()
  const id      = params.id as string

  const utils = trpc.useUtils()
  const { data: sol, isLoading, error } = trpc.solicitacao.buscarPorId.useQuery({ id })
  const { data: materiais } = trpc.material.listar.useQuery()

  // Edit mode
  const [editando,     setEditando]     = useState(false)
  const [urgenciaEdit, setUrgenciaEdit] = useState(2)
  const [obsEdit,      setObsEdit]      = useState("")
  const [itensEdit,    setItensEdit]    = useState<ItemEdit[]>([])
  const [confirmDel,   setConfirmDel]   = useState(false)

  const atualizarStatus = trpc.solicitacao.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.solicitacao.buscarPorId.invalidate({ id })
      utils.solicitacao.listar.invalidate({})
    },
  })

  const atualizarMut = trpc.solicitacao.atualizar.useMutation({
    onSuccess: () => {
      utils.solicitacao.buscarPorId.invalidate({ id })
      utils.solicitacao.listar.invalidate({})
      setEditando(false)
    },
  })

  const excluirMut = trpc.solicitacao.excluir.useMutation({
    onSuccess: () => router.push("/suprimentos/solicitacoes"),
  })

  function iniciarEdicao() {
    if (!sol) return
    setUrgenciaEdit(sol.urgencia)
    setObsEdit(sol.observacoes ?? "")
    setItensEdit(sol.itens.map((i) => ({
      materialId: i.material.id,
      quantidade: i.quantidade,
      unidade:    i.unidade ?? i.material.unidade,
      observacao: i.observacao ?? "",
    })))
    setEditando(true)
  }

  function addItem() {
    setItensEdit((prev) => [...prev, { materialId: "", quantidade: 1, unidade: "", observacao: "" }])
  }

  function removeItem(idx: number) {
    setItensEdit((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof ItemEdit, value: string | number) {
    setItensEdit((prev) => prev.map((item, i) => {
      if (i !== idx) return item
      if (field === "materialId") {
        const mat = materiais?.find((m) => m.id === value)
        return { ...item, materialId: value as string, unidade: mat?.unidade ?? item.unidade }
      }
      return { ...item, [field]: value }
    }))
  }

  function handleSalvar() {
    const validItens = itensEdit.filter((i) => i.materialId && i.quantidade > 0)
    if (!validItens.length) return
    atualizarMut.mutate({
      id,
      urgencia:    urgenciaEdit,
      observacoes: obsEdit,
      itens:       validItens.map((i) => ({
        materialId: i.materialId,
        quantidade: i.quantidade,
        unidade:    i.unidade || undefined,
        observacao: i.observacao || undefined,
      })),
    })
  }

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center h-64">
      <p className="text-sm text-[var(--text-muted)]">Carregando solicitação...</p>
    </div>
  }

  if (error || !sol) {
    return <div className="p-6">
      <p className="text-sm text-red-500">Solicitação não encontrada.</p>
      <Link href="/suprimentos/solicitacoes" className="text-sm text-orange-500 mt-2 inline-block">
        ← Voltar para lista
      </Link>
    </div>
  }

  const status   = STATUS_MAP[sol.status as StatusSolicitacao] ?? STATUS_MAP.RASCUNHO
  const mutating = atualizarStatus.isPending
  const isRascunho = sol.status === "RASCUNHO"

  const nextActions: { label: string; status: StatusSolicitacao; icon: React.ReactNode; cls: string }[] = []
  if (sol.status === "RASCUNHO") {
    nextActions.push({ label: "Enviar para aprovação", status: "PENDENTE",  icon: <Send size={14} />,       cls: "btn-orange" })
  }
  if (sol.status === "PENDENTE") {
    nextActions.push({ label: "Aprovar",   status: "APROVADA",  icon: <ThumbsUp size={14} />,   cls: "btn-orange" })
    nextActions.push({ label: "Rejeitar",  status: "REJEITADA", icon: <ThumbsDown size={14} />, cls: "btn-danger" })
  }
  if (sol.status !== "CANCELADA" && sol.status !== "APROVADA" && sol.status !== "REJEITADA") {
    nextActions.push({ label: "Cancelar", status: "CANCELADA", icon: <XCircle size={14} />, cls: "btn-ghost" })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/suprimentos/solicitacoes"
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors cursor-pointer">
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <ClipboardList size={20} className="text-orange-500 flex-shrink-0" />
            Solicitação de Compra
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {sol.obra.nome} · {formatDataLonga(sol.createdAt)}
          </p>
        </div>

        {/* Ações do rascunho */}
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
                <button onClick={() => setConfirmDel(false)} className="px-3 py-2 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
                  Não
                </button>
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
      {editando ? (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Editando rascunho</h2>
            <button onClick={() => setEditando(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Cancelar
            </button>
          </div>

          {/* Urgência */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Urgência</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgenciaEdit(u)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    urgenciaEdit === u
                      ? URGENCIA_CLS[u] + " font-bold"
                      : "border-border text-[var(--text-muted)] hover:border-border"
                  }`}
                >
                  {URGENCIA_LABEL[u]}
                </button>
              ))}
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Itens</label>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 transition-colors">
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
                      onChange={(e) => updateItem(idx, "materialId", e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white outline-none focus:border-orange-400 transition-colors"
                    >
                      <option value="">Selecione...</option>
                      {materiais?.map((m) => (
                        <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-[var(--text-muted)] font-medium mb-1 block">Quantidade</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={item.quantidade}
                      onChange={(e) => updateItem(idx, "quantidade", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-[var(--text-muted)] font-medium mb-1 block">Unidade</label>
                    <input
                      type="text"
                      value={item.unidade}
                      onChange={(e) => updateItem(idx, "unidade", e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
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
              value={obsEdit}
              onChange={(e) => setObsEdit(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm resize-none outline-none focus:border-orange-400 transition-colors"
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setEditando(false)} className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={atualizarMut.isPending || itensEdit.filter(i => i.materialId).length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {atualizarMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar alterações
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Status + info card */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.cls}`}>
                <status.Icon size={12} />
                {status.label}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${URGENCIA_CLS[sol.urgencia] ?? URGENCIA_CLS[2]}`}>
                Urgência {URGENCIA_LABEL[sol.urgencia] ?? "Média"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Solicitante</p>
                <p className="text-sm text-[var(--text-primary)]">{sol.solicitante.nome}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Obra</p>
                <p className="text-sm text-[var(--text-primary)]">{sol.obra.nome}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Total de Itens</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{sol.itens.length} {sol.itens.length === 1 ? "item" : "itens"}</p>
              </div>
              {sol.pedidos.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Pedidos vinculados</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{sol.pedidos.length}</p>
                </div>
              )}
            </div>

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
              Itens solicitados
              <span className="text-[var(--text-muted)] font-normal ml-2">({sol.itens.length})</span>
            </h3>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Material</th>
                    <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Quantidade</th>
                    <th className="text-left px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {sol.itens.map(item => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-2.5 text-[var(--text-primary)]">{item.material.nome}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">
                        {item.quantidade} {item.unidade ?? item.material.unidade}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{item.observacao ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {sol.observacoes && (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Observações</h3>
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{sol.observacoes}</p>
            </div>
          )}

          {sol.pedidos.length > 0 && (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Pedidos de Compra vinculados</h3>
              <div className="space-y-2">
                {sol.pedidos.map(p => (
                  <Link
                    key={p.id}
                    href={`/suprimentos/pedidos/${p.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted transition-colors no-underline"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{p.fornecedor.nome}</p>
                      <p className="text-xs text-[var(--text-muted)]">{p.status}</p>
                    </div>
                    {p.total != null && (
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        R$ {p.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
