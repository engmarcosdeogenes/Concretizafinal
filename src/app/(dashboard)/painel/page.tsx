"use client"

import Link from "next/link"
import {
  FolderOpen, ClipboardList, Users, Plus, Upload,
  TrendingUp, PieChart as PieChartIcon,
  AlertTriangle, AlertCircle, Clock,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { AlertasObra } from "@/components/obras/AlertasObra"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"

function initiais(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    EM_ANDAMENTO: "Em Andamento", PLANEJAMENTO: "Planejamento",
    PAUSADA: "Pausada", CONCLUIDA: "Concluída",
  }
  return m[s] ?? s
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "EM_ANDAMENTO") return "default"
  if (s === "PAUSADA")      return "outline"
  return "secondary"
}

function OcIcon({ tipo }: { tipo: string }) {
  if (tipo === "SEGURANCA") return <AlertTriangle className="h-4 w-4 text-red-500" />
  if (tipo === "PRAZO")     return <Clock className="h-4 w-4 text-amber-500" />
  return <AlertCircle className="h-4 w-4 text-blue-500" />
}

function SkeletonKpi() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-muted rounded animate-pulse mt-1" />
        <div className="h-3 w-28 bg-muted rounded animate-pulse mt-2" />
      </CardContent>
    </Card>
  )
}

