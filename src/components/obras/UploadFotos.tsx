"use client"

import { useRef, useState } from "react"
import { Camera, Trash2, ZoomIn, X, Plus, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

type Props = {
  obraId: string
  rdoId?: string
  fvsId?: string
  fvmId?: string
  ocorrenciaId?: string
}

export function UploadFotos({ obraId, rdoId, fvsId, fvmId, ocorrenciaId }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro]   = useState<string | null>(null)

  const utils = trpc.useUtils()
  const filtro = { rdoId, fvsId, fvmId, ocorrenciaId }

  const { data: midias = [] } = trpc.midia.listar.useQuery(filtro)

  const criarMidia = trpc.midia.criar.useMutation({
    onSuccess: () => utils.midia.listar.invalidate(filtro),
  })
  const excluirMidia = trpc.midia.excluir.useMutation({
    onSuccess: () => utils.midia.listar.invalidate(filtro),
  })

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setErro(null)

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setErro("Apenas imagens são aceitas (JPG, PNG, WebP)")
        continue
      }

      setUploading(true)
      try {
        const ext      = file.name.split(".").pop() ?? "jpg"
        const timestamp = Date.now()
        const subfolder = rdoId ? `rdo/${rdoId}` : fvsId ? `fvs/${fvsId}` : fvmId ? `fvm/${fvmId}` : ocorrenciaId ? `ocorrencia/${ocorrenciaId}` : "geral"
        const path = `obras/${obraId}/${subfolder}/${timestamp}.${ext}`

        const fd = new FormData()
        fd.append("file", file)
        fd.append("path", path)

        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const json = await res.json() as { url?: string; error?: string }

        if (!res.ok || !json.url) {
          setErro(json.error ?? "Erro ao fazer upload")
          continue
        }

        await criarMidia.mutateAsync({ obraId, url: json.url, tipo: "FOTO", rdoId, fvsId, fvmId, ocorrenciaId })
      } catch {
        setErro("Erro inesperado no upload")
      } finally {
        setUploading(false)
      }
    }
  }

  return (
    <div>
      {/* Erro */}
      {erro && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center justify-between">
          {erro}
          <button onClick={() => setErro(null)} className="ml-2 shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* Grid de fotos */}
      {midias.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {midias.map(m => (
            <div key={m.id} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.descricao ?? "Foto"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setPreview(m.url)}
                  className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center transition-colors"
                  title="Ampliar"
                >
                  <ZoomIn size={14} className="text-slate-700" />
                </button>
                <button
                  onClick={() => excluirMidia.mutate({ id: m.id })}
                  disabled={excluirMidia.isPending}
                  className="w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Excluir"
                >
                  <Trash2 size={14} className="text-white" />
                </button>
              </div>
            </div>
          ))}

          {/* Botão adicionar inline */}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted hover:border-orange-300 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {uploading
              ? <Loader2 size={20} className="text-orange-500 animate-spin" />
              : <Plus size={20} className="text-[var(--text-muted)]" />
            }
          </button>
        </div>
      )}

      {/* Zona de upload vazia */}
      {midias.length === 0 && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center justify-center gap-2 hover:border-orange-300 hover:bg-orange-50/30 transition-colors cursor-pointer disabled:opacity-50 group"
        >
          {uploading ? (
            <Loader2 size={24} className="text-orange-500 animate-spin" />
          ) : (
            <Camera size={24} className="text-[var(--text-muted)] group-hover:text-orange-500 transition-colors" />
          )}
          <p className="text-sm font-medium text-[var(--text-muted)] group-hover:text-orange-600 transition-colors">
            {uploading ? "Enviando..." : "Adicionar fotos"}
          </p>
          <p className="text-xs text-[var(--text-muted)]">JPG, PNG, WebP · máx. 20MB</p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
            onClick={() => setPreview(null)}
          >
            <X size={20} className="text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
