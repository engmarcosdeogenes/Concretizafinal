"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useRef, useState } from "react"
import dynamic from "next/dynamic"
import {
  Map, Plus, X, Trash2, AlertTriangle, ArrowRight,
  MapPin, Crosshair, Upload, ExternalLink, Layers,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { cn } from "@/lib/utils"

// Importação dinâmica para evitar SSR do canvas Fabric.js
const MapaCanvas = dynamic(
  () => import("@/components/obras/MapaCanvas").then(m => ({ default: m.MapaCanvas })),
  {
    ssr: false, loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0f172a] rounded-xl">
        <p className="text-slate-400 text-sm">Carregando mapa...</p>
      </div>
    )
  }
)

const TIPO_CLS: Record<string, string> = {
  SEGURANCA: "bg-red-50 text-red-700 border-red-200",
  QUALIDADE: "bg-purple-50 text-purple-700 border-purple-200",
  PRAZO:     "bg-amber-50 text-amber-700 border-amber-200",
  CUSTO:     "bg-blue-50 text-blue-700 border-blue-200",
  AMBIENTAL: "bg-green-50 text-green-700 border-green-200",
  OUTRO:     "bg-slate-50 text-slate-600 border-slate-200",
}
const TIPO_LABEL: Record<string, string> = {
  SEGURANCA: "Segurança", QUALIDADE: "Qualidade", PRAZO: "Prazo",
  CUSTO: "Custo", AMBIENTAL: "Ambiental", OUTRO: "Outro",
}
const PRIO_LABEL: Record<number, string> = { 1: "Baixa", 2: "Média", 3: "Alta" }
const PRIO_CLS: Record<number, string> = {
  1: "text-slate-500", 2: "text-amber-600", 3: "text-red-600 font-semibold",
}
const TIPO_COR_MAPA: Record<string, string> = {
  SEGURANCA: "#ef4444", QUALIDADE: "#8b5cf6", PRAZO: "#f59e0b",
  CUSTO: "#3b82f6",     AMBIENTAL: "#10b981", OUTRO: "#64748b",
}