export default function PainelPage() {
  const { data: resumo, isLoading } = trpc.painel.resumo.useQuery()

  const kpis = resumo ? [
    {
      label: "Obras Ativas",
      value: String(resumo.kpis.obrasAtivas),
      subtext: `${resumo.kpis.totalObras} no total`,
      subtextCls: "text-slate-500",
      icon: <FolderOpen className="h-5 w-5 text-blue-500" />,
      iconBg: "bg-blue-100/50",
      href: "/obras",
    },
    {
      label: "RDOs este mês",
      value: String(resumo.kpis.rdosMes),
      subtext: "registros no mês atual",
      subtextCls: "text-slate-500",
      icon: <ClipboardList className="h-5 w-5 text-emerald-500" />,
      iconBg: "bg-emerald-100/50",
      href: "/obras",
    },
    {
      label: "Ocorrências Abertas",
      value: String(resumo.kpis.ocAbertas),
      subtext: "precisam de atenção",
      subtextCls: resumo.kpis.ocAbertas > 0 ? "text-amber-600 font-semibold" : "text-emerald-500",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      iconBg: "bg-amber-100/50",
      href: "/obras",
    },
    {
      label: "Membros Ativos",
      value: String(resumo.kpis.membrosAtivos),
      subtext: "na empresa",
      subtextCls: "text-slate-500",
      icon: <Users className="h-5 w-5 text-slate-500" />,
      iconBg: "bg-slate-100",
      href: "/equipe",
    },
  ] : []

  const total = resumo?.kpis.totalObras ?? 1

  const pieData = resumo ? [
    { name: `Em Andamento ${Math.round(resumo.statusObras.EM_ANDAMENTO / total * 100)}%`, value: resumo.statusObras.EM_ANDAMENTO, color: "#10b981" },
    { name: `Planejamento ${Math.round(resumo.statusObras.PLANEJAMENTO / total * 100)}%`,  value: resumo.statusObras.PLANEJAMENTO,  color: "#3b82f6" },
    { name: `Pausadas ${Math.round(resumo.statusObras.PAUSADA / total * 100)}%`,           value: resumo.statusObras.PAUSADA,       color: "#f59e0b" },
    { name: `Concluídas ${Math.round(resumo.statusObras.CONCLUIDA / total * 100)}%`,       value: resumo.statusObras.CONCLUIDA,     color: "#64748b" },
  ].filter(d => d.value > 0) : []

  const obraMap = Object.fromEntries((resumo?.obras ?? []).map(o => [o.id, o.nome]))

  const obrasEM  = (resumo?.obras ?? []).filter(o => o.status === "EM_ANDAMENTO" || o.status === "PLANEJAMENTO")
  const obrasOK  = (resumo?.obras ?? []).filter(o => o.status === "CONCLUIDA")
  const obrasPau = (resumo?.obras ?? []).filter(o => o.status === "PAUSADA")

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">

      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
          <p className="text-muted-foreground">Visão geral das suas obras em andamento.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/relatorios">
            <Button>Baixar Relatório</Button>
          </Link>
        </div>
      </div>

      {/* Alertas inteligentes */}
      <AlertasObra />

      {/* KPIs Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)
          : kpis.map((kpi, idx) => (
            <Link key={idx} href={kpi.href}>
              <Card className="transition-all hover:shadow-md cursor-pointer hover:border-primary/50 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                  <div className={`p-2 rounded-md ${kpi.iconBg}`}>{kpi.icon}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className={`text-xs mt-1 font-medium ${kpi.subtextCls}`}>{kpi.subtext}</p>
                </CardContent>
              </Card>
            </Link>
          ))
        }
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">

        {/* Obras Ativas */}
        <Card className="md:col-span-5 shadow-sm">
          <CardHeader>
            <CardTitle>Obras</CardTitle>
            <CardDescription>Acompanhamento de progresso e status de todas as obras.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ativas" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="ativas">Em Andamento ({obrasEM.length})</TabsTrigger>
                <TabsTrigger value="concluidas">Concluídas ({obrasOK.length})</TabsTrigger>
                <TabsTrigger value="pausadas">Pausadas ({obrasPau.length})</TabsTrigger>
              </TabsList>

              {([
                { value: "ativas",    obras: obrasEM },
                { value: "concluidas", obras: obrasOK },
                { value: "pausadas",  obras: obrasPau },
              ] as const).map(({ value, obras }) => (
                <TabsContent key={value} value={value} className="space-y-3">
                  {obras.length === 0 && (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Nenhuma obra nesta categoria.
                    </p>
                  )}
                  {obras.map((obra) => (
                    <Link key={obra.id} href={`/obras/${obra.id}`} className="block">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-xl hover:bg-muted/30 transition-colors gap-4">

                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-10 w-10 border shadow-sm">
                            <AvatarFallback className="bg-primary/5 text-primary font-semibold text-xs">
                              {initiais(obra.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold leading-none">{obra.nome}</p>
                            <p className="text-sm text-muted-foreground">{obra.cidade ?? "—"}</p>
                          </div>
                        </div>

                        <div className="flex-1 w-full sm:max-w-[200px]">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Progresso</span>
                            <span className="text-xs font-bold">{obra.progresso}%</span>
                          </div>
                          <Progress value={obra.progresso} className="h-2 w-full" />
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <Badge variant={statusVariant(obra.status)}>{statusLabel(obra.status)}</Badge>
                          <div className="flex items-center text-xs text-muted-foreground font-medium w-20 justify-end">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {obra.dataFim ? formatDataCurta(obra.dataFim) : "—"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Coluna lateral */}
        <div className="md:col-span-2 space-y-6">

          {/* Ações Rápidas */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/obras/nova" className={buttonVariants({ variant: "default", size: "lg", className: "w-full font-semibold" })}>
                <Plus className="mr-2 h-4 w-4" /> Nova Obra
              </Link>
              <Link href="/documentos" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full justify-start text-muted-foreground font-medium" })}>
                <Upload className="mr-2 h-4 w-4" /> Enviar Documento
              </Link>
              <Link href="/obras" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full justify-start text-muted-foreground font-medium" })}>
                <ClipboardList className="mr-2 h-4 w-4" /> Registrar Inspeção
              </Link>
            </CardContent>
          </Card>

          {/* Atividades Recentes (ocorrências abertas) */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Ocorrências Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-muted rounded-full animate-pulse" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && (resumo?.ocorrenciasRecentes ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma ocorrência aberta.
                </p>
              )}
              <div className="space-y-5">
                {(resumo?.ocorrenciasRecentes ?? []).map((oc) => (
                  <div key={oc.id} className="flex items-start gap-4 group">
                    <div className="mt-0.5 bg-muted/50 p-1.5 rounded-full ring-1 ring-border group-hover:bg-muted transition-colors">
                      <OcIcon tipo={oc.tipo} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{oc.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {obraMap[oc.obraId] ?? "—"} · {formatDataCurta(oc.data)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Gráficos Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 border-t pt-8 mt-8">

        {/* Tendência de RDOs */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Tendência de RDOs</CardTitle>
            </div>
            <CardDescription>Relatórios diários registrados nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={resumo?.rdosPorMes ?? []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorInspec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
                    itemStyle={{ fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="count" name="RDOs" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorInspec)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status das Obras (Pie) */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-emerald-500" />
              <CardTitle>Distribuição de Obras</CardTitle>
            </div>
            <CardDescription>Status atual de todas as obras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full flex items-center justify-center">
              {pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma obra cadastrada.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={70} outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
                      itemStyle={{ fontWeight: "bold" }}
                    />
                    <Legend
                      layout="vertical" verticalAlign="middle" align="right"
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px", fontWeight: 500, color: "hsl(var(--muted-foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
