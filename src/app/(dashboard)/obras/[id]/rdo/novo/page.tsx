"use client"

import Link from "next/link"
import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, ClipboardList, CloudSun, Loader2, Copy, Users, BookmarkPlus } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

const CLIMAS = [
  { value: "sol",     label: "☀️ Sol" },
  { value: "nublado", label: "☁️ Nublado" },
  { value: "chuva",   label: "🌧️ Chuva" },
  { value: "vento",   label: "💨 Vento" },
]

const STATUS_PRESENCA_OPTIONS = [
  { value: "PRESENTE",          label: "Presente" },
  { value: "AFASTADO",          label: "Afastado" },
  { value: "ATESTADO",          label: "Atestado" },
  { value: "DESLOCANDO",        label: "Deslocando" },
  { value: "FALTA_JUSTIFICADA", label: "Falta Just." },
  { value: "FERIAS",            label: "Férias" },
  { value: "FOLGA",             label: "Folga" },
  { value: "LICENCA",           label: "Licença" },
  { value: "TREINAMENTO",       label: "Treinamento" },
  { value: "VIAGEM",            label: "Viagem" },
]

type StatusPresenca = "PRESENTE" | "AFASTADO" | "ATESTADO" | "DESLOCANDO" | "FALTA_JUSTIFICADA" | "FERIAS" | "FOLGA" | "LICENCA" | "TREINAMENTO" | "VIAGEM"
type Atividade    = { descricao: string; quantidade: string; unidade: string }
type MembroEquipe = { funcao: string; quantidade: string; statusPresenca: StatusPresenca }

