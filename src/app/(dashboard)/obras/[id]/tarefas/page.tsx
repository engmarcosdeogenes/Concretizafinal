"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ListTodo, Plus, Pencil, Trash2, ChevronRight, ChevronDown, Download, X, Check, Upload, FileSpreadsheet, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { useRole } from "@/hooks/useRole"

// ── helpers ────────────────────────────────────────────────────────────────
function BarraProgresso({ pct }: { pct: number }) {
  const cor = pct >= 100 ? "bg-green-500" : pct > 0 ? "bg-blue-500" : "bg-slate-200"
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
      <div className={cn("h-full rounded-full transition-all", cor)} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

const STATUS_MAP = {
  NAO_INICIADO: { label: "Não iniciado", cls: "bg-slate-50 text-slate-500 border-slate-200" },
  EM_ANDAMENTO: { label: "Em andamento", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  CONCLUIDO:    { label: "Concluído",    cls: "bg-green-50 text-green-700 border-green-200" },
  SUSPENSO:     { label: "Suspenso",     cls: "bg-amber-50 text-amber-700 border-amber-200" },
}

// ── tipos de importação ────────────────────────────────────────────────────
type TarefaImport = {
  codigo?: string
  codigoPai?: string
  nome: string
  setor?: string
  unidade: string
  quantidadeTotal: number
}

// ── tipos ──────────────────────────────────────────────────────────────────
type TarefaBase = {
  id: string; obraId: string; parentId: string | null
  codigo: string | null; nome: string; setor: string | null
  unidade: string; quantidadeTotal: number; quantidadeExecutada: number
  percentual: number; status: keyof typeof STATUS_MAP; ordem: number
}
type TarefaRaw = TarefaBase & { filhos: TarefaBase[] }

type FormData = {
  codigo: string; nome: string; setor: string; unidade: string
  quantidadeTotal: string; parentId: string; ordem: string
}

const EMPTY_FORM: FormData = { codigo: "", nome: "", setor: "", unidade: "un", quantidadeTotal: "0", parentId: "", ordem: "0" }

// ── parsing Excel ─────────────────────────────────────────────────────────
async function parseExcel(file: File): Promise<TarefaImport[]> {
  const xlsx = await import("xlsx")
  const buf  = await file.arrayBuffer()
  const wb   = xlsx.read(buf)
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws)
  return rows
    .filter(r => r["Nome"] ?? r["Serviço"] ?? r["Name"])
    .map((r, i) => ({
      codigo:          String(r["Código"] ?? r["WBS"] ?? r["Code"] ?? "").trim() || undefined,
      codigoPai:       String(r["Cód. Pai"] ?? r["Código Pai"] ?? r["Parent"] ?? "").trim() || undefined,
      nome:            String(r["Nome"] ?? r["Serviço"] ?? r["Name"] ?? `Tarefa ${i + 1}`).trim(),
      setor:           r["Setor"] != null ? String(r["Setor"]).trim() || undefined : undefined,
      unidade:         String(r["Unidade"] ?? r["Un"] ?? "un").trim() || "un",
      quantidadeTotal: Number(r["Qtd Total"] ?? r["Quantidade"] ?? r["Qty"] ?? 0) || 0,
    }))
}

// ── parsing MS Project XML ─────────────────────────────────────────────────
async function parseXml(file: File): Promise<TarefaImport[]> {
  const text = await file.text()
  const doc  = new DOMParser().parseFromString(text, "text/xml")
  const tasks = Array.from(doc.querySelectorAll("Tasks > Task"))
  const levelStack: string[] = []

  return tasks
    .filter(t => {
      const name = t.querySelector("Name")?.textContent ?? ""
      const isSum = t.querySelector("Summary")?.textContent === "1"
      const isMilestone = t.querySelector("Milestone")?.textContent === "1"
      return name && !isMilestone && name !== "Project Summary Task" && !isSum
    })
    .map(t => {
      const wbs   = (t.querySelector("WBS")?.textContent ?? "").trim()
      const nome  = (t.querySelector("Name")?.textContent ?? "").trim()
      const level = Number(t.querySelector("OutlineLevel")?.textContent ?? 1)
      levelStack[level - 1] = wbs
      const codigoPai = level > 1 ? levelStack[level - 2] : undefined
      return { codigo: wbs || undefined, codigoPai, nome: nome || "Sem nome", unidade: "un", quantidadeTotal: 0 }
    })
    .filter(t => t.nome)
}

// ── template Excel ─────────────────────────────────────────────────────────
async function baixarTemplate() {
  const xlsx = await import("xlsx")
  const ws = xlsx.utils.aoa_to_sheet([
    ["Código", "Cód. Pai", "Nome", "Setor", "Unidade", "Qtd Total"],
    ["1",      "",        "Estrutura", "Bloco A", "m³", 100],
    ["1.1",    "1",       "Pilares",   "Bloco A", "un", 20],
  ])
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, "Tarefas")
  xlsx.writeFile(wb, "template_tarefas_wbs.xlsx")
}

