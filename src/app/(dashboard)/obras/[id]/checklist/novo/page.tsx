"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, ClipboardCheck, ChevronRight, ListChecks, AlertCircle } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

export default function NovoChecklistPage() {
  const params = useParams()
  const router = useRouter()
  const obraId = params.id as string

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))

  const { data: templates = [], isLoading } = trpc.checklist.listarTemplates.useQuery()

  const criar = trpc.checklist.criarResposta.useMutation({
    onSuccess: (resposta) => {
      toast.success("Checklist iniciado!")
      router.push(`/obras/${obraId}/checklist/${resposta!.id}`)
    },
    onError: (e) => toast.error(e.message),
  })

  function handleSubmit() {
    if (!selectedTemplateId) {
      toast.error("Selecione um template de checklist")
      return
    }
    criar.mutate({ obraId, templateId: selectedTemplateId, data })
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={`/obras/${obraId}/checklist`}
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Voltar
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Iniciar Checklist</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Escolha um template e a data de aplicação</p>
      </div>

      {/* Data */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-2">
        <label className="text-sm font-semibold text-[var(--text-primary)]">Data</label>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-border rounded-xl text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
        />
      </div>

      {/* Templates */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Template</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Nenhum template cadastrado</p>
              <p className="text-xs text-amber-600 mt-0.5">
                <Link href="/configuracoes/checklists" className="underline hover:no-underline">
                  Crie um template
                </Link>{" "}
                em Configurações → Checklists
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplateId(t.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  selectedTemplateId === t.id
                    ? "border-orange-400 bg-orange-50"
                    : "border-border bg-white hover:border-orange-200 hover:bg-orange-50/50"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedTemplateId === t.id ? "bg-orange-100" : "bg-slate-100"
                }`}>
                  <ListChecks size={16} className={selectedTemplateId === t.id ? "text-orange-600" : "text-slate-500"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{t.nome}</p>
                  {t.descricao && (
                    <p className="text-xs text-[var(--text-muted)] truncate">{t.descricao}</p>
                  )}
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{t._count.itens} {t._count.itens === 1 ? "item" : "itens"}</p>
                </div>
                <ChevronRight size={16} className={`flex-shrink-0 ${selectedTemplateId === t.id ? "text-orange-500" : "text-[var(--text-muted)]"}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedTemplateId || criar.isPending}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <ClipboardCheck size={18} />
        {criar.isPending ? "Iniciando..." : "Iniciar Checklist"}
      </button>
    </div>
  )
}
