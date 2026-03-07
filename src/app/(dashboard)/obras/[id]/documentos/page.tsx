"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { FileText, Plus, X, Trash2, Eye, Download, Search, Filter, File as FileIcon, Archive, Image as ImageIcon } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { cn } from "@/lib/utils"

type Categoria = "ART" | "PROJETO" | "CONTRATO" | "LAUDO" | "CERTIFICADO" | "FOTO" | "OUTRO"

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: "ART", label: "ART" },
  { value: "PROJETO", label: "Projeto" },
  { value: "CONTRATO", label: "Contrato" },
  { value: "LAUDO", label: "Laudo" },
  { value: "CERTIFICADO", label: "Certificado" },
  { value: "FOTO", label: "Foto" },
  { value: "OUTRO", label: "Outro" },
]

type FormState = { nome: string; categoria: Categoria; url: string }
const EMPTY_FORM: FormState = { nome: "", categoria: "OUTRO", url: "" }

const inputCls = "w-full px-3.5 h-[40px] border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-[13px] font-medium text-[var(--text-primary)] mb-1.5"

const getFileIconConfig = (url: string, categ: string) => {
  const l = (url + " " + categ).toLowerCase()
  if (l.includes("pdf")) return { Icon: FileIcon, cls: "text-red-500 bg-red-50 border border-red-100", label: "PDF" }
  if (l.includes("xls") || l.includes("sheet") || l.includes("excel")) return { Icon: FileIcon, cls: "text-green-500 bg-green-50 border border-green-100", label: "Excel" }
  if (l.includes("doc") || l.includes("word")) return { Icon: FileIcon, cls: "text-blue-500 bg-blue-50 border border-blue-100", label: "Word" }
  if (l.includes("png") || l.includes("jpg") || l.includes("jpeg") || l.includes("foto")) return { Icon: ImageIcon, cls: "text-purple-500 bg-purple-50 border border-purple-100", label: "Imagem" }
  if (l.includes("zip") || l.includes("rar")) return { Icon: Archive, cls: "text-amber-500 bg-amber-50 border border-amber-100", label: "Arquivo" }
  return { Icon: FileText, cls: "text-slate-500 bg-slate-50 border border-slate-200", label: "Link" }
}

