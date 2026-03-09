"use client"

import { useState } from "react"
import { Package, Plus, X, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { trpc } from "@/lib/trpc/client"

type Material = {
  id: string; nome: string; unidade: string; descricao?: string | null
  categoria?: string | null; precoUnitario?: number | null
}

type FormState = {
  nome: string; unidade: string; descricao: string; categoria: string; precoUnitario: string
}

const EMPTY_FORM: FormState = { nome: "", unidade: "", descricao: "", categoria: "", precoUnitario: "" }

const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

export default function MateriaisCatalogoPage() {
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<Material | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [erro, setErro]             = useState("")
  const [busca, setBusca]           = useState("")
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: materiais = [], isLoading } = trpc.material.listar.useQuery()

  const criar     = trpc.material.criar.useMutation({
    onSuccess: () => { utils.material.listar.invalidate(); fecharModal() },
    onError: (e) => setErro(e.message),
  })
  const atualizar = trpc.material.atualizar.useMutation({
    onSuccess: () => { utils.material.listar.invalidate(); fecharModal() },
    onError: (e) => setErro(e.message),
  })
  const excluir   = trpc.material.excluir.useMutation({
    onSuccess: () => { utils.material.listar.invalidate(); setConfirmDel(null) },
  })

  function abrirCriar() {
    setEditing(null); setForm(EMPTY_FORM); setErro(""); setShowModal(true)
  }

  function abrirEditar(m: Material) {
    setEditing(m)
    setForm({
      nome: m.nome, unidade: m.unidade, descricao: m.descricao ?? "",
      categoria: m.categoria ?? "", precoUnitario: m.precoUnitario?.toString() ?? "",
    })
    setErro(""); setShowModal(true)
  }

  function fecharModal() {
    setShowModal(false); setEditing(null); setForm(EMPTY_FORM); setErro("")
  }

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErro("")
    const data = {
      nome: form.nome, unidade: form.unidade,
      descricao: form.descricao || undefined,
      categoria: form.categoria || undefined,
      precoUnitario: form.precoUnitario ? Number(form.precoUnitario) : undefined,
    }
    if (editing) atualizar.mutate({ id: editing.id, ...data })
    else criar.mutate(data)
  }

  const filtered = materiais.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (m.categoria ?? "").toLowerCase().includes(busca.toLowerCase())
  )

  const categorias = Array.from(new Set(filtered.map(m => m.categoria ?? "Sem categoria")))
  const grouped = categorias.reduce<Record<string, typeof filtered>>((acc, cat) => {
    acc[cat] = filtered.filter(m => (m.categoria ?? "Sem categoria") === cat)
    return acc
  }, {})

  const isPending = criar.isPending || atualizar.isPending

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Catálogo de Materiais"
        subtitle="Materiais e insumos para uso em solicitações e pedidos"
        actions={
          <button onClick={abrirCriar} className="btn-orange min-h-[44px]">
            <Plus size={15} />
            Novo Material
          </button>
        }
      />

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar material ou categoria..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className={`${inputCls} max-w-sm`}
        />
        <span className="text-sm text-[var(--text-muted)]">{filtered.length} materiais</span>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando...</div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm py-12 text-center">
          <Package size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {busca ? "Nenhum material encontrado" : "Catálogo vazio"}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {busca ? "Tente um termo diferente" : "Clique em \"Novo Material\" para adicionar"}
          </p>
        </div>
      )}

      {categorias.map(cat => (
        <div key={cat} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-muted border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{cat}</span>
            <span className="text-xs text-[var(--text-muted)]">{grouped[cat].length} itens</span>
          </div>
          <div className="divide-y divide-border">
            {grouped[cat].map(m => (
              <div key={m.id} className="grid grid-cols-[1fr_80px_120px_88px] gap-3 px-5 py-3.5 items-center hover:bg-muted transition-colors">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{m.nome}</p>
                  {m.descricao && <p className="text-xs text-[var(--text-muted)] mt-0.5">{m.descricao}</p>}
                </div>
                <p className="text-xs font-mono text-[var(--text-muted)]">{m.unidade}</p>
                <p className="text-xs text-[var(--text-primary)]">
                  {m.precoUnitario != null
                    ? `R$ ${m.precoUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/${m.unidade}`
                    : "—"}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => abrirEditar(m)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-muted transition-colors cursor-pointer">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setConfirmDel(m.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal criar/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-orange-500" />
                <h2 className="font-bold text-[var(--text-primary)]">
                  {editing ? "Editar Material" : "Novo Material"}
                </h2>
              </div>
              <button onClick={fecharModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-[var(--text-muted)] hover:bg-muted transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {erro && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>}
              <div>
                <label className={labelCls}>Nome <span className="text-red-500">*</span></label>
                <input required type="text" value={form.nome} onChange={e => set("nome", e.target.value)}
                  placeholder="Ex: Cimento CP-II 50kg" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Unidade <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.unidade} onChange={e => set("unidade", e.target.value)}
                    placeholder="sc, m², kg, un" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Categoria</label>
                  <input type="text" value={form.categoria} onChange={e => set("categoria", e.target.value)}
                    placeholder="Ex: Cimento, Aço" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Preço unitário (R$)</label>
                <input type="number" min="0" step="0.01" value={form.precoUnitario}
                  onChange={e => set("precoUnitario", e.target.value)}
                  placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Descrição</label>
                <input type="text" value={form.descricao} onChange={e => set("descricao", e.target.value)}
                  placeholder="Especificação técnica, norma, etc." className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isPending}
                  className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 cursor-pointer">
                  {isPending ? "Salvando..." : editing ? "Salvar" : "Adicionar ao catálogo"}
                </button>
                <button type="button" onClick={fecharModal}
                  className="btn-ghost min-h-[44px] flex-1 justify-center cursor-pointer">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-[var(--text-primary)]">Excluir material?</h3>
            <p className="text-sm text-[var(--text-muted)]">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => excluir.mutate({ id: confirmDel })} disabled={excluir.isPending}
                className="flex-1 min-h-[44px] bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60">
                {excluir.isPending ? "Excluindo..." : "Excluir"}
              </button>
              <button onClick={() => setConfirmDel(null)}
                className="btn-ghost min-h-[44px] flex-1 justify-center cursor-pointer">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
