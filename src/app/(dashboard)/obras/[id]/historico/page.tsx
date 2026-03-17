"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import {
  Clock,
  Loader2,
  History,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react"
import { useHistoricoObra } from "@/hooks/useObrasGestao"

// ─── Helpers ────────────────────────────────────────────────────────────────

function tempoRelativo(data: string | Date): string {
  const agora = Date.now()
  const ts = new Date(data).getTime()
  const diff = agora - ts
  const seg = Math.floor(diff / 1000)
  if (seg < 60) return "agora mesmo"
  const min = Math.floor(seg / 60)
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} hora${h !== 1 ? "s" : ""}`
  const d = Math.floor(h / 24)
  if (d === 1) return "ontem"
  if (d < 7) return `há ${d} dias`
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function labelGrupo(data: string | Date): string {
  const hoje = new Date()
  const d = new Date(data)
  const diffDias = Math.floor(
    (hoje.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / 86400000,
  )
  if (diffDias === 0) return "Hoje"
  if (diffDias === 1) return "Ontem"
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function chaveGrupo(data: string | Date): string {
  return new Date(data).toLocaleDateString("pt-BR")
}

// ─── Ícone e cor por ação ────────────────────────────────────────────────────

type AcaoInfo = { Icon: React.ElementType; bg: string; fg: string; label: string }

function acaoInfo(acao: string): AcaoInfo {
  const a = acao.toUpperCase()
  if (a.includes("CRIA") || a.includes("ADICION") || a === "CREATE" || a === "INSERT")
    return { Icon: Plus,   bg: "bg-green-100",  fg: "text-green-600",  label: "criou" }
  if (a.includes("DELET") || a.includes("REMOV") || a === "DELETE" || a.includes("EXCLU"))
    return { Icon: Trash2, bg: "bg-red-100",    fg: "text-red-600",    label: "excluiu" }
  return   { Icon: Pencil, bg: "bg-blue-100",   fg: "text-blue-600",   label: "atualizou" }
}

// ─── Mapa de nomes legíveis para entityType ──────────────────────────────────

const ENTITY_LABELS: Record<string, string> = {
  RDO:           "RDO",
  FVS:           "FVS",
  FVM:           "FVM",
  OCORRENCIA:    "Ocorrência",
  EQUIPE:        "Equipe",
  MATERIAL:      "Material",
  DOCUMENTO:     "Documento",
  FINANCEIRO:    "Financeiro",
  CHECKLIST:     "Checklist",
  OBRA:          "Obra",
  MEDICAO:       "Medição",
  CONTRATO:      "Contrato",
  TAREFA:        "Tarefa",
  ALMOXARIFADO:  "Almoxarifado",
  ORCAMENTO:     "Orçamento",
}

function labelEntidade(entityType: string): string {
  return ENTITY_LABELS[entityType.toUpperCase()] ?? entityType
}

// ─── Tipo do AuditLog ────────────────────────────────────────────────────────

interface AuditLogItem {
  id: string
  entityType: string
  entityId: string
  acao: string
  usuarioNome: string
  detalhes?: string | null
  createdAt: string | Date
}

// ─── Componente de um item na timeline ──────────────────────────────────────

function TimelineItem({ item, isLast }: { item: AuditLogItem; isLast: boolean }) {
  const [expandido, setExpandido] = useState(false)
  const { Icon, bg, fg, label } = acaoInfo(item.acao)

  return (
    <div className="flex gap-3 relative">
      {/* Linha vertical conectando os itens */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
      )}

      {/* Ícone */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ring-2 ring-white ${bg}`}
      >
        <Icon size={14} className={fg} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 pb-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-[var(--text-primary)] leading-snug">
            <span className="font-semibold">{item.usuarioNome}</span>{" "}
            <span className="text-[var(--text-muted)]">{label}</span>{" "}
            <span className="font-medium">{labelEntidade(item.entityType)}</span>
          </p>
          <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0 mt-0.5">
            {tempoRelativo(item.createdAt)}
          </span>
        </div>

        {/* Ação raw como badge */}
        <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide bg-muted text-[var(--text-muted)] px-2 py-0.5 rounded-full border border-border">
          {item.acao}
        </span>

        {/* Detalhes expansíveis */}
        {item.detalhes && (
          <div className="mt-1.5">
            <button
              onClick={() => setExpandido((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {expandido ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {expandido ? "Ocultar detalhes" : "Ver detalhes"}
            </button>
            {expandido && (
              <p className="mt-1 text-xs text-[var(--text-muted)] bg-muted/60 rounded-lg px-3 py-2 border border-border font-mono break-all">
                {item.detalhes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

const TAKE_STEP = 30

export default function HistoricoObraPage() {
  const { id } = useParams<{ id: string }>()
  const [take, setTake] = useState(TAKE_STEP)
  const [filtroEntidade, setFiltroEntidade] = useState<string>("TODAS")

  const { historico, isLoading, error, refetch } = useHistoricoObra(id, take)

  // Tipos únicos de entidade presentes nos dados
  const tiposEntidade = useMemo(() => {
    const set = new Set<string>()
    historico.forEach((h) => set.add(h.entityType))
    return Array.from(set).sort()
  }, [historico])

  // Filtro aplicado
  const historicoFiltrado = useMemo(() => {
    if (filtroEntidade === "TODAS") return historico as AuditLogItem[]
    return (historico as AuditLogItem[]).filter(
      (h) => h.entityType.toUpperCase() === filtroEntidade,
    )
  }, [historico, filtroEntidade])

  // Agrupar por data
  const grupos = useMemo(() => {
    const map = new Map<string, { label: string; items: AuditLogItem[] }>()
    historicoFiltrado.forEach((item) => {
      const chave = chaveGrupo(item.createdAt)
      if (!map.has(chave)) {
        map.set(chave, { label: labelGrupo(item.createdAt), items: [] })
      }
      map.get(chave)!.items.push(item)
    })
    return Array.from(map.entries())
  }, [historicoFiltrado])

  const podeMaisCarregar = historico.length === take

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Clock size={18} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Histórico da Obra
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Registro de alterações e atividades (audit log)
          </p>
        </div>
      </div>

      {/* Filtro por entidade */}
      {tiposEntidade.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Filter size={13} />
            <span className="font-medium">Filtrar por:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFiltroEntidade("TODAS")}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                filtroEntidade === "TODAS"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-[var(--text-muted)] border-border hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              Todas
            </button>
            {tiposEntidade.map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroEntidade(tipo.toUpperCase())}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  filtroEntidade === tipo.toUpperCase()
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-[var(--text-muted)] border-border hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                {labelEntidade(tipo)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between">
          <span>Erro ao carregar histórico: {error.message}</span>
          <button
            onClick={() => refetch()}
            className="text-xs font-semibold underline ml-3 hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && historicoFiltrado.length === 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-12 text-center">
          <History size={36} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Nenhuma ação registrada ainda
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {filtroEntidade === "TODAS"
              ? "Ações realizadas nesta obra aparecerão aqui."
              : `Nenhuma ação registrada para "${labelEntidade(filtroEntidade)}".`}
          </p>
        </div>
      )}

      {/* Timeline agrupada por data */}
      {!isLoading && grupos.length > 0 && (
        <div className="space-y-6">
          {grupos.map(([chave, { label, items }]) => (
            <div key={chave}>
              {/* Cabeçalho do grupo */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {label}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-[var(--text-muted)] bg-muted px-2 py-0.5 rounded-full border border-border">
                  {items.length} {items.length === 1 ? "evento" : "eventos"}
                </span>
              </div>

              {/* Itens da timeline */}
              <div className="bg-white rounded-2xl border border-border shadow-sm px-5 pt-5 pb-1">
                {items.map((item, idx) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    isLast={idx === items.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Carregar mais */}
          {podeMaisCarregar && (
            <div className="text-center pt-2">
              <button
                onClick={() => setTake((v) => v + TAKE_STEP)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-[var(--text-primary)] hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm"
              >
                <ChevronDown size={15} />
                Carregar mais
              </button>
            </div>
          )}

          {/* Contador total */}
          <p className="text-center text-[11px] text-[var(--text-muted)]">
            Exibindo {historicoFiltrado.length} de {historico.length} registro
            {historico.length !== 1 ? "s" : ""}
            {filtroEntidade !== "TODAS" && ` filtrados por "${labelEntidade(filtroEntidade)}"`}
          </p>
        </div>
      )}
    </div>
  )
}
