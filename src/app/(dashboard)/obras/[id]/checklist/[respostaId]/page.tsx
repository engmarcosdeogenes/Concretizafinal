"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft, CheckCircle2, XCircle, Circle, Camera, ChevronDown, ChevronUp,
  ClipboardCheck, Save, Pen, AlertCircle
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { AssinaturaCanvas } from "@/components/obras/AssinaturaCanvas"
import { cn } from "@/lib/utils"

type ConformeStatus = "conforme" | "nao_conforme" | "na"

function StatusBtn({
  value, current, onChange, children, className
}: {
  value: ConformeStatus; current: ConformeStatus | null; onChange: (v: ConformeStatus) => void
  children: React.ReactNode; className: string
}) {
  const active = current === value
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
        active ? className : "bg-white border-border text-[var(--text-muted)] hover:border-slate-300"
      )}
    >
      {children}
    </button>
  )
}

function ItemRow({
  item,
  resposta,
  onUpdate,
}: {
  item: { id: string; descricao: string; secao: string | null; obrigatorio: boolean; ordem: number }
  resposta: { id: string; conforme: boolean | null; observacao: string | null; fotoUrl: string | null } | undefined
  onUpdate: (itemRespostaId: string, data: { conforme?: boolean | null; observacao?: string | null; fotoUrl?: string | null }) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [obs, setObs] = useState(resposta?.observacao ?? "")

  if (!resposta) return null

  const status: ConformeStatus | null =
    resposta.conforme === null || resposta.conforme === undefined ? null :
    resposta.conforme ? "conforme" : "nao_conforme"

  function handleStatusChange(v: ConformeStatus) {
    const conforme = v === "conforme" ? true : v === "nao_conforme" ? false : null
    onUpdate(resposta!.id, { conforme })
    if (v === "nao_conforme") setExpanded(true)
  }

  function handleObsBlur() {
    if (obs !== (resposta?.observacao ?? "")) {
      onUpdate(resposta!.id, { observacao: obs || null })
    }
  }

  const iconColor =
    status === "conforme" ? "text-green-600" :
    status === "nao_conforme" ? "text-red-500" :
    "text-slate-300"

  return (
    <div className={cn(
      "rounded-xl border transition-colors",
      status === "conforme" ? "border-green-200 bg-green-50/30" :
      status === "nao_conforme" ? "border-red-200 bg-red-50/30" :
      "border-border bg-white"
    )}>
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className="flex-shrink-0 mt-0.5">
            {status === "conforme" ? <CheckCircle2 size={16} className="text-green-600" /> :
             status === "nao_conforme" ? <XCircle size={16} className="text-red-500" /> :
             <Circle size={16} className="text-slate-300" />}
          </div>

          {/* Descrição */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">
              {item.descricao}
              {item.obrigatorio && <span className="ml-1 text-red-400 text-xs">*</span>}
            </p>
            {(resposta.observacao || expanded) && status === "nao_conforme" && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{resposta.observacao}</p>
            )}
          </div>

          {/* Expand obs */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Status buttons */}
        <div className="flex items-center gap-2 mt-2">
          <StatusBtn
            value="conforme"
            current={status}
            onChange={handleStatusChange}
            className="bg-green-500 border-green-500 text-white"
          >
            <CheckCircle2 size={12} /> Conforme
          </StatusBtn>
          <StatusBtn
            value="nao_conforme"
            current={status}
            onChange={handleStatusChange}
            className="bg-red-500 border-red-500 text-white"
          >
            <XCircle size={12} /> Não conforme
          </StatusBtn>
          <StatusBtn
            value="na"
            current={status}
            onChange={handleStatusChange}
            className="bg-slate-400 border-slate-400 text-white"
          >
            N/A
          </StatusBtn>
        </div>

        {/* Expandable obs */}
        {expanded && (
          <div className="mt-3 space-y-2">
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              onBlur={handleObsBlur}
              placeholder="Observação (opcional)"
              rows={2}
              className="w-full px-3 py-2 bg-white border border-border rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition resize-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChecklistRespostaPage() {
  const params = useParams()
  const router = useRouter()
  const obraId     = params.id as string
  const respostaId = params.respostaId as string

  const [assinatura, setAssinatura] = useState<string | null>(null)
  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false)

  const utils = trpc.useUtils()
  const { data: resposta, isLoading } = trpc.checklist.buscarResposta.useQuery({ id: respostaId })

  const atualizarItem = trpc.checklist.atualizarItem.useMutation({
    onSuccess: () => utils.checklist.buscarResposta.invalidate({ id: respostaId }),
    onError: (e) => toast.error(e.message),
  })

  const finalizar = trpc.checklist.finalizarResposta.useMutation({
    onSuccess: () => {
      toast.success("Checklist finalizado!")
      router.push(`/obras/${obraId}/checklist`)
    },
    onError: (e) => toast.error(e.message),
  })

  function handleUpdateItem(itemRespostaId: string, data: { conforme?: boolean | null; observacao?: string | null; fotoUrl?: string | null }) {
    atualizarItem.mutate({ itemRespostaId, ...data })
  }

  function handleFinalizar() {
    finalizar.mutate({ id: respostaId, assinaturaUrl: assinatura })
  }

  // Group items by section
  const secoes = useMemo(() => {
    if (!resposta) return []
    const map = new Map<string, typeof resposta.template.itens>()
    for (const item of resposta.template.itens) {
      const sec = item.secao ?? "Geral"
      if (!map.has(sec)) map.set(sec, [])
      map.get(sec)!.push(item)
    }
    return Array.from(map.entries()).map(([nome, itens]) => ({ nome, itens }))
  }, [resposta])

  // Progress
  const { total, respondidos, conformes, naoConformes } = useMemo(() => {
    if (!resposta) return { total: 0, respondidos: 0, conformes: 0, naoConformes: 0 }
    const t = resposta.itens.length
    const r = resposta.itens.filter(i => i.conforme !== null && i.conforme !== undefined).length
    const c = resposta.itens.filter(i => i.conforme === true).length
    const n = resposta.itens.filter(i => i.conforme === false).length
    return { total: t, respondidos: r, conformes: c, naoConformes: n }
  }, [resposta])

  const pctRespondido = total === 0 ? 0 : Math.round((respondidos / total) * 100)

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (!resposta) {
    return (
      <div className="p-8 text-center">
        <AlertCircle size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-[var(--text-muted)]">Checklist não encontrado</p>
        <Link href={`/obras/${obraId}/checklist`} className="mt-2 text-sm text-orange-500 hover:text-orange-600">
          Voltar
        </Link>
      </div>
    )
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{resposta.template.nome}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{formatDataCurta(resposta.data)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{pctRespondido}%</p>
          <p className="text-xs text-[var(--text-muted)]">{respondidos}/{total} respondidos</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              pctRespondido === 100 ? "bg-green-500" : pctRespondido >= 70 ? "bg-amber-400" : "bg-orange-400"
            )}
            style={{ width: `${pctRespondido}%` }}
          />
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <CheckCircle2 size={12} /> {conformes} conformes
          </span>
          <span className="flex items-center gap-1 text-red-500 font-medium">
            <XCircle size={12} /> {naoConformes} não conformes
          </span>
          <span className="text-[var(--text-muted)]">
            {total - respondidos} pendentes
          </span>
        </div>
      </div>

      {/* Itens por seção */}
      {secoes.map(({ nome, itens }) => (
        <div key={nome} className="space-y-2">
          {secoes.length > 1 && (
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{nome}</p>
          )}
          {itens.map((item) => {
            const respostaItem = resposta.itens.find(ri => ri.itemId === item.id)
            return (
              <ItemRow
                key={item.id}
                item={item}
                resposta={respostaItem ? {
                  id: respostaItem.id,
                  conforme: respostaItem.conforme,
                  observacao: respostaItem.observacao,
                  fotoUrl: respostaItem.fotoUrl,
                } : undefined}
                onUpdate={handleUpdateItem}
              />
            )
          })}
        </div>
      ))}

      {/* Assinatura */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3">
        <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Pen size={14} className="text-orange-500" />
          Assinatura do responsável
        </p>
        <AssinaturaCanvas
          label="Responsável pela inspeção"
          imagemUrl={resposta.assinaturaUrl}
          onSave={(dataUrl) => setAssinatura(dataUrl)}
        />
      </div>

      {/* Finalizar */}
      <button
        type="button"
        onClick={handleFinalizar}
        disabled={finalizar.isPending}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Save size={18} />
        {finalizar.isPending ? "Salvando..." : "Finalizar Checklist"}
      </button>

    </div>
  )
}
