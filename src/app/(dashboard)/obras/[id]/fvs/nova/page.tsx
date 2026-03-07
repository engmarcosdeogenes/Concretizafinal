"use client"

import Link from "next/link"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, CheckSquare } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

type Item = { descricao: string }

export default function NovaFvsPage() {
  const params = useParams()
  const obraId = params.id as string
  const router = useRouter()

  const hoje = new Date().toISOString().split("T")[0]

  const [servico, setServico]         = useState("")
  const [codigo, setCodigo]           = useState("")
  const [data, setData]               = useState(hoje)
  const [observacoes, setObservacoes] = useState("")
  const [itens, setItens]             = useState<Item[]>([{ descricao: "" }])
  const [erro, setErro]               = useState("")

  const criar = trpc.fvs.criar.useMutation({
    onSuccess: (fvs) => {
      router.push(`/obras/${obraId}/fvs/${fvs.id}`)
    },
    onError: (e) => {
      setErro(e.message || "Erro ao criar FVS.")
    },
  })

  function addItem() {
    setItens(prev => [...prev, { descricao: "" }])
  }

  function removeItem(i: number) {
    setItens(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, value: string) {
    setItens(prev => prev.map((item, idx) => idx === i ? { descricao: value } : item))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")

    const itensFiltrados = itens.filter(item => item.descricao.trim())

    criar.mutate({
      obraId,
      servico: servico.trim(),
      codigo: codigo.trim() || undefined,
      data,
      observacoes: observacoes.trim() || undefined,
      itens: itensFiltrados.map(item => ({ descricao: item.descricao.trim() })),
    })
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/obras/${obraId}/fvs`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <CheckSquare size={20} className="text-orange-500" />
            Nova FVS
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Ficha de Verificação de Serviço</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {erro && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {erro}
          </div>
        )}

        {/* Informações gerais */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Informações gerais</h3>

          <div>
            <label className={labelCls}>
              Serviço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={servico}
              onChange={e => setServico(e.target.value)}
              placeholder="Ex: Concretagem de Laje — Pav. 5"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Código (PEIS)</label>
              <input
                type="text"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Ex: PEIS 004"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Data <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={data}
                onChange={e => setData(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Itens do checklist */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Itens do checklist</h3>

          <div className="space-y-2">
            {itens.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] w-5 text-right flex-shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  value={item.descricao}
                  onChange={e => updateItem(i, e.target.value)}
                  placeholder="Descrição do item a verificar"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={itens.length === 1}
                  className="h-[42px] w-[38px] flex-shrink-0 flex items-center justify-center rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Adicionar item
          </button>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Observações</h3>
          <textarea
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            placeholder="Observações gerais sobre o serviço ou condições de inspeção..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-6">
          <button
            type="submit"
            disabled={criar.isPending}
            className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckSquare size={15} />
            {criar.isPending ? "Salvando..." : "Criar FVS"}
          </button>
          <Link href={`/obras/${obraId}/fvs`} className="btn-ghost min-h-[44px] flex-1 justify-center cursor-pointer">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
