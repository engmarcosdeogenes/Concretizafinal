"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ClipboardList, AlertTriangle, CheckSquare,
  DollarSign, Printer, HardHat, CalendarRange, Download,
  History, ExternalLink, Trash2,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const TIPOS_RELATORIO = [
  {
    id: "rdo",
    title: "Diário de Obra (RDO)",
    description: "Atividades, equipe e clima registrados por data",
    icon: ClipboardList,
    color: "#10b981",
    bg: "bg-emerald-100/50",
    needsObra: false,
  },
  {
    id: "ocorrencias",
    title: "Ocorrências",
    description: "Registro de ocorrências abertas e resolvidas",
    icon: AlertTriangle,
    color: "#ef4444",
    bg: "bg-red-100/50",
    needsObra: true,
  },
  {
    id: "fvs",
    title: "Inspeções FVS",
    description: "Fichas de verificação de serviço por obra",
    icon: CheckSquare,
    color: "#8b5cf6",
    bg: "bg-violet-100/50",
    needsObra: true,
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Receitas, despesas e saldo por obra",
    icon: DollarSign,
    color: "#3b82f6",
    bg: "bg-blue-100/50",
    needsObra: true,
  },
  {
    id: "semana",
    title: "Relatório Semanal",
    description: "Resumo da semana: RDOs, equipe e atividades em PDF",
    icon: CalendarRange,
    color: "#f97316",
    bg: "bg-orange-100/50",
    needsObra: true,
  },
]

const TIPO_TITULO: Record<string, string> = {
  rdo: "Diário de Obra",
  ocorrencias: "Ocorrências",
  fvs: "Inspeções FVS",
  financeiro: "Financeiro",
  semana: "Semanal PDF",
}

const STORAGE_KEY = "concretiza_relatorios_historico"
const MAX_HISTORY = 10

interface HistoricoItem {
  id: string
  tipo: string
  obraId: string
  obraNome: string
  dataInicio?: string
  geradoEm: string // ISO string
  url: string
}

// Calcula a segunda-feira da semana corrente
function getMonday(d: Date = new Date()): string {
  const day  = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon  = new Date(d)
  mon.setDate(d.getDate() + diff)
  return mon.toISOString().slice(0, 10)
}

function formatRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)  return "agora mesmo"
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `há ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1)  return "ontem"
  if (d < 7)    return `há ${d} dias`
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

export default function RelatoriosPage() {
  const [obraId,     setObraId]     = useState("")
  const [tipo,       setTipo]       = useState<string | null>(null)
  const [dataInicio, setDataInicio] = useState(getMonday)
  const [historico,  setHistorico]  = useState<HistoricoItem[]>([])

  const { data: obras = [] } = trpc.obra.listar.useQuery()
  const obraSel = obras.find(o => o.id === obraId)
  const tipoSel = TIPOS_RELATORIO.find(t => t.id === tipo)

  const podeGerar = !!tipo && (!tipoSel?.needsObra || !!obraId)

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setHistorico(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  function salvarHistorico(item: HistoricoItem) {
    const novo = [item, ...historico].slice(0, MAX_HISTORY)
    setHistorico(novo)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novo))
    } catch {
      // ignore
    }
  }

  function limparHistorico() {
    setHistorico([])
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  function gerarRelatorio() {
    if (!tipo) return

    let url: string

    if (tipo === "semana") {
      url = `/api/pdf/semana?obraId=${obraId}&dataInicio=${dataInicio}`
    } else {
      const params = new URLSearchParams({ tipo })
      if (obraId) params.set("obraId", obraId)
      url = `/relatorios/preview?${params.toString()}`
    }

    window.open(url, "_blank")

    salvarHistorico({
      id: Date.now().toString(),
      tipo,
      obraId,
      obraNome: obraSel?.nome ?? (obraId ? obraId : "Todas as obras"),
      dataInicio: tipo === "semana" ? dataInicio : undefined,
      geradoEm: new Date().toISOString(),
      url,
    })
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-muted-foreground mt-0.5">Gere relatórios prontos para impressão ou exportação em PDF.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">

          {/* 1. Tipo */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">1. Escolha o tipo de relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {TIPOS_RELATORIO.map(({ id, title, description, icon: Icon, color, bg }) => (
                  <button key={id} onClick={() => setTipo(id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      tipo === id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 2. Filtros */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">2. Configurar filtros</CardTitle>
              <CardDescription>
                {tipoSel?.needsObra ? "Selecione a obra (obrigatório para este tipo)." : "Filtre por obra ou deixe em branco para todas."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={obraId} onValueChange={(v) => setObraId(v === "all" ? "" : (v ?? ""))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
                <SelectContent>
                  {!tipoSel?.needsObra && <SelectItem value="all">Todas as obras</SelectItem>}
                  {obras.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {obraSel && (
                <div className="text-sm">
                  <span className="text-muted-foreground mr-1">Obra selecionada:</span>
                  <Badge variant="outline" className="bg-primary/5 font-semibold text-primary">{obraSel.nome}</Badge>
                </div>
              )}

              {/* Semana seleção de data */}
              {tipo === "semana" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Semana (início — segunda-feira)
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Gerar */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <button
                  onClick={gerarRelatorio}
                  disabled={!podeGerar}
                  className="btn-download self-start text-base px-6 py-3"
                >
                  {tipo === "semana" ? (
                    <><Download size={18} />Baixar PDF Semanal</>
                  ) : (
                    <><Printer size={18} />Gerar e Visualizar</>
                  )}
                </button>
                <p className="text-xs text-muted-foreground">
                  {!tipo
                    ? "Selecione o tipo de relatório para continuar."
                    : tipoSel?.needsObra && !obraId
                      ? "Este relatório exige a seleção de uma obra."
                      : tipo === "semana"
                        ? "O PDF semanal será baixado diretamente."
                        : "O relatório abrirá em nova aba formatado para impressão."}
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6">

          {/* Histórico de relatórios gerados */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History size={16} className="text-muted-foreground" />
                    Histórico Recente
                  </CardTitle>
                  <CardDescription className="mt-0.5">Últimos {MAX_HISTORY} relatórios gerados</CardDescription>
                </div>
                {historico.length > 0 && (
                  <button
                    onClick={limparHistorico}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                    title="Limpar histórico"
                  >
                    <Trash2 size={13} />
                    Limpar
                  </button>
                )}
              </div>
            </CardHeader>
            <div className="flex flex-col max-h-[280px] overflow-y-auto">
              {historico.length === 0 ? (
                <div className="py-10 text-center">
                  <History size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum relatório gerado ainda.</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">O histórico aparece aqui após gerar.</p>
                </div>
              ) : (
                historico.map((item) => {
                  const tipoInfo = TIPOS_RELATORIO.find(t => t.id === item.tipo)
                  const Icon = tipoInfo?.icon ?? ClipboardList
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors group"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: tipoInfo?.color ? `${tipoInfo.color}18` : "#f1f5f9" }}
                      >
                        <Icon size={14} style={{ color: tipoInfo?.color ?? "#64748b" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {TIPO_TITULO[item.tipo] ?? item.tipo}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.obraNome}
                          {item.dataInicio && <span className="ml-1 opacity-60">· {item.dataInicio}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground">{formatRelativo(item.geradoEm)}</span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Reabrir relatório"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Atalhos por obra */}
          {obras.length > 0 && (
            <Card className="shadow-sm flex flex-col max-h-[340px]">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-base">Acesso Rápido por Obra</CardTitle>
                <CardDescription>Módulos de preenchimento e PDF individuais</CardDescription>
              </CardHeader>
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col">
                  {obras.slice(0, 6).map(obra => (
                    <div
                      key={obra.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <HardHat size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{obra.nome}</p>
                          {obra.dataFim && (
                            <p className="text-xs text-muted-foreground">Entrega: {formatDataCurta(obra.dataFim)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        {[
                          { label: "RDO", href: `/obras/${obra.id}/rdo` },
                          { label: "FVS", href: `/obras/${obra.id}/fvs` },
                          { label: "R$",  href: `/obras/${obra.id}/financeiro` },
                        ].map(({ label, href }) => (
                          <Link
                            key={label}
                            href={href}
                            className="h-7 px-2.5 text-xs flex-1 sm:flex-none flex items-center justify-center border border-border rounded-lg hover:bg-muted transition-colors font-medium text-foreground"
                          >
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
