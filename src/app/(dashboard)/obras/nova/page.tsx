"use client"

import Link from "next/link"
import { ArrowLeft, HardHat } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]

export default function NovaObraPage() {
  const router = useRouter()
  const [erro, setErro] = useState("")

  const criar = trpc.obra.criar.useMutation({
    onSuccess: (obra) => {
      router.push(`/obras/${obra.id}`)
    },
    onError: (e) => {
      setErro(e.message || "Erro ao criar obra.")
    },
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro("")

    const form = new FormData(e.currentTarget)
    const orcamentoStr = form.get("orcamento") as string

    criar.mutate({
      nome:       (form.get("nome") as string).trim(),
      endereco:   (form.get("endereco") as string) || undefined,
      cidade:     (form.get("cidade") as string) || undefined,
      estado:     (form.get("estado") as string) || undefined,
      orcamento:  orcamentoStr ? parseFloat(orcamentoStr) : undefined,
      dataInicio: (form.get("dataInicio") as string) || undefined,
      dataFim:    (form.get("dataFim") as string) || undefined,
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/obras"
          aria-label="Voltar para obras"
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl">Nova Obra</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Preencha os dados da obra</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-5">

        {erro && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {erro}
          </div>
        )}

        {/* Nome */}
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Nome da Obra <span className="text-red-500">*</span>
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            placeholder="Ex: Edifício Residencial Araucária"
            className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Endereço */}
        <div>
          <label htmlFor="endereco" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Endereço
          </label>
          <input
            id="endereco"
            name="endereco"
            type="text"
            placeholder="Rua, número, bairro"
            className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Cidade / Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cidade" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Cidade
            </label>
            <input
              id="cidade"
              name="cidade"
              type="text"
              placeholder="Ex: Goiânia"
              className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="">Selecione</option>
              {ESTADOS.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dataInicio" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Data de Início
            </label>
            <input
              id="dataInicio"
              name="dataInicio"
              type="date"
              className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div>
            <label htmlFor="dataFim" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Término Previsto
            </label>
            <input
              id="dataFim"
              name="dataFim"
              type="date"
              className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        {/* Orçamento */}
        <div>
          <label htmlFor="orcamento" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Orçamento Total (R$)
          </label>
          <input
            id="orcamento"
            name="orcamento"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={criar.isPending}
            className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <HardHat size={15} />
            {criar.isPending ? "Criando..." : "Criar Obra"}
          </button>
          <Link href="/obras" className="btn-ghost min-h-[44px] flex-1 justify-center">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
