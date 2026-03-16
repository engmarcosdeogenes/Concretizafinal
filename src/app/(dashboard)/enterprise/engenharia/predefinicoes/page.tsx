"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, Wrench, Loader2, Plus, Trash2, Save } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { toast } from "sonner"

interface EquipeRow {
  funcao: string
  quantidade: number
}

interface EquipamentoRow {
  nome: string
  quantidade: number
}

export default function PredefinicoesPage() {
  const utils = trpc.useUtils()
  const { data: obras = [], isLoading } = trpc.obra.listar.useQuery()

  const [obraId, setObraId] = useState<string>("")
  const [equipe, setEquipe] = useState<EquipeRow[]>([])
  const [equipamentos, setEquipamentos] = useState<EquipamentoRow[]>([])

  const obraAtual = obras.find((o) => o.id === obraId)

  const loadFromObra = useCallback(() => {
    if (!obraAtual) return
    const eq = (obraAtual.equipePredef ?? []) as EquipeRow[]
    const ep = (obraAtual.equipamentosPredef ?? []) as EquipamentoRow[]
    setEquipe(eq.length > 0 ? eq.map((r) => ({ ...r })) : [{ funcao: "", quantidade: 1 }])
    setEquipamentos(ep.length > 0 ? ep.map((r) => ({ ...r })) : [{ nome: "", quantidade: 1 }])
  }, [obraAtual])

  useEffect(() => {
    if (obraAtual) loadFromObra()
  }, [obraAtual, loadFromObra])

  const salvarEquipe = trpc.obra.salvarEquipePredef.useMutation({
    onSuccess: () => {
      toast.success("Salvo!")
      utils.obra.listar.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const salvarEquipamentos = trpc.obra.salvarEquipamentosPredef.useMutation({
    onSuccess: () => {
      toast.success("Salvo!")
      utils.obra.listar.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  // --- Equipe handlers ---
  const updateEquipeRow = (idx: number, field: keyof EquipeRow, value: string | number) => {
    setEquipe((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }
  const addEquipeRow = () => setEquipe((prev) => [...prev, { funcao: "", quantidade: 1 }])
  const removeEquipeRow = (idx: number) => setEquipe((prev) => prev.filter((_, i) => i !== idx))

  // --- Equipamentos handlers ---
  const updateEquipRow = (idx: number, field: keyof EquipamentoRow, value: string | number) => {
    setEquipamentos((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }
  const addEquipRow = () => setEquipamentos((prev) => [...prev, { nome: "", quantidade: 1 }])
  const removeEquipRow = (idx: number) => setEquipamentos((prev) => prev.filter((_, i) => i !== idx))

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 relative">
          <Users size={16} className="text-amber-700" />
          <Wrench size={10} className="text-amber-700 absolute bottom-1 right-1" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Predefinições de Equipes e Equipamentos
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Configure equipes e equipamentos padrão para cada obra
          </p>
        </div>
      </div>

      {/* Obra selector */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Selecione a Obra
        </label>
        {isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">Carregando obras...</span>
          </div>
        ) : (
          <select
            value={obraId}
            onChange={(e) => setObraId(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">-- Selecione --</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Sections side by side */}
      {obraId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Equipe Predefinida */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Users size={16} className="text-amber-600" />
                Equipe Predefinida
              </h2>
            </div>
            <div className="p-5 space-y-3">
              {equipe.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Função (ex: Pedreiro)"
                    value={row.funcao}
                    onChange={(e) => updateEquipeRow(idx, "funcao", e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <input
                    type="number"
                    min={1}
                    value={row.quantidade}
                    onChange={(e) => updateEquipeRow(idx, "quantidade", Math.max(1, Number(e.target.value)))}
                    className="w-20 rounded-xl border border-border bg-white px-3 py-2 text-sm text-center text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeEquipeRow(idx)}
                    disabled={equipe.length <= 1}
                    className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addEquipeRow}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
              >
                <Plus size={14} />
                Adicionar função
              </button>
              <div className="pt-3 border-t border-border">
                <button
                  type="button"
                  disabled={salvarEquipe.isPending}
                  onClick={() =>
                    salvarEquipe.mutate({
                      obraId,
                      equipePredef: equipe.filter((r) => r.funcao.trim() !== ""),
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {salvarEquipe.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Salvar Equipe
                </button>
              </div>
            </div>
          </div>

          {/* Equipamentos Predefinidos */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Wrench size={16} className="text-amber-600" />
                Equipamentos Predefinidos
              </h2>
            </div>
            <div className="p-5 space-y-3">
              {equipamentos.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nome (ex: Betoneira)"
                    value={row.nome}
                    onChange={(e) => updateEquipRow(idx, "nome", e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <input
                    type="number"
                    min={1}
                    value={row.quantidade}
                    onChange={(e) => updateEquipRow(idx, "quantidade", Math.max(1, Number(e.target.value)))}
                    className="w-20 rounded-xl border border-border bg-white px-3 py-2 text-sm text-center text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeEquipRow(idx)}
                    disabled={equipamentos.length <= 1}
                    className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addEquipRow}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
              >
                <Plus size={14} />
                Adicionar equipamento
              </button>
              <div className="pt-3 border-t border-border">
                <button
                  type="button"
                  disabled={salvarEquipamentos.isPending}
                  onClick={() =>
                    salvarEquipamentos.mutate({
                      obraId,
                      equipamentosPredef: equipamentos.filter((r) => r.nome.trim() !== ""),
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {salvarEquipamentos.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Salvar Equipamentos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
