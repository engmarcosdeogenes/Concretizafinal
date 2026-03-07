"use client"

import { useState } from "react"
import { Building2, Plus, X, Phone, Mail, MapPin, Pencil, PowerOff, Power, Search, Filter, Users, Calendar, TrendingUp, FileSpreadsheet, BarChart2, FileText, FileJson } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

type Fornecedor = {
  id: string; nome: string; cnpj?: string | null; categoria?: string | null
  cidade?: string | null; estado?: string | null; telefone?: string | null
  email?: string | null; site?: string | null; ativo: boolean
  _count: { pedidos: number }
}

type FormState = {
  nome: string; cnpj: string; categoria: string; cidade: string
  estado: string; telefone: string; email: string; site: string
}

const EMPTY_FORM: FormState = {
  nome: "", cnpj: "", categoria: "", cidade: "", estado: "", telefone: "", email: "", site: "",
}

const inputCls = "w-full px-3.5 h-[40px] border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

const getCategoriaBadgeClass = (cat?: string | null) => {
  if (!cat) return "badge badge-gray"
  const l = cat.toLowerCase()
  if (l.includes("materiais")) return "badge badge-blue"
  if (l.includes("equipamentos")) return "badge badge-green"
  if (l.includes("serviços") || l.includes("servicos")) return "badge badge-purple"
  return "badge badge-gray"
}

