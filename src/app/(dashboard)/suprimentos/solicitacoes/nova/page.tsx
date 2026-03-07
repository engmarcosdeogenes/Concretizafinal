"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ClipboardList, Plus, Trash2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

type Item = { materialId: string; quantidade: string; unidade: string; observacao: string }

const URGENCIAS = [
  { value: 1, label: "Baixa",  cls: "border-slate-300 text-slate-600" },
  { value: 2, label: "Média",  cls: "border-amber-400 text-amber-700" },
  { value: 3, label: "Alta",   cls: "border-red-400 text-red-700" },
]

const inputCls = "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

export default function NovaSolicitacaoPage() {
  const router = useRouter()

  const [obraId, setObraId]         = useState("")
  const [urgencia, setUrgencia]     = useState(2)
  const [observacoes, setObs]       = useState("")
  const [itens, setItens]           = useState<Item[]>([{ materialId: "", quantidade: "", unidade: "", observacao: "" }])
  const [erro, setErro]             = useState("")

  const { data: obras = [] }      = trpc.obra.listar.useQuery()
  const { data: materiais = [] }  = trpc.material.listar.useQuery()

  const criar = trpc.solicitacao.criar.useMutation({
    onSuccess: (sol) => router.push(`/suprimentos/solicitacoes/${sol.id}`),
    onError: (e) => setErro(e.message),
  })

  function addItem() {
    setItens(prev => [...prev, { materialId: "", quantidade: "", unidade: "", observacao: "" }])
  }

  function removeItem(i: number) {
    setItens(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof Item, value: string) {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  // Auto-preencher unidade ao selecionar material
  function selecionarMaterial(i: number, materialId: string) {
    const mat = materiais.find(m => m.id === materialId)
    setItens(prev => prev.map((item, idx) =>
      idx === i ? { ...item, materialId, unidade: mat?.unidade ?? "" } : item
    ))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErro("")
    const itensFiltrados = itens.filter(i => i.materialId && i.quantidade)
    if (itensFiltrados.length === 0) {
      setErro("Adicione ao menos um item com material e quantidade.")
      return
    }
    criar.mutate({
      obraId,
      urgencia,
      observacoes: observacoes.trim() || undefined,
      itens: itensFiltrados.map(i => ({
        materialId: i.materialId,
        quantidade: Number(i.quantidade),
        unidade: i.unidade || undefined,
        observacao: i.observacao || undefined,
      })),
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/suprimentos/solicitacoes"
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer">
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <ClipboardList size={20} className="text-orange-500" />
            Nova Solicitação de Compra
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Solicite materiais e insumos para a obra</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {erro && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>
        )}

        {/* Obra + urgência */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Informações gerais</h3>

          <div>
            <label className={labelCls}>Obra <span className="text-red-500">*</span></label>
            <select required value={obraId} onChange={e => setObraId(e.target.value)} className={inputCls}>
              <option value="">Selecione a obra...</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Urgência</label>
            <div className="flex gap-3">
              {URGENCIAS.map(u => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgencia(u.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                    urgencia === u.value
                      ? `${u.cls} bg-opacity-10`
                      : "border-[var(--border)] text-[var(--text-muted)] bg-white hover:bg-[var(--muted)]"
                  }`}
                  style={urgencia === u.value ? { borderColor: "currentColor" } : {}}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Itens solicitados</h3>

          <div className="space-y-3">
            {itens.map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Item {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={itens.length === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div>
                  <label className={labelCls}>Material <span className="text-red-500">*</span></label>
                  <select
                    value={item.materialId}
                    onChange={e => selecionarMaterial(i, e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Selecione o material...</option>
                    {materiais.map(m => (
                      <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Quantidade <span className="text-red-500">*</span></label>
                    <input
                      type="number" min="0" step="any"
                      value={item.quantidade}
                      onChange={e => updateItem(i, "quantidade", e.target.value)}
                      placeholder="Ex: 50" className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Unidade</label>
                    <input
                      type="text"
                      value={item.unidade}
                      onChange={e => updateItem(i, "unidade", e.target.value)}
                      placeholder="sc, kg, m²" className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Observação</label>
                  <input
                    type="text"
                    value={item.observacao}
                    onChange={e => updateItem(i, "observacao", e.target.value)}
                    placeholder="Especificação adicional..." className={inputCls}
                  />
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem}
            className="flex items-center gap-2 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors cursor-pointer">
            <Plus size={14} />
            Adicionar item
          </button>
        </div>

        {/* Observações gerais */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Observações</h3>
          <textarea
            value={observacoes}
            onChange={e => setObs(e.target.value)}
            placeholder="Informações adicionais, prazo necessário, justificativa..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex items-center gap-3 pb-6">
          <button type="submit" disabled={criar.isPending}
            className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 cursor-pointer">
            <ClipboardList size={15} />
            {criar.isPending ? "Salvando..." : "Criar Solicitação"}
          </button>
          <Link href="/suprimentos/solicitacoes"
            className="btn-ghost min-h-[44px] flex-1 justify-center cursor-pointer">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
