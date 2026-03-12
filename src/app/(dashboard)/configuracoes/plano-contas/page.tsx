"use client"

import { useState, useEffect } from "react"
import { BookOpen, Save, Loader2, Info } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { toast } from "sonner"

const CATEGORIAS = [
  { key: "Materiais",    label: "Materiais de Construção",  desc: "Usado ao aprovar FVM e entrega de pedido de compra" },
  { key: "Servicos",     label: "Serviços / Empreitada",    desc: "Contratos de mão de obra e subempreiteiras" },
  { key: "Equipamentos", label: "Equipamentos / Locação",   desc: "Aluguéis de máquinas e equipamentos" },
  { key: "Outros",       label: "Outras Despesas",          desc: "Demais lançamentos não categorizados" },
  { key: "centroCusto",  label: "Centro de Custo (padrão)", desc: "Código de centro de custo aplicado em todos os lançamentos" },
]

export default function PlanoContasPage() {
  const { data: planos, isLoading } = trpc.configuracoes.buscarPlanosContas.useQuery()
  const salvar = trpc.configuracoes.salvarPlanosContas.useMutation({
    onSuccess: () => toast.success("Plano de contas salvo!"),
    onError: () => toast.error("Erro ao salvar"),
  })

  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (planos) setForm(planos)
  }, [planos])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <BookOpen size={18} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Plano de Contas</h1>
          <p className="text-sm text-[var(--text-muted)]">Mapeie categorias para códigos contábeis do Sienge</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Quando um pedido é entregue ou um FVM é aprovado, o Concretiza envia automaticamente um lançamento contábil ao Sienge com o código configurado aqui. Deixe em branco as categorias que não deseja lançar automaticamente.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <div className="grid grid-cols-[1fr_180px] gap-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            <span>Categoria</span>
            <span>Código da Conta</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {CATEGORIAS.map(({ key, label, desc }) => (
            <div key={key} className="grid grid-cols-[1fr_180px] gap-4 px-5 py-4 items-center">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{desc}</p>
              </div>
              <input
                value={form[key] ?? ""}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={key === "centroCusto" ? "ex: CC001" : "ex: 1.1.01"}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => salvar.mutate({ planosContas: form })}
        disabled={salvar.isPending}
        className="btn-orange flex items-center gap-2"
      >
        {salvar.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Salvar Plano de Contas
      </button>
    </div>
  )
}
