"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { DollarSign, Plus, X, Trash2, TrendingUp, TrendingDown, Wallet, RefreshCw } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

type Tipo = "RECEITA" | "DESPESA"

const CATEGORIAS_DESPESA = [
  "Mão de obra", "Materiais", "Equipamentos", "Serviços terceirizados",
  "Taxas e impostos", "Transporte", "Alimentação", "EPI / Segurança",
  "Projeto / ART", "Outros",
]
const CATEGORIAS_RECEITA = [
  "Medição", "Adiantamento", "Parcela contratual", "Reembolso", "Outros",
]

type RecorrenciaTipo = "NENHUMA" | "DIARIA" | "SEMANAL" | "MENSAL"
type FormState = { tipo: Tipo; categoria: string; descricao: string; valor: string; data: string; recorrencia: RecorrenciaTipo; recorrenciaFim: string }
const EMPTY: FormState = {
  tipo: "DESPESA", categoria: "", descricao: "",
  valor: "", data: new Date().toISOString().split("T")[0],
  recorrencia: "NENHUMA", recorrenciaFim: "",
}

const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
type Filtro = "TODOS" | "RECEITA" | "DESPESA"

export default function FinanceiroObraPage() {
  const params = useParams()
  const obraId = params.id as string

  const [showModal, setShowModal]     = useState(false)
  const [form, setForm]               = useState<FormState>(EMPTY)
  const [erro, setErro]               = useState("")
  const [filtro, setFiltro]           = useState<Filtro>("TODOS")
  const [confirmDel, setConfirmDel]   = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: lancamentos = [], isLoading } = trpc.financeiro.listar.useQuery({ obraId })
  const { data: resumo }                       = trpc.financeiro.resumo.useQuery({ obraId })

  const criar   = trpc.financeiro.criar.useMutation({
    onSuccess: () => {
      utils.financeiro.listar.invalidate({ obraId })
      utils.financeiro.resumo.invalidate({ obraId })
      fecharModal()
    },
    onError: (e) => setErro(e.message),
  })
  const excluir = trpc.financeiro.excluir.useMutation({
    onSuccess: () => {
      utils.financeiro.listar.invalidate({ obraId })
      utils.financeiro.resumo.invalidate({ obraId })
      setConfirmDel(null)
    },
  })

  function fecharModal() { setShowModal(false); setForm(EMPTY); setErro("") }
  function set(f: keyof FormState, v: string) { setForm(p => ({ ...p, [f]: v })) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErro("")
    criar.mutate({
      obraId,
      tipo:           form.tipo,
      categoria:      form.categoria || undefined,
      descricao:      form.descricao,
      valor:          Number(form.valor),
      data:           form.data || undefined,
      recorrencia:    form.recorrencia,
      recorrenciaFim: form.recorrenciaFim || undefined,
    })
  }

  const filtered = filtro === "TODOS" ? lancamentos : lancamentos.filter(l => l.tipo === filtro)
  const pctCusto = resumo?.orcamento
    ? Math.min(100, Math.round(((resumo.totalDespesas) / resumo.orcamento) * 100))
    : null
  const categorias = form.tipo === "RECEITA" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Financeiro</h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Receitas e despesas desta obra</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-orange min-h-[44px] flex-shrink-0">
          <Plus size={15} />
          Lançamento
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Receitas",  val: resumo?.totalReceitas ?? 0, color: "text-green-600", bg: "bg-green-50",  Icon: TrendingUp },
          { label: "Despesas",  val: resumo?.totalDespesas ?? 0, color: "text-red-600",   bg: "bg-red-50",    Icon: TrendingDown },
          { label: "Saldo",     val: resumo?.saldo         ?? 0, color: (resumo?.saldo ?? 0) >= 0 ? "text-blue-600" : "text-red-600", bg: "bg-blue-50", Icon: Wallet },
          { label: "Orçamento", val: resumo?.orcamento     ?? 0, color: "text-slate-600", bg: "bg-slate-50",  Icon: DollarSign },
        ].map(({ label, val, color, bg, Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[11px] font-medium text-[var(--text-muted)]">{label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
                <Icon size={13} className={color} />
              </div>
            </div>
            <p className={`text-lg font-extrabold leading-none ${color}`}>
              {label === "Orçamento" && val === 0 ? "—" : fmt(val)}
            </p>
          </div>
        ))}
      </div>

      {/* Barra orçamento */}
      {pctCusto !== null && resumo?.orcamento && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">Despesas vs Orçamento</p>
            <p className={`text-sm font-bold ${pctCusto >= 90 ? "text-red-600" : pctCusto >= 70 ? "text-amber-600" : "text-green-600"}`}>
              {pctCusto}%
            </p>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all ${pctCusto >= 90 ? "bg-red-500" : pctCusto >= 70 ? "bg-amber-500" : "bg-green-500"}`}
              style={{ width: `${pctCusto}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-[var(--text-muted)]">
            <span>Despesas: {fmt(resumo.totalDespesas)}</span>
            <span>Orçamento: {fmt(resumo.orcamento)}</span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["TODOS", "RECEITA", "DESPESA"] as Filtro[]).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              filtro === f
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-[var(--text-muted)] border-border hover:bg-muted"
            }`}>
            {f === "TODOS"
              ? `Todos (${lancamentos.length})`
              : f === "RECEITA"
                ? `Receitas (${lancamentos.filter(l => l.tipo === "RECEITA").length})`
                : `Despesas (${lancamentos.filter(l => l.tipo === "DESPESA").length})`}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading && <div className="py-10 text-center text-sm text-[var(--text-muted)]">Carregando...</div>}

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <DollarSign size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Nenhum lançamento</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Registre receitas e despesas desta obra</p>
          </div>
        )}

        {filtered.map(l => (
          <div key={l.id}
            className="flex items-center gap-3 px-5 py-4 border-b border-border last:border-0 hover:bg-muted transition-colors">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${l.tipo === "RECEITA" ? "bg-green-50" : "bg-red-50"}`}>
              {l.tipo === "RECEITA"
                ? <TrendingUp size={14} className="text-green-600" />
                : <TrendingDown size={14} className="text-red-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{l.descricao}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {l.categoria && (
                  <span className="text-[10px] text-[var(--text-muted)] bg-muted px-1.5 py-0.5 rounded">{l.categoria}</span>
                )}
                <span className="text-[11px] text-[var(--text-muted)]">{formatDataCurta(l.data)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <p className={`text-sm font-bold ${l.tipo === "RECEITA" ? "text-green-600" : "text-red-600"}`}>
                {l.tipo === "RECEITA" ? "+" : "−"}{fmt(l.valor)}
              </p>
              <button onClick={() => setConfirmDel(l.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors cursor-pointer">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal novo lançamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-orange-500" />
                <h2 className="font-bold text-[var(--text-primary)]">Novo Lançamento</h2>
              </div>
              <button onClick={fecharModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-[var(--text-muted)] hover:bg-muted transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {erro && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>}

              <div>
                <label className={labelCls}>Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["DESPESA", "RECEITA"] as Tipo[]).map(t => (
                    <button key={t} type="button" onClick={() => { set("tipo", t); set("categoria", "") }}
                      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        form.tipo === t
                          ? t === "DESPESA"
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-green-500 text-white border-green-500"
                          : "bg-white text-[var(--text-muted)] border-border hover:bg-muted"
                      }`}>
                      {t === "DESPESA" ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                      {t === "DESPESA" ? "Despesa" : "Receita"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Descrição <span className="text-red-500">*</span></label>
                <input required type="text" value={form.descricao} onChange={e => set("descricao", e.target.value)}
                  placeholder="Ex: Compra de cimento, Medição #3..." className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Valor (R$) <span className="text-red-500">*</span></label>
                  <input required type="number" min="0.01" step="0.01" value={form.valor}
                    onChange={e => set("valor", e.target.value)} placeholder="0,00" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Data</label>
                  <input type="date" value={form.data} onChange={e => set("data", e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Categoria</label>
                <select value={form.categoria} onChange={e => set("categoria", e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Recorrência */}
              <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <RefreshCw size={13} className="text-[var(--text-muted)]" />
                  <label className="text-sm font-medium text-[var(--text-primary)]">Repetir lançamento</label>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {([["NENHUMA","Não"], ["DIARIA","Diário"], ["SEMANAL","Semanal"], ["MENSAL","Mensal"]] as [RecorrenciaTipo, string][]).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => set("recorrencia", v)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        form.recorrencia === v
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-[var(--text-muted)] border-border hover:bg-muted"
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
                {form.recorrencia !== "NENHUMA" && (
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Repetir até (data)</label>
                    <input type="date" value={form.recorrenciaFim} onChange={e => set("recorrenciaFim", e.target.value)}
                      className={inputCls} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={criar.isPending}
                  className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 cursor-pointer">
                  {criar.isPending ? "Salvando..." : "Adicionar"}
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

      {/* Confirm delete */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-[var(--text-primary)]">Remover lançamento?</h3>
            <p className="text-sm text-[var(--text-muted)]">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => excluir.mutate({ id: confirmDel })} disabled={excluir.isPending}
                className="flex-1 min-h-[44px] bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:opacity-60">
                {excluir.isPending ? "Removendo..." : "Remover"}
              </button>
              <button onClick={() => setConfirmDel(null)}
                className="btn-ghost min-h-[44px] flex-1 justify-center cursor-pointer">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
