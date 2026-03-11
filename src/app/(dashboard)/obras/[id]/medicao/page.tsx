"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { BarChart2, Plus, Trash2, ChevronDown, ChevronRight, Link2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { toast } from "sonner"

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function hoje() {
  return new Date().toISOString().split("T")[0]
}

type FormItem = { descricao: string; unidade: string; qtdPrevista: string; qtdMedida: string; percentual: string }

const ITEM_VAZIO: FormItem = { descricao: "", unidade: "", qtdPrevista: "", qtdMedida: "0", percentual: "0" }

export default function MedicaoPage() {
  const { id: obraId } = useParams<{ id: string }>()

  const utils = trpc.useUtils()
  const { data: medicoes = [], isLoading } = trpc.medicao.listar.useQuery({ obraId })

  const criarMedicao = trpc.medicao.criar.useMutation({
    onSuccess: () => {
      toast.success("Medição registrada!")
      void utils.medicao.listar.invalidate()
      setCriando(false)
      setForm({ data: hoje(), descricao: "", itens: [{ ...ITEM_VAZIO }] })
    },
    onError: (err) => toast.error(err.message),
  })
  const excluirMedicao = trpc.medicao.excluir.useMutation({
    onSuccess: () => { toast.success("Medição excluída"); void utils.medicao.listar.invalidate() },
    onError:   (err) => toast.error(err.message),
  })

  const [criando, setCriando] = useState(false)
  const [form, setForm]       = useState({ data: hoje(), descricao: "", itens: [{ ...ITEM_VAZIO }] })
  const [abertos, setAbertos] = useState<Record<string, boolean>>({})

  // KPIs
  const totalMedicoes  = medicoes.length
  const ultimaData     = medicoes[0]?.data ? new Date(medicoes[0].data).toLocaleDateString("pt-BR") : "—"
  const percentualMedio = medicoes.length > 0
    ? medicoes.reduce((s, m) => {
        const avg = m.itens.length > 0
          ? m.itens.reduce((a, i) => a + (i.percentual ?? 0), 0) / m.itens.length
          : 0
        return s + avg
      }, 0) / medicoes.length
    : 0

  function updateItem(idx: number, field: keyof FormItem, value: string) {
    setForm(f => ({ ...f, itens: f.itens.map((it, i) => i === idx ? { ...it, [field]: value } : it) }))
  }
  function addItem() {
    setForm(f => ({ ...f, itens: [...f.itens, { ...ITEM_VAZIO }] }))
  }
  function removeItem(idx: number) {
    setForm(f => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }))
  }

  function handleSubmit() {
    const itens = form.itens.map(i => ({
      descricao:   i.descricao.trim(),
      unidade:     i.unidade.trim() || undefined,
      qtdPrevista: i.qtdPrevista ? parseFloat(i.qtdPrevista) : undefined,
      qtdMedida:   parseFloat(i.qtdMedida) || 0,
      percentual:  i.percentual ? parseFloat(i.percentual) : undefined,
    }))
    if (itens.some(i => !i.descricao)) { toast.error("Preencha a descrição de todos os itens"); return }
    criarMedicao.mutate({ obraId, data: form.data, descricao: form.descricao || undefined, itens })
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <BarChart2 size={20} className="text-orange-500 flex-shrink-0" />
            Medição de Obra
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Registro de avanço físico por período</p>
        </div>
        <button type="button" onClick={() => setCriando(v => !v)} className="btn-orange min-h-[44px]">
          <Plus size={15} />
          Nova Medição
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-xl font-extrabold text-orange-500">{totalMedicoes}</p>
          <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">Medições</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-xl font-extrabold text-slate-700">{ultimaData}</p>
          <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">Última medição</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-xl font-extrabold text-blue-600">{fmt(percentualMedio)}%</p>
          <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">% médio</p>
        </div>
      </div>

      {/* Formulário inline */}
      {criando && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Nova Medição</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Data *</label>
              <input
                type="date"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-white outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Medição #3 — fundação"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-white outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Itens */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Descrição *</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-20">Unid.</th>
                  <th className="text-right px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28">Qtd Prevista</th>
                  <th className="text-right px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28">Qtd Medida *</th>
                  <th className="text-right px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-24">% Exec.</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {form.itens.map((item, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={item.descricao}
                        onChange={e => updateItem(idx, "descricao", e.target.value)}
                        placeholder="Serviço ou item"
                        className="w-full px-2 py-1 text-sm border border-border rounded-lg outline-none focus:border-blue-400"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={item.unidade}
                        onChange={e => updateItem(idx, "unidade", e.target.value)}
                        placeholder="m², kg"
                        className="w-full px-2 py-1 text-sm border border-border rounded-lg outline-none focus:border-blue-400"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.qtdPrevista}
                        onChange={e => updateItem(idx, "qtdPrevista", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded-lg outline-none focus:border-blue-400 text-right"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.qtdMedida}
                        onChange={e => updateItem(idx, "qtdMedida", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded-lg outline-none focus:border-blue-400 text-right"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.percentual}
                        onChange={e => updateItem(idx, "percentual", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded-lg outline-none focus:border-blue-400 text-right"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      {form.itens.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              <Plus size={14} />
              Adicionar item
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCriando(false)} className="btn-ghost">Cancelar</button>
              <button
                type="button"
                disabled={criarMedicao.isPending}
                onClick={handleSubmit}
                className="btn-orange disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {criarMedicao.isPending ? "Salvando…" : "Salvar Medição"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading && <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando…</div>}

      {!isLoading && medicoes.length === 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm py-12 text-center">
          <BarChart2 size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma medição registrada</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Crie a primeira medição de avanço físico da obra</p>
        </div>
      )}

      <div className="space-y-3">
        {medicoes.map(m => {
          const isOpen   = !!abertos[m.id]
          const dataFmt  = new Date(m.data).toLocaleDateString("pt-BR")
          const avgPct   = m.itens.length > 0
            ? m.itens.reduce((s, i) => s + (i.percentual ?? 0), 0) / m.itens.length
            : 0
          const hasSienge = m.itens.some(i => i.siengeProgressLogId)

          return (
            <div key={m.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setAbertos(a => ({ ...a, [m.id]: !a[m.id] }))}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/50 transition-colors text-left"
              >
                {isOpen
                  ? <ChevronDown size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                  : <ChevronRight size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{dataFmt}</span>
                    {m.descricao && (
                      <span className="text-xs text-[var(--text-muted)] truncate">— {m.descricao}</span>
                    )}
                    {hasSienge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                        <Link2 size={9} />Sienge
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {m.itens.length} {m.itens.length === 1 ? "item" : "itens"} · % médio: {fmt(avgPct)}%
                  </p>
                </div>
                {/* Barra de progresso */}
                <div className="w-32 flex-shrink-0">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                    <span>Avanço</span>
                    <span>{fmt(avgPct)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(avgPct, 100)}%`,
                        backgroundColor: avgPct >= 100 ? "#22c55e" : avgPct >= 50 ? "#3b82f6" : "#f97316",
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm("Excluir esta medição?")) {
                      excluirMedicao.mutate({ id: m.id })
                    }
                  }}
                  className="ml-2 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </button>

              {isOpen && (
                <div className="border-t border-border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Descrição</th>
                        <th className="text-center px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-16">Unid.</th>
                        <th className="text-right px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28">Qtd Prevista</th>
                        <th className="text-right px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-28">Qtd Medida</th>
                        <th className="text-right px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-24">% Exec.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.itens.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 1 ? "bg-muted/20 border-t border-border" : "border-t border-border"}>
                          <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{item.descricao}</td>
                          <td className="px-4 py-2.5 text-center text-[var(--text-muted)]">{item.unidade ?? "—"}</td>
                          <td className="px-4 py-2.5 text-right text-[var(--text-muted)]">
                            {item.qtdPrevista != null ? fmt(item.qtdPrevista) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">{fmt(item.qtdMedida)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`font-semibold ${(item.percentual ?? 0) >= 100 ? "text-green-600" : (item.percentual ?? 0) > 0 ? "text-blue-600" : "text-slate-400"}`}>
                              {item.percentual != null ? `${fmt(item.percentual)}%` : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
