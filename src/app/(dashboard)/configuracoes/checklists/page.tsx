"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft, Plus, Trash2, Edit2, ListChecks, ChevronDown, ChevronUp,
  GripVertical, X, Check, ClipboardCheck
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"

type ItemInput = {
  descricao: string
  secao: string
  obrigatorio: boolean
  ordem: number
}

function ItemEditor({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: ItemInput
  index: number
  onChange: (i: number, field: keyof ItemInput, value: string | boolean | number) => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="flex items-center gap-2 group">
      <GripVertical size={14} className="text-[var(--text-muted)] flex-shrink-0 cursor-grab" />
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
        <input
          value={item.descricao}
          onChange={(e) => onChange(index, "descricao", e.target.value)}
          placeholder={`Item ${index + 1}`}
          className="px-3 py-2 bg-[var(--input-bg)] border border-border rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
        />
        <input
          value={item.secao}
          onChange={(e) => onChange(index, "secao", e.target.value)}
          placeholder="Seção (opcional)"
          className="px-3 py-2 bg-[var(--input-bg)] border border-border rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition sm:w-36"
        />
        <label className="flex items-center gap-1.5 cursor-pointer select-none flex-shrink-0">
          <input
            type="checkbox"
            checked={item.obrigatorio}
            onChange={(e) => onChange(index, "obrigatorio", e.target.checked)}
            className="w-4 h-4 rounded accent-orange-500 cursor-pointer"
          />
          <span className="text-xs text-[var(--text-muted)]">Obrigatório</span>
        </label>
      </div>
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

const BLANK_ITEM = (): ItemInput => ({ descricao: "", secao: "", obrigatorio: false, ordem: 0 })

function TemplateModal({
  editingId,
  initialNome,
  initialDescricao,
  initialItens,
  onClose,
  onSaved,
}: {
  editingId?: string
  initialNome?: string
  initialDescricao?: string
  initialItens?: ItemInput[]
  onClose: () => void
  onSaved: () => void
}) {
  const [nome, setNome] = useState(initialNome ?? "")
  const [descricao, setDescricao] = useState(initialDescricao ?? "")
  const [itens, setItens] = useState<ItemInput[]>(initialItens ?? [BLANK_ITEM()])

  const criar = trpc.checklist.criarTemplate.useMutation({
    onSuccess: () => { toast.success("Template criado!"); onSaved() },
    onError: (e) => toast.error(e.message),
  })
  const atualizar = trpc.checklist.atualizarTemplate.useMutation({
    onSuccess: () => { toast.success("Template atualizado!"); onSaved() },
    onError: (e) => toast.error(e.message),
  })

  function addItem() {
    setItens(prev => [...prev, { ...BLANK_ITEM(), ordem: prev.length }])
  }

  function updateItem(i: number, field: keyof ItemInput, value: string | boolean | number) {
    setItens(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it))
  }

  function removeItem(i: number) {
    setItens(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { toast.error("Nome do template é obrigatório"); return }
    const itensValidos = itens.filter(i => i.descricao.trim()).map((it, idx) => ({ ...it, ordem: idx }))
    if (itensValidos.length === 0) { toast.error("Adicione pelo menos um item"); return }

    if (editingId) {
      atualizar.mutate({ id: editingId, nome: nome.trim(), descricao: descricao || undefined, itens: itensValidos })
    } else {
      criar.mutate({ nome: nome.trim(), descricao: descricao || undefined, itens: itensValidos })
    }
  }

  const isPending = criar.isPending || atualizar.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            {editingId ? "Editar Template" : "Novo Template de Checklist"}
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
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Nome do template</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Checklist Diário de Segurança"
              className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-border rounded-xl text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Descrição (opcional)</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Aplicar antes de iniciar os trabalhos"
              className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-border rounded-xl text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Itens</label>
              <span className="text-xs text-[var(--text-muted)]">{itens.filter(i => i.descricao.trim()).length} item(s)</span>
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
            disabled={isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={16} />
            {isPending ? "Salvando..." : editingId ? "Salvar alterações" : "Criar template"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ChecklistsConfigPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<{
    id: string; nome: string; descricao?: string; itens: ItemInput[]
  } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: templates = [], isLoading } = trpc.checklist.listarTemplates.useQuery()
  const excluir = trpc.checklist.excluirTemplate.useMutation({
    onSuccess: () => { utils.checklist.listarTemplates.invalidate(); toast.success("Template excluído") },
    onError: (e) => toast.error(e.message),
  })

  const { data: detalheTemplate } = trpc.checklist.buscarTemplate.useQuery(
    { id: expandedId! },
    { enabled: !!expandedId }
  )

  function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir template "${nome}"? Esta ação removerá o template (os checklists preenchidos não serão afetados).`)) return
    excluir.mutate({ id })
  }

  function handleEdit(t: typeof templates[0]) {
    setExpandedId(t.id)
    // we'll load itens via buscarTemplate query — handled below after expand
    setEditingTemplate({ id: t.id, nome: t.nome, descricao: t._count ? undefined : undefined, itens: [] })
    setShowModal(true)
  }

  function openEdit(t: typeof templates[0]) {
    if (!detalheTemplate || detalheTemplate.id !== t.id) {
      setExpandedId(t.id)
    }
    setEditingTemplate({
      id: t.id,
      nome: t.nome,
      descricao: undefined,
      itens: detalheTemplate?.itens.map(i => ({
        descricao: i.descricao,
        secao: i.secao ?? "",
        obrigatorio: i.obrigatorio,
        ordem: i.ordem,
      })) ?? [],
    })
    setShowModal(true)
  }

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
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Templates de Checklist</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Crie templates reutilizáveis para verificações diárias de campo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setEditingTemplate(null); setShowModal(true) }}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex-shrink-0"
          >
            <Plus size={16} /> Novo template
          </button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-border animate-pulse" />)}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-border border-dashed">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <ListChecks size={28} className="text-slate-400" />
            </div>
            <p className="text-base font-semibold text-[var(--text-primary)] mb-1">Nenhum template ainda</p>
            <p className="text-sm text-[var(--text-muted)] mb-4 max-w-sm">
              Templates de checklist são modelos reutilizáveis. Crie um para "Segurança Diária", "Vistoria Semanal", etc.
            </p>
            <button
              type="button"
              onClick={() => { setEditingTemplate(null); setShowModal(true) }}
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
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <ListChecks size={18} className="text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{t.nome}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {t._count.itens} {t._count.itens === 1 ? "item" : "itens"}
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
                        onClick={() => openEdit(t)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(t.id, t.nome)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded itens */}
                  {expanded && detalheTemplate?.id === t.id && (
                    <div className="border-t border-border px-4 py-3 space-y-1">
                      {detalheTemplate.itens.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic">Nenhum item</p>
                      ) : (
                        detalheTemplate.itens.map((item, i) => (
                          <div key={item.id} className="flex items-center gap-2 py-1">
                            <span className="text-[11px] text-[var(--text-muted)] w-5 text-right flex-shrink-0">{i + 1}.</span>
                            <p className="text-sm text-[var(--text-primary)] flex-1">{item.descricao}</p>
                            {item.secao && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">{item.secao}</span>
                            )}
                            {item.obrigatorio && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded font-medium">Obrig.</span>
                            )}
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
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">Dica</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            Templates de checklist são diferentes de FVS. O checklist é uma lista rápida de verificação do dia a dia (ex: segurança antes do início).
            O FVS é uma inspeção formal com workflow de aprovação e laudo.
          </p>
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <TemplateModal
          editingId={editingTemplate?.id}
          initialNome={editingTemplate?.nome}
          initialDescricao={editingTemplate?.descricao}
          initialItens={editingTemplate?.itens}
          onClose={() => { setShowModal(false); setEditingTemplate(null) }}
          onSaved={() => {
            utils.checklist.listarTemplates.invalidate()
            setShowModal(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </>
  )
}