export default function DocumentosObraPage() {
  const params = useParams()
  const obraId = params.id as string

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [erro, setErro] = useState("")
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [filtroCateg, setFiltro] = useState<string>("TODOS")
  const [busca, setBusca] = useState("")

  const utils = trpc.useUtils()
  const { data: docs = [], isLoading } = trpc.documento.listar.useQuery({ obraId })

  const criar = trpc.documento.criar.useMutation({
    onSuccess: () => { utils.documento.listar.invalidate({ obraId }); fecharModal() },
    onError: (e) => setErro(e.message),
  })
  const excluir = trpc.documento.excluir.useMutation({
    onSuccess: () => { utils.documento.listar.invalidate({ obraId }); setConfirmDel(null) },
  })

  function fecharModal() {
    setShowModal(false); setForm(EMPTY_FORM); setErro("")
  }

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErro("")
    criar.mutate({ obraId, nome: form.nome, categoria: form.categoria, url: form.url })
  }

  const filtered = docs.filter(d => {
    const matchCat = filtroCateg === "TODOS" || d.categoria === filtroCateg
    const matchBusca = d.nome.toLowerCase().includes(busca.toLowerCase())
    return matchCat && matchBusca
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Documentos</h1>
            <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
              Gerencie todos os documentos e arquivos da obra
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white border border-[var(--border)] p-2 rounded-[var(--radius-lg)] shadow-sm">
        <label className="flex items-center gap-2 px-3 h-[40px] flex-1">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </label>

        <div className="hidden md:block w-px h-6 bg-[var(--border)]" />

        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center w-[40px] h-[40px] rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--muted)] transition-colors">
            <Filter size={16} />
          </button>

          <select
            value={filtroCateg}
            onChange={(e) => setFiltro(e.target.value)}
            className="h-[40px] px-3 bg-transparent border border-[var(--border)] rounded-[var(--radius)] text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="TODOS">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <button onClick={() => setShowModal(true)} className="btn-primary h-[40px] ml-2 px-4 whitespace-nowrap">
            <Plus size={16} />
            Novo Documento
          </button>
        </div>
      </div>

      {/* Grid de Documentos */}
      {isLoading && <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando documentos...</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center bg-white border border-[var(--border)] rounded-[var(--radius-lg)] shadow-sm">
          <FileText size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />
          <p className="text-lg font-bold text-[var(--text-primary)] mb-1">
            Nenhum documento encontrado
          </p>
          <p className="text-[14px] text-[var(--text-muted)] max-w-sm text-center">
            Adicione links de documentos armazenados no Drive, Dropbox ou outro serviço de armazenamento.
          </p>
          {!busca && filtroCateg === "TODOS" && (
            <button onClick={() => setShowModal(true)} className="btn-primary mt-6">
              <Plus size={16} />
              Adicionar Documento
            </button>
          )}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(doc => {
            const catg = CATEGORIAS.find(c => c.value === doc.categoria)
            const iconConfig = getFileIconConfig(doc.url, doc.categoria)
            const IconComp = iconConfig.Icon

            return (
              <div key={doc.id} className="bg-white border border-[var(--border)] rounded-2xl shadow-sm flex flex-col group relative">

                <button
                  onClick={() => setConfirmDel(doc.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white border border-[var(--border)] flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  title="Excluir documento"
                >
                  <Trash2 size={14} />
                </button>

                <div className="p-5 flex gap-4">
                  <div className={cn("w-14 h-16 rounded-xl flex items-center justify-center flex-shrink-0", iconConfig.cls)}>
                    <IconComp size={24} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight mb-1" title={doc.nome}>
                      {doc.nome}
                    </h3>
                    <p className="text-[13px] text-[var(--text-secondary)] mb-2">
                      {catg?.label || "Outro"}
                    </p>
                    <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                      <span>{iconConfig.label}</span>
                      <span>•</span>
                      <span>Externa</span>
                      <span>•</span>
                      <span>{formatDataCurta(doc.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto border-t border-[var(--border)] flex">
                  <a href={doc.url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-50 transition-colors border-r border-[var(--border)] rounded-bl-2xl">
                    <Eye size={16} />
                    Ver
                  </a>
                  <a href={doc.url} download target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-50 transition-colors rounded-br-2xl">
                    <Download size={16} />
                    Baixar
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal adicionar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText size={16} className="text-[var(--blue)]" />
                </div>
                <h2 className="font-bold text-[var(--text-primary)]">Adicionar Documento</h2>
              </div>
              <button onClick={fecharModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {erro && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-[var(--radius)] text-red-600 text-[13px] font-medium">{erro}</div>}

              <div>
                <label className={labelCls}>Nome do documento <span className="text-red-500">*</span></label>
                <input required type="text" value={form.nome} onChange={e => set("nome", e.target.value)}
                  placeholder="Ex: Contrato de Empreiteira" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Categoria</label>
                <select value={form.categoria} onChange={(e) => set("categoria", e.target.value as Categoria)} className={inputCls}>
                  {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Link do arquivo <span className="text-red-500">*</span></label>
                <input required type="url" value={form.url} onChange={e => set("url", e.target.value)}
                  placeholder="https://drive.google.com/..." className={inputCls} />
                <p className="text-[12px] text-[var(--text-muted)] mt-1.5 leading-snug">
                  Nesta versão, adicione links de arquivos armazenados na nuvem (Google Drive, OneDrive, etc).
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={fecharModal}
                  className="btn-ghost h-[40px] flex-1 text-sm font-semibold">
                  Cancelar
                </button>
                <button type="submit" disabled={criar.isPending}
                  className="btn-primary h-[40px] flex-1 text-sm font-semibold disabled:opacity-60 cursor-pointer shadow-sm">
                  {criar.isPending ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[var(--text-primary)]">Remover documento?</h3>
            <p className="text-[14px] text-[var(--text-secondary)] leading-snug">O arquivo original no serviço em nuvem não será excluído, apenas o registro nesta plataforma.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmDel(null)}
                className="btn-ghost h-[40px] flex-1 font-semibold text-sm">
                Cancelar
              </button>
              <button onClick={() => excluir.mutate({ id: confirmDel })} disabled={excluir.isPending}
                className="flex-1 h-[40px] bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-[var(--radius)] flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                {excluir.isPending ? "Removendo..." : "Sim, Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
