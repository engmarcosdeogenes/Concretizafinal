"use client"

import Link from "next/link"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Package } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

export default function NovaFvmPage() {
  const params = useParams()
  const obraId = params.id as string
  const router = useRouter()

  const hoje = new Date().toISOString().split("T")[0]

  const [material, setMaterial]             = useState("")
  const [codigo, setCodigo]                 = useState("")
  const [fornecedorNome, setFornecedorNome] = useState("")
  const [quantidade, setQuantidade]         = useState("")
  const [unidade, setUnidade]               = useState("")
  const [data, setData]                     = useState(hoje)
  const [notaFiscal, setNotaFiscal]         = useState("")
  const [observacoes, setObservacoes]       = useState("")
  const [erro, setErro]                     = useState("")

  const criar = trpc.fvm.criar.useMutation({
    onSuccess: (fvm) => {
      router.push(`/obras/${obraId}/fvm/${fvm.id}`)
    },
    onError: (e) => {
      setErro(e.message || "Erro ao criar FVM.")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    criar.mutate({
      obraId,
      material: material.trim(),
      codigo: codigo.trim() || undefined,
      fornecedorNome: fornecedorNome.trim() || undefined,
      quantidade: Number(quantidade),
      unidade: unidade.trim() || undefined,
      data,
      notaFiscal: notaFiscal.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    })
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/obras/${obraId}/fvm`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <Package size={20} className="text-orange-500" />
            Nova FVM
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Ficha de Verificação de Material</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {erro && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>
        )}

        {/* Material */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Identificação do material</h3>

          <div>
            <label className={labelCls}>Material <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={material}
              onChange={e => setMaterial(e.target.value)}
              placeholder="Ex: Aço CA-50 — Barras e Fios"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Código (FVM)</label>
              <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ex: FVM 02" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Data de recebimento <span className="text-red-500">*</span></label>
              <input type="date" required value={data} onChange={e => setData(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Quantidade e fornecedor */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quantidade e fornecedor</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Quantidade <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                placeholder="Ex: 2400"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Unidade</label>
              <input type="text" value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="Ex: kg, m², un" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fornecedor</label>
              <input type="text" value={fornecedorNome} onChange={e => setFornecedorNome(e.target.value)} placeholder="Nome do fornecedor" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nota Fiscal</label>
              <input type="text" value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)} placeholder="Ex: NF 001.234" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Observações</h3>
          <textarea
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            placeholder="Condições do material, não conformidades observadas no recebimento..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-6">
          <button
            type="submit"
            disabled={criar.isPending}
            className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Package size={15} />
            {criar.isPending ? "Salvando..." : "Criar FVM"}
          </button>
          <Link href={`/obras/${obraId}/fvm`} className="btn-ghost min-h-[44px] flex-1 justify-center cursor-pointer">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
