"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Package, CheckCircle2, XCircle, Clock, RotateCcw, Truck, FileText, Send, ThumbsDown, Camera, Upload, DollarSign, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataLonga } from "@/lib/format"
import { UploadFotos } from "@/components/obras/UploadFotos"

type StatusFVM = "PENDENTE" | "RECEBIDO" | "APROVADO" | "REJEITADO" | "DEVOLVIDO"

const STATUS_MAP: Record<StatusFVM, { label: string; cls: string; Icon: React.ElementType }> = {
  PENDENTE:  { label: "Pendente",  cls: "bg-slate-50 text-slate-600 border border-slate-200",    Icon: Clock },
  RECEBIDO:  { label: "Recebido",  cls: "bg-blue-50 text-blue-700 border border-blue-200",       Icon: Package },
  APROVADO:  { label: "Aprovado",  cls: "bg-green-50 text-green-700 border border-green-200",    Icon: CheckCircle2 },
  REJEITADO: { label: "Rejeitado", cls: "bg-red-50 text-red-700 border border-red-200",          Icon: XCircle },
  DEVOLVIDO: { label: "Devolvido", cls: "bg-orange-50 text-orange-700 border border-orange-200", Icon: RotateCcw },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as StatusFVM] ?? STATUS_MAP.PENDENTE
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      <s.Icon size={12} />
      {s.label}
    </span>
  )
}

type NfeData = {
  numero: string
  dataEmissao: string
  valorTotal: number
  emitente: { cnpj: string; nome: string }
  itens: Array<{ descricao: string; quantidade: number; unidade: string; valorTotal: number }>
}

