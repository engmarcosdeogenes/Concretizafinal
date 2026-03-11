"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Loader2, ToggleLeft } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import type { CampoPersonalizado } from "@/server/routers/configuracoes"

const TIPOS = [
  { value: "TEXT",    label: "Texto livre" },
  { value: "NUMBER",  label: "Número" },
  { value: "BOOLEAN", label: "Sim / Não" },
  { value: "SELECT",  label: "Lista de opções" },
] as const

const SECOES = [
  { value: "GERAL",       label: "Geral (cabeçalho do RDO)" },
  { value: "ATIVIDADES",  label: "Atividades" },
  { value: "OCORRENCIAS", label: "Ocorrências do dia" },
] as const

function gerarId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function CamposRdoPage() {
  const utils = trpc.useUtils()
  const { data: camposSalvos = [], isLoading } = trpc.configuracoes.buscarCamposPersonalizados.useQuery()

  const [campos, setCampos] = useState<CampoPersonalizado[]>([])
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    if (camposSalvos.length > 0) setCampos(camposSalvos)
  }, [camposSalvos])

  const salvarMut = trpc.configuracoes.salvarCamposPersonalizados.useMutation({
    onSuccess: () => {
      utils.configuracoes.buscarCamposPersonalizados.invalidate()
      setSalvo(true)
      setTimeout(() => setSalvo(false), 3000)
    },
    onSettled: () => setSalvando(false),
  })

  function addCampo() {
    setCampos(prev => [...prev, {
      id:          gerarId(),
      nome:        "",
      tipo:        "TEXT",
      secao:       "GERAL",
      obrigatorio: false,
      opcoes:      [],
    }])
  }

  function removeCampo(id: string) {
    setCampos(prev => prev.filter(c => c.id !== id))
  }

  function updateCampo<K extends keyof CampoPersonalizado>(id: string, key: K, value: CampoPersonalizado[K]) {
    setCampos(prev => prev.map(c => c.id === id ? { ...c, [key]: value } : c))
  }

  function handleSalvar() {
    setSalvando(true)
    setSalvo(false)
    salvarMut.mutate({ campos })
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <Link
        href="/configuracoes"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Configurações
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Campos Personalizados do RDO</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Adicione campos extras ao RDO da sua empresa. Eles aparecerão em todos os RDOs criados daqui para frente.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSalvar}
          disabled={salvando}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {salvo ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* Lista de campos */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {campos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 bg-white border border-dashed border-border rounded-xl text-center">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Nenhum campo personalizado</p>
              <p className="text-xs text-[var(--text-muted)]">Clique em "+ Adicionar campo" para criar o primeiro.</p>
            </div>
          )}

          {campos.map((campo, idx) => (
            <div key={campo.id} className="bg-white border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-slate-300 flex-shrink-0 cursor-grab" />
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Campo {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeCampo(campo.id)}
                  className="ml-auto p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Nome */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Nome do campo *</label>
                  <input
                    type="text"
                    value={campo.nome}
                    onChange={e => updateCampo(campo.id, "nome", e.target.value)}
                    placeholder="Ex: Trecho executado, Número da medição..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-orange-400 transition-colors"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Tipo</label>
                  <select
                    value={campo.tipo}
                    onChange={e => updateCampo(campo.id, "tipo", e.target.value as CampoPersonalizado["tipo"])}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-orange-400 transition-colors bg-white"
                  >
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {/* Seção */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Seção no RDO</label>
                  <select
                    value={campo.secao}
                    onChange={e => updateCampo(campo.id, "secao", e.target.value as CampoPersonalizado["secao"])}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-orange-400 transition-colors bg-white"
                  >
                    {SECOES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                {/* Opções (apenas SELECT) */}
                {campo.tipo === "SELECT" && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Opções (uma por linha)</label>
                    <textarea
                      value={(campo.opcoes ?? []).join("\n")}
                      onChange={e => updateCampo(campo.id, "opcoes", e.target.value.split("\n").map(s => s.trim()).filter(Boolean))}
                      rows={3}
                      placeholder={"Opção 1\nOpção 2\nOpção 3"}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Obrigatório */}
              <button
                type="button"
                onClick={() => updateCampo(campo.id, "obrigatorio", !campo.obrigatorio)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  campo.obrigatorio
                    ? "bg-orange-50 text-orange-600 border border-orange-200"
                    : "bg-slate-50 text-[var(--text-muted)] border border-border hover:bg-slate-100"
                )}
              >
                <ToggleLeft size={14} />
                {campo.obrigatorio ? "Obrigatório" : "Opcional"}
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addCampo}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border hover:border-orange-300 hover:text-orange-500 text-[var(--text-muted)] rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus size={16} /> Adicionar campo
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">Como funciona</p>
        <ul className="space-y-0.5 text-xs text-blue-600 list-disc list-inside">
          <li>Campos criados aqui aparecem no formulário de criação/edição do RDO</li>
          <li>Os valores preenchidos aparecem no PDF do RDO e na tela de detalhes</li>
          <li>Campos obrigatórios bloqueiam o envio do RDO se não preenchidos</li>
          <li>Alterar campos não afeta RDOs já criados</li>
        </ul>
      </div>
    </div>
  )
}
