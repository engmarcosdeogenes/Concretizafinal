"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Users,
  Wrench,
  AlertTriangle,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta, diaSemanaAbrev } from "@/lib/format"
import { useHistogramaMO } from "@/hooks/useHistogramaMO"

// ── Helpers ─────────────────────────────────────────────────
function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function formatISO(d: Date): string {
  return d.toISOString().split("T")[0]
}

// ── Main Page ───────────────────────────────────────────────
export default function RdoDashboardPage() {
  const params = useParams()
  const obraId = params.id as string

  // Semana state
  const [semanaInicio, setSemanaInicio] = useState(() => getMonday(new Date()))

  const semanaAnterior = () => {
    setSemanaInicio((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }
  const proximaSemana = () => {
    setSemanaInicio((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  // ── Queries ─────────────────────────────────────────────
  const { data: semana, isLoading: loadingSemana } = trpc.rdo.buscarSemana.useQuery({
    obraId,
    dataInicio: formatISO(semanaInicio),
  })

  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const hasSienge = !!obra?.siengeId

  const { porFuncao, porMes, isLoading: loadingHist } = useHistogramaMO(obraId)

  // Sienge diário types
  const { data: tiposOcorrencia = [] } = trpc.sienge.listarTiposOcorrenciaDiarioObra.useQuery(
    undefined,
    { enabled: hasSienge }
  )
  const { data: tiposDiario = [] } = trpc.sienge.listarTiposDiarioObra.useQuery(
    undefined,
    { enabled: hasSienge }
  )

  // ── Resumo semanal ────────────────────────────────────────
  const resumoSemana = useMemo(() => {
    if (!semana?.rdos) return { total: 0, totalEquipe: 0, diasComRdo: 0 }
    const total = semana.rdos.length
    const totalEquipe = semana.rdos.reduce(
      (sum, rdo) => sum + rdo.equipe.reduce((s, e) => s + e.quantidade, 0),
      0
    )
    return { total, totalEquipe, diasComRdo: total }
  }, [semana])

  // ── Histogram bar max ─────────────────────────────────────
  const maxFuncao = Math.max(1, ...porFuncao.map((f) => f.total))
  const maxMes = Math.max(1, ...porMes.map((m) => m.total))

  const semanaFim = new Date(semanaInicio)
  semanaFim.setDate(semanaFim.getDate() + 6)

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/obras/${obraId}/rdo`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 size={20} className="text-orange-500" />
            Dashboard RDO
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Visão consolidada: semana, equipe e histograma de mão de obra
          </p>
        </div>
      </div>

      {/* ═══════ SEÇÃO: Visão Semanal ═══════ */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar size={14} className="text-orange-500" />
            Visão Semanal
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={semanaAnterior}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium text-[var(--text-primary)] min-w-[160px] text-center">
              {formatDataCurta(semanaInicio)} — {formatDataCurta(semanaFim)}
            </span>
            <button
              type="button"
              onClick={proximaSemana}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {loadingSemana ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)] flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Carregando semana…
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xl font-extrabold text-blue-600">{resumoSemana.diasComRdo}</p>
                <p className="text-[10px] font-medium text-blue-700">Dias com RDO</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xl font-extrabold text-green-600">{resumoSemana.totalEquipe}</p>
                <p className="text-[10px] font-medium text-green-700">Total equipe (soma)</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xl font-extrabold text-purple-600">
                  {resumoSemana.total > 0
                    ? Math.round(resumoSemana.totalEquipe / resumoSemana.total)
                    : 0}
                </p>
                <p className="text-[10px] font-medium text-purple-700">Média equipe/dia</p>
              </div>
            </div>

            {/* Day-by-day */}
            <div className="space-y-1">
              {Array.from({ length: 7 }, (_, i) => {
                const dia = new Date(semanaInicio)
                dia.setDate(dia.getDate() + i)
                const rdo = semana?.rdos.find(
                  (r) => formatISO(new Date(r.data)) === formatISO(dia)
                )
                const totalEquipeDia = rdo
                  ? rdo.equipe.reduce((s, e) => s + e.quantidade, 0)
                  : 0
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-colors ${
                      rdo
                        ? "border-green-200 bg-green-50/50"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <span className="text-xs font-semibold text-[var(--text-primary)] w-12">
                      {diaSemanaAbrev(dia)}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] w-16">
                      {formatDataCurta(dia)}
                    </span>
                    {rdo ? (
                      <>
                        <span className="text-xs text-[var(--text-primary)] flex-1 truncate">
                          {rdo.atividades
                            .slice(0, 2)
                            .map((a) => a.descricao)
                            .join(" · ") || "Sem atividades"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Users size={10} /> {totalEquipeDia}
                        </span>
                        <Link
                          href={`/obras/${obraId}/rdo/${rdo.id}`}
                          className="text-[10px] text-orange-500 font-semibold hover:underline"
                        >
                          Ver
                        </Link>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-[var(--text-muted)] italic flex-1">
                          Sem registro
                        </span>
                        <Link
                          href={`/obras/${obraId}/rdo/novo`}
                          className="text-[10px] text-orange-500 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Plus size={10} /> Criar
                        </Link>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ═══════ SEÇÃO: Histograma MO — Por Função ═══════ */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Users size={14} className="text-orange-500" />
          Histograma de Mão de Obra — Por Função
        </h3>

        {loadingHist ? (
          <div className="py-6 text-center text-sm text-[var(--text-muted)] flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Carregando…
          </div>
        ) : porFuncao.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic">Sem dados de equipe registrados.</p>
        ) : (
          <div className="space-y-2">
            {porFuncao.map((f) => (
              <div key={f.funcao} className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-primary)] w-28 truncate font-medium">
                  {f.funcao}
                </span>
                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(f.presentes / maxFuncao) * 100}%` }}
                    title={`Presentes: ${f.presentes}`}
                  />
                  <div
                    className="h-full bg-orange-400 transition-all"
                    style={{ width: `${(f.ausentes / maxFuncao) * 100}%` }}
                    title={`Ausentes: ${f.ausentes}`}
                  />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] w-14 text-right">
                  {f.presentes}/{f.total}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2 text-[10px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Presentes
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> Ausentes
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ SEÇÃO: Histograma MO — Por Mês ═══════ */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <BarChart3 size={14} className="text-orange-500" />
          Evolução Mensal — Mão de Obra
        </h3>

        {loadingHist ? (
          <div className="py-6 text-center text-sm text-[var(--text-muted)]">Carregando…</div>
        ) : porMes.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic">Sem dados mensais.</p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {porMes.map((m) => (
              <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-28">
                  <div
                    className="w-full max-w-[40px] bg-green-500 rounded-t-md transition-all"
                    style={{ height: `${(m.presentes / maxMes) * 100}%`, minHeight: m.presentes > 0 ? 4 : 0 }}
                    title={`Presentes: ${m.presentes}`}
                  />
                  <div
                    className="w-full max-w-[40px] bg-orange-400 rounded-b-md transition-all"
                    style={{ height: `${(m.ausentes / maxMes) * 100}%`, minHeight: m.ausentes > 0 ? 4 : 0 }}
                    title={`Ausentes: ${m.ausentes}`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-[var(--text-primary)]">
                  {m.total}
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">{m.mes}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ SEÇÃO: Sienge — Tipos de Diário de Obra ═══════ */}
      {hasSienge && (
        <>
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Wrench size={14} className="text-blue-500" />
              Tipos de Diário de Obra (Sienge)
            </h3>
            {tiposDiario.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] italic">Nenhum tipo de diário configurado no Sienge.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(tiposDiario as Array<{ id: number; description?: string; name?: string }>).map((t) => (
                  <div
                    key={t.id}
                    className="px-3 py-2 rounded-xl border border-border bg-muted/30 text-xs text-[var(--text-primary)]"
                  >
                    {t.name ?? t.description ?? `Tipo #${t.id}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              Tipos de Ocorrência (Sienge)
            </h3>
            {tiposOcorrencia.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] italic">Nenhum tipo de ocorrência configurado.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(tiposOcorrencia as Array<{ id: number; description?: string; name?: string }>).map((t) => (
                  <div
                    key={t.id}
                    className="px-3 py-2 rounded-xl border border-border bg-muted/30 text-xs text-[var(--text-primary)]"
                  >
                    {t.name ?? t.description ?? `Tipo #${t.id}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Link back */}
      <div className="flex justify-center pb-4">
        <Link
          href={`/obras/${obraId}/rdo`}
          className="text-sm text-orange-500 font-medium hover:underline flex items-center gap-1.5"
        >
          <ClipboardList size={13} />
          Voltar à listagem de RDOs
        </Link>
      </div>
    </div>
  )
}