export default function FvmDetalhePage() {
  const params = useParams()
  const obraId = params.id as string
  const fvmId  = params.fvmId as string

  const utils = trpc.useUtils()

  const { data: fvm, isLoading, error } = trpc.fvm.buscarPorId.useQuery({ id: fvmId })

  const atualizarStatus = trpc.fvm.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.fvm.buscarPorId.invalidate({ id: fvmId })
      utils.fvm.listar.invalidate({ obraId })
    },
  })

  const lancarDespesa = trpc.fvm.lancarDespesaNf.useMutation({
    onSuccess: () => {
      setLancado(true)
    },
  })

  // NF-e upload state
  const fileRef = useRef<HTMLInputElement>(null)
  const [nfe, setNfe]             = useState<NfeData | null>(null)
  const [parseando, setParseando] = useState(false)
  const [nfeErro, setNfeErro]     = useState("")
  const [lancado, setLancado]     = useState(false)

  async function handleNfeFile(file: File) {
    if (!file.name.endsWith(".xml")) {
      setNfeErro("Selecione um arquivo XML de NF-e.")
      return
    }
    setParseando(true)
    setNfeErro("")
    setNfe(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/nfe/parse", { method: "POST", body: formData })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "Erro ao processar XML.")
      }
      const data: NfeData = await res.json()
      setNfe(data)
    } catch (e: unknown) {
      setNfeErro(e instanceof Error ? e.message : "Erro ao processar XML.")
    } finally {
      setParseando(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Carregando FVM...</p>
      </div>
    )
  }

  if (error || !fvm) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">FVM não encontrada.</p>
        <Link href={`/obras/${obraId}/fvm`} className="text-sm text-orange-500 mt-2 inline-block cursor-pointer">
          ← Voltar para lista
        </Link>
      </div>
    )
  }

  const mutating = atualizarStatus.isPending

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/obras/${obraId}/fvm`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <Package size={20} className="text-orange-500 flex-shrink-0" />
            <span className="truncate">{fvm.material}</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {fvm.codigo && <span className="font-mono mr-2">{fvm.codigo} ·</span>}
            {formatDataLonga(fvm.data)}
          </p>
        </div>
      </div>

      {/* Info + Status card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <StatusBadge status={fvm.status} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Quantidade</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {fvm.quantidade}{fvm.unidade ? ` ${fvm.unidade}` : ""}
            </p>
          </div>
          {fvm.fornecedorNome && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Fornecedor</p>
              <p className="text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                <Truck size={13} className="text-[var(--text-muted)]" />
                {fvm.fornecedorNome}
              </p>
            </div>
          )}
          {fvm.notaFiscal && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Nota Fiscal</p>
              <p className="text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                <FileText size={13} className="text-[var(--text-muted)]" />
                {fvm.notaFiscal}
              </p>
            </div>
          )}
        </div>

        {/* Status actions */}
        {fvm.status !== "APROVADO" && fvm.status !== "REJEITADO" && fvm.status !== "DEVOLVIDO" && (
          <div className="pt-4 border-t border-border flex gap-2 flex-wrap">
            {fvm.status === "PENDENTE" && (
              <button
                type="button"
                disabled={mutating}
                onClick={() => atualizarStatus.mutate({ id: fvmId, status: "RECEBIDO" })}
                className="btn-orange min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {mutating ? "..." : "Registrar Recebimento"}
              </button>
            )}
            {fvm.status === "RECEBIDO" && (
              <>
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => atualizarStatus.mutate({ id: fvmId, status: "APROVADO" })}
                  className="btn-orange min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={14} />
                  {mutating ? "..." : "Aprovar"}
                </button>
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => atualizarStatus.mutate({ id: fvmId, status: "REJEITADO" })}
                  className="btn-danger min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ThumbsDown size={14} />
                  {mutating ? "..." : "Rejeitar"}
                </button>
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => atualizarStatus.mutate({ id: fvmId, status: "DEVOLVIDO" })}
                  className="btn-ghost min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RotateCcw size={14} />
                  {mutating ? "..." : "Devolver"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Observações */}
      {fvm.observacoes && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Observações</h3>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{fvm.observacoes}</p>
        </div>
      )}

      {/* Nota Fiscal (XML) */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Nota Fiscal (NF-e)</h3>
        </div>

        {/* Upload area */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {parseando
            ? <Loader2 size={20} className="mx-auto animate-spin text-orange-500 mb-1.5" />
            : <Upload size={20} className="mx-auto text-[var(--text-muted)] mb-1.5" />}
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {parseando ? "Processando XML..." : "Clique para anexar XML da NF-e"}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Arquivo .xml do SEFAZ</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xml"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleNfeFile(f) }}
          />
        </div>

        {nfeErro && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{nfeErro}</p>
        )}

        {/* NF-e parsed preview */}
        {nfe && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">NF-e nº {nfe.numero}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{nfe.emitente.nome} · {nfe.emitente.cnpj}</p>
              </div>
              <p className="text-sm font-bold text-green-700">
                R$ {nfe.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="divide-y divide-border">
              {nfe.itens.slice(0, 4).map((item, i) => (
                <div key={i} className="px-4 py-2 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-primary)] truncate flex-1 mr-4">{item.descricao}</span>
                  <span className="text-[var(--text-muted)] shrink-0">{item.quantidade} {item.unidade}</span>
                </div>
              ))}
              {nfe.itens.length > 4 && (
                <div className="px-4 py-2 text-xs text-[var(--text-muted)] italic">
                  +{nfe.itens.length - 4} itens
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lançar despesa */}
        {nfe && !lancado && (
          <button
            type="button"
            disabled={lancarDespesa.isPending}
            onClick={() => lancarDespesa.mutate({
              fvmId,
              descricao: `Recebimento de material — NF-e ${nfe.numero}`,
              valor:     nfe.valorTotal,
            })}
            className="btn-orange min-h-[40px] w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <DollarSign size={15} />
            {lancarDespesa.isPending ? "Lançando..." : `Lançar R$ ${nfe.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} como despesa`}
          </button>
        )}

        {lancado && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            <CheckCircle2 size={16} />
            Despesa lançada no financeiro da obra!
          </div>
        )}
      </div>

      {/* Fotos */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Camera size={16} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Fotos do recebimento</h3>
        </div>
        <UploadFotos obraId={obraId} fvmId={fvmId} />
      </div>

    </div>
  )
}
