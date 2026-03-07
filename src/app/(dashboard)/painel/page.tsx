"use client"

import Link from "next/link"
import {
  FolderOpen, ClipboardList, Box, Users, Plus, Upload,
  CheckCircle2, AlertTriangle, MessageSquare, TrendingUp, PieChart
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from "recharts"

const kpis = [
  {
    label: "Obras Ativas",
    value: "24",
    subtext: "+12% do mês passado",
    subtextCls: "text-[#23CE6B]",
    icon: <FolderOpen size={22} className="text-[#3C82D9]" />,
    iconBg: "bg-blue-50",
  },
  {
    label: "Inspeções",
    value: "156",
    subtext: "+8% do mês passado",
    subtextCls: "text-[#23CE6B]",
    icon: <ClipboardList size={22} className="text-[#23CE6B]" />,
    iconBg: "bg-green-50",
  },
  {
    label: "Retrabalho Evitado",
    value: "89%",
    subtext: "+3% do mês passado",
    subtextCls: "text-[#23CE6B]",
    icon: <Box size={22} className="text-[#FFB703]" />,
    iconBg: "bg-amber-50",
  },
  {
    label: "Membros da Equipe",
    value: "42",
    subtext: "+5% do mês passado",
    subtextCls: "text-[#23CE6B]",
    icon: <Users size={22} className="text-slate-500" />,
    iconBg: "bg-slate-100",
  },
]

const obrasAtivas = [
  { nome: "Construção de Shopping Center", local: "Distrito Central", progresso: 75, status: "Ativa", statusColor: "bg-[#23CE6B]", inicial: "SC", resp: "Sarah Chen", date: "Dez 2025" },
  { nome: "Complexo Residencial Fase 2", local: "Zona Norte", progresso: 45, status: "Ativa", statusColor: "bg-[#3C82D9]", inicial: "MJ", resp: "Mike Johnson", date: "Mar 2026" },
  { nome: "Renovação de Ponte Rodoviária", local: "Corredor Leste", progresso: 90, status: "Ativa", statusColor: "bg-[#23CE6B]", inicial: "LP", resp: "Lisa Park", date: "Nov 2025" },
  { nome: "Estação de Tratamento de Água", local: "Área Industrial", progresso: 60, status: "Ativa", statusColor: "bg-[#23CE6B]", inicial: "EW", resp: "Emma Wilson", date: "Fev 2026" },
]

const recentActivities = [
  { title: "Inspeção concluída", sub: "Shopping Mall - 2 horas atrás" },
  { title: "Material entregue", sub: "Bridge Renovation - 5 horas atrás" },
  { title: "Documento enviado", sub: "Office Tower - Ontem" },
]

const tendInspData = [
  { name: 'Jan', inspecObras: 40 },
  { name: 'Feb', inspecObras: 30 },
  { name: 'Mar', inspecObras: 60 },
  { name: 'Apr', inspecObras: 80 },
  { name: 'May', inspecObras: 110 },
  { name: 'Jun', inspecObras: 150 },
]

const pieData = [
  { name: 'Ativo 45%', value: 45, color: '#23CE6B' },
  { name: 'Em Andamento 30%', value: 30, color: '#3C82D9' },
  { name: 'Em Espera 15%', value: 15, color: '#FF8800' },
  { name: 'Concluído 10%', value: 10, color: '#FFB703' },
]

export default function PainelPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div>
        <h1 className="text-slate-900 font-extrabold text-2xl tracking-tight">Painel</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Visão geral das suas obras</p>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">{kpi.label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight group-hover:scale-105 transition-transform origin-left">{kpi.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-[14px] ${kpi.iconBg} flex items-center justify-center shadow-inner`}>
                {kpi.icon}
              </div>
            </div>
            <p className={`text-xs font-semibold mt-5 ${kpi.subtextCls} relative z-10`}>
              {kpi.subtext}
            </p>
            {/* Subtle background flair */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-slate-50 rounded-full blur-2xl opacity-50 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

        {/* Left Column: Obras Ativas */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 lg:p-7 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Obras Ativas</h2>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button className="px-5 py-2 bg-[#3C82D9] text-white text-sm font-bold rounded-full shadow-sm hover:bg-blue-600 transition-colors">
              Ativas
            </button>
            <button className="px-5 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-bold rounded-full transition-colors relative overflow-hidden">
              Concluídas
            </button>
            <button className="px-5 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-bold rounded-full transition-colors relative overflow-hidden">
              Pausadas
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {obrasAtivas.map((obra, idx) => (
              <div key={idx} className="border border-slate-200/80 rounded-xl p-5 hover:border-[#3C82D9]/50 hover:shadow-sm transition-all duration-300 group cursor-pointer bg-white relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-[#3C82D9] transition-colors">{obra.nome}</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{obra.local}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold text-white rounded-lg shadow-sm ${obra.statusColor}`}>
                    {obra.status}
                  </span>
                </div>

                <div className="mb-5 relative z-10">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-slate-500">Progresso</span>
                    <span className="text-xs font-bold text-slate-900">{obra.progresso}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#3C82D9] rounded-full transition-all duration-1000 ease-out" style={{ width: `${obra.progresso}%` }}></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-[#3C82D9] flex items-center justify-center font-bold text-xs ring-1 ring-blue-100/50">
                      {obra.inicial}
                    </div>
                    <span className="font-semibold text-slate-700">{obra.resp}</span>
                  </div>
                  <span className="font-semibold text-slate-500">{obra.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Actions & Activities */}
        <div className="space-y-6 flex flex-col">

          {/* Ações Rápidas */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden">
            <h2 className="text-lg font-bold text-slate-900 mb-5 relative z-10">Ações Rápidas</h2>

            <div className="space-y-3 relative z-10">
              <button className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-[#3C82D9] to-blue-500 hover:to-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] transform">
                <Plus size={22} />
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] transform shadow-sm">
                <Upload size={18} className="text-slate-400" />
                Enviar Documento
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] transform shadow-sm">
                <ClipboardList size={18} className="text-slate-400" />
                Registrar Inspeção
              </button>
            </div>
            {/* Subtle bg glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Atividades Recentes */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex-1">
            <h2 className="text-lg font-bold text-slate-900 mb-5">Atividades Recentes</h2>

            <div className="space-y-3">
              {recentActivities.map((act, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col hover:border-[#3C82D9]/50 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5">
                  <p className="text-sm font-bold text-slate-900">{act.title}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1.5">{act.sub}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Gráficos Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tendência de Inspeções */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={22} className="text-[#3C82D9]" />
            <h2 className="text-lg font-bold text-slate-900">Tendência de Inspeções</h2>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendInspData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInspec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3C82D9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3C82D9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="inspecObras" name="Inspeções Obras" stroke="#3C82D9" strokeWidth={3} fillOpacity={1} fill="url(#colorInspec)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Qualidade dos Materiais (Pie Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <PieChart size={22} className="text-[#23CE6B]" />
            <h2 className="text-lg font-bold text-slate-900">Qualidade dos Materiais</h2>
          </div>
          <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold', color: '#333' }}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  )
}
