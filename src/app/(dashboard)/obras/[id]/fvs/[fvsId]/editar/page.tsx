"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, CheckSquare } from "lucide-react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc/client"

type Item = { descricao: string }

export default function EditarFvsPage() {
  const params = useParams()
  const obraId = params.id as string
  const fvsId  = params.fvsId as string
  const router = useRouter()

  const [servico,     setServico]     = useState("")
  const [codigo,      setCodigo]      = useState("")
  const [data,        setData]        = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [itens,       setItens]       = useState<Item[]>([])
  const [erro,        setErro]        = useState("")
  const [pronto,      setPronto]      = useState(false)

  const utils = trpc.useUtils()
  const { data: fvs, isLoading } = trpc.fvs.buscarPorId.useQuery({ id: fvsId })

  // Popula form quando os dados carregam
  useEffect(() => {
    if (!fvs || pronto) return
    setServico(fvs.servico)
    setCodigo(fvs.codigo ?? "")
    setData(new Date(fvs.data).toISOString().split("T")[0])
    setObservacoes(fvs.observacoes ?? "")
    setItens(fvs.itens.length > 0
      ? fvs.itens.map(i => ({ descricao: i.descricao }))
      : [{ descricao: "" }]
    )
    setPronto(true)
  }, [fvs, pronto])

  const atualizar = trpc.fvs.atualizar.useMutation({
    onSuccess: () => {
      utils.fvs.buscarPorId.invalidate({ id: fvsId })
      utils.fvs.listar.invalidate({ obraId })
      toast.success("FVS atualizada")
      router.push(`/obras/${obraId}/fvs/${fvsId}`)
    },
    onError: (e) => {
      setErro(e.message || "Erro ao atualizar FVS.")
      toast.error(e.message)
    },
  })

  function addItem()                            { setItens(prev => [...prev, { descricao: "" }]) }
  function removeItem(i: number)                { setItens(prev => prev.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, value: string) { setItens(prev => prev.map((it, idx) => idx === i ? { descricao: value } : it)) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    const itensFiltrados = itens.filter(i => i.descricao.trim())
    atualizar.mutate({
      id:          fvsId,
      servico:     servico.trim(),
      codigo:      codigo.trim() || null,
      data,
      observacoes: observacoes.trim() || null,
      itens:       itensFiltrados.map(i => ({ descricao: i.descricao.trim() })),
    })
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Carregando FVS...</p>
      </div>
    )
  }

  if (!fvs) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">FVS não encontrada.</p>
        <Link href={`/obras/${obraId}/fvs`} className="text-sm text-orange-500 mt-2 inline-block">← Voltar para lista</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/obras/${obraId}/fvs/${fvsId}`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <CheckSquare size={20} className="text-orange-500" />
            Editar FVS
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5 truncate max-w-sm">{fvs.servico}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {erro && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>
        )}

        {/* Informações gerais */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Informações gerais</h3>

          <div>
            <label className={labelCls}>Serviço <span className="text-red-500">*</span></label>
            <input
              type="text" required value={servico} onChange={e => setServico(e.target.value)}
              placeholder="Ex: Concretagem de Laje — Pav. 5" className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Código (PEIS)</label>
              <input
                type="text" value={codigo} onChange={e => setCodigo(e.target.value)}
                placeholder="Ex: PEIS 004" className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Data <span className="text-red-500">*</span></label>
              <input type="date" required value={data} onChange={e => setData(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Itens do checklist</h3>
            <span className="text-[11px] text-[var(--text-muted)]">{itens.filter(i => i.descricao.trim()).length} itens</span>
          </div>

          <div className="space-y-2">
            {itens.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] w-5 text-right flex-shrink-0">{i + 1}.</span>
                <input
                  type="text" value={item.descricao} onChange={e => updateItem(i, e.target.value)}
                  placeholder="Descrição do item a verificar" className={`${inputCls} flex-1`}
                />
                <button
                  type="button" onClick={() => removeItem(i)} disabled={itens.length === 1}
                  className="h-[42px] w-[38px] flex-shrink-0 flex items-center justify-center rounded-xl border border-border text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button" onClick={addItem}
            className="flex items-center gap-2 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Adicionar item
          </button>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Observações</h3>
          <textarea
            value={observacoes} onChange={e => setObservacoes(e.target.value)}
            placeholder="Observações gerais sobre o serviço ou condições de inspeção..." rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-6">
          <button
            type="submit" disabled={atualizar.isPending}
            className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckSquare size={15} />
            {atualizar.isPending ? "Salvando..." : "Salvar alterações"}
          </button>
          <Link href={`/obras/${obraId}/fvs/${fvsId}`} className="btn-ghost min-h-[44px] flex-1 justify-center cursor-pointer">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
