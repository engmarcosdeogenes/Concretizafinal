"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft, FileText, Plus, Trash2, Edit2, CheckCircle2,
  Eye, EyeOff, X, AlertTriangle, ToggleLeft, ToggleRight,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECOES = [
  { id: "equipe",               label: "Equipe do dia" },
  { id: "atividades",           label: "Atividades realizadas" },
  { id: "equipamentos",         label: "Equipamentos utilizados" },
  { id: "ocorrencias",          label: "Ocorrências do dia" },
  { id: "materiais",            label: "Materiais recebidos/utilizados" },
  { id: "clima",                label: "Condições climáticas" },
  { id: "fotos",                label: "Fotos e mídias" },
  { id: "assinaturas",          label: "Assinaturas digitais" },
  { id: "camposPersonalizados", label: "Campos personalizados" },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Modelo = {
  id: string
  nome: string
  nomeRelatorio: string
  secoesVisiveis: unknown
  ativo: boolean
}

function parseSecoes(s: unknown): string[] {
  if (Array.isArray(s)) return s as string[]
  if (typeof s === "string") {
    try { return JSON.parse(s) } catch { return [] }
  }
  return []
}

// ---------------------------------------------------------------------------
// Delete confirmation modal (AlertDialog)
// ---------------------------------------------------------------------------

function DeleteDialog({
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Excluir modelo?</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              O modelo <span className="font-semibold text-[var(--text-primary)]">"{nome}"</span> será removido permanentemente.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-[var(--text-muted)] hover:border-gray-400 transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={12} />
            {isPending ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modelo card
// ---------------------------------------------------------------------------

function ModeloCard({
  modelo,
  onEdit,
  onDelete,
  onToggleAtivo,
  isTogglingAtivo,
}: {
  modelo: Modelo
  onEdit: () => void
  onDelete: () => void
  onToggleAtivo: () => void
  isTogglingAtivo: boolean
}) {
  const secoes = parseSecoes(modelo.secoesVisiveis)
  return (
    <div className={cn(
      "bg-white border rounded-xl p-5 transition-all",
      modelo.ativo ? "border-border" : "border-dashed border-gray-300 opacity-60"
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{modelo.nome}</p>
            {!modelo.ativo && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-semibold">
                Inativo
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Título no PDF: <span className="italic">"{modelo.nomeRelatorio}"</span>
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onToggleAtivo}
            disabled={isTogglingAtivo}
            className="p-1.5 rounded-lg border border-border text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-300 transition-all disabled:opacity-50 cursor-pointer"
            title={modelo.ativo ? "Desativar modelo" : "Ativar modelo"}
          >
            {modelo.ativo
              ? <ToggleRight size={15} className="text-green-600" />
              : <ToggleLeft size={15} />
            }
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg border border-border text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-300 transition-all cursor-pointer"
            title="Editar"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg border border-border text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-all cursor-pointer"
            title="Excluir"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SECOES.map(s => (
          <span
            key={s.id}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-semibold",
              secoes.includes(s.id)
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400 line-through"
            )}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modelo form (inline, appears above or in-place)
// ---------------------------------------------------------------------------

function ModeloForm({
  initial,
  isPending,
  onSave,
  onCancel,
}: {
  initial?: { nome: string; nomeRelatorio: string; secoesVisiveis: string[] }
  isPending: boolean
  onSave: (d: { nome: string; nomeRelatorio: string; secoesVisiveis: string[] }) => void
  onCancel: () => void
}) {
  const [nome, setNome] = useState(initial?.nome ?? "")
  const [nomeRelatorio, setNomeRelatorio] = useState(
    initial?.nomeRelatorio ?? "Relatório Diário de Obra"
  )
  const [secoes, setSecoes] = useState<string[]>(
    initial?.secoesVisiveis ?? SECOES.map(s => s.id)
  )

  const toggle = (id: string) =>
    setSecoes(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  function handleSubmit() {
    if (!nome.trim()) {
      toast.error("Nome do modelo é obrigatório")
      return
    }
    onSave({ nome: nome.trim(), nomeRelatorio: nomeRelatorio.trim() || "Relatório Diário de Obra", secoesVisiveis: secoes })
  }

  return (
    <div className="bg-white border-2 border-orange-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--text-primary)]">
          {initial ? "Editar Modelo" : "Novo Modelo"}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            Nome do Modelo *
          </label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="ex: Modelo Obras Públicas"
            className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-border rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            Título no PDF
          </label>
          <input
            value={nomeRelatorio}
            onChange={e => setNomeRelatorio(e.target.value)}
            placeholder="ex: Relatório Diário de Obra"
            className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-border rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          Seções visíveis no RDO
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SECOES.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                secoes.includes(s.id)
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-gray-50 border-border text-[var(--text-muted)] hover:border-gray-400"
              )}
            >
              {secoes.includes(s.id) ? <Eye size={12} /> : <EyeOff size={12} />}
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          {secoes.length} de {SECOES.length} seções ativas
        </p>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-[var(--text-muted)] hover:border-gray-400 transition-all disabled:opacity-50 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !nome.trim()}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          <CheckCircle2 size={13} />
          {isPending ? "Salvando..." : "Salvar Modelo"}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ModelosRelatorioPage() {
  const utils = trpc.useUtils()

  const { data: modelos = [], isLoading } = trpc.modeloRelatorio.listar.useQuery()

  const criar = trpc.modeloRelatorio.criar.useMutation({
    onSuccess: () => {
      toast.success("Modelo criado com sucesso!")
      utils.modeloRelatorio.listar.invalidate()
      setShowForm(false)
    },
    onError: (e) => toast.error(e.message),
  })

  const atualizar = trpc.modeloRelatorio.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Modelo atualizado!")
      utils.modeloRelatorio.listar.invalidate()
      setEditId(null)
    },
    onError: (e) => toast.error(e.message),
  })

  const excluir = trpc.modeloRelatorio.excluir.useMutation({
    onSuccess: () => {
      toast.success("Modelo excluído")
      utils.modeloRelatorio.listar.invalidate()
      setDeleteTarget(null)
    },
    onError: (e) => toast.error(e.message),
  })

  const [showForm, setShowForm]         = useState(false)
  const [editId, setEditId]             = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Modelo | null>(null)
  const [togglingId, setTogglingId]     = useState<string | null>(null)

  const modeloEmEdicao = modelos.find(m => m.id === editId)

  function handleToggleAtivo(m: Modelo) {
    setTogglingId(m.id)
    atualizar.mutate(
      { id: m.id, ativo: !m.ativo },
      {
        onSuccess: () => {
          toast.success(m.ativo ? "Modelo desativado" : "Modelo ativado")
          setTogglingId(null)
        },
        onError: () => setTogglingId(null),
      }
    )
  }

  return (
    <>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">

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
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Modelos de Relatório
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Personalize quais seções aparecem no PDF do RDO por tipo de obra
              </p>
            </div>
          </div>
          {!showForm && !editId && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex-shrink-0"
            >
              <Plus size={16} /> Novo Modelo
            </button>
          )}
        </div>

        {/* New form */}
        {showForm && (
          <ModeloForm
            isPending={criar.isPending}
            onSave={d => criar.mutate(d)}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white rounded-xl border border-border animate-pulse" />
            ))}
          </div>
        ) : modelos.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-dashed border-border">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <FileText size={28} className="text-slate-400" />
            </div>
            <p className="text-base font-semibold text-[var(--text-primary)] mb-1">Nenhum modelo criado</p>
            <p className="text-sm text-[var(--text-muted)] mb-4 max-w-sm">
              Crie modelos para padronizar os RDOs de diferentes tipos de obra — obras públicas, industriais, residenciais, etc.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={14} /> Criar primeiro modelo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {modelos.map(m =>
              editId === m.id && modeloEmEdicao ? (
                <ModeloForm
                  key={m.id}
                  initial={{
                    nome: m.nome,
                    nomeRelatorio: m.nomeRelatorio,
                    secoesVisiveis: parseSecoes(m.secoesVisiveis),
                  }}
                  isPending={atualizar.isPending}
                  onSave={d => atualizar.mutate({ id: m.id, ...d })}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <ModeloCard
                  key={m.id}
                  modelo={m}
                  onEdit={() => { setShowForm(false); setEditId(m.id) }}
                  onDelete={() => setDeleteTarget(m)}
                  onToggleAtivo={() => handleToggleAtivo(m)}
                  isTogglingAtivo={togglingId === m.id}
                />
              )
            )}
          </div>
        )}

        {/* Footer counter */}
        {modelos.length > 0 && (
          <p className="text-xs text-center text-[var(--text-muted)]">
            {modelos.length} modelo{modelos.length !== 1 ? "s" : ""} configurado{modelos.length !== 1 ? "s" : ""}
            {" "}({modelos.filter(m => m.ativo).length} ativo{modelos.filter(m => m.ativo).length !== 1 ? "s" : ""})
          </p>
        )}

        {/* Info tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">Como usar modelos</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            Ao gerar o PDF de um RDO, o modelo escolhido define quais seções aparecem no relatório.
            Por exemplo: um modelo "Obra Pública" pode incluir assinaturas e omitir fotos; um modelo
            "Residencial" pode incluir todos os campos.
          </p>
        </div>

      </div>

      {/* Delete AlertDialog */}
      {deleteTarget && (
        <DeleteDialog
          nome={deleteTarget.nome}
          isPending={excluir.isPending}
          onConfirm={() => excluir.mutate({ id: deleteTarget.id })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
