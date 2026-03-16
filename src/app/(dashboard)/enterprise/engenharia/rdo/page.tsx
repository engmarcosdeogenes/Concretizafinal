"use client"

import { useState, useCallback } from "react"
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Wrench,
  ListChecks,
  AlertTriangle,
  BarChart3,
  Calendar,
  Trash2,
  Plus,
  Save,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc/client"

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  try {
    return new Date(v).toLocaleDateString("pt-BR")
  } catch {
    return v
  }
}

const fmtCurrency = (v?: number | null) =>
  v != null
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—"

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  iconColor,
}: {
  icon: React.ElementType
  title: string
  iconColor: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className={iconColor} />
      <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Detail section for a single RDO                                     */
/* ------------------------------------------------------------------ */

function RdoDetail({
  buildingId,
  dailyReportId,
  obraId,
}: {
  buildingId: number
  dailyReportId: number
  obraId: string
}) {
  const utils = trpc.useUtils()

  const { data: detail, isLoading } = trpc.sienge.buscarDiarioObra.useQuery({
    buildingId,
    dailyReportId,
  })

  const deletar = trpc.sienge.deletarDiarioObra.useMutation({
    onSuccess: () => {
      toast.success("Diário de obra excluído")
      utils.sienge.listarRdosPorObra.invalidate({ obraId })
    },
    onError: (e: { message: string }) => toast.error(e.message),
  })

  // Ocorrências
  const incluirOcorrencias =
    trpc.sienge.incluirOcorrenciasDiarioObra.useMutation({
      onSuccess: () => {
        toast.success("Ocorrências incluídas")
        utils.sienge.buscarDiarioObra.invalidate({ buildingId, dailyReportId })
      },
      onError: (e: { message: string }) => toast.error(e.message),
    })

  const atualizarOcorrencias =
    trpc.sienge.atualizarOcorrenciasDiarioObra.useMutation({
      onSuccess: () => {
        toast.success("Ocorrências atualizadas")
        utils.sienge.buscarDiarioObra.invalidate({ buildingId, dailyReportId })
      },
      onError: (e: { message: string }) => toast.error(e.message),
    })

  // Tarefas
  const incluirTarefas = trpc.sienge.incluirTarefasDiarioObra.useMutation({
    onSuccess: () => {
      toast.success("Tarefas incluídas")
      utils.sienge.buscarDiarioObra.invalidate({ buildingId, dailyReportId })
    },
    onError: (e: { message: string }) => toast.error(e.message),
  })

  const atualizarTarefas = trpc.sienge.atualizarTarefasDiarioObra.useMutation({
    onSuccess: () => {
      toast.success("Tarefas atualizadas")
      utils.sienge.buscarDiarioObra.invalidate({ buildingId, dailyReportId })
    },
    onError: (e: { message: string }) => toast.error(e.message),
  })

  // Equipes
  const incluirEquipes = trpc.sienge.incluirEquipesDiarioObra.useMutation({
    onSuccess: () => {
      toast.success("Equipes incluídas")
      utils.sienge.buscarDiarioObra.invalidate({ buildingId, dailyReportId })
    },
    onError: (e: { message: string }) => toast.error(e.message),
  })

  const atualizarEquipes = trpc.sienge.atualizarEquipesDiarioObra.useMutation({
    onSuccess: () => {
      toast.success("Equipes atualizadas")
      utils.sienge.buscarDiarioObra.invalidate({ buildingId, dailyReportId })
    },
    onError: (e: { message: string }) => toast.error(e.message),
  })

  // Equipamentos
  const incluirEquipamentos =
    trpc.sienge.incluirEquipamentosDiarioObra.useMutation({
      onSuccess: () => {
        toast.success("Equipamentos incluídos")
        utils.sienge.buscarDiarioObra.invalidate({ buildingId, dailyReportId })
      },
      onError: (e: { message: string }) => toast.error(e.message),
    })

  const atualizarEquipamentos =
    trpc.sienge.atualizarEquipamentosDiarioObra.useMutation({
      onSuccess: () => {
        toast.success("Equipamentos atualizados")
        utils.sienge.buscarDiarioObra.invalidate({ buildingId, dailyReportId })
      },
      onError: (e: { message: string }) => toast.error(e.message),
    })

  const handleDelete = useCallback(() => {
    if (!confirm("Tem certeza que deseja excluir este diário de obra?")) return
    deletar.mutate({ buildingId, dailyReportId })
  }, [buildingId, dailyReportId, deletar])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const d = detail as Record<string, unknown> | undefined
  const equipes = (d?.equipes ?? d?.crews ?? []) as Record<string, unknown>[]
  const equipamentos = (d?.equipamentos ?? d?.equipments ?? []) as Record<
    string,
    unknown
  >[]
  const tarefas = (d?.tarefas ?? d?.tasks ?? []) as Record<string, unknown>[]
  const ocorrencias = (d?.ocorrencias ?? d?.events ?? []) as Record<
    string,
    unknown
  >[]

  return (
    <div className="px-5 pb-5 space-y-5">
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleDelete}
          disabled={deletar.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={12} />
          {deletar.isPending ? "Excluindo…" : "Excluir RDO"}
        </button>
      </div>

      {/* Equipes */}
      <div className="bg-muted/30 rounded-xl p-4">
        <SectionHeader icon={Users} title="Equipes" iconColor="text-blue-500" />
        {equipes.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">
            Nenhuma equipe registrada
          </p>
        ) : (
          <div className="space-y-1">
            {equipes.map((eq, i) => (
              <div
                key={i}
                className="text-xs text-[var(--text-primary)] bg-white rounded-lg px-3 py-2 border border-border"
              >
                {String(eq.description ?? eq.descricao ?? `Equipe ${i + 1}`)}
                {eq.quantity != null && (
                  <span className="ml-2 text-[var(--text-muted)]">
                    Qtd: {String(eq.quantity ?? eq.quantidade)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() =>
              incluirEquipes.mutate({
                buildingId,
                dailyReportId,
                crews: [],
              })
            }
            disabled={incluirEquipes.isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Plus size={10} />
            Incluir
          </button>
          <button
            onClick={() =>
              atualizarEquipes.mutate({
                buildingId,
                dailyReportId,
                crews: equipes,
              })
            }
            disabled={atualizarEquipes.isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            <Save size={10} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Equipamentos */}
      <div className="bg-muted/30 rounded-xl p-4">
        <SectionHeader
          icon={Wrench}
          title="Equipamentos"
          iconColor="text-orange-500"
        />
        {equipamentos.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">
            Nenhum equipamento registrado
          </p>
        ) : (
          <div className="space-y-1">
            {equipamentos.map((eq, i) => (
              <div
                key={i}
                className="text-xs text-[var(--text-primary)] bg-white rounded-lg px-3 py-2 border border-border"
              >
                {String(
                  eq.description ?? eq.descricao ?? `Equipamento ${i + 1}`
                )}
                {eq.quantity != null && (
                  <span className="ml-2 text-[var(--text-muted)]">
                    Qtd: {String(eq.quantity ?? eq.quantidade)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() =>
              incluirEquipamentos.mutate({
                buildingId,
                dailyReportId,
                equipments: [],
              })
            }
            disabled={incluirEquipamentos.isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
          >
            <Plus size={10} />
            Incluir
          </button>
          <button
            onClick={() =>
              atualizarEquipamentos.mutate({
                buildingId,
                dailyReportId,
                equipments: equipamentos,
              })
            }
            disabled={atualizarEquipamentos.isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            <Save size={10} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Tarefas */}
      <div className="bg-muted/30 rounded-xl p-4">
        <SectionHeader
          icon={ListChecks}
          title="Tarefas"
          iconColor="text-violet-500"
        />
        {tarefas.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">
            Nenhuma tarefa registrada
          </p>
        ) : (
          <div className="space-y-1">
            {tarefas.map((t, i) => (
              <div
                key={i}
                className="text-xs text-[var(--text-primary)] bg-white rounded-lg px-3 py-2 border border-border"
              >
                {String(t.description ?? t.descricao ?? `Tarefa ${i + 1}`)}
                {t.percentComplete != null && (
                  <span className="ml-2 text-[var(--text-muted)]">
                    {String(t.percentComplete)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() =>
              incluirTarefas.mutate({
                buildingId,
                dailyReportId,
                tasks: [],
              })
            }
            disabled={incluirTarefas.isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"
          >
            <Plus size={10} />
            Incluir
          </button>
          <button
            onClick={() =>
              atualizarTarefas.mutate({
                buildingId,
                dailyReportId,
                tasks: tarefas,
              })
            }
            disabled={atualizarTarefas.isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            <Save size={10} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Ocorrencias */}
      <div className="bg-muted/30 rounded-xl p-4">
        <SectionHeader
          icon={AlertTriangle}
          title="Ocorrências"
          iconColor="text-amber-500"
        />
        {ocorrencias.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">
            Nenhuma ocorrência registrada
          </p>
        ) : (
          <div className="space-y-1">
            {ocorrencias.map((oc, i) => (
              <div
                key={i}
                className="text-xs text-[var(--text-primary)] bg-white rounded-lg px-3 py-2 border border-border"
              >
                <span className="font-medium">
                  {String(oc.type ?? oc.tipo ?? "Ocorrência")}
                </span>
                {" — "}
                {String(oc.description ?? oc.descricao ?? "")}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() =>
              incluirOcorrencias.mutate({
                buildingId,
                dailyReportId,
                events: [],
              })
            }
            disabled={incluirOcorrencias.isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
          >
            <Plus size={10} />
            Incluir
          </button>
          <button
            onClick={() =>
              atualizarOcorrencias.mutate({
                buildingId,
                dailyReportId,
                events: ocorrencias,
              })
            }
            disabled={atualizarOcorrencias.isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            <Save size={10} />
            Atualizar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Histograma de MO mini-bar                                           */
/* ------------------------------------------------------------------ */

function HistogramaMO({ obraId }: { obraId?: string }) {
  const { data, isLoading } = trpc.analises.histogramaMO.useQuery({ obraId })

  const porMes = (data as Record<string, unknown> | undefined)?.porMes as
    | { mes: string; presentes: number; ausentes: number }[]
    | undefined

  const rows = porMes ?? []
  const maxVal = rows.reduce(
    (m, r) => Math.max(m, r.presentes + r.ausentes),
    1
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="text-xs text-[var(--text-muted)] text-center py-6">
        Sem dados de mão de obra disponíveis.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const total = r.presentes + r.ausentes
        const pctPresentes = total > 0 ? (r.presentes / maxVal) * 100 : 0
        const pctAusentes = total > 0 ? (r.ausentes / maxVal) * 100 : 0
        return (
          <div key={r.mes} className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--text-muted)] w-20 text-right flex-shrink-0">
              {r.mes}
            </span>
            <div className="flex-1 flex items-center gap-0.5 h-5">
              <div
                className="bg-green-400 rounded-l h-full transition-all"
                style={{ width: `${pctPresentes}%` }}
                title={`Presentes: ${r.presentes}`}
              />
              <div
                className="bg-red-300 rounded-r h-full transition-all"
                style={{ width: `${pctAusentes}%` }}
                title={`Ausentes: ${r.ausentes}`}
              />
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)] w-10 text-right flex-shrink-0">
              {total}
            </span>
          </div>
        )
      })}
      <div className="flex items-center gap-4 mt-2 justify-end">
        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" />
          Presentes
        </span>
        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-300 inline-block" />
          Ausentes
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Semana view                                                         */
/* ------------------------------------------------------------------ */

function SemanaView({ obraId }: { obraId: string }) {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const dataInicio = monday.toISOString().slice(0, 10)

  const { data, isLoading } = trpc.rdo.buscarSemana.useQuery({
    obraId,
    dataInicio,
  })

  const dias = (data as Record<string, unknown>[] | undefined) ?? []

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (dias.length === 0) {
    return (
      <p className="text-xs text-[var(--text-muted)] text-center py-6">
        Nenhum dado da semana disponível.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {dias.map((dia, i) => {
        const dateStr = String(dia.data ?? dia.date ?? "")
        const count = Number(dia.totalRdos ?? dia.count ?? 0)
        return (
          <div
            key={i}
            className={`rounded-xl border border-border p-3 text-center ${
              count > 0 ? "bg-blue-50 border-blue-200" : "bg-white"
            }`}
          >
            <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase">
              {fmtDate(dateStr)}
            </p>
            <p className="text-lg font-bold text-[var(--text-primary)] mt-1">
              {count}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">RDOs</p>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export default function RdoSiengeDashboard() {
  const [selectedObraId, setSelectedObraId] = useState<string>("")
  const [expandedRdoId, setExpandedRdoId] = useState<number | null>(null)

  const { data: obras = [], isLoading: loadingObras } =
    trpc.obra.listar.useQuery()

  const obraSelected = selectedObraId !== ""

  const {
    data: rdos = [],
    isLoading: loadingRdos,
    error: rdosError,
    refetch: refetchRdos,
    isFetching: fetchingRdos,
  } = trpc.sienge.listarRdosPorObra.useQuery(
    { obraId: selectedObraId },
    { enabled: obraSelected }
  )

  const { data: tiposOcorrencia = [] } =
    trpc.sienge.listarTiposOcorrenciaDiarioObra.useQuery(undefined, {
      enabled: obraSelected,
    })

  const { data: tiposDiario = [] } =
    trpc.sienge.listarTiposDiarioObra.useQuery(undefined, {
      enabled: obraSelected,
    })

  const rdoList = rdos as Record<string, unknown>[]
  const tiposOcList = tiposOcorrencia as Record<string, unknown>[]
  const tiposDiarioList = tiposDiario as Record<string, unknown>[]

  /* Find buildingId for the selected obra */
  const selectedObra = obras.find(
    (o) => (o as Record<string, unknown>).id === selectedObraId
  ) as Record<string, unknown> | undefined
  const buildingId = Number(
    selectedObra?.siengeId ?? selectedObra?.buildingId ?? 0
  )

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <ClipboardList size={18} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Diário de Obra — Sienge
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Visualize e gerencie RDOs integrados ao Sienge
          </p>
        </div>
      </div>

      {/* Obra selector */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <label
          htmlFor="obra-select"
          className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2"
        >
          Selecionar Obra
        </label>
        {loadingObras ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-[var(--text-muted)]">
              Carregando obras…
            </span>
          </div>
        ) : (
          <select
            id="obra-select"
            value={selectedObraId}
            onChange={(e) => {
              setSelectedObraId(e.target.value)
              setExpandedRdoId(null)
            }}
            className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Selecione uma obra —</option>
            {obras.map((obra) => {
              const o = obra as Record<string, unknown>
              return (
                <option key={String(o.id)} value={String(o.id)}>
                  {String(o.nome ?? o.name ?? o.id)}
                </option>
              )
            })}
          </select>
        )}
      </div>

      {/* Error state */}
      {obraSelected && rdosError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle
            size={18}
            className="text-amber-600 mt-0.5 flex-shrink-0"
          />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Sienge não configurado
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Configure a integração Sienge em{" "}
              <a
                href="/configuracoes/integracoes"
                className="underline font-medium"
              >
                Configurações &rarr; Integrações
              </a>{" "}
              para visualizar os diários de obra.
            </p>
          </div>
        </div>
      )}

      {/* Content when obra is selected */}
      {obraSelected && !rdosError && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Total de RDOs"
              value={loadingRdos ? "…" : String(rdoList.length)}
              icon={ClipboardList}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
            />
            <KpiCard
              label="Tipos de Ocorrência"
              value={loadingRdos ? "…" : String(tiposOcList.length)}
              icon={AlertTriangle}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
            <KpiCard
              label="Tipos de Diário"
              value={loadingRdos ? "…" : String(tiposDiarioList.length)}
              icon={ListChecks}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
            />
          </div>

          {/* RDO list */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                RDOs do Sienge
              </h2>
              <button
                onClick={() => refetchRdos()}
                disabled={fetchingRdos}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <RefreshCw
                  size={12}
                  className={fetchingRdos ? "animate-spin" : ""}
                />
                Atualizar
              </button>
            </div>

            {loadingRdos ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : rdoList.length === 0 ? (
              <div className="text-center py-12 px-4">
                <ClipboardList
                  size={36}
                  className="text-[var(--text-muted)] mx-auto mb-3"
                />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Nenhum RDO encontrado
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Não há diários de obra registrados no Sienge para esta obra.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {rdoList.map((rdo) => {
                  const rdoId = Number(
                    rdo.dailyReportId ?? rdo.id ?? 0
                  )
                  const isExpanded = expandedRdoId === rdoId
                  const date = String(rdo.date ?? rdo.data ?? "")
                  const type = String(
                    rdo.type ?? rdo.tipo ?? rdo.typeName ?? ""
                  )
                  const description = String(
                    rdo.description ?? rdo.descricao ?? ""
                  )

                  return (
                    <div key={rdoId}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRdoId(isExpanded ? null : rdoId)
                        }
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown
                              size={16}
                              className="text-[var(--text-muted)] flex-shrink-0"
                            />
                          ) : (
                            <ChevronRight
                              size={16}
                              className="text-[var(--text-muted)] flex-shrink-0"
                            />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {fmtDate(date)}
                              {type && (
                                <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                                  {type}
                                </span>
                              )}
                            </p>
                            {description && (
                              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                                {description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          #{rdoId}
                        </span>
                      </button>
                      {isExpanded && buildingId > 0 && (
                        <RdoDetail
                          buildingId={buildingId}
                          dailyReportId={rdoId}
                          obraId={selectedObraId}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Semana view */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-blue-500" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Resumo Semanal
              </h2>
            </div>
            <SemanaView obraId={selectedObraId} />
          </div>

          {/* Histograma de MO */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-green-500" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Histograma de Mão de Obra
              </h2>
            </div>
            <HistogramaMO obraId={selectedObraId} />
          </div>
        </>
      )}

      {/* Initial state — no obra selected */}
      {!obraSelected && !loadingObras && (
        <div className="text-center py-16">
          <ClipboardList
            size={48}
            className="text-[var(--text-muted)] mx-auto mb-4"
          />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Selecione uma obra para começar
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Os dados de diário de obra serão carregados do Sienge
            automaticamente.
          </p>
        </div>
      )}
    </div>
  )
}
