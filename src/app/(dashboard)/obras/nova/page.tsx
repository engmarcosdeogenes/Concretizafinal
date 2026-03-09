"use client"

import Link from "next/link"
import { ArrowLeft, HardHat, Camera, X, Loader2 } from "lucide-react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]

const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

export default function NovaObraPage() {
  const router = useRouter()
  const [erro, setErro] = useState("")
  const [imagemUrl, setImagemUrl] = useState<string | null>(null)
  const [uploadando, setUploadando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const criar = trpc.obra.criar.useMutation({
    onSuccess: (obra) => router.push(`/obras/${obra.id}`),
    onError: (e) => setErro(e.message || "Erro ao criar obra."),
  })

  async function handleFoto(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith("image/")) { setErro("Apenas imagens são aceitas"); return }
    setUploadando(true)
    try {
      const ext = file.name.split(".").pop() ?? "jpg"
      const path = `obras/capas/${Date.now()}.${ext}`
      const fd = new FormData()
      fd.append("file", file)
      fd.append("path", path)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) { setErro(json.error ?? "Erro no upload"); return }
      setImagemUrl(json.url)
    } catch {
      setErro("Erro inesperado no upload")
    } finally {
      setUploadando(false)
    }
  }

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
      imagemUrl:  imagemUrl ?? undefined,
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/obras"
          aria-label="Voltar para obras"
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl">Nova Obra</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Preencha os dados da obra</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">

        {erro && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center justify-between">
            {erro}
            <button type="button" onClick={() => setErro("")}><X size={14} /></button>
          </div>
        )}

        {/* Foto de capa */}
        <div>
          <label className={labelCls}>Foto de Capa</label>
          <div
            onClick={() => !uploadando && inputRef.current?.click()}
            className="relative w-full h-40 rounded-xl border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-orange-300 transition-colors group"
          >
            {imagemUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagemUrl} alt="Capa" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/90 rounded-xl px-3 py-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Camera size={14} />
                    Trocar foto
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setImagemUrl(null) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X size={13} className="text-white" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                {uploadando
                  ? <Loader2 size={24} className="text-orange-500 animate-spin" />
                  : <Camera size={24} className="text-[var(--text-muted)] group-hover:text-orange-500 transition-colors" />
                }
                <p className="text-sm font-medium text-[var(--text-muted)] group-hover:text-orange-600 transition-colors">
                  {uploadando ? "Enviando..." : "Adicionar foto de capa"}
                </p>
                <p className="text-xs text-[var(--text-muted)]">JPG, PNG, WebP · máx. 20MB</p>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFoto(e.target.files)}
          />
        </div>

        {/* Nome */}
        <div>
          <label htmlFor="nome" className={labelCls}>
            Nome da Obra <span className="text-red-500">*</span>
          </label>
          <input id="nome" name="nome" type="text" required
            placeholder="Ex: Edifício Residencial Araucária"
            className={inputCls}
          />
        </div>

        {/* Endereço */}
        <div>
          <label htmlFor="endereco" className={labelCls}>Endereço</label>
          <input id="endereco" name="endereco" type="text"
            placeholder="Rua, número, bairro"
            className={inputCls}
          />
        </div>

        {/* Cidade / Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cidade" className={labelCls}>Cidade</label>
            <input id="cidade" name="cidade" type="text" placeholder="Ex: Goiânia" className={inputCls} />
          </div>
          <div>
            <label htmlFor="estado" className={labelCls}>Estado</label>
            <select id="estado" name="estado" className={inputCls}>
              <option value="">Selecione</option>
              {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dataInicio" className={labelCls}>Data de Início</label>
            <input id="dataInicio" name="dataInicio" type="date" className={inputCls} />
          </div>
          <div>
            <label htmlFor="dataFim" className={labelCls}>Término Previsto</label>
            <input id="dataFim" name="dataFim" type="date" className={inputCls} />
          </div>
        </div>

        {/* Orçamento */}
        <div>
          <label htmlFor="orcamento" className={labelCls}>Orçamento Total (R$)</label>
          <input id="orcamento" name="orcamento" type="number" min="0" step="0.01"
            placeholder="0,00" className={inputCls}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={criar.isPending || uploadando}
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
