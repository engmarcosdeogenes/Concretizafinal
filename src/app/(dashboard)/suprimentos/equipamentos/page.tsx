"use client"

import { useState } from "react"
import { Wrench, Plus, X, Pencil } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { trpc } from "@/lib/trpc/client"

type Equipamento = {
  id: string; nome: string; tipo?: string | null; modelo?: string | null
  placa?: string | null; status: "DISPONIVEL" | "EM_USO" | "MANUTENCAO" | "INATIVO"
}

type FormState = { nome: string; tipo: string; modelo: string; placa: string }
const EMPTY_FORM: FormState = { nome: "", tipo: "", modelo: "", placa: "" }

const STATUS_MAP = {
  DISPONIVEL: { label: "Disponível", cls: "bg-green-50 text-green-700 border border-green-200" },
  EM_USO:     { label: "Em Uso",     cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  MANUTENCAO: { label: "Manutenção", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  INATIVO:    { label: "Inativo",    cls: "bg-slate-50 text-slate-600 border border-slate-200" },
}

const inputCls = "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

export default function EquipamentosPage() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Equipamento | null>(null)
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [erro, setErro]           = useState("")
  const [busca, setBusca]         = useState("")

  const utils = trpc.useUtils()
  const { data: equipamentos = [], isLoading } = trpc.equipamento.listar.useQuery()

  const criar     = trpc.equipamento.criar.useMutation({
    onSuccess: () => { utils.equipamento.listar.invalidate(); fecharModal() },
    onError: (e) => setErro(e.message),
  })
  const atualizar = trpc.equipamento.atualizar.useMutation({
    onSuccess: () => { utils.equipamento.listar.invalidate() },
    onError: (e) => setErro(e.message),
  })

  function abrirCriar() {
    setEditing(null); setForm(EMPTY_FORM); setErro(""); setShowModal(true)
  }

  function abrirEditar(eq: Equipamento) {
    setEditing(eq)
    setForm({ nome: eq.nome, tipo: eq.tipo ?? "", modelo: eq.modelo ?? "", placa: eq.placa ?? "" })
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
      nome: form.nome, tipo: form.tipo || undefined,
      modelo: form.modelo || undefined, placa: form.placa || undefined,
    }
    if (editing) {
      atualizar.mutate({ id: editing.id, ...data }, {
        onSuccess: () => { utils.equipamento.listar.invalidate(); fecharModal() },
      })
    } else {
      criar.mutate(data)
    }
  }

  function mudarStatus(id: string, status: Equipamento["status"]) {
    atualizar.mutate({ id, status })
  }

  const filtered = equipamentos.filter(eq =>
    eq.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (eq.tipo ?? "").toLowerCase().includes(busca.toLowerCase()) ||
    (eq.placa ?? "").toLowerCase().includes(busca.toLowerCase())
  )

  const stats = {
    disponivel: equipamentos.filter(e => e.status === "DISPONIVEL").length,
    em_uso:     equipamentos.filter(e => e.status === "EM_USO").length,
    manutencao: equipamentos.filter(e => e.status === "MANUTENCAO").length,
  }

  const isPending = criar.isPending || atualizar.isPending

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Equipamentos"
        subtitle="Máquinas e ferramentas da empresa"
        actions={
          <button onClick={abrirCriar} className="btn-orange min-h-[44px]">
            <Plus size={15} />
            Novo Equipamento
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: equipamentos.length, color: "text-slate-600" },
          { label: "Disponíveis", value: stats.disponivel,    color: "text-green-600" },
          { label: "Em Uso",      value: stats.em_uso,        color: "text-blue-600" },
          { label: "Manutenção",  value: stats.manutencao,    color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-4">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Buscar equipamento, tipo ou placa..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className={`${inputCls} max-w-sm`}
      />

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_160px_44px] gap-3 px-5 py-3 bg-[var(--muted)] border-b border-[var(--border)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Equipamento</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Tipo</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Placa/Modelo</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</span>
          <span />
        </div>

        {isLoading && <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando...</div>}

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <Wrench size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {busca ? "Nenhum equipamento encontrado" : "Nenhum equipamento cadastrado"}
            </p>
          </div>
        )}

        {filtered.map(eq => {
          const s = STATUS_MAP[eq.status]
          return (
            <div key={eq.id}
              className="grid grid-cols-[1fr_120px_100px_160px_44px] gap-3 px-5 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--muted)] transition-colors">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{eq.nome}</p>
              <p className="text-xs text-[var(--text-muted)]">{eq.tipo ?? "—"}</p>
              <div>
                {eq.placa && <p className="text-xs font-mono text-[var(--text-primary)]">{eq.placa}</p>}
                {eq.modelo && <p className="text-xs text-[var(--text-muted)]">{eq.modelo}</p>}
                {!eq.placa && !eq.modelo && <p className="text-xs text-[var(--text-muted)]">—</p>}
              </div>
              <select
                value={eq.status}
                onChange={e => mudarStatus(eq.id, e.target.value as Equipamento["status"])}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none w-fit ${s.cls}`}
              >
                {Object.entries(STATUS_MAP).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <button onClick={() => abrirEditar(eq)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
                <Pencil size={13} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-orange-500" />
                <h2 className="font-bold text-[var(--text-primary)]">
                  {editing ? "Editar Equipamento" : "Novo Equipamento"}
                </h2>
              </div>
              <button onClick={fecharModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {erro && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>}
              <div>
                <label className={labelCls}>Nome <span className="text-red-500">*</span></label>
                <input required type="text" value={form.nome} onChange={e => set("nome", e.target.value)}
                  placeholder="Ex: Betoneira 400L, Guincho de Coluna" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tipo</label>
                  <input type="text" value={form.tipo} onChange={e => set("tipo", e.target.value)}
                    placeholder="Ex: Betoneira, Escavadeira" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Modelo</label>
                  <input type="text" value={form.modelo} onChange={e => set("modelo", e.target.value)}
                    placeholder="Ex: MBM400, PC210" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Placa / Identificação</label>
                <input type="text" value={form.placa} onChange={e => set("placa", e.target.value)}
                  placeholder="Placa ou código interno" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isPending}
                  className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 cursor-pointer">
                  {isPending ? "Salvando..." : editing ? "Salvar" : "Cadastrar"}
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
    </div>
  )
}
