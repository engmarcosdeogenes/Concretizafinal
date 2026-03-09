"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Package, Plus, X, TrendingUp, TrendingDown, RefreshCw, Settings } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

type TipoMov = "ENTRADA" | "SAIDA" | "TRANSFERENCIA" | "AJUSTE"

const TIPO_MAP: Record<TipoMov, { label: string; cls: string; Icon: React.ElementType; sinal: string }> = {
  ENTRADA:      { label: "Entrada",     cls: "text-green-600 bg-green-50 border border-green-200",  Icon: TrendingUp,   sinal: "+" },
  SAIDA:        { label: "Saída",       cls: "text-red-600 bg-red-50 border border-red-200",        Icon: TrendingDown, sinal: "−" },
  TRANSFERENCIA:{ label: "Transfer.",   cls: "text-blue-600 bg-blue-50 border border-blue-200",     Icon: RefreshCw,    sinal: "~" },
  AJUSTE:       { label: "Ajuste",      cls: "text-amber-600 bg-amber-50 border border-amber-200",  Icon: Settings,     sinal: "±" },
}

type FormState = {
  materialId: string; tipo: TipoMov; quantidade: string; data: string; observacao: string
}

const EMPTY_FORM: FormState = {
  materialId: "", tipo: "ENTRADA", quantidade: "",
  data: new Date().toISOString().split("T")[0], observacao: "",
}

const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

type View = "movimentacoes" | "saldo"

