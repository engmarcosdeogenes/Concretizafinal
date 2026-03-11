"use client"

import { useState } from "react"
import { FileText, Plus, Trash2, Edit2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

const SECOES = [
  { id: "equipe",              label: "Equipe do dia" },
  { id: "atividades",          label: "Atividades realizadas" },
  { id: "equipamentos",        label: "Equipamentos utilizados" },
  { id: "ocorrencias",         label: "Ocorrências do dia" },
  { id: "materiais",           label: "Materiais recebidos/utilizados" },
  { id: "clima",               label: "Condições climáticas" },
  { id: "fotos",               label: "Fotos e mídias" },
  { id: "assinaturas",         label: "Assinaturas digitais" },
  { id: "camposPersonalizados", label: "Campos personalizados" },
]

type Modelo = {
  id: string; nome: string; nomeRelatorio: string; secoesVisiveis: unknown; ativo: boolean
}

function parseSecoes(s: unknown): string[] {
  if (Array.isArray(s)) return s as string[]
  if (typeof s === "string") { try { return JSON.parse(s) } catch { return [] } }
  return []
}

function ModeloCard({ modelo, onEdit, onDelete }: { modelo: Modelo; onEdit: () => void; onDelete: () => void }) {
  const secoes = parseSecoes(modelo.secoesVisiveis)
  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-sm text-[var(--text-primary)]">{modelo.nome}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Título do PDF: "{modelo.nomeRelatorio}"</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit}
            className="p-1.5 rounded-lg border border-border text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-300 transition-all">
            <Edit2 size={13} />
          </button>
          <button type="button" onClick={onDelete}
            className="p-1.5 rounded-lg border border-border text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SECOES.map(s => (
          <span key={s.id} className={cn(
            "px-2 py-0.5 rounded text-[10px] font-semibold",
            secoes.includes(s.id) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400 line-through"
          )}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function ModeloForm({
  initial, onSave, onCancel,
}: {
  initial?: { nome: string; nomeRelatorio: string; secoesVisiveis: string[] }
  onSave: (d: { nome: string; nomeRelatorio: string; secoesVisiveis: string[] }) => void
  onCancel: () => void
}) {
  const [nome, setNome] = useState(initial?.nome ?? "")
  const [nomeRelatorio, setNomeRelatorio] = useState(initial?.nomeRelatorio ?? "Relatório Diário de Obra")
  const [secoes, setSecoes] = useState<string[]>(
    initial?.secoesVisiveis ?? SECOES.map(s => s.id)
  )

  const toggle = (id: string) =>
    setSecoes(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <div className="bg-white border-2 border-orange-200 rounded-xl p-5 space-y-4">
      <p className="text-sm font-bold text-[var(--text-primary)]">{initial ? "Editar Modelo" : "Novo Modelo"}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Nome do Modelo</label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-orange-400"
            placeholder="ex: Modelo Obras Públicas" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Título no PDF</label>
          <input value={nomeRelatorio} onChange={e => setNomeRelatorio(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-orange-400"
            placeholder="ex: Relatório Diário de Obra" />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Seções visíveis no RDO</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SECOES.map(s => (
            <button key={s.id} type="button" onClick={() => toggle(s.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                secoes.includes(s.id)
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-gray-50 border-border text-[var(--text-muted)]"
              )}>
              {secoes.includes(s.id) ? <Eye size={12} /> : <EyeOff size={12} />}
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-[var(--text-muted)] hover:border-gray-400 transition-all">
          Cancelar
        </button>
        <button type="button" onClick={() => onSave({ nome, nomeRelatorio, secoesVisiveis: secoes })}
          disabled={!nome.trim()}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2">
          <CheckCircle2 size={13} /> Salvar Modelo
        </button>
      </div>
    </div>
  )
}

export default function ModelosRelatorioPage() {
  const { data: modelos = [], refetch } = trpc.modeloRelatorio.listar.useQuery()
  const criar = trpc.modeloRelatorio.criar.useMutation({ onSuccess: () => { setShowForm(false); refetch() } })
  const atualizar = trpc.modeloRelatorio.atualizar.useMutation({ onSuccess: () => { setEditId(null); refetch() } })
  const excluir = trpc.modeloRelatorio.excluir.useMutation({ onSuccess: () => refetch() })

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const modeloEmEdicao = modelos.find(m => m.id === editId)

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={22} className="text-orange-500" />
            Modelos de Relatório
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Customize quais seções aparecem no RDO PDF por modelo</p>
        </div>
        {!showForm && !editId && (
          <button type="button" onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-all">
            <Plus size={14} /> Novo Modelo
          </button>
        )}
      </div>

      {showForm && (
        <ModeloForm
          onSave={d => criar.mutate(d)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-3">
        {modelos.length === 0 && !showForm && (
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <FileText size={36} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Nenhum modelo criado</p>
            <p className="text-xs text-[var(--text-muted)]">Crie modelos para padronizar os RDOs de diferentes tipos de obra.</p>
          </div>
        )}

        {modelos.map(m => (
          editId === m.id && modeloEmEdicao ? (
            <ModeloForm
              key={m.id}
              initial={{ nome: m.nome, nomeRelatorio: m.nomeRelatorio, secoesVisiveis: parseSecoes(m.secoesVisiveis) }}
              onSave={d => atualizar.mutate({ id: m.id, ...d })}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <ModeloCard
              key={m.id}
              modelo={m}
              onEdit={() => setEditId(m.id)}
              onDelete={() => { if (confirm(`Excluir modelo "${m.nome}"?`)) excluir.mutate({ id: m.id }) }}
            />
          )
        ))}
      </div>

      <p className="text-xs text-center text-[var(--text-muted)]">{modelos.length} modelo{modelos.length !== 1 ? "s" : ""} configurado{modelos.length !== 1 ? "s" : ""}</p>
    </div>
  )
}
