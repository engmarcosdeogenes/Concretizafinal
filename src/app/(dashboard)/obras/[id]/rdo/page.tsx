"use client"

import Link from "next/link"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClipboardList, Plus, Sun, Cloud, CloudRain, Wind, CheckCircle2, Clock, AlertCircle, Users, Copy, Download, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta, diaSemanaAbrev } from "@/lib/format"
import { exportarExcel } from "@/lib/excel"
import { useRole } from "@/hooks/useRole"

function formatTemp(min?: number | null, max?: number | null) {
  if (min != null && max != null) return `${min}/${max}°C`
  if (max != null) return `${max}°C`
  if (min != null) return `${min}°C`
  return ""
}

function ClimaIcon({ clima }: { clima?: string | null }) {
  const cls = "flex-shrink-0"
  if (clima === "chuva")   return <CloudRain size={16} className={`text-blue-400 ${cls}`} />
  if (clima === "nublado") return <Cloud size={16} className={`text-slate-400 ${cls}`} />
  if (clima === "vento")   return <Wind size={16} className={`text-slate-500 ${cls}`} />
  return <Sun size={16} className={`text-amber-400 ${cls}`} />
}

function StatusChip({ status }: { status: string }) {
  const map = {
    APROVADO:   { label: "Aprovado",    cls: "bg-green-50 text-green-700 border border-green-200" },
    ENVIADO:    { label: "Enviado",     cls: "bg-blue-50 text-blue-700 border border-blue-200" },
    EM_REVISAO: { label: "Em Revisão",  cls: "bg-sky-50 text-sky-700 border border-sky-200" },
    RASCUNHO:   { label: "Rascunho",   cls: "bg-slate-50 text-slate-600 border border-slate-200" },
    REJEITADO:  { label: "Rejeitado",  cls: "bg-red-50 text-red-700 border border-red-200" },
  }
  const s = map[status as keyof typeof map] ?? map.RASCUNHO
  const Icon = status === "APROVADO" ? CheckCircle2 : status === "ENVIADO" || status === "EM_REVISAO" ? Clock : AlertCircle
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${s.cls}`}>
      <Icon size={10} className="inline mr-1" />
      {s.label}
    </span>
  )
}

export default function RdoPage() {
  const params  = useParams()
  const router  = useRouter()
  const id      = params.id as string
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null)

  const { canDelete, canFvs } = useRole()
  const utils = trpc.useUtils()
  const { data: rdos = [], isLoading } = trpc.rdo.listar.useQuery({ obraId: id })
  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id })
  const hasSienge = !!obra?.siengeId
  const { data: rdosSienge = [], isLoading: loadingSienge } = trpc.sienge.listarRdosPorObra.useQuery(
    { obraId: id },
    { enabled: hasSienge }
  )
  const [siengeAberto, setSiengeAberto] = useState(false)

  const duplicar = trpc.rdo.duplicar.useMutation({
    onSuccess: (rdo) => {
      utils.rdo.listar.invalidate({ obraId: id })
      setDuplicandoId(null)
      toast.success("RDO duplicado")
      router.push(`/obras/${id}/rdo/${rdo.id}`)
    },
    onError: (e) => { setDuplicandoId(null); toast.error(e.message) },
  })

  const total      = rdos.length
  const aprovados  = rdos.filter(r => r.status === "APROVADO").length
  const pendentes  = rdos.filter(r => r.status === "ENVIADO").length

  const STATS = [
    { label: "Total de RDOs",   value: String(total),     sub: "desde o início",    color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Aprovados",       value: String(aprovados), sub: `${total > 0 ? Math.round(aprovados / total * 100) : 0}% do total`, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pendentes",       value: String(pendentes), sub: "aguardando revisão", color: "text-amber-600",  bg: "bg-amber-50" },
    { label: "Dias trabalhados",value: String(total),     sub: "dias registrados",  color: "text-purple-600", bg: "bg-purple-50" },
  ]

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Relatório Diário de Obra</h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Registro diário das atividades, equipe, condições climáticas e ocorrências
          </p>
        </div>
        <div className="flex gap-2">
          {rdos.length > 0 && (
            <>
              <button
                onClick={() => exportarExcel(rdos.map(r => ({
                  Data:        formatDataCurta(r.data),
                  Responsável: r.responsavel.nome,
                  Clima:       r.clima ?? "",
                  Status:      r.status,
                  Atividades:  r.atividades.map(a => a.descricao).join("; "),
                  Equipe:      r.equipe.reduce((s, e) => s + e.quantidade, 0),
                })), `RDOs`)}
                className="btn-ghost min-h-[44px] flex-shrink-0"
                title="Exportar para Excel"
              >
                <Download size={15} />
                Excel
              </button>
              {canFvs && (
                <button
                  onClick={() => {
                    setDuplicandoId(rdos[0].id)
                    duplicar.mutate({ rdoId: rdos[0].id })
                  }}
                  disabled={duplicar.isPending}
                  className="btn-ghost min-h-[44px] flex-shrink-0 disabled:opacity-60"
                  title="Duplica o RDO mais recente"
                >
                  <Copy size={15} />
                  {duplicar.isPending ? "Duplicando..." : "Duplicar último"}
                </button>
              )}
            </>
          )}
          <Link href={`/obras/${id}/rdo/novo`} className="btn-orange min-h-[44px] flex-shrink-0">
            <Plus size={15} />
            Novo RDO
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map(({ label, value, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{label}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Lista de RDOs */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="grid grid-cols-[80px_1fr_120px_80px_100px] gap-3 px-5 py-3 bg-muted border-b border-border">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Data</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Atividades</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Responsável</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Equipe</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</span>
        </div>

        {isLoading && (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">
            Carregando...
          </div>
        )}

        {!isLoading && rdos.length === 0 && (
          <div className="py-12 text-center">
            <ClipboardList size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Nenhum RDO registrado</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Crie o primeiro relatório diário desta obra</p>
          </div>
        )}

        {rdos.map((rdo) => {
          const totalEquipe = rdo.equipe.reduce((sum, e) => sum + e.quantidade, 0)
          return (
            <Link
              key={rdo.id}
              href={`/obras/${id}/rdo/${rdo.id}`}
              className="grid grid-cols-[80px_1fr_120px_80px_100px] gap-3 px-5 py-4 border-b border-border last:border-0 hover:bg-muted transition-colors items-center no-underline"
            >
              {/* Data + clima */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <ClimaIcon clima={rdo.clima} />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{diaSemanaAbrev(rdo.data)}</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">{formatDataCurta(rdo.data)}</span>
                {formatTemp(rdo.temperaturaMin, rdo.temperaturaMax) && (
                  <span className="text-[10px] text-[var(--text-muted)]">{formatTemp(rdo.temperaturaMin, rdo.temperaturaMax)}</span>
                )}
              </div>

              {/* Atividades */}
              <div className="min-w-0">
                {rdo.atividades.length > 0 ? (
                  <p className="text-xs text-[var(--text-primary)] truncate">
                    {rdo.atividades.slice(0, 2).map(a => a.descricao).join(" · ")}
                    {rdo.atividades.length > 2 && <span className="text-[var(--text-muted)]"> +{rdo.atividades.length - 2}</span>}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] italic">Sem atividades</p>
                )}
              </div>

              {/* Responsável */}
              <p className="text-xs text-[var(--text-muted)] truncate">{rdo.responsavel.nome}</p>

              {/* Equipe */}
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Users size={11} />
                {totalEquipe}
              </div>

              {/* Status */}
              <StatusChip status={rdo.status} />
            </Link>
          )
        })}
      </div>

      {/* Seção Sienge */}
      {hasSienge && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setSiengeAberto(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ClipboardList size={14} className="text-blue-500" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">RDOs no Sienge</span>
              {rdosSienge.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-semibold border border-blue-200">
                  {rdosSienge.length}
                </span>
              )}
            </div>
            <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${siengeAberto ? "rotate-180" : ""}`} />
          </button>
          {siengeAberto && (
            <div className="border-t border-border">
              {loadingSienge ? (
                <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Carregando…</p>
              ) : rdosSienge.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhum RDO encontrado no Sienge para esta obra.</p>
              ) : (
                <div className="divide-y divide-border">
                  {(rdosSienge as Array<{ id: number; date?: string; status?: string }>).map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="text-[var(--text-primary)]">{r.date ?? `RDO #${r.id}`}</span>
                      <span className="text-xs text-[var(--text-muted)] bg-muted px-2 py-0.5 rounded-full">{r.status ?? "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
