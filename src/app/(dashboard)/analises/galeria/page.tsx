"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Camera, Video, Images, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatDataCurta } from "@/lib/format"

function LightboxModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
      >
        <X size={18} />
      </button>
      <img
        src={url}
        alt=""
        className="max-w-full max-h-[90vh] object-contain rounded-xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}

export default function GaleriaPage() {
  const [obraFiltro, setObraFiltro]  = useState("")
  const [tipoFiltro, setTipoFiltro]  = useState<"" | "FOTO" | "VIDEO">("")
  const [page, setPage]              = useState(1)
  const [lightbox, setLightbox]      = useState<string | null>(null)

  const { data: obras = [] } = trpc.obra.listar.useQuery({ grupo: undefined })

  const { data, isLoading } = trpc.midia.galeria.useQuery({
    obraId:  obraFiltro || undefined,
    tipo:    tipoFiltro || undefined,
    page,
    perPage: 30,
  })

  const midias = data?.midias ?? []
  const total  = data?.total ?? 0
  const pages  = data?.pages ?? 1

  function handleFiltroChange() {
    setPage(1)
  }

  return (
    <>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Back */}
        <Link
          href="/analises"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Análises
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Images size={20} className="text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Galeria</h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {total} {total === 1 ? "arquivo" : "arquivos"} em todas as obras
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {/* Tipo */}
          {(["", "FOTO", "VIDEO"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTipoFiltro(t); handleFiltroChange() }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                tipoFiltro === t
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-border text-[var(--text-muted)] hover:bg-slate-50"
              )}
            >
              {t === "" ? <Images size={12} /> : t === "FOTO" ? <Camera size={12} /> : <Video size={12} />}
              {t === "" ? "Tudo" : t === "FOTO" ? "Fotos" : "Vídeos"}
            </button>
          ))}

          <div className="w-px h-6 bg-border self-center" />

          {/* Obra */}
          <select
            value={obraFiltro}
            onChange={e => { setObraFiltro(e.target.value); handleFiltroChange() }}
            className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-orange-400 cursor-pointer"
          >
            <option value="">Todas as obras</option>
            {obras.map(o => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : midias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Images size={28} className="text-slate-400" />
            </div>
            <p className="text-base font-semibold text-[var(--text-primary)] mb-1">Nenhuma mídia encontrada</p>
            <p className="text-sm text-[var(--text-muted)]">
              Faça upload de fotos nos RDOs, FVS ou ocorrências para aparecerem aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {midias.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => m.tipo === "FOTO" ? setLightbox(m.url) : window.open(m.url, "_blank")}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all"
                title={m.obra.nome}
              >
                {m.tipo === "FOTO" ? (
                  <img
                    src={m.thumbnailUrl ?? m.url}
                    alt={m.descricao ?? "Foto da obra"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <Video size={24} className="text-white" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Obra badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[10px] font-medium truncate">{m.obra.nome}</p>
                  <p className="text-white/70 text-[9px]">{formatDataCurta(m.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Paginação */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-[var(--text-muted)]">
              {page} / {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && <LightboxModal url={lightbox} onClose={() => setLightbox(null)} />}
    </>
  )
}
