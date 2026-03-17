"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft, Plus, Trash2, ClipboardList, ChevronDown, ChevronUp,
  GripVertical, X, Check, AlertTriangle,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"

// ─── Types ───────────────────────────────────────────────────────────────────

type ItemInput = { descricao: string }

// ─── Item editor row ─────────────────────────────────────────────────────────

function ItemEditor({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: ItemInput
  index: number
  onChange: (i: number, value: string) => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="flex items-center gap-2 group">
      <GripVertical size={14} className="text-[var(--text-muted)] flex-shrink-0 cursor-grab" />
      <input
        value={item.descricao}
        onChange={(e) => onChange(index, e.target.value)}
        placeholder={`Item ${index + 1}`}
        className="flex-1 px-3 py-2 bg-[var(--input-bg)] border border-border rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─── AlertDialog (confirm delete) ────────────────────────────────────────────

function ConfirmDeleteDialog({
  nome,
  isPending,
  onConfirm,
  onCancel,
}: {
  nome: string
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Excluir template?</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              O template <span className="font-semibold text-[var(--text-primary)]">"{nome}"</span> será removido
              permanentemente. As FVS já criadas com ele não serão afetadas.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-[var(--text-secondary)] hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create/Edit Modal ────────────────────────────────────────────────────────

function TemplateModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [nome, setNome] = useState("")
  const [servico, setServico] = useState("")
  const [itens, setItens] = useState<ItemInput[]>([{ descricao: "" }])

  const criar = trpc.templateFvs.criar.useMutation({
    onSuccess: () => { toast.success("Template criado!"); onSaved() },
    onError: (e) => toast.error(e.message),
  })

  function addItem() {
    setItens((prev) => [...prev, { descricao: "" }])
  }

  function updateItem(i: number, value: string) {
    setItens((prev) => prev.map((it, idx) => (idx === i ? { descricao: value } : it)))
  }

  function removeItem(i: number) {
    setItens((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { toast.error("Nome do template é obrigatório"); return }
    if (!servico.trim()) { toast.error("Nome do serviço é obrigatório"); return }
    const itensValidos = itens.filter((i) => i.descricao.trim())
    if (itensValidos.length === 0) { toast.error("Adicione pelo menos um item de verificação"); return }
    criar.mutate({ nome: nome.trim(), servico: servico.trim(), itens: itensValidos })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Novo Template de FVS
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              Nome do template <span className="text-red-500">*</span>
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Verificação de Alvenaria Estrutural"
              className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-border rounded-xl text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              Serviço <span className="text-red-500">*</span>
            </label>
            <input
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              placeholder="Ex: Alvenaria, Fundação, Revestimento..."
              className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-border rounded-xl text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Itens de verificação
              </label>
              <span className="text-xs text-[var(--text-muted)]">
                {itens.filter((i) => i.descricao.trim()).length} item(s)
              </span>
            </div>
            <div className="space-y-2">
              {itens.map((item, i) => (
                <ItemEditor
                  key={i}
                  item={item}
                  index={i}
                  onChange={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm text-[var(--text-muted)] hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/50 transition-all cursor-pointer"
            >
              <Plus size={14} /> Adicionar item
            </button>
          </div>

          <button
            type="submit"
            disabled={criar.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={16} />
            {criar.isPending ? "Criando..." : "Criar template"}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TemplatesFvsPage() {
  const [showModal, setShowModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: templates = [], isLoading } = trpc.templateFvs.listar.useQuery()

  const excluir = trpc.templateFvs.excluir.useMutation({
    onSuccess: () => {
      utils.templateFvs.listar.invalidate()
      toast.success("Template excluído")
      setDeletingId(null)
    },
    onError: (e) => {
      toast.error(e.message)
      setDeletingId(null)
    },
  })

  const deletingTemplate = templates.find((t) => t.id === deletingId)

  return (
    <>
      <div className="flex-1 p-6 md:p-8 max-w-3xl mx-auto space-y-6">

        {/* Back */}
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Configurações
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardList className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Templates de FVS</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Modelos reutilizáveis para Fichas de Verificação de Serviço
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex-shrink-0"
          >
            <Plus size={16} /> Novo template
          </button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-border border-dashed">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <ClipboardList size={28} className="text-slate-400" />
            </div>
            <p className="text-base font-semibold text-[var(--text-primary)] mb-1">Nenhum template ainda</p>
            <p className="text-sm text-[var(--text-muted)] mb-4 max-w-sm">
              Templates de FVS são modelos pré-definidos de verificação. Crie um para "Alvenaria", "Fundação", "Revestimento", etc.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={14} /> Criar primeiro template
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => {
              const expanded = expandedId === t.id
              return (
                <div key={t.id} className="bg-white rounded-2xl border border-border shadow-sm">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <ClipboardList size={18} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{t.nome}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Serviço: <span className="font-medium">{t.servico}</span>
                        {" · "}
                        {t.itens.length} {t.itens.length === 1 ? "item" : "itens"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : t.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Ver itens"
                      >
                        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(t.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded items */}
                  {expanded && (
                    <div className="border-t border-border px-4 py-3 space-y-1">
                      {t.itens.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic">Nenhum item cadastrado</p>
                      ) : (
                        t.itens.map((item, i) => (
                          <div key={item.id} className="flex items-center gap-2 py-1">
                            <span className="text-[11px] text-[var(--text-muted)] w-5 text-right flex-shrink-0">{i + 1}.</span>
                            <p className="text-sm text-[var(--text-primary)] flex-1">{item.descricao}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Tip */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-orange-700 mb-1">Como usar</p>
          <p className="text-xs text-orange-600 leading-relaxed">
            Ao criar uma FVS em uma obra, selecione um template para preencher os itens automaticamente.
            Templates agilizam o processo e garantem padronização entre os inspetores de campo.
          </p>
        </div>

      </div>

      {/* Create Modal */}
      {showModal && (
        <TemplateModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            utils.templateFvs.listar.invalidate()
            setShowModal(false)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && deletingTemplate && (
        <ConfirmDeleteDialog
          nome={deletingTemplate.nome}
          isPending={excluir.isPending}
          onConfirm={() => excluir.mutate({ id: deletingId })}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </>
  )
}
