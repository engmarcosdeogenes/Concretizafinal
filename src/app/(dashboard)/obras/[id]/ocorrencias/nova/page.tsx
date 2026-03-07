"use client"

import Link from "next/link"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

type TipoOcorrencia = "SEGURANCA" | "QUALIDADE" | "PRAZO" | "CUSTO" | "AMBIENTAL" | "OUTRO"

const TIPOS: { value: TipoOcorrencia; label: string; emoji: string }[] = [
  { value: "SEGURANCA", label: "Segurança",  emoji: "🦺" },
  { value: "QUALIDADE", label: "Qualidade",  emoji: "⭐" },
  { value: "PRAZO",     label: "Prazo",      emoji: "⏱️" },
  { value: "CUSTO",     label: "Custo",      emoji: "💰" },
  { value: "AMBIENTAL", label: "Ambiental",  emoji: "🌿" },
  { value: "OUTRO",     label: "Outro",      emoji: "📌" },
]

const PRIORIDADES: { value: number; label: string; cls: string }[] = [
  { value: 1, label: "Baixa",  cls: "border-slate-300 text-slate-600" },
  { value: 2, label: "Média",  cls: "border-amber-400 text-amber-700" },
  { value: 3, label: "Alta",   cls: "border-red-400 text-red-700" },
]

export default function NovaOcorrenciaPage() {
  const params = useParams()
  const obraId = params.id as string
  const router = useRouter()

  const hoje = new Date().toISOString().split("T")[0]

  const [titulo, setTitulo]         = useState("")
  const [tipo, setTipo]             = useState<TipoOcorrencia>("OUTRO")
  const [prioridade, setPrioridade] = useState(2)
  const [descricao, setDescricao]   = useState("")
  const [data, setData]             = useState(hoje)
  const [erro, setErro]             = useState("")

  const criar = trpc.ocorrencia.criar.useMutation({
    onSuccess: (oc) => {
      router.push(`/obras/${obraId}/ocorrencias/${oc.id}`)
    },
    onError: (e) => {
      setErro(e.message || "Erro ao criar ocorrência.")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    criar.mutate({
      obraId,
      titulo: titulo.trim(),
      tipo,
      prioridade,
      descricao: descricao.trim() || undefined,
      data,
    })
  }

  const inputCls = "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
  const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/obras/${obraId}/ocorrencias`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            Nova Ocorrência
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Registre uma não conformidade ou problema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {erro && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>
        )}

        {/* Identificação */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Identificação</h3>

          <div>
            <label className={labelCls}>Título <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Armadura exposta na viga do Pav. 3"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Data <span className="text-red-500">*</span></label>
            <input type="date" required value={data} onChange={e => setData(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Tipo */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tipo</h3>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipo(t.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                  tipo === t.value
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--muted)]"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prioridade */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Prioridade</h3>
          <div className="flex gap-3">
            {PRIORIDADES.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPrioridade(p.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                  prioridade === p.value
                    ? `${p.cls} bg-opacity-10`
                    : "border-[var(--border)] text-[var(--text-muted)] bg-white hover:bg-[var(--muted)]"
                }`}
                style={prioridade === p.value ? { borderColor: "currentColor" } : {}}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Descrição</h3>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva a ocorrência em detalhes: local, causa aparente, impacto..."
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-6">
          <button
            type="submit"
            disabled={criar.isPending}
            className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <AlertTriangle size={15} />
            {criar.isPending ? "Salvando..." : "Registrar Ocorrência"}
          </button>
          <Link href={`/obras/${obraId}/ocorrencias`} className="btn-ghost min-h-[44px] flex-1 justify-center cursor-pointer">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
