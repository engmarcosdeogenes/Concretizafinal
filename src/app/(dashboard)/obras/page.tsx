"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus, HardHat, FileText, MessageSquare, MapPin, Search, LayoutGrid, List, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const STATUS_MAP = {
  EM_ANDAMENTO: { label: "Ativa", variant: "default" as const },
  PAUSADA: { label: "Em Espera", variant: "secondary" as const },
  CONCLUIDA: { label: "Concluída", variant: "outline" as const },
  PLANEJAMENTO: { label: "Planejamento", variant: "secondary" as const },
  CANCELADA: { label: "Cancelada", variant: "destructive" as const },
}

const TABS = [
  { label: "Todas", value: null },
  { label: "Ativas", value: "EM_ANDAMENTO" },
  { label: "Em Espera", value: "PAUSADA" },
  { label: "Concluídas", value: "CONCLUIDA" },
] as const

function getProgressColorClass(p: number) {
  if (p >= 100) return "bg-emerald-500"
  return "bg-amber-500"
}

export default function ObrasPage() {
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null)
  const [filtroGrupo, setFiltroGrupo] = useState<string | null>(null)
  const [viewGrid, setViewGrid] = useState(true)

  const { data: obras, isLoading } = trpc.obra.listar.useQuery()

  const grupos = [...new Set((obras ?? []).map(o => o.grupo).filter(Boolean))] as string[]

  const obrasFiltradas = (obras ?? []).filter((obra) => {
    const matchBusca = obra.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (obra.cidade ?? "").toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus ? obra.status === filtroStatus : true
    const matchGrupo = filtroGrupo ? obra.grupo === filtroGrupo : true
    return matchBusca && matchStatus && matchGrupo
  })

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Obras</h2>
          <p className="text-muted-foreground mt-0.5">
            Gerencie todas as suas obras em um só lugar.
          </p>
        </div>
        <Link href="/obras/nova" className="btn-orange">
          <Plus className="h-4 w-4" />
          Adicionar Obra
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar obras..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {TABS.map((tab) => {
            const active = filtroStatus === tab.value
            return (
              <Button
                key={tab.label}
                variant={active ? "default" : "outline"}
                onClick={() => setFiltroStatus(tab.value)}
                className="whitespace-nowrap"
              >
                {tab.label}
              </Button>
            )
          })}
          {grupos.length > 0 && (
            <>
              <div className="w-px h-6 bg-border shrink-0" />
              {grupos.map((g) => (
                <Button
                  key={g}
                  variant={filtroGrupo === g ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFiltroGrupo(filtroGrupo === g ? null : g)}
                  className="whitespace-nowrap text-xs"
                >
                  {g}
                </Button>
              ))}
            </>
          )}
        </div>

        <div className="hidden sm:flex items-center bg-card border rounded-md p-1 ml-auto shrink-0 shadow-sm">
          <Button
            variant={viewGrid ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewGrid(true)}
            className="h-8 w-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={!viewGrid ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewGrid(false)}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && obrasFiltradas.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-20 text-center shadow-sm">
          <div className="bg-primary/5 p-4 rounded-full mb-4">
            <HardHat className="text-primary h-10 w-10 opacity-80" />
          </div>
          <CardTitle className="mb-2">
            {busca || filtroStatus ? "Nenhuma obra encontrada" : "Nenhuma obra cadastrada"}
          </CardTitle>
          <CardDescription className="max-w-sm mb-6">
            {busca || filtroStatus
              ? "Tente ajustar seus filtros para encontrar a obra desejada."
              : "Crie sua primeira obra para começar a usar a plataforma."}
          </CardDescription>
          {!busca && !filtroStatus && (
            <Link href="/obras/nova" className="btn-orange">
              <Plus className="h-4 w-4" />
              Adicionar Obra
            </Link>
          )}
        </Card>
      )}

      {/* Grid View */}
      {!isLoading && obrasFiltradas.length > 0 && viewGrid && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {obrasFiltradas.map((obra) => {
            const status = STATUS_MAP[obra.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.PLANEJAMENTO
            return (
              <Link
                key={obra.id}
                href={`/obras/${obra.id}`}
                className="group"
              >
                <Card className="h-full flex flex-col overflow-hidden hover:border-primary/50 transition-colors cursor-pointer shadow-sm hover:shadow-md">
                  {/* Imagem Cover */}
                  <div className="relative h-[180px] w-full bg-muted flex-shrink-0">
                    {obra.imagemUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={obra.imagemUrl} alt={obra.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                        <HardHat className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge variant={status.variant} className="shadow-sm">{status.label}</Badge>
                    </div>
                  </div>

                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="mb-4">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {obra.nome}
                      </CardTitle>
                      {obra.grupo && (
                        <span className="text-xs text-muted-foreground mt-1 block">{obra.grupo}</span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="mt-auto mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground">Progresso</span>
                        <span className="text-xs font-bold">{obra.progresso}%</span>
                      </div>
                      <Progress value={obra.progresso} className="h-2" />
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border my-4" />

                    {/* Stats & Locale */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs font-semibold">{obra._count.rdos}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-xs font-semibold">{obra._count.ocorrencias}</span>
                        </div>
                      </div>

                      {(obra.cidade || obra.estado) && (
                        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-semibold">
                            {[obra.cidade, obra.estado].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* List View */}
      {!isLoading && obrasFiltradas.length > 0 && !viewGrid && (
        <div className="flex flex-col gap-3">
          {obrasFiltradas.map((obra) => {
            const status = STATUS_MAP[obra.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.PLANEJAMENTO
            return (
              <Link
                key={obra.id}
                href={`/obras/${obra.id}`}
                className="group"
              >
                <Card className="flex items-center gap-5 p-4 hover:bg-muted/30 hover:border-primary/50 transition-colors shadow-sm">
                  {/* Imagem Thumbnail */}
                  <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                    {obra.imagemUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={obra.imagemUrl} alt={obra.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HardHat className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className="text-base font-bold truncate group-hover:text-primary transition-colors">
                        {obra.nome}
                      </h3>
                      <Badge variant={status.variant} className="shadow-sm">{status.label}</Badge>
                    </div>
                    {obra.grupo && (
                      <span className="text-xs text-muted-foreground block mb-2">{obra.grupo}</span>
                    )}

                    <div className="flex items-center gap-6">
                      {/* Progress */}
                      <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                        <span className="text-xs font-bold w-8">{obra.progresso}%</span>
                        <Progress value={obra.progresso} className="h-1.5 w-full" />
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-4 border-l pl-6">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-semibold">{obra._count.rdos} RDOs</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-semibold">{obra._count.ocorrencias} Ocorrências</span>
                        </div>
                      </div>

                      {/* Local */}
                      {(obra.cidade || obra.estado) && (
                        <div className="hidden md:flex items-center gap-1.5 text-muted-foreground border-l pl-6 ml-auto">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-semibold">
                            {[obra.cidade, obra.estado].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
