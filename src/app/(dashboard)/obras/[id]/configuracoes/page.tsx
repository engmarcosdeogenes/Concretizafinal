"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Plus, Trash2, Save, Settings, Users, Wrench, CheckCircle2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

type ItemEquipe = { funcao: string; quantidade: string }
type ItemEquipamento = { nome: string; quantidade: string }

export default function ObraConfiguracoesPage() {
  const params = useParams()
  const obraId = params.id as string

  const { data: obra, isLoading } = trpc.obra.buscarPorId.useQuery({ id: obraId })

  const [equipe, setEquipe] = useState<ItemEquipe[]>([])
  const [equipamentos, setEquipamentos] = useState<ItemEquipamento[]>([])
  const [equipeOk, setEquipeOk] = useState(false)
  const [equipOk, setEquipOk] = useState(false)

  // Inicializa de volta do banco
  useEffect(() => {
    if (!obra) return
    const eq = obra.equipePredef as Array<{ funcao: string; quantidade: number }> | null
    if (eq && eq.length > 0) {
      setEquipe(eq.map(e => ({ funcao: e.funcao, quantidade: String(e.quantidade) })))
    } else {
      setEquipe([{ funcao: "", quantidade: "1" }])
    }
    const eqp = obra.equipamentosPredef as Array<{ nome: string; quantidade: number }> | null
    if (eqp && eqp.length > 0) {
      setEquipamentos(eqp.map(e => ({ nome: e.nome, quantidade: String(e.quantidade) })))
    } else {
      setEquipamentos([{ nome: "", quantidade: "1" }])
    }
  }, [obra])

  const salvarEquipePredef = trpc.obra.salvarEquipePredef.useMutation({
    onSuccess: () => { setEquipeOk(true); setTimeout(() => setEquipeOk(false), 3000) },
  })
  const salvarEquipamentosPredef = trpc.obra.salvarEquipamentosPredef.useMutation({
    onSuccess: () => { setEquipOk(true); setTimeout(() => setEquipOk(false), 3000) },
  })

  function handleSalvarEquipe() {
    const filtrada = equipe.filter(e => e.funcao.trim())
    salvarEquipePredef.mutate({
      id: obraId,
      equipePredef: filtrada.map(e => ({ funcao: e.funcao.trim(), quantidade: Number(e.quantidade) || 1 })),
    })
  }

  function handleSalvarEquipamentos() {
    const filtrados = equipamentos.filter(e => e.nome.trim())
    salvarEquipamentosPredef.mutate({
      id: obraId,
      equipamentosPredef: filtrados.map(e => ({ nome: e.nome.trim(), quantidade: Number(e.quantidade) || 1 })),
    })
  }

  const inputCls = "px-3 py-2 border border-border rounded-lg text-sm text-[var(--text-primary)] bg-white outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-all"

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded-xl animate-pulse w-48" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Settings size={18} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Configurações da Obra</h1>
          <p className="text-sm text-[var(--text-muted)]">Predefinições para agilizar o preenchimento do RDO</p>
        </div>
      </div>

      {/* Equipe Padrão */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Equipe Padrão</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Carregada automaticamente ao criar novo RDO</p>
        </div>

        <div className="p-5 space-y-3">
          {equipe.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Função (ex: Pedreiro)"
                value={item.funcao}
                onChange={e => setEquipe(prev => prev.map((x, idx) => idx === i ? { ...x, funcao: e.target.value } : x))}
                className={cn(inputCls, "flex-1")}
              />
              <input
                type="number"
                min={1}
                value={item.quantidade}
                onChange={e => setEquipe(prev => prev.map((x, idx) => idx === i ? { ...x, quantidade: e.target.value } : x))}
                className={cn(inputCls, "w-20 text-center")}
              />
              <button
                type="button"
                onClick={() => setEquipe(prev => prev.filter((_, idx) => idx !== i))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setEquipe(prev => [...prev, { funcao: "", quantidade: "1" }])}
            className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            <Plus size={14} /> Adicionar função
          </button>
        </div>

        <div className="px-5 pb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSalvarEquipe}
            disabled={salvarEquipePredef.isPending}
            className="btn-orange flex items-center gap-2"
          >
            <Save size={14} />
            {salvarEquipePredef.isPending ? "Salvando..." : "Salvar Equipe"}
          </button>
          {equipeOk && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 size={14} /> Salvo!
            </span>
          )}
        </div>
      </div>

      {/* Equipamentos Padrão */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-orange-500" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Equipamentos Padrão</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Equipamentos típicos desta obra</p>
        </div>

        <div className="p-5 space-y-3">
          {equipamentos.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Equipamento (ex: Betoneira)"
                value={item.nome}
                onChange={e => setEquipamentos(prev => prev.map((x, idx) => idx === i ? { ...x, nome: e.target.value } : x))}
                className={cn(inputCls, "flex-1")}
              />
              <input
                type="number"
                min={1}
                value={item.quantidade}
                onChange={e => setEquipamentos(prev => prev.map((x, idx) => idx === i ? { ...x, quantidade: e.target.value } : x))}
                className={cn(inputCls, "w-20 text-center")}
              />
              <button
                type="button"
                onClick={() => setEquipamentos(prev => prev.filter((_, idx) => idx !== i))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setEquipamentos(prev => [...prev, { nome: "", quantidade: "1" }])}
            className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            <Plus size={14} /> Adicionar equipamento
          </button>
        </div>

        <div className="px-5 pb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSalvarEquipamentos}
            disabled={salvarEquipamentosPredef.isPending}
            className="btn-orange flex items-center gap-2"
          >
            <Save size={14} />
            {salvarEquipamentosPredef.isPending ? "Salvando..." : "Salvar Equipamentos"}
          </button>
          {equipOk && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 size={14} /> Salvo!
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)] text-center">
        A equipe padrão é carregada automaticamente ao clicar em &quot;Carregar equipe padrão&quot; no novo RDO.
      </p>
    </div>
  )
}