export default function MapaPage() {
  const params = useParams()
  const obraId = params.id as string

  const [showModal, setShowModal]       = useState(false)
  const [plantaNome, setPlantaNome]     = useState("")
  const [plantaUrl, setPlantaUrl]       = useState("")
  const [erroModal, setErroModal]       = useState("")
  const [plantaSel, setPlantaSel]       = useState<string | null>(null)
  const [modoSelecao, setModoSelecao]   = useState<string | null>(null)
  const [modoInput, setModoInput]       = useState<"url" | "upload">("url")
  const [uploadando, setUploadando]     = useState(false)
  const fileInputRef                    = useRef<HTMLInputElement>(null)

  const utils = trpc.useUtils()
  const { data: plantas    = [], isLoading: loadingPlantas } = trpc.planta.listar.useQuery({ obraId })
  const { data: ocorrencias = [] }                            = trpc.ocorrencia.listar.useQuery({ obraId })

  const criarPlanta = trpc.planta.criar.useMutation({
    onSuccess: (p) => {
      utils.planta.listar.invalidate({ obraId })
      setShowModal(false); setPlantaNome(""); setPlantaUrl(""); setErroModal("")
      setPlantaSel(p.id)
    },
    onError: (e) => setErroModal(e.message),
  })

  const excluirPlanta = trpc.planta.excluir.useMutation({
    onSuccess: () => {
      utils.planta.listar.invalidate({ obraId })
      utils.ocorrencia.listar.invalidate({ obraId })
      setPlantaSel(null)
    },
  })

  const atualizarPosicao = trpc.ocorrencia.atualizarPosicao.useMutation({
    onSuccess: () => {
      utils.ocorrencia.listar.invalidate({ obraId })
      setModoSelecao(null)
    },
  })

  const plantaAtiva   = plantas.find(p => p.id === plantaSel) ?? plantas[0] ?? null
  const ocComPosicao  = ocorrencias.filter(o => o.posX !== null && o.posY !== null && o.plantaId === plantaAtiva?.id)
  const ocSemPosicao  = ocorrencias.filter(o => o.posX === null || o.posY === null)
  const abertas       = ocorrencias.filter(o => o.status === "ABERTA" || o.status === "EM_ANALISE")

  async function handleUploadPlanta(file: File) {
    if (!file.type.startsWith("image/")) {
      setErroModal("Apenas imagens são aceitas (JPG, PNG, WebP)")
      return
    }
    setUploadando(true)
    setErroModal("")
    try {
      const ext = file.name.split(".").pop() ?? "jpg"
      const path = `obras/${obraId}/plantas/${Date.now()}.${ext}`
      const fd = new FormData()
      fd.append("file", file)
      fd.append("path", path)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) { setErroModal(json.error ?? "Erro no upload"); return }
      setPlantaUrl(json.url)
    } catch {
      setErroModal("Erro inesperado no upload")
    } finally {
      setUploadando(false)
    }
  }

  function handleUpdatePosicao(ocId: string, posX: number, posY: number) {
    if (!plantaAtiva) return
    atualizarPosicao.mutate({ id: ocId, posX, posY, plantaId: plantaAtiva.id })
  }

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Mapa Visual</h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Plantas baixas com marcação interativa de ocorrências
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-orange min-h-[44px] flex-shrink-0">
          <Upload size={15} />
          Adicionar Planta
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Ocorrências",  val: ocorrencias.length, color: "text-slate-600" },
          { label: "Abertas",      val: abertas.length,      color: "text-amber-600" },
          { label: "No mapa",      val: ocComPosicao.length, color: "text-blue-600" },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <p className={`text-2xl font-extrabold ${color}`}>{val}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Seletor de plantas */}
      {plantas.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Layers size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">Planta:</span>
          {plantas.map(p => (
            <button key={p.id} onClick={() => setPlantaSel(p.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                (plantaSel === p.id || (!plantaSel && plantas[0]?.id === p.id))
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-[var(--text-muted)] border-border hover:bg-muted"
              )}>
              {p.nome}
            </button>
          ))}
        </div>
      )}

      {/* Canvas + painel lateral */}
      {loadingPlantas ? (
        <div className="bg-[#0f172a] rounded-2xl h-[520px] flex items-center justify-center">
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

          {/* Canvas */}
          <div className="bg-[#0f172a] rounded-2xl overflow-hidden h-[520px] relative">
            <MapaCanvas
              planta={plantaAtiva}
              ocorrencias={ocorrencias}
              modoSelecao={modoSelecao}
              onUpdatePosicao={handleUpdatePosicao}
              onCancelarSelecao={() => setModoSelecao(null)}
            />

            {plantaAtiva && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <a href={plantaAtiva.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors">
                  <ExternalLink size={12} />
                  Abrir original
                </a>
                <button
                  onClick={() => {
                    if (confirm("Remover esta planta? As ocorrências perderão o posicionamento.")) {
                      excluirPlanta.mutate({ id: plantaAtiva.id })
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white text-xs rounded-lg transition-colors">
                  <Trash2 size={12} />
                  Remover planta
                </button>
              </div>
            )}
          </div>

          {/* Lateral */}
          <div className="flex flex-col gap-4">

            {/* Legenda */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Legenda</h4>
              <div className="space-y-1.5">
                {Object.entries(TIPO_COR_MAPA).map(([tipo, cor]) => (
                  <div key={tipo} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                    <span className="text-xs text-[var(--text-secondary)]">{TIPO_LABEL[tipo]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border space-y-1">
                <p className="text-[10px] text-[var(--text-muted)]">Tamanho do pin = prioridade</p>
              </div>
            </div>

            {/* Sem localização */}
            <div className="bg-white rounded-2xl border border-border shadow-sm flex-1 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <MapPin size={13} className="text-orange-500" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Sem localização ({ocSemPosicao.length})
                </span>
              </div>
              <div className="overflow-y-auto max-h-[280px]">
                {ocSemPosicao.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-xs text-[var(--text-muted)]">Todas posicionadas!</p>
                  </div>
                )}
                {ocSemPosicao.map(oc => (
                  <div key={oc.id} className="flex items-start gap-2 px-4 py-3 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{oc.titulo}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-semibold", TIPO_CLS[oc.tipo] ?? TIPO_CLS.OUTRO)}>
                          {TIPO_LABEL[oc.tipo] ?? oc.tipo}
                        </span>
                        <span className={cn("text-[10px]", PRIO_CLS[oc.prioridade] ?? PRIO_CLS[2])}>
                          {PRIO_LABEL[oc.prioridade]}
                        </span>
                      </div>
                    </div>
                    {plantaAtiva && (
                      <button
                        onClick={() => setModoSelecao(modoSelecao === oc.id ? null : oc.id)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors flex-shrink-0",
                          modoSelecao === oc.id
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white border-border text-[var(--text-muted)] hover:border-orange-300 hover:text-orange-600"
                        )}>
                        <Crosshair size={10} />
                        {modoSelecao === oc.id ? "Clique no mapa" : "Localizar"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de todas as ocorrências */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Todas as ocorrências</h2>
          </div>
          <Link href={`/obras/${obraId}/ocorrencias`}
            className="text-xs text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1">
            Ver todas <ArrowRight size={11} />
          </Link>
        </div>

        {ocorrencias.length === 0 && (
          <div className="py-12 text-center">
            <Map size={28} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma ocorrência registrada</p>
            <Link href={`/obras/${obraId}/ocorrencias/nova`}
              className="text-xs text-orange-500 mt-2 inline-block">
              Registrar ocorrência →
            </Link>
          </div>
        )}

        {ocorrencias.map(oc => (
          <Link key={oc.id} href={`/obras/${obraId}/ocorrencias/${oc.id}`}
            className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted transition-colors no-underline">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{oc.titulo}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border", TIPO_CLS[oc.tipo] ?? TIPO_CLS.OUTRO)}>
                  {TIPO_LABEL[oc.tipo] ?? oc.tipo}
                </span>
                <span className={cn("text-[10px]", PRIO_CLS[oc.prioridade] ?? PRIO_CLS[2])}>
                  {PRIO_LABEL[oc.prioridade]}
                </span>
                {oc.posX !== null && oc.posY !== null && (
                  <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                    <MapPin size={9} /> Localizada
                  </span>
                )}
                <span className="text-[11px] text-[var(--text-muted)]">{formatDataCurta(oc.data)}</span>
              </div>
            </div>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 border",
              oc.status === "ABERTA"      ? "bg-amber-50 text-amber-700 border-amber-200" :
              oc.status === "EM_ANALISE"  ? "bg-blue-50 text-blue-700 border-blue-200" :
              oc.status === "RESOLVIDA"   ? "bg-green-50 text-green-700 border-green-200" :
              "bg-slate-50 text-slate-600 border-slate-200"
            )}>
              {oc.status === "ABERTA" ? "Aberta" : oc.status === "EM_ANALISE" ? "Em Análise" :
               oc.status === "RESOLVIDA" ? "Resolvida" : "Fechada"}
            </span>
          </Link>
        ))}
      </div>

      {/* Modal adicionar planta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Map size={18} className="text-orange-500" />
                <h2 className="font-bold text-[var(--text-primary)]">Adicionar Planta</h2>
              </div>
              <button onClick={() => { setShowModal(false); setErroModal("") }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-[var(--text-muted)] hover:bg-muted transition-colors">
                <X size={14} />
              </button>
            </div>

            <form className="p-5 space-y-4" onSubmit={e => {
              e.preventDefault()
              if (!plantaUrl) { setErroModal("Adicione a imagem da planta"); return }
              setErroModal("")
              criarPlanta.mutate({ obraId, nome: plantaNome, url: plantaUrl })
            }}>
              {erroModal && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erroModal}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Nome da planta <span className="text-red-500">*</span>
                </label>
                <input required type="text" value={plantaNome} onChange={e => setPlantaNome(e.target.value)}
                  placeholder="Ex: Planta Baixa — Térreo"
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>

              {/* Abas URL / Upload */}
              <div>
                <div className="flex border border-border rounded-xl overflow-hidden mb-3">
                  {(["url", "upload"] as const).map(modo => (
                    <button key={modo} type="button"
                      onClick={() => { setModoInput(modo); setPlantaUrl(""); setErroModal("") }}
                      className={cn("flex-1 py-2 text-xs font-semibold transition-colors",
                        modoInput === modo
                          ? "bg-orange-500 text-white"
                          : "bg-white text-[var(--text-muted)] hover:bg-muted"
                      )}>
                      {modo === "url" ? "URL externa" : "Upload de arquivo"}
                    </button>
                  ))}
                </div>

                {modoInput === "url" ? (
                  <div>
                    <input type="url" value={plantaUrl} onChange={e => setPlantaUrl(e.target.value)}
                      placeholder="https://... (link direto para JPG/PNG)"
                      className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all" />
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5">Google Drive (compartilhar como imagem), Imgur, etc.</p>
                  </div>
                ) : (
                  <div>
                    {plantaUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={plantaUrl} alt="Preview" className="w-full h-32 object-cover" />
                        <button type="button" onClick={() => setPlantaUrl("")}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center">
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" disabled={uploadando}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center justify-center gap-2 hover:border-orange-300 hover:bg-orange-50/30 transition-colors cursor-pointer disabled:opacity-50">
                        {uploadando
                          ? <><Upload size={20} className="text-orange-500 animate-bounce" /><p className="text-sm text-[var(--text-muted)]">Enviando...</p></>
                          : <><Upload size={20} className="text-[var(--text-muted)]" /><p className="text-sm text-[var(--text-muted)]">Clique para selecionar a planta</p><p className="text-[11px] text-[var(--text-muted)]">JPG, PNG, WebP · máx. 20MB</p></>
                        }
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPlanta(f) }} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={criarPlanta.isPending || uploadando || !plantaUrl}
                  className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60">
                  {criarPlanta.isPending ? "Salvando..." : "Adicionar"}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setErroModal(""); setPlantaUrl(""); setPlantaNome(""); setModoInput("url") }}
                  className="btn-ghost min-h-[44px] flex-1 justify-center">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