export default function NovoRdoPage() {
  const params  = useParams()
  const obraId  = params.id as string
  const router  = useRouter()
  const utils   = trpc.useUtils()

  const hoje = new Date().toISOString().split("T")[0]

  const [data, setData]                       = useState(hoje)
  const [clima, setClima]                     = useState("")
  const [tempMin, setTempMin]                 = useState("")
  const [tempMax, setTempMax]                 = useState("")
  const [ocorreuChuva, setOcorreuChuva]       = useState(false)
  const [observacoes, setObservacoes]         = useState("")
  const [atividades, setAtividades]           = useState<Atividade[]>([{ descricao: "", quantidade: "", unidade: "" }])
  const [equipe, setEquipe]                   = useState<MembroEquipe[]>([{ funcao: "", quantidade: "1", statusPresenca: "PRESENTE" }])
  const [erro, setErro]                       = useState("")
  const [buscandoClima, setBuscandoClima]     = useState(false)
  const [climaMsg, setClimaMsg]               = useState("")
  const [copiarDeId, setCopiarDeId]           = useState("")
  const [carregandoCopia, setCarregandoCopia] = useState(false)
  const [predefSalvo, setPredefSalvo]         = useState(false)

  const [valoresCampos, setValoresCampos] = useState<Record<string, unknown>>({})

  const { data: obra }                    = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const { data: rdosAnteriores = [] }     = trpc.rdo.listar.useQuery({ obraId })
  const { data: camposPersonalizados = [] } = trpc.configuracoes.buscarCamposPersonalizados.useQuery()

  const criar = trpc.rdo.criar.useMutation({
    onSuccess: (rdo) => router.push(`/obras/${obraId}/rdo/${rdo.id}`),
    onError:   (e)   => setErro(e.message || "Erro ao criar RDO."),
  })

  const salvarEquipePredef = trpc.obra.salvarEquipePredef.useMutation({
    onSuccess: () => { setPredefSalvo(true); setTimeout(() => setPredefSalvo(false), 2500) },
  })

  async function handleCopiarRdo(rdoIdSelecionado: string) {
    setCopiarDeId(rdoIdSelecionado)
    if (!rdoIdSelecionado) return
    setCarregandoCopia(true)
    try {
      const rdoCopia = await utils.rdo.buscarPorId.fetch({ id: rdoIdSelecionado })
      setClima(rdoCopia.clima ?? "")
      setTempMin(rdoCopia.temperaturaMin != null ? String(rdoCopia.temperaturaMin) : "")
      setTempMax(rdoCopia.temperaturaMax != null ? String(rdoCopia.temperaturaMax) : "")
      setAtividades(
        rdoCopia.atividades.length > 0
          ? rdoCopia.atividades.map(a => ({ descricao: a.descricao, quantidade: a.quantidade ? String(a.quantidade) : "", unidade: a.unidade ?? "" }))
          : [{ descricao: "", quantidade: "", unidade: "" }]
      )
      setEquipe(
        rdoCopia.equipe.length > 0
          ? rdoCopia.equipe.map(e => ({ funcao: e.funcao, quantidade: String(e.quantidade), statusPresenca: (e.statusPresenca as StatusPresenca) ?? "PRESENTE" }))
          : [{ funcao: "", quantidade: "1", statusPresenca: "PRESENTE" }]
      )
    } catch {
      setErro("Erro ao carregar RDO para cópia.")
    } finally {
      setCarregandoCopia(false)
    }
  }

  function carregarEquipePredef() {
    const predef = obra?.equipePredef as Array<{ funcao: string; quantidade: number }> | null | undefined
    if (!predef || predef.length === 0) return
    setEquipe(predef.map(e => ({ funcao: e.funcao, quantidade: String(e.quantidade), statusPresenca: "PRESENTE" })))
  }

  function salvarComoPredef() {
    const equipeFiltrada = equipe.filter(e => e.funcao.trim())
    if (equipeFiltrada.length === 0) return
    salvarEquipePredef.mutate({
      id: obraId,
      equipePredef: equipeFiltrada.map(e => ({ funcao: e.funcao.trim(), quantidade: Number(e.quantidade) || 1 })),
    })
  }

  const buscarClima = useCallback(async () => {
    const cidade = obra?.cidade
    const estado = obra?.estado
    if (!cidade) { setClimaMsg("Cadastre a cidade da obra para buscar o clima."); return }
    setBuscandoClima(true)
    setClimaMsg("")
    try {
      const qs = new URLSearchParams({ cidade, ...(estado ? { estado } : {}) })
      const res = await fetch(`/api/clima?${qs.toString()}`)
      if (!res.ok) throw new Error()
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
  }, [obra])

  function addAtividade()  { setAtividades(prev => [...prev, { descricao: "", quantidade: "", unidade: "" }]) }
  function removeAtividade(i: number) { setAtividades(prev => prev.filter((_, idx) => idx !== i)) }
  function updateAtividade(i: number, field: keyof Atividade, value: string) {
    setAtividades(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }

  function addEquipe()  { setEquipe(prev => [...prev, { funcao: "", quantidade: "1", statusPresenca: "PRESENTE" }]) }
  function removeEquipe(i: number) { setEquipe(prev => prev.filter((_, idx) => idx !== i)) }
  function updateEquipe(i: number, field: keyof MembroEquipe, value: string) {
    setEquipe(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    const atividadesFiltradas = atividades
      .filter(a => a.descricao.trim())
      .map(a => ({ descricao: a.descricao.trim(), quantidade: a.quantidade ? Number(a.quantidade) : undefined, unidade: a.unidade.trim() || undefined }))
    const equipeFiltrada = equipe
      .filter(e => e.funcao.trim())
      .map(e => ({ funcao: e.funcao.trim(), quantidade: Number(e.quantidade) || 1, statusPresenca: e.statusPresenca }))

    criar.mutate({ obraId, data, clima: clima || undefined, temperaturaMin: tempMin ? Number(tempMin) : undefined, temperaturaMax: tempMax ? Number(tempMax) : undefined, ocorreuChuva, observacoes: observacoes.trim() || undefined, valoresCamposPersonalizados: Object.keys(valoresCampos).length > 0 ? valoresCampos : undefined, atividades: atividadesFiltradas, equipe: equipeFiltrada })
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"
  const equipePredef = obra?.equipePredef as Array<{ funcao: string; quantidade: number }> | null | undefined

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

        {/* 1. Data + Copiar de RDO anterior */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Informações gerais</h3>
          <div>
            <label className={labelCls}>Data <span className="text-red-500">*</span></label>
            <input type="date" required value={data} onChange={e => setData(e.target.value)} className={inputCls} />
          </div>

          {rdosAnteriores.length > 0 && (
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5">
                  <Copy size={13} className="text-orange-500" />
                  Copiar de RDO anterior
                </span>
              </label>
              <select
                value={copiarDeId}
                onChange={e => handleCopiarRdo(e.target.value)}
                className={inputCls}
                disabled={carregandoCopia}
              >
                <option value="">Não copiar</option>
                {rdosAnteriores.map(r => (
                  <option key={r.id} value={r.id}>
                    {formatDataCurta(r.data)}{r.atividades[0]?.descricao ? ` — ${r.atividades[0].descricao.slice(0, 40)}` : ""}
                  </option>
                ))}
              </select>
              {carregandoCopia && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" /> Carregando dados...
                </p>
              )}
            </div>
          )}
        </div>

        {/* 2. Clima */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Condições climáticas</h3>
            <button type="button" onClick={buscarClima} disabled={buscandoClima}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors cursor-pointer">
              {buscandoClima ? <Loader2 size={12} className="animate-spin" /> : <CloudSun size={12} />}
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
                    clima === c.value ? "bg-orange-500 text-white border-orange-500" : "bg-white text-[var(--text-primary)] border-border hover:bg-muted"
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Equipe</h3>
            {equipePredef && equipePredef.length > 0 && (
              <button type="button" onClick={carregarEquipePredef}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
                <Users size={12} /> Carregar equipe padrão
              </button>
            )}
          </div>
          <div className="space-y-3">
            {equipe.map((e, i) => (
              <div key={i} className="grid grid-cols-[1fr_72px_140px_36px] gap-2 items-start">
                <input type="text" value={e.funcao} onChange={ev => updateEquipe(i, "funcao", ev.target.value)}
                  placeholder="Função (ex: Pedreiro)" className={inputCls} />
                <input type="number" min="1" value={e.quantidade} onChange={ev => updateEquipe(i, "quantidade", ev.target.value)}
                  placeholder="Qtd" className={inputCls} />
                <select value={e.statusPresenca} onChange={ev => updateEquipe(i, "statusPresenca", ev.target.value)}
                  className={`${inputCls} ${e.statusPresenca !== "PRESENTE" ? "border-amber-300 bg-amber-50 text-amber-800" : ""}`}>
                  {STATUS_PRESENCA_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button type="button" onClick={() => removeEquipe(i)} disabled={equipe.length === 1}
                  className="h-[42px] w-[36px] flex items-center justify-center rounded-xl border border-border text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={addEquipe}
              className="flex items-center gap-2 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors cursor-pointer">
              <Plus size={14} /> Adicionar função
            </button>
            <button type="button" onClick={salvarComoPredef} disabled={salvarEquipePredef.isPending}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50">
              <BookmarkPlus size={13} />
              {salvarEquipePredef.isPending ? "Salvando..." : predefSalvo ? "Equipe salva!" : "Salvar como padrão"}
            </button>
          </div>
        </div>

        {/* 5. Campos Personalizados */}
        {camposPersonalizados.length > 0 && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Campos Personalizados</h3>
            <div className="space-y-3">
              {camposPersonalizados.map(campo => (
                <div key={campo.id}>
                  <label className={labelCls}>
                    {campo.nome}
                    {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                    <span className="text-[10px] text-[var(--text-muted)] font-normal ml-2">({campo.secao.toLowerCase()})</span>
                  </label>
                  {campo.tipo === "TEXT" && (
                    <input type="text" value={String(valoresCampos[campo.id] ?? "")}
                      onChange={e => setValoresCampos(prev => ({ ...prev, [campo.id]: e.target.value }))}
                      className={inputCls} />
                  )}
                  {campo.tipo === "NUMBER" && (
                    <input type="number" value={String(valoresCampos[campo.id] ?? "")}
                      onChange={e => setValoresCampos(prev => ({ ...prev, [campo.id]: e.target.value ? Number(e.target.value) : "" }))}
                      className={inputCls} />
                  )}
                  {campo.tipo === "BOOLEAN" && (
                    <select value={String(valoresCampos[campo.id] ?? "")}
                      onChange={e => setValoresCampos(prev => ({ ...prev, [campo.id]: e.target.value === "true" }))}
                      className={inputCls}>
                      <option value="">Selecione...</option>
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </select>
                  )}
                  {campo.tipo === "SELECT" && (
                    <select value={String(valoresCampos[campo.id] ?? "")}
                      onChange={e => setValoresCampos(prev => ({ ...prev, [campo.id]: e.target.value }))}
                      className={inputCls}>
                      <option value="">Selecione...</option>
                      {(campo.opcoes ?? []).map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Observações */}
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
