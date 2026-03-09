"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingCart, Plus, Trash2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

type Item = { materialId: string; quantidade: string; precoUnit: string; unidade: string }

const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

export default function NovoPedidoPage() {
  const router = useRouter()

  const [fornecedorId, setFornecedorId]     = useState("")
  const [previsaoEntrega, setPrevisao]      = useState("")
  const [observacoes, setObs]               = useState("")
  const [itens, setItens]                   = useState<Item[]>([{ materialId: "", quantidade: "", precoUnit: "", unidade: "" }])
  const [erro, setErro]                     = useState("")

  const { data: _fData } = trpc.fornecedor.listar.useQuery()
  const fornecedores = _fData?.fornecedores ?? []
  const { data: materiais = [] }    = trpc.material.listar.useQuery()

  const criar = trpc.pedido.criar.useMutation({
    onSuccess: (p) => router.push(`/suprimentos/pedidos/${p.id}`),
    onError: (e) => setErro(e.message),
  })

  function addItem() {
    setItens(prev => [...prev, { materialId: "", quantidade: "", precoUnit: "", unidade: "" }])
  }

  function removeItem(i: number) {
    setItens(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof Item, value: string) {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function selecionarMaterial(i: number, materialId: string) {
    const mat = materiais.find(m => m.id === materialId)
    setItens(prev => prev.map((item, idx) =>
      idx === i ? {
        ...item, materialId,
        unidade: mat?.unidade ?? "",
        precoUnit: mat?.precoUnitario?.toString() ?? item.precoUnit,
      } : item
    ))
  }

  const total = itens.reduce((sum, item) => {
    const qty   = Number(item.quantidade) || 0
    const price = Number(item.precoUnit) || 0
    return sum + qty * price
  }, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErro("")
    const itensFiltrados = itens.filter(i => i.materialId && i.quantidade)
    if (itensFiltrados.length === 0) {
      setErro("Adicione ao menos um item com material e quantidade.")
      return
    }
    criar.mutate({
      fornecedorId,
      previsaoEntrega: previsaoEntrega || undefined,
      observacoes: observacoes.trim() || undefined,
      itens: itensFiltrados.map(i => ({
        materialId: i.materialId,
        quantidade: Number(i.quantidade),
        precoUnit: i.precoUnit ? Number(i.precoUnit) : undefined,
        unidade: i.unidade || undefined,
      })),
    })
  }

  const fornecedoresAtivos = fornecedores.filter(f => f.ativo)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/suprimentos/pedidos"
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors cursor-pointer">
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <ShoppingCart size={20} className="text-orange-500" />
            Novo Pedido de Compra
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Emita um pedido para o fornecedor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {erro && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>
        )}

        {/* Fornecedor + previsão */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Fornecedor</h3>

          <div>
            <label className={labelCls}>Fornecedor <span className="text-red-500">*</span></label>
            <select required value={fornecedorId} onChange={e => setFornecedorId(e.target.value)} className={inputCls}>
              <option value="">Selecione o fornecedor...</option>
              {fornecedoresAtivos.map(f => (
                <option key={f.id} value={f.id}>
                  {f.nome}{f.categoria ? ` — ${f.categoria}` : ""}
                </option>
              ))}
            </select>
            {fornecedoresAtivos.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Nenhum fornecedor ativo. <Link href="/suprimentos/fornecedores" className="underline">Cadastre um fornecedor</Link> primeiro.
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Previsão de entrega</label>
            <input type="date" value={previsaoEntrega} onChange={e => setPrevisao(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Itens do pedido</h3>

          <div className="space-y-3">
            {itens.map((item, i) => {
              const subtotal = (Number(item.quantidade) || 0) * (Number(item.precoUnit) || 0)
              return (
                <div key={i} className="p-4 rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Item {i + 1}</span>
                    <div className="flex items-center gap-2">
                      {subtotal > 0 && (
                        <span className="text-xs font-semibold text-orange-600">
                          R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      <button type="button" onClick={() => removeItem(i)} disabled={itens.length === 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Material <span className="text-red-500">*</span></label>
                    <select value={item.materialId} onChange={e => selecionarMaterial(i, e.target.value)} className={inputCls}>
                      <option value="">Selecione o material...</option>
                      {materiais.map(m => (
                        <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Qtd. <span className="text-red-500">*</span></label>
                      <input type="number" min="0" step="any" value={item.quantidade}
                        onChange={e => updateItem(i, "quantidade", e.target.value)}
                        placeholder="0" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Unidade</label>
                      <input type="text" value={item.unidade}
                        onChange={e => updateItem(i, "unidade", e.target.value)}
                        placeholder="sc, kg, m²" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Preço unit. (R$)</label>
                      <input type="number" min="0" step="0.01" value={item.precoUnit}
                        onChange={e => updateItem(i, "precoUnit", e.target.value)}
                        placeholder="0,00" className={inputCls} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={addItem}
              className="flex items-center gap-2 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors cursor-pointer">
              <Plus size={14} />
              Adicionar item
            </button>
            {total > 0 && (
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Total: <span className="text-orange-600">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </p>
            )}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Observações</h3>
          <textarea value={observacoes} onChange={e => setObs(e.target.value)}
            placeholder="Condições de pagamento, local de entrega, observações especiais..."
            rows={3} className={`${inputCls} resize-none`} />
        </div>

        <div className="flex items-center gap-3 pb-6">
          <button type="submit" disabled={criar.isPending}
            className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 cursor-pointer">
            <ShoppingCart size={15} />
            {criar.isPending ? "Salvando..." : "Criar Pedido"}
          </button>
          <Link href="/suprimentos/pedidos" className="btn-ghost min-h-[44px] flex-1 justify-center cursor-pointer">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