export default function MateriaisPage() {
  const params = useParams()
  const obraId = params.id as string

  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [erro, setErro]           = useState("")
  const [view, setView]           = useState<View>("saldo")

  const utils = trpc.useUtils()
  const { data: movs = [], isLoading: loadingMovs }        = trpc.movimentacao.listar.useQuery({ obraId })
  const { data: saldo = [], isLoading: loadingSaldo }      = trpc.movimentacao.saldoPorMaterial.useQuery({ obraId })
  const { data: materiais = [] }                            = trpc.material.listar.useQuery()

  const criar = trpc.movimentacao.criar.useMutation({
    onSuccess: () => {
      utils.movimentacao.listar.invalidate({ obraId })
      utils.movimentacao.saldoPorMaterial.invalidate({ obraId })
      fecharModal()
    },
    onError: (e) => setErro(e.message),
  })

  function fecharModal() {
    setShowModal(false); setForm(EMPTY_FORM); setErro("")
  }

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErro("")
    if (!form.materialId) { setErro("Selecione um material."); return }
    criar.mutate({
      obraId, materialId: form.materialId,
      tipo: form.tipo, quantidade: Number(form.quantidade),
      data: form.data || undefined,
      observacao: form.observacao || undefined,
    })
  }

  const totalEntradas = movs.filter(m => m.tipo === "ENTRADA").reduce((s, m) => s + m.quantidade, 0)
  const totalSaidas   = movs.filter(m => m.tipo === "SAIDA").reduce((s, m) => s + m.quantidade, 0)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Materiais da Obra</h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Movimentação e controle de estoque</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-orange min-h-[44px] flex-shrink-0">
          <Plus size={15} />
          Registrar Movimentação
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
          <p className="text-2xl font-extrabold text-blue-600">{movs.length}</p>
          <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">Movimentações</p>
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
          <p className="text-2xl font-extrabold text-green-600">{movs.filter(m => m.tipo === "ENTRADA").length}</p>
          <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">Entradas</p>
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
          <p className="text-2xl font-extrabold text-red-600">{movs.filter(m => m.tipo === "SAIDA").length}</p>
          <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">Saídas</p>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {(["saldo", "movimentacoes"] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
              view === v
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-[var(--text-primary)] border-border hover:bg-muted"
            }`}>
            {v === "saldo" ? "Estoque atual" : "Histórico"}
          </button>
        ))}
      </div>

      {/* Estoque atual (saldo) */}
      {view === "saldo" && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_100px_80px] gap-3 px-5 py-3 bg-muted border-b border-border">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Material</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Saldo</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Categoria</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Unidade</span>
          </div>

          {loadingSaldo && <div className="py-8 text-center text-sm text-[var(--text-muted)]">Carregando...</div>}

          {!loadingSaldo && saldo.length === 0 && (
            <div className="py-12 text-center">
              <Package size={28} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
              <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma movimentação ainda</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Registre entradas para ver o estoque</p>
            </div>
          )}

          {saldo.map(item => (
            <div key={item.material.id}
              className="grid grid-cols-[1fr_100px_100px_80px] gap-3 px-5 py-3.5 border-b border-border last:border-0 items-center hover:bg-muted transition-colors">
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.material.nome}</p>
              <p className={`text-sm font-bold ${item.saldo > 0 ? "text-green-600" : item.saldo < 0 ? "text-red-600" : "text-slate-500"}`}>
                {item.saldo > 0 ? "+" : ""}{item.saldo}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{item.material.categoria ?? "—"}</p>
              <p className="text-xs font-mono text-[var(--text-muted)]">{item.material.unidade}</p>
            </div>
          ))}
        </div>
      )}

      {/* Histórico de movimentações */}
      {view === "movimentacoes" && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_120px_80px_80px] gap-3 px-5 py-3 bg-muted border-b border-border">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Data</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Material</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Tipo</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Qtd.</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Un.</span>
          </div>

          {loadingMovs && <div className="py-8 text-center text-sm text-[var(--text-muted)]">Carregando...</div>}

          {!loadingMovs && movs.length === 0 && (
            <div className="py-12 text-center">
              <Package size={28} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
              <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma movimentação ainda</p>
            </div>
          )}

          {movs.map(m => {
            const t = TIPO_MAP[m.tipo as TipoMov] ?? TIPO_MAP.ENTRADA
            return (
              <div key={m.id}
                className="grid grid-cols-[80px_1fr_120px_80px_80px] gap-3 px-5 py-3.5 border-b border-border last:border-0 items-center hover:bg-muted transition-colors">
                <p className="text-xs text-[var(--text-muted)]">{formatDataCurta(m.data)}</p>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{m.material.nome}</p>
                  {m.observacao && <p className="text-xs text-[var(--text-muted)]">{m.observacao}</p>}
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${t.cls}`}>
                  <t.Icon size={10} />{t.label}
                </span>
                <p className={`text-sm font-bold ${m.tipo === "ENTRADA" ? "text-green-600" : m.tipo === "SAIDA" ? "text-red-600" : "text-[var(--text-primary)]"}`}>
                  {t.sinal}{m.quantidade}
                </p>
                <p className="text-xs font-mono text-[var(--text-muted)]">{m.material.unidade}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-orange-500" />
                <h2 className="font-bold text-[var(--text-primary)]">Registrar Movimentação</h2>
              </div>
              <button onClick={fecharModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-[var(--text-muted)] hover:bg-muted transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {erro && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>}

              <div>
                <label className={labelCls}>Tipo de movimentação</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(TIPO_MAP) as [TipoMov, typeof TIPO_MAP[TipoMov]][]).map(([tipo, t]) => (
                    <button key={tipo} type="button" onClick={() => set("tipo", tipo)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${
                        form.tipo === tipo
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-[var(--text-primary)] border-border hover:bg-muted"
                      }`}>
                      <t.Icon size={14} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Material <span className="text-red-500">*</span></label>
                <select value={form.materialId} onChange={e => set("materialId", e.target.value)} className={inputCls}>
                  <option value="">Selecione o material...</option>
                  {materiais.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>)}
                </select>
                {materiais.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Cadastre materiais em Suprimentos › Catálogo primeiro.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Quantidade <span className="text-red-500">*</span></label>
                  <input required type="number" min="0.001" step="any" value={form.quantidade}
                    onChange={e => set("quantidade", e.target.value)}
                    placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Data</label>
                  <input type="date" value={form.data} onChange={e => set("data", e.target.value)}
                    className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Observação</label>
                <input type="text" value={form.observacao} onChange={e => set("observacao", e.target.value)}
                  placeholder="Nota fiscal, fornecedor, destino..." className={inputCls} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={criar.isPending}
                  className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 cursor-pointer">
                  {criar.isPending ? "Salvando..." : "Registrar"}
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