// ── modal de importação ────────────────────────────────────────────────────
function ImportarModal({ obraId, onClose }: { obraId: string; onClose: () => void }) {
  const utils = trpc.useUtils()
  const [preview, setPreview] = useState<TarefaImport[]>([])
  const [erro, setErro] = useState("")
  const [arquivo, setArquivo] = useState<string>("")

  const criarLote = trpc.tarefaObra.criarLote.useMutation({
    onSuccess: (data) => {
      utils.tarefaObra.listar.invalidate({ obraId })
      toast.success(`${data.criadas} tarefa(s) importada(s)`)
      onClose()
    },
    onError: (e) => toast.error(e.message),
  })

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro(""); setPreview([]); setArquivo(file.name)
    try {
      const ext = file.name.split(".").pop()?.toLowerCase()
      let items: TarefaImport[] = []
      if (ext === "xml") items = await parseXml(file)
      else items = await parseExcel(file)
      if (items.length === 0) { setErro("Nenhuma tarefa encontrada. Verifique o formato do arquivo."); return }
      setPreview(items)
    } catch {
      setErro("Erro ao processar o arquivo. Verifique se está no formato correto.")
    }
  }

  function handleImportar() {
    if (preview.length === 0) return
    criarLote.mutate({ obraId, tarefas: preview })
  }

  const inputCls = "w-full px-3 py-2 border border-border rounded-xl text-sm bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] transition-all"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Upload size={16} className="text-orange-500" />
            Importar Tarefas
          </h3>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Formatos suportados */}
          <div className="flex gap-2 text-xs text-[var(--text-muted)]">
            <span className="bg-muted px-2 py-0.5 rounded-full">.xlsx</span>
            <span className="bg-muted px-2 py-0.5 rounded-full">.csv</span>
            <span className="bg-muted px-2 py-0.5 rounded-full">MS Project .xml</span>
          </div>

          {/* Upload */}
          <div>
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all">
              <FileSpreadsheet size={32} className="text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">{arquivo || "Clique para selecionar o arquivo"}</span>
              <input type="file" accept=".xlsx,.csv,.xml" onChange={handleFile} className="hidden" />
            </label>
          </div>

          {/* Template */}
          <button type="button" onClick={baixarTemplate} className="btn-ghost text-xs flex items-center gap-1.5">
            <Download size={12} />
            Baixar template Excel
          </button>

          {/* Erro */}
          {erro && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              {erro}
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                Preview — {preview.length} tarefa(s) encontrada(s)
              </p>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {["Código", "Cód. Pai", "Nome", "Setor", "Unid.", "Qtd"].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((t, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5 font-mono text-[var(--text-muted)]">{t.codigo ?? "—"}</td>
                        <td className="px-3 py-1.5 font-mono text-[var(--text-muted)]">{t.codigoPai ?? "—"}</td>
                        <td className="px-3 py-1.5 font-medium text-[var(--text-primary)] max-w-[200px] truncate">{t.nome}</td>
                        <td className="px-3 py-1.5 text-[var(--text-muted)]">{t.setor ?? "—"}</td>
                        <td className="px-3 py-1.5 text-[var(--text-muted)]">{t.unidade}</td>
                        <td className="px-3 py-1.5 text-[var(--text-muted)]">{t.quantidadeTotal}</td>
                      </tr>
                    ))}
                    {preview.length > 20 && (
                      <tr className="border-t border-border">
                        <td colSpan={6} className="px-3 py-2 text-center text-[var(--text-muted)]">
                          … e mais {preview.length - 20} tarefa(s)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleImportar}
            disabled={preview.length === 0 || criarLote.isPending}
            className="btn-orange flex-1 justify-center min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Upload size={14} />
            {criarLote.isPending ? "Importando…" : `Importar ${preview.length > 0 ? preview.length : ""} tarefa(s)`}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center min-h-[40px] cursor-pointer">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── modal de criação/edição ────────────────────────────────────────────────
function TarefaModal({
  obraId, editando, pais, onClose,
}: {
  obraId: string
  editando: TarefaRaw | null
  pais: TarefaRaw[]
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const [form, setForm] = useState<FormData>(editando ? {
    codigo:         editando.codigo ?? "",
    nome:           editando.nome,
    setor:          editando.setor ?? "",
    unidade:        editando.unidade,
    quantidadeTotal: String(editando.quantidadeTotal),
    parentId:       editando.parentId ?? "",
    ordem:          String(editando.ordem),
  } : EMPTY_FORM)

  const criar = trpc.tarefaObra.criar.useMutation({
    onSuccess: () => { utils.tarefaObra.listar.invalidate({ obraId }); toast.success("Tarefa criada"); onClose() },
    onError:   (e) => toast.error(e.message),
  })
  const atualizar = trpc.tarefaObra.atualizar.useMutation({
    onSuccess: () => { utils.tarefaObra.listar.invalidate({ obraId }); toast.success("Tarefa atualizada"); onClose() },
    onError:   (e) => toast.error(e.message),
  })

  const set = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const inputCls = "w-full px-3 py-2 border border-border rounded-xl text-sm bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    const base = {
      codigo:          form.codigo.trim() || undefined,
      nome:            form.nome.trim(),
      setor:           form.setor.trim() || undefined,
      unidade:         form.unidade || "un",
      quantidadeTotal: Number(form.quantidadeTotal) || 0,
      parentId:        form.parentId || undefined,
      ordem:           Number(form.ordem) || 0,
    }
    if (editando) {
      atualizar.mutate({ id: editando.id, ...base })
    } else {
      criar.mutate({ obraId, ...base })
    }
  }

  const isPending = criar.isPending || atualizar.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-[var(--text-primary)]">{editando ? "Editar Tarefa" : "Nova Tarefa"}</h3>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Código WBS</label>
              <input value={form.codigo} onChange={e => set("codigo", e.target.value)} placeholder="Ex: 1.2.3" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Ordem</label>
              <input type="number" value={form.ordem} onChange={e => set("ordem", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Nome / Serviço <span className="text-red-500">*</span></label>
            <input required value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: Estrutura — Pilares" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Setor / Localização</label>
            <input value={form.setor} onChange={e => set("setor", e.target.value)} placeholder="Ex: Bloco A, Pavimento 2" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Quantidade total</label>
              <input type="number" min="0" step="any" value={form.quantidadeTotal} onChange={e => set("quantidadeTotal", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Unidade</label>
              <input value={form.unidade} onChange={e => set("unidade", e.target.value)} placeholder="m², m³, un…" className={inputCls} />
            </div>
          </div>
          {pais.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Tarefa Pai (opcional)</label>
              <select value={form.parentId} onChange={e => set("parentId", e.target.value)} className={inputCls}>
                <option value="">— Nível raiz —</option>
                {pais.map(p => (
                  <option key={p.id} value={p.id}>{p.codigo ? `${p.codigo} — ` : ""}{p.nome}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending}
              className="btn-orange flex-1 justify-center min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              <Check size={14} />
              {isPending ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={onClose}
              className="btn-ghost flex-1 justify-center min-h-[40px] cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── linha de tarefa ────────────────────────────────────────────────────────
function TarefaRow({
  tarefa, nivel, obraId, todasRaiz,
}: {
  tarefa: TarefaRaw; nivel: number; obraId: string; todasRaiz: TarefaRaw[]
}) {
  const [aberto, setAberto] = useState(true)
  const [editando, setEditando] = useState(false)
  const utils = trpc.useUtils()
  const { canDelete } = useRole()

  const excluir = trpc.tarefaObra.excluir.useMutation({
    onSuccess: () => { utils.tarefaObra.listar.invalidate({ obraId }); toast.success("Tarefa excluída") },
    onError:   (e) => toast.error(e.message),
  })

  const temFilhos = tarefa.filhos.length > 0
  const statusInfo = STATUS_MAP[tarefa.status] ?? STATUS_MAP.NAO_INICIADO

  return (
    <>
      {editando && (
        <TarefaModal
          obraId={obraId}
          editando={tarefa}
          pais={todasRaiz.filter(t => t.id !== tarefa.id)}
          onClose={() => setEditando(false)}
        />
      )}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 border-b border-border hover:bg-muted/30 transition-colors group",
          nivel > 0 && "bg-slate-50/50"
        )}
        style={{ paddingLeft: `${16 + nivel * 20}px` }}
      >
        {/* Toggle filho */}
        <button
          type="button"
          onClick={() => setAberto(v => !v)}
          className={cn("flex-shrink-0 text-[var(--text-muted)] transition-colors", !temFilhos && "invisible")}
        >
          {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Código */}
        <span className="text-[11px] font-mono text-[var(--text-muted)] w-14 flex-shrink-0">{tarefa.codigo ?? "—"}</span>

        {/* Nome */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tarefa.nome}</p>
          {tarefa.setor && <p className="text-[10px] text-[var(--text-muted)] truncate">{tarefa.setor}</p>}
        </div>

        {/* Qtd */}
        <span className="text-xs text-[var(--text-muted)] w-24 text-right flex-shrink-0">
          {tarefa.quantidadeExecutada > 0 ? (
            <>{tarefa.quantidadeExecutada}<span className="text-[var(--text-muted)]">/{tarefa.quantidadeTotal}</span> {tarefa.unidade}</>
          ) : (
            <>{tarefa.quantidadeTotal} {tarefa.unidade}</>
          )}
        </span>

        {/* Progresso */}
        <div className="w-28 flex items-center gap-2 flex-shrink-0">
          <BarraProgresso pct={tarefa.percentual} />
          <span className="text-[11px] font-semibold w-8 text-right text-[var(--text-primary)]">
            {Math.round(tarefa.percentual)}%
          </span>
        </div>

        {/* Status */}
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border w-22 text-center flex-shrink-0", statusInfo.cls)}>
          {statusInfo.label}
        </span>

        {/* Ações */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button type="button" onClick={() => setEditando(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
            <Pencil size={12} />
          </button>
          {canDelete && (
            <button type="button"
              onClick={() => { if (confirm("Excluir tarefa?")) excluir.mutate({ id: tarefa.id }) }}
              disabled={excluir.isPending}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Filhos (apenas 1 nível, sem sub-filhos) */}
      {aberto && tarefa.filhos.map(filho => (
        <TarefaRow key={filho.id} tarefa={{ ...filho, filhos: [] }} nivel={nivel + 1} obraId={obraId} todasRaiz={todasRaiz} />
      ))}
    </>
  )
}

// ── página principal ───────────────────────────────────────────────────────
export default function TarefasPage() {
  const params  = useParams()
  const obraId  = params.id as string
  const [modal, setModal] = useState(false)
  const [importModal, setImportModal] = useState(false)
  const [busca, setBusca] = useState("")

  const { data: tarefas = [], isLoading } = trpc.tarefaObra.listar.useQuery({ obraId })

  // KPIs
  const flat = tarefas.flatMap(t => [t, ...t.filhos])
  const total     = flat.length
  const concluidas = flat.filter(t => t.status === "CONCLUIDO").length
  const emAndamento = flat.filter(t => t.status === "EM_ANDAMENTO").length
  const avgPct = total > 0 ? Math.round(flat.reduce((s, t) => s + t.percentual, 0) / total) : 0

  const tarefasFiltradas = busca.trim()
    ? tarefas.filter(t =>
        t.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (t.codigo ?? "").toLowerCase().includes(busca.toLowerCase()) ||
        (t.setor ?? "").toLowerCase().includes(busca.toLowerCase()) ||
        t.filhos.some(f =>
          f.nome.toLowerCase().includes(busca.toLowerCase()) ||
          (f.codigo ?? "").toLowerCase().includes(busca.toLowerCase())
        )
      )
    : tarefas

  return (
    <div className="p-6 space-y-5">
      {modal && (
        <TarefaModal
          obraId={obraId}
          editando={null}
          pais={tarefas}
          onClose={() => setModal(false)}
        />
      )}
      {importModal && (
        <ImportarModal obraId={obraId} onClose={() => setImportModal(false)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ListTodo size={20} className="text-orange-500" />
            Lista de Tarefas
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            WBS nativo da obra — código, serviço, setor, avanço físico
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/pdf/tarefas/${obraId}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost min-h-[44px] flex-shrink-0"
            title="Exportar PDF"
          >
            <Download size={14} />
            PDF
          </a>
          <button
            type="button"
            onClick={() => setImportModal(true)}
            className="btn-ghost min-h-[44px] flex-shrink-0"
          >
            <Upload size={14} />
            Importar
          </button>
          <button
            type="button"
            onClick={() => setModal(true)}
            className="btn-orange min-h-[44px] flex-shrink-0"
          >
            <Plus size={14} />
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",        value: total,       color: "text-blue-600",   bg: "bg-blue-50",   sub: "tarefas/subtarefas" },
          { label: "Concluídas",   value: concluidas,  color: "text-green-600",  bg: "bg-green-50",  sub: "100% executadas" },
          { label: "Em andamento", value: emAndamento, color: "text-amber-600",  bg: "bg-amber-50",  sub: "execução parcial" },
          { label: "Avanço médio", value: `${avgPct}%`,color: "text-purple-600", bg: "bg-purple-50", sub: "percentual geral" },
        ].map(({ label, value, color, bg, sub }) => (
          <div key={label} className={cn("rounded-2xl border border-border shadow-sm p-4", bg)}>
            <p className={cn("text-2xl font-extrabold", color)}>{value}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{label}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <input
        type="search"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        placeholder="Buscar por nome, código ou setor…"
        className="w-full max-w-sm px-3.5 py-2 border border-border rounded-xl text-sm bg-white outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-[var(--text-muted)]"
      />

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted border-b border-border text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          <span className="w-5 flex-shrink-0" />
          <span className="w-14 flex-shrink-0">WBS</span>
          <span className="flex-1">Nome / Serviço</span>
          <span className="w-24 text-right flex-shrink-0">Qtd / Un</span>
          <span className="w-28 flex-shrink-0 text-center">Progresso</span>
          <span className="w-22 flex-shrink-0 text-center">Status</span>
          <span className="w-14 flex-shrink-0" />
        </div>

        {isLoading && (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando…</div>
        )}

        {!isLoading && tarefasFiltradas.length === 0 && (
          <div className="py-14 text-center">
            <ListTodo size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {busca ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa cadastrada"}
            </p>
            {!busca && (
              <p className="text-xs text-[var(--text-muted)] mt-1">Clique em "Nova Tarefa" para começar o WBS desta obra</p>
            )}
          </div>
        )}

        {tarefasFiltradas.map(tarefa => (
          <TarefaRow key={tarefa.id} tarefa={tarefa} nivel={0} obraId={obraId} todasRaiz={tarefas} />
        ))}
      </div>
    </div>
  )
}
