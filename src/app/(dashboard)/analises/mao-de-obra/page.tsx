"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, BarChart3, TrendingUp, ArrowLeft } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"

const STATUS_LABELS: Record<string, string> = {
  PRESENTE: "Presente",
  AFASTADO: "Afastado",
  ATESTADO: "Atestado",
  DESLOCANDO: "Deslocando",
  FALTA_JUSTIFICADA: "Falta Justif.",
  FERIAS: "Férias",
  FOLGA: "Folga",
  LICENCA: "Licença",
  TREINAMENTO: "Treinamento",
  VIAGEM: "Viagem",
}

const STATUS_CORES: Record<string, string> = {
  PRESENTE: "#22c55e",
  AFASTADO: "#94a3b8",
  ATESTADO: "#f59e0b",
  DESLOCANDO: "#3b82f6",
  FALTA_JUSTIFICADA: "#ef4444",
  FERIAS: "#a855f7",
  FOLGA: "#06b6d4",
  LICENCA: "#f97316",
  TREINAMENTO: "#10b981",
  VIAGEM: "#6366f1",
}

function KpiCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value.toLocaleString("pt-BR")}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  )
}

export default function HistogramaMOPage() {
  const { data: obras = [] } = trpc.obra.listar.useQuery()
  const [obraId, setObraId] = useState<string | undefined>(undefined)

  const { data, isLoading } = trpc.analises.histogramaMO.useQuery({ obraId })

  const porFuncao = data?.porFuncao ?? []
  const porMes = data?.porMes ?? []
  const statusBreakdown = data?.statusBreakdown ?? []
  const totalRegistros = data?.totalRegistros ?? 0

  const totalPresentes = porMes.reduce((s, m) => s + m.presentes, 0)
  const totalAusentes  = porMes.reduce((s, m) => s + m.ausentes, 0)
  const pctPresenca = totalPresentes + totalAusentes > 0
    ? Math.round(totalPresentes / (totalPresentes + totalAusentes) * 100)
    : 0

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header + Tab Nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users size={22} className="text-blue-500" />
            Histograma de Mão de Obra
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Análise de presença e ausências por função ao longo do tempo</p>
        </div>
        <Link href="/analises" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={12} /> Voltar para Indicadores
        </Link>
      </div>

      {/* Filtro de obra */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Filtrar por obra:</label>
        <select
          value={obraId ?? ""}
          onChange={e => setObraId(e.target.value || undefined)}
          className="px-3 py-1.5 rounded-lg border border-border text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:border-orange-400"
        >
          <option value="">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-56 bg-muted rounded-xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && totalRegistros === 0 && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Users size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Nenhum RDO com equipe registrada</p>
          <p className="text-xs text-[var(--text-muted)]">Crie RDOs com equipe para visualizar o histograma.</p>
        </div>
      )}

      {!isLoading && totalRegistros > 0 && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Registros MO" value={totalRegistros} />
            <KpiCard label="Total Presentes" value={totalPresentes} sub={`${pctPresenca}% de presença`} />
            <KpiCard label="Total Ausências" value={totalAusentes} />
            <KpiCard label="Funções únicas" value={porFuncao.length} />
          </div>

          {/* Evolução mensal */}
          <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-blue-500" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Evolução Mensal</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={porMes} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gPresentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAusentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => Number(v ?? 0).toLocaleString("pt-BR")} />
                <Legend />
                <Area type="monotone" dataKey="presentes" name="Presentes" stroke="#22c55e" fill="url(#gPresentes)" strokeWidth={2} />
                <Area type="monotone" dataKey="ausentes" name="Ausências" stroke="#f97316" fill="url(#gAusentes)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Por função + Breakdown em linha */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* BarChart por função */}
            <div className="lg:col-span-2 bg-white border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-orange-500" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Por Função</h2>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={porFuncao} layout="vertical" margin={{ top: 5, right: 20, left: 8, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="funcao" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(v) => Number(v ?? 0).toLocaleString("pt-BR")} />
                  <Legend />
                  <Bar dataKey="presentes" name="Presentes" stackId="a" fill="#22c55e" radius={[0,0,0,0]} />
                  <Bar dataKey="ausentes"  name="Ausências" stackId="a" fill="#f97316" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* PieChart breakdown status */}
            <div className="bg-white border border-border rounded-xl p-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">Por Status</h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="total" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                    {statusBreakdown.map((s, i) => (
                      <Cell key={i} fill={STATUS_CORES[s.status] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => Number(v ?? 0).toLocaleString("pt-BR")} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {statusBreakdown.slice(0, 6).map(s => (
                  <div key={s.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: STATUS_CORES[s.status] ?? "#94a3b8" }} />
                      <span className="text-[var(--text-muted)]">{STATUS_LABELS[s.status] ?? s.status}</span>
                    </div>
                    <span className="font-semibold text-[var(--text-primary)]">{s.total.toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-[var(--text-muted)]">{totalRegistros.toLocaleString("pt-BR")} registros de equipe analisados</p>
        </>
      )}
    </div>
  )
}