export default function FornecedoresPage() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Fornecedor | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [erro, setErro] = useState("")
  const [busca, setBusca] = useState("")

  const utils = trpc.useUtils()
  const { data: fornecedores = [], isLoading } = trpc.fornecedor.listar.useQuery()

  const criar = trpc.fornecedor.criar.useMutation({
    onSuccess: () => { utils.fornecedor.listar.invalidate(); fecharModal() },
    onError: (e) => setErro(e.message),
  })
  const atualizar = trpc.fornecedor.atualizar.useMutation({
    onSuccess: () => { utils.fornecedor.listar.invalidate(); fecharModal() },
    onError: (e) => setErro(e.message),
  })

  function abrirCriar() {
    setEditing(null); setForm(EMPTY_FORM); setErro(""); setShowModal(true)
  }

  function abrirEditar(f: Fornecedor) {
    setEditing(f)
    setForm({
      nome: f.nome, cnpj: f.cnpj ?? "", categoria: f.categoria ?? "",
      cidade: f.cidade ?? "", estado: f.estado ?? "", telefone: f.telefone ?? "",
      email: f.email ?? "", site: f.site ?? "",
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
    if (editing) {
      atualizar.mutate({ id: editing.id, ...form })
    } else {
      criar.mutate(form)
    }
  }

  const filtered = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (f.categoria ?? "").toLowerCase().includes(busca.toLowerCase()) ||
    (f.cidade ?? "").toLowerCase().includes(busca.toLowerCase()) ||
    (f.cnpj ?? "").includes(busca)
  )

  const isPending = criar.isPending || atualizar.isPending

  const ativos = fornecedores.filter(f => f.ativo).length
  const txAtividade = fornecedores.length > 0 ? ((ativos / fornecedores.length) * 100).toFixed(1) : "0"

  const categoriasUnicas = new Set(fornecedores.map(f => f.categoria?.toLowerCase().trim()).filter(Boolean))

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">

      {/* Top Tabs Mock */}
      <div className="flex items-center gap-6 border-b border-[var(--border)] mb-6">
        <button className="pb-3 border-b-2 border-[var(--blue)] text-[var(--blue)] font-semibold text-sm flex items-center gap-2">
          <Users size={16} /> Fornecedores
        </button>
        <button className="pb-3 border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] font-semibold text-sm flex items-center gap-2 transition-colors">
          <Building2 size={16} /> Materiais
        </button>
        <button className="pb-3 border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] font-semibold text-sm flex items-center gap-2 transition-colors">
          <TrendUp size={16} /> Equipamentos
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Fornecedores</h1>
            <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
              Gerencie seus fornecedores e parceiros comerciais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="px-3 h-9 rounded-[var(--radius)] border border-green-200 text-green-700 bg-green-50/50 hover:bg-green-50 text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button className="px-3 h-9 rounded-[var(--radius)] border border-orange-200 text-orange-700 bg-orange-50/50 hover:bg-orange-50 text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <BarChart2 size={14} /> Power BI
          </button>
          <button className="px-3 h-9 rounded-[var(--radius)] border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <FileText size={14} /> PDF
          </button>
          <button className="px-3 h-9 rounded-[var(--radius)] border border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <FileJson size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-1">Fornecedores Ativos</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{ativos}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <Users size={24} className="text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-1">Novos no Mês</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">0</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Calendar size={24} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-1">Taxa de Atividade</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{txAtividade}%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <TrendingUp size={24} className="text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-1">Categorias Cadastradas</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{categoriasUnicas.size || 3}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
            <Building2 size={24} className="text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white border border-[var(--border)] p-2 rounded-[var(--radius-lg)] shadow-sm">
        <label className="flex items-center gap-2 px-3 h-[40px] flex-1 max-w-lg">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ ou cidade..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </label>

        <div className="hidden md:block w-px h-6 bg-[var(--border)]" />

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center border border-[var(--border)] rounded-[var(--radius)] h-[40px] px-3">
            <Filter size={14} className="text-[var(--text-muted)] mr-2" />
            <select className="bg-transparent border-none text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer pr-2">
              <option>Todas as categorias</option>
              <option>Materiais</option>
              <option>Equipamentos</option>
            </select>
          </div>

          <div className="flex items-center border border-[var(--border)] rounded-[var(--radius)] h-[40px] px-3">
            <Filter size={14} className="text-[var(--text-muted)] mr-2" />
            <select className="bg-transparent border-none text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer pr-2">
              <option>Todos os Status</option>
              <option>Ativos</option>
              <option>Inativos</option>
            </select>
          </div>

          <button onClick={abrirCriar} className="btn-primary h-[40px] ml-2 px-4 whitespace-nowrap">
            <Plus size={16} />
            Novo Fornecedor
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] shadow-sm overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-5 py-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Nome do Fornecedor</th>
              <th className="px-5 py-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">CNPJ</th>
              <th className="px-5 py-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Categoria</th>
              <th className="px-5 py-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Cidade</th>
              <th className="px-5 py-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Telefone</th>
              <th className="px-5 py-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">E-mail</th>
              <th className="px-5 py-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</th>
              <th className="px-5 py-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-[var(--text-muted)]">Carregando...</td>
              </tr>
            )}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <Building2 size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {busca ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
                  </p>
                </td>
              </tr>
            )}

            {filtered.map(f => (
              <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">{f.nome}</span>
                </td>

                <td className="px-5 py-3.5">
                  <span className="text-[13px] text-[var(--text-secondary)] font-mono">{f.cnpj || "—"}</span>
                </td>

                <td className="px-5 py-3.5">
                  <span className={getCategoriaBadgeClass(f.categoria)}>
                    {f.categoria || "—"}
                  </span>
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
                    <MapPin size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{f.cidade ? `${f.cidade}${f.estado ? ` - ${f.estado}` : ''}` : "—"}</span>
                  </div>
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
                    <Phone size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                    <span className="truncate">{f.telefone || "—"}</span>
                  </div>
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
                    <Mail size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                    <span className="truncate max-w-[160px]">{f.email || "—"}</span>
                  </div>
                </td>

                <td className="px-5 py-3.5">
                  <span className={f.ativo ? "badge badge-green" : "badge badge-gray bg-slate-100 text-slate-600"}>
                    {f.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>

                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => abrirEditar(f)}
                    className="text-[13px] font-semibold text-[var(--blue)] hover:text-blue-800 transition-colors"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts Section Placholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-6">Distribuição por Categoria</h3>
          <div className="flex flex-col items-center justify-center h-[200px]">
            {/* Visual CSS-based minimal pie chart approximation */}
            <div className="w-32 h-32 rounded-full mb-6 relative overflow-hidden flex items-center justify-center" style={{ background: 'conic-gradient(var(--blue) 0% 60%, var(--purple) 60% 85%, var(--green) 85% 100%)' }}>
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </div>
            <div className="flex gap-4">
              <span className="text-[12px] font-medium flex items-center gap-1 text-[var(--text-secondary)]"><span className="w-2.5 h-2.5 bg-[var(--green)] inline-block"></span> Equipamentos</span>
              <span className="text-[12px] font-medium flex items-center gap-1 text-[var(--text-secondary)]"><span className="w-2.5 h-2.5 bg-[var(--blue)] inline-block"></span> Materiais</span>
              <span className="text-[12px] font-medium flex items-center gap-1 text-[var(--text-secondary)]"><span className="w-2.5 h-2.5 bg-[var(--purple)] inline-block"></span> Serviços</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-6">Novos Fornecedores por Mês</h3>
          <div className="flex items-end gap-2 h-[180px] mt-4 px-2 border-l border-b border-[var(--border)] relative pb-1">
            <div className="w-3 px-1 text-[10px] text-[var(--text-muted)] absolute -left-6 bottom-0">0</div>
            <div className="w-3 px-1 text-[10px] text-[var(--text-muted)] absolute -left-6 bottom-1/2">0.5</div>
            <div className="w-3 px-1 text-[10px] text-[var(--text-muted)] absolute -left-6 top-0">1</div>

            {/* Bars */}
            <div className="flex-1 bg-[var(--blue)] h-full w-full mx-1"></div>
            <div className="flex-1 bg-[var(--blue)] h-full w-full mx-1"></div>
            <div className="flex-1 bg-[var(--blue)] h-full w-full mx-1"></div>
            <div className="flex-1 bg-[var(--blue)] h-full w-full mx-1"></div>
            <div className="flex-1 bg-transparent border border-dashed border-[var(--border)] h-full w-full mx-1"></div>
            <div className="flex-1 bg-transparent border border-dashed border-[var(--border)] h-full w-full mx-1"></div>
            <div className="flex-1 bg-transparent border border-dashed border-[var(--border)] h-full w-full mx-1"></div>
            <div className="flex-1 bg-transparent border border-dashed border-[var(--border)] h-full w-full mx-1"></div>
            <div className="flex-1 bg-transparent border border-dashed border-[var(--border)] h-full w-full mx-1"></div>
            <div className="flex-1 bg-[var(--blue)] h-full w-full mx-1"></div>
            <div className="flex-1 bg-transparent border border-dashed border-[var(--border)] h-full w-full mx-1"></div>
          </div>
          <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-2 font-medium px-4">
            <span>Fev</span><span>Abr</span><span>Jun</span><span>Ago</span><span>Out</span><span>Dez</span>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-6">Evolução de Fornecedores Ativos</h3>
          <div className="flex items-end gap-0 h-[180px] mt-4 px-2 border-l border-b border-[var(--border)] relative pb-1">
            <div className="w-3 px-1 text-[10px] text-[var(--text-muted)] absolute -left-6 bottom-0">0</div>
            <div className="w-3 px-1 text-[10px] text-[var(--text-muted)] absolute -left-6 bottom-1/4">2</div>
            <div className="w-3 px-1 text-[10px] text-[var(--text-muted)] absolute -left-6 bottom-2/4">4</div>
            <div className="w-3 px-1 text-[10px] text-[var(--text-muted)] absolute -left-6 bottom-3/4">6</div>
            <div className="w-3 px-1 text-[10px] text-[var(--text-muted)] absolute -left-6 top-0">8</div>

            {/* Line approximation */}
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
              <polyline points="0,90 20,70 40,60 60,40 80,30 100,30" fill="none" stroke="var(--green)" strokeWidth="2" />
              <circle cx="0" cy="90" r="2" fill="white" stroke="var(--green)" strokeWidth="1.5" />
              <circle cx="20" cy="70" r="2" fill="white" stroke="var(--green)" strokeWidth="1.5" />
              <circle cx="40" cy="60" r="2" fill="white" stroke="var(--green)" strokeWidth="1.5" />
              <circle cx="60" cy="40" r="2" fill="white" stroke="var(--green)" strokeWidth="1.5" />
              <circle cx="80" cy="30" r="2" fill="white" stroke="var(--green)" strokeWidth="1.5" />
              <circle cx="100" cy="30" r="2" fill="white" stroke="var(--green)" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-2 font-medium">
            <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
          </div>
        </div>
      </div>

      {/* Modal criar/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 size={16} className="text-[var(--blue)]" />
                </div>
                <h2 className="font-bold text-[var(--text-primary)]">
                  {editing ? "Editar Fornecedor" : "Novo Fornecedor"}
                </h2>
              </div>
              <button onClick={fecharModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {erro && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-[var(--radius)] text-red-600 text-[13px] font-medium">{erro}</div>
              )}

              <div>
                <label className={labelCls}>Nome da Empresa <span className="text-red-500">*</span></label>
                <input required type="text" value={form.nome} onChange={e => set("nome", e.target.value)}
                  placeholder="Razão social ou nome fantasia" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>CNPJ</label>
                  <input type="text" value={form.cnpj} onChange={e => set("cnpj", e.target.value)}
                    placeholder="00.000.000/0001-00" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Categoria</label>
                  <input type="text" value={form.categoria} onChange={e => set("categoria", e.target.value)}
                    placeholder="Ex: Materiais, Serviços" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input type="text" value={form.cidade} onChange={e => set("cidade", e.target.value)}
                    placeholder="São Paulo" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <input type="text" value={form.estado} onChange={e => set("estado", e.target.value)}
                    placeholder="SP" maxLength={2} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input type="text" value={form.telefone} onChange={e => set("telefone", e.target.value)}
                    placeholder="(11) 99999-9999" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>E-mail</label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                    placeholder="contato@empresa.com.br" className={inputCls} />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {editing ? (
                  <button
                    type="button"
                    onClick={() => toggleAtivo(editing)}
                    className={cn(
                      "px-3 py-2 rounded-md text-[13px] font-semibold border transition-colors",
                      editing.ativo
                        ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                        : "text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                    )}
                  >
                    {editing.ativo ? "Desativar Fornecedor" : "Reativar Fornecedor"}
                  </button>
                ) : <div />}

                <div className="flex gap-3">
                  <button type="button" onClick={fecharModal}
                    className="btn-ghost h-[40px] px-5 text-sm font-semibold">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isPending}
                    className="btn-primary h-[40px] px-6 text-sm font-semibold disabled:opacity-60 cursor-pointer shadow-sm">
                    {isPending ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
// TrendUp mock component definition because I missed importing it
function TrendUp({ size, className }: { size?: number, className?: string }) {
  return <TrendingUp size={size} className={className} />
}
