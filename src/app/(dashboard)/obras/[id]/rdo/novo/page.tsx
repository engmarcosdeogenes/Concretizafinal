"use client"

import Link from "next/link"
import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, ClipboardList, CloudSun, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

const CLIMAS = [
  { value: "sol",     label: "☀️ Sol" },
  { value: "nublado", label: "☁️ Nublado" },
  { value: "chuva",   label: "🌧️ Chuva" },
  { value: "vento",   label: "💨 Vento" },
]

type Atividade   = { descricao: string; quantidade: string; unidade: string }
type MembroEquipe = { funcao: string; quantidade: string }

export default function NovoRdoPage() {
  const params = useParams()
  const obraId = params.id as string
  const router = useRouter()

  const hoje = new Date().toISOString().split("T")[0]

  const [data, setData]                 = useState(hoje)
  const [clima, setClima]               = useState("")
  const [tempMin, setTempMin]           = useState("")
  const [tempMax, setTempMax]           = useState("")
  const [ocorreuChuva, setOcorreuChuva] = useState(false)
  const [observacoes, setObservacoes]   = useState("")
  const [atividades, setAtividades]     = useState<Atividade[]>([{ descricao: "", quantidade: "", unidade: "" }])
  const [equipe, setEquipe]             = useState<MembroEquipe[]>([{ funcao: "", quantidade: "1" }])
  const [erro, setErro]                 = useState("")
  const [buscandoClima, setBuscandoClima] = useState(false)
  const [climaMsg, setClimaMsg]         = useState("")

  // Busca a obra para ter cidade/estado
  const { data: obra } = trpc.obra.buscarPorId?.useQuery?.({ id: obraId }, { enabled: false }) ?? {}
  const { data: obras = [] } = trpc.obra.listar.useQuery()
  const obraAtual = obras.find(o => o.id === obraId)

  const criar = trpc.rdo.criar.useMutation({
    onSuccess: (rdo) => { router.push(`/obras/${obraId}/rdo/${rdo.id}`) },
    onError:   (e)   => { setErro(e.message || "Erro ao criar RDO.") },
  })

  // Clima automático via Open-Meteo
  const buscarClima = useCallback(async () => {
    const cidade = obraAtual?.cidade
    const estado = obraAtual?.estado
    if (!cidade) {
      setClimaMsg("Cadastre a cidade da obra para buscar o clima.")
      return
    }
    setBuscandoClima(true)
    setClimaMsg("")
    try {
      const params = new URLSearchParams({ cidade, ...(estado ? { estado } : {}) })
      const res = await fetch(`/api/clima?${params.toString()}`)
      if (!res.ok) throw new Error("Cidade não encontrada")
      const d = await res.json()
      setClima(d.clima)
      setTempMin(String(d.tempMin))
      setTempMax(String(d.tempMax))
      if (d.chuva) setOcorreuChuva(true)
      setClimaMsg(`Clima carregado para ${cidade}`)
    } catch {
      setClimaMsg("Não foi possível buscar o clima. Preencha manualmente.")
    } finally {
      setBuscandoClima(false)
    }
  }, [obraAtual])

  function addAtividade()   { setAtividades(prev => [...prev, { descricao: "", quantidade: "", unidade: "" }]) }
  function removeAtividade(i: number) { setAtividades(prev => prev.filter((_, idx) => idx !== i)) }
  function updateAtividade(i: number, field: keyof Atividade, value: string) {
    setAtividades(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }

  function addEquipe()   { setEquipe(prev => [...prev, { funcao: "", quantidade: "1" }]) }
  function removeEquipe(i: number) { setEquipe(prev => prev.filter((_, idx) => idx !== i)) }
  function updateEquipe(i: number, field: keyof MembroEquipe, value: string) {
    setEquipe(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    const atividadesFiltradas = atividades
      .filter(a => a.descricao.trim())
      .map(a => ({
        descricao:  a.descricao.trim(),
        quantidade: a.quantidade ? Number(a.quantidade) : undefined,
        unidade:    a.unidade.trim() || undefined,
      }))
    const equipeFiltrada = equipe
      .filter(e => e.funcao.trim())
      .map(e => ({ funcao: e.funcao.trim(), quantidade: Number(e.quantidade) || 1 }))

    criar.mutate({
      obraId,
      data,
      clima:         clima || undefined,
      temperaturaMin: tempMin ? Number(tempMin) : undefined,
      temperaturaMax: tempMax ? Number(tempMax) : undefined,
      ocorreuChuva,
      observacoes:   observacoes.trim() || undefined,
      atividades:    atividadesFiltradas,
      equipe:        equipeFiltrada,
    })
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/obras/${obraId}/rdo`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors">
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <ClipboardList size={20} className="text-orange-500" />
            Novo RDO
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Relatório Diário de Obra</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {erro && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>
        )}

        {/* 1. Data */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Informações gerais</h3>
          <div>
            <label className={labelCls}>Data <span className="text-red-500">*</span></label>
            <input type="date" required value={data} onChange={e => setData(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* 2. Clima */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Condições climáticas</h3>
            <button
              type="button"
              onClick={buscarClima}
              disabled={buscandoClima}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {buscandoClima
                ? <Loader2 size={12} className="animate-spin" />
                : <CloudSun size={12} />}
              {buscandoClima ? "Buscando..." : "Clima automático"}
            </button>
          </div>

          {climaMsg && (
            <p className={`text-xs px-3 py-2 rounded-lg ${climaMsg.includes("não") || climaMsg.includes("Cadastre") ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
              {climaMsg}
            </p>
          )}

          <div>
            <label className={labelCls}>Clima</label>
            <div className="flex gap-2 flex-wrap">
              {CLIMAS.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setClima(prev => prev === c.value ? "" : c.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                    clima === c.value
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-[var(--text-primary)] border-border hover:bg-muted"
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Temp. Mínima (°C)</label>
              <input type="number" value={tempMin} onChange={e => setTempMin(e.target.value)} placeholder="Ex: 18" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Temp. Máxima (°C)</label>
              <input type="number" value={tempMax} onChange={e => setTempMax(e.target.value)} placeholder="Ex: 32" className={inputCls} />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={ocorreuChuva} onChange={e => setOcorreuChuva(e.target.checked)} className="w-4 h-4 accent-orange-500" />
            <span className="text-sm text-[var(--text-primary)]">Ocorreu chuva durante o dia</span>
          </label>
        </div>

        {/* 3. Atividades */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Atividades realizadas</h3>
          <div className="space-y-3">
            {atividades.map((a, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_90px_36px] gap-2 items-start">
                <input type="text" value={a.descricao} onChange={e => updateAtividade(i, "descricao", e.target.value)}
                  placeholder="Descrição da atividade" className={inputCls} />
                <input type="number" value={a.quantidade} onChange={e => updateAtividade(i, "quantidade", e.target.value)}
                  placeholder="Qtd" className={inputCls} />
                <input type="text" value={a.unidade} onChange={e => updateAtividade(i, "unidade", e.target.value)}
                  placeholder="Un (m², m³…)" className={inputCls} />
                <button type="button" onClick={() => removeAtividade(i)} disabled={atividades.length === 1}
                  className="h-[42px] w-[36px] flex items-center justify-center rounded-xl border border-border text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addAtividade}
            className="flex items-center gap-2 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors cursor-pointer">
            <Plus size={14} /> Adicionar atividade
          </button>
        </div>

        {/* 4. Equipe */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Equipe</h3>
          <div className="space-y-3">
            {equipe.map((e, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_36px] gap-2 items-start">
                <input type="text" value={e.funcao} onChange={ev => updateEquipe(i, "funcao", ev.target.value)}
                  placeholder="Função (ex: Pedreiro)" className={inputCls} />
                <input type="number" min="1" value={e.quantidade} onChange={ev => updateEquipe(i, "quantidade", ev.target.value)}
                  placeholder="Qtd" className={inputCls} />
                <button type="button" onClick={() => removeEquipe(i)} disabled={equipe.length === 1}
                  className="h-[42px] w-[36px] flex items-center justify-center rounded-xl border border-border text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addEquipe}
            className="flex items-center gap-2 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors cursor-pointer">
            <Plus size={14} /> Adicionar função
          </button>
        </div>

        {/* 5. Observações */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Observações</h3>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
            placeholder="Registre ocorrências, pendências ou observações gerais do dia..." rows={4}
            className={`${inputCls} resize-none`} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-6">
          <button type="submit" disabled={criar.isPending}
            className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
            <ClipboardList size={15} />
            {criar.isPending ? "Salvando..." : "Salvar RDO"}
          </button>
          <Link href={`/obras/${obraId}/rdo`} className="btn-ghost min-h-[44px] flex-1 justify-center cursor-pointer">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
