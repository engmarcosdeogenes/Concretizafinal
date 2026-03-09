"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Users, UserPlus, X, Pencil, Phone, Building2, PowerOff, Power } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

type Membro = {
  id: string; nome: string; funcao: string; cpf?: string | null
  telefone?: string | null; empresaNome?: string | null
  dataEntrada: Date; dataSaida?: Date | null; ativo: boolean
}

type FormState = {
  nome: string; funcao: string; cpf: string; telefone: string
  empresaNome: string; dataEntrada: string
}

const EMPTY_FORM: FormState = {
  nome: "", funcao: "", cpf: "", telefone: "", empresaNome: "",
  dataEntrada: new Date().toISOString().split("T")[0],
}

const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

const FUNCOES_COMUNS = [
  "Engenheiro Civil", "Mestre de Obras", "Encarregado", "Pedreiro",
  "Servente", "Eletricista", "Encanador", "Pintor", "Carpinteiro",
  "Armador", "Operador de Máquinas", "Topógrafo",
]

export default function EquipePage() {
  const params = useParams()
  const obraId = params.id as string

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Membro | null>(null)
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [erro, setErro]           = useState("")

  const utils = trpc.useUtils()
  const { data: membros = [], isLoading } = trpc.equipe.listar.useQuery({ obraId })

  const criar     = trpc.equipe.criar.useMutation({
    onSuccess: () => { utils.equipe.listar.invalidate({ obraId }); fecharModal() },
    onError: (e) => setErro(e.message),
  })
  const atualizar = trpc.equipe.atualizar.useMutation({
    onSuccess: () => { utils.equipe.listar.invalidate({ obraId }); fecharModal() },
    onError: (e) => setErro(e.message),
  })

  function abrirCriar() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, dataEntrada: new Date().toISOString().split("T")[0] })
    setErro(""); setShowModal(true)
  }

  function abrirEditar(m: Membro) {
    setEditing(m)
    setForm({
      nome: m.nome, funcao: m.funcao, cpf: m.cpf ?? "", telefone: m.telefone ?? "",
      empresaNome: m.empresaNome ?? "",
      dataEntrada: new Date(m.dataEntrada).toISOString().split("T")[0],
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
      nome: form.nome, funcao: form.funcao,
      cpf: form.cpf || undefined, telefone: form.telefone || undefined,
      empresaNome: form.empresaNome || undefined,
      dataEntrada: form.dataEntrada || undefined,
    }
    if (editing) atualizar.mutate({ id: editing.id, ...data })
    else criar.mutate({ obraId, ...data })
  }

  function toggleAtivo(m: Membro) {
    atualizar.mutate({
      id: m.id, ativo: !m.ativo,
      dataSaida: !m.ativo ? null : new Date().toISOString().split("T")[0],
    })
  }

  const ativos   = membros.filter(m => m.ativo)
  const inativos = membros.filter(m => !m.ativo)
  const isPending = criar.isPending || atualizar.isPending

  // Agrupar ativos por função
  const funcoes = Array.from(new Set(ativos.map(m => m.funcao)))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Equipe da Obra</h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Membros e funções nesta obra</p>
        </div>
        <button onClick={abrirCriar} className="btn-orange min-h-[44px] flex-shrink-0">
          <UserPlus size={15} />
          Adicionar Membro
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total ativo",  value: ativos.length,        color: "text-blue-600" },
          { label: "Funções",      value: funcoes.length,       color: "text-purple-600" },
          { label: "Inativos",     value: inativos.length,      color: "text-slate-500" },
          { label: "Total geral",  value: membros.length,       color: "text-slate-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading && <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando...</div>}

      {!isLoading && membros.length === 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm py-12 text-center">
          <Users size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Nenhum membro na equipe</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Adicione engenheiros, mestres e encarregados</p>
        </div>
      )}

      {/* Membros ativos agrupados por função */}
      {funcoes.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-muted border-b border-border">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Membros ativos — {ativos.length}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_140px_120px_100px_80px] gap-3 px-5 py-2.5 bg-muted border-b border-border">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Nome</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Função</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Empresa</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Entrada</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Ações</span>
          </div>

          {ativos.map(m => (
            <div key={m.id}
              className="grid grid-cols-[1fr_140px_120px_100px_80px] gap-3 px-5 py-3.5 border-b border-border last:border-0 items-center hover:bg-muted transition-colors">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{m.nome}</p>
                {m.cpf && <p className="text-[11px] text-[var(--text-muted)] font-mono">{m.cpf}</p>}
                {m.telefone && (
                  <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Phone size={10} />{m.telefone}
                  </p>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)]">{m.funcao}</p>
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                {m.empresaNome ? (
                  <>
                    <Building2 size={10} className="flex-shrink-0" />
                    <span className="truncate">{m.empresaNome}</span>
                  </>
                ) : "—"}
              </div>
              <p className="text-xs text-[var(--text-muted)]">{formatDataCurta(m.dataEntrada)}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => abrirEditar(m)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-muted transition-colors cursor-pointer">
                  <Pencil size={13} />
                </button>
                <button onClick={() => toggleAtivo(m)} title="Desligar"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors cursor-pointer">
                  <PowerOff size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inativos (colapsável / compacto) */}
      {inativos.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden opacity-70">
          <div className="px-5 py-3 bg-muted border-b border-border">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Inativos — {inativos.length}
            </span>
          </div>
          {inativos.map(m => (
            <div key={m.id}
              className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm text-[var(--text-primary)]">{m.nome}</p>
                <p className="text-xs text-[var(--text-muted)]">{m.funcao}</p>
              </div>
              <button onClick={() => toggleAtivo(m)} title="Reativar"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-green-200 text-green-500 hover:bg-green-50 transition-colors cursor-pointer">
                <Power size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-orange-500" />
                <h2 className="font-bold text-[var(--text-primary)]">
                  {editing ? "Editar Membro" : "Adicionar Membro"}
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
                <label className={labelCls}>Nome completo <span className="text-red-500">*</span></label>
                <input required type="text" value={form.nome} onChange={e => set("nome", e.target.value)}
                  placeholder="Nome do membro" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Função <span className="text-red-500">*</span></label>
                <input required type="text" list="funcoes-list" value={form.funcao}
                  onChange={e => set("funcao", e.target.value)}
                  placeholder="Ex: Pedreiro, Engenheiro Civil" className={inputCls} />
                <datalist id="funcoes-list">
                  {FUNCOES_COMUNS.map(f => <option key={f} value={f} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>CPF</label>
                  <input type="text" value={form.cpf} onChange={e => set("cpf", e.target.value)}
                    placeholder="000.000.000-00" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input type="text" value={form.telefone} onChange={e => set("telefone", e.target.value)}
                    placeholder="(11) 99999-9999" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Empresa / Subempreiteira</label>
                  <input type="text" value={form.empresaNome} onChange={e => set("empresaNome", e.target.value)}
                    placeholder="Nome da empresa" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Data de entrada</label>
                  <input type="date" value={form.dataEntrada} onChange={e => set("dataEntrada", e.target.value)}
                    className={inputCls} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isPending}
                  className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 cursor-pointer">
                  {isPending ? "Salvando..." : editing ? "Salvar" : "Adicionar"}
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
