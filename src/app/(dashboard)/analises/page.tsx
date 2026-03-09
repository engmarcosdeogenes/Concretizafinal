"use client"

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  TrendingUp, AlertTriangle, CheckSquare, ClipboardList,
  HardHat, BarChart2, DollarSign, Package,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"

const TIPO_LABEL: Record<string, string> = {
  SEGURANCA: "Segurança", QUALIDADE: "Qualidade", PRAZO: "Prazo",
  CUSTO: "Custo", AMBIENTAL: "Ambiental", OUTRO: "Outro",
}
const TIPO_COR: Record<string, string> = {
  SEGURANCA: "#ef4444", QUALIDADE: "#8b5cf6", PRAZO: "#f59e0b",
  CUSTO: "#3b82f6",     AMBIENTAL: "#10b981", OUTRO: "#64748b",
}
const STATUS_OC_COR = ["#ef4444", "#f59e0b", "#10b981", "#64748b"]
const STATUS_FVS_COR = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#f97316"]

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "20" }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-[var(--text-primary)]">{value}</p>
        <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const tooltipStyle = {
  contentStyle: { borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: 12 },
  itemStyle: { fontWeight: 600 },
}

export default function AnalisesPage() {
  const { data, isLoading } = trpc.analises.resumo.useQuery()

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Carregando análises...</p>
      </div>
    )
  }

  if (!data) return null

  const { kpis, rdosPorMes, ocorrenciasPorTipo, statusOc, statusFvs, financeiroPorMes, orcamentoVsCusto } = data

  const ocStatusData = [
    { name: "Abertas",      value: statusOc.ABERTA },
    { name: "Em Análise",   value: statusOc.EM_ANALISE },
    { name: "Resolvidas",   value: statusOc.RESOLVIDA },
    { name: "Fechadas",     value: statusOc.FECHADA },
  ].filter(d => d.value > 0)

  const fvsStatusData = [
    { name: "Pendente",    value: statusFvs.PENDENTE },
    { name: "Em Inspeção", value: statusFvs.EM_INSPECAO },
    { name: "Aprovadas",   value: statusFvs.APROVADO },
    { name: "Rejeitadas",  value: statusFvs.REJEITADO },
    { name: "Retrabalho",  value: statusFvs.RETRABALHO },
  ].filter(d => d.value > 0)

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <BarChart2 size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Análises</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Indicadores e tendências de todas as obras</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Obras ativas" value={kpis.obrasAtivas} sub={`${kpis.totalObras} no total`} icon={HardHat} color="#f97316" />
        <KpiCard label="RDOs registrados" value={kpis.totalRdos} icon={ClipboardList} color="#10b981" />
        <KpiCard label="Ocorrências abertas" value={kpis.ocAbertas} sub={`${kpis.totalOcorrencias} no total`} icon={AlertTriangle} color="#ef4444" />
        <KpiCard label="FVS aprovadas" value={kpis.fvsAprovadas} sub={`Progresso médio: ${kpis.progressoMedio}%`} icon={CheckSquare} color="#8b5cf6" />
      </div>

      {/* Gráficos linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* RDOs por mês */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-orange-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">RDOs por mês (últimos 12 meses)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={rdosPorMes} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rdoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="count" name="RDOs" stroke="#f97316" strokeWidth={2.5} fill="url(#rdoGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Financeiro por mês */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign size={16} className="text-green-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Financeiro por mês (últimos 6 meses)</h3>
          </div>
          {financeiroPorMes.every(m => m.receitas === 0 && m.despesas === 0) ? (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">Nenhum lançamento registrado</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={financeiroPorMes} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip {...tooltipStyle} formatter={(v) => formatBRL(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Gráficos linha 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Ocorrências por tipo */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Ocorrências por tipo</h3>
          </div>
          {ocorrenciasPorTipo.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">Sem ocorrências</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ocorrenciasPorTipo.map(o => ({ name: TIPO_LABEL[o.tipo] ?? o.tipo, value: o.count, color: TIPO_COR[o.tipo] ?? "#64748b" }))}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {ocorrenciasPorTipo.map((o, i) => (
                    <Cell key={i} fill={TIPO_COR[o.tipo] ?? "#64748b"} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ocorrências por status */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Status das ocorrências</h3>
          </div>
          {ocStatusData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">Sem ocorrências</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ocStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {ocStatusData.map((_, i) => <Cell key={i} fill={STATUS_OC_COR[i % STATUS_OC_COR.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* FVS por status */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare size={16} className="text-purple-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Status das FVS</h3>
          </div>
          {fvsStatusData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">Sem FVS cadastradas</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={fvsStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {fvsStatusData.map((_, i) => <Cell key={i} fill={STATUS_FVS_COR[i % STATUS_FVS_COR.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Orçamento vs Custo */}
      {orcamentoVsCusto.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign size={16} className="text-blue-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Orçamento vs. Custo atual por obra</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={orcamentoVsCusto} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={(v) => formatBRL(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="orcamento" name="Orçamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="custo" name="Custo atual" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Avanço Físico por FVS */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={16} className="text-green-500" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Avanço Físico por FVS</h3>
          <span className="text-[11px] text-[var(--text-muted)] ml-1">— % de FVS aprovadas por obra</span>
        </div>
        {data.avancoFisicoObras.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic">Nenhuma obra com FVS registradas.</p>
        ) : (
          <div className="space-y-4">
            {data.avancoFisicoObras.map(o => (
              <div key={o.nome}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--text-primary)]">{o.nome}</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    <span className="font-semibold text-green-600">{o.pct}%</span>
                    {" "}({o.aprovadas}/{o.total} FVS)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${o.pct}%` }}
                  />
                </div>
                {o.progresso !== o.pct && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Progresso manual: {o.progresso}%
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
