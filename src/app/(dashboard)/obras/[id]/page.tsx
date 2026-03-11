"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useRef, useState } from "react"
import {
  ClipboardList, CheckSquare, AlertTriangle, Users,
  Package, Sun, CloudRain, Wind, TrendingUp, TrendingDown,
  ArrowRight, Clock, CheckCircle2, XCircle, FileText, Edit2, X,
  Camera, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { useRole } from "@/hooks/useRole"

function ClimaIcon({ clima, chuva }: { clima?: string | null; chuva?: boolean }) {
  if (chuva || clima?.toLowerCase().includes("chuva")) return <CloudRain size={13} className="text-blue-400" />
  if (clima?.toLowerCase().includes("vento") || clima?.toLowerCase().includes("nublado")) return <Wind size={13} className="text-slate-400" />
  return <Sun size={13} className="text-amber-400" />
}

function StatusBadgeRDO({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    APROVADO:  { label: "Aprovado",  cls: "bg-green-50 text-green-700" },
    ENVIADO:   { label: "Enviado",   cls: "bg-blue-50 text-blue-700" },
    RASCUNHO:  { label: "Rascunho",  cls: "bg-slate-50 text-slate-600" },
  }
  const s = map[status] ?? map.RASCUNHO
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>{s.label}</span>
}

function PrioridadeDot({ p }: { p: number }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${p === 3 ? "bg-red-500" : p === 2 ? "bg-amber-400" : "bg-slate-300"}`} />
  )
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    EM_ANDAMENTO: "Em Andamento", PLANEJAMENTO: "Planejamento",
    PAUSADA: "Pausada", CONCLUIDA: "Concluída", CANCELADA: "Cancelada",
  }
  return m[s] ?? s
}

function iniciais(nome: string) {
  return nome.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()
}

const STATUS_OPTIONS = [
  { value: "PLANEJAMENTO", label: "Planejamento" },
  { value: "EM_ANDAMENTO", label: "Em Andamento" },
  { value: "PAUSADA",      label: "Pausada" },
  { value: "CONCLUIDA",    label: "Concluída" },
  { value: "CANCELADA",    label: "Cancelada" },
]

const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

function HistoricoObra({ obraId }: { obraId: string }) {
  const { data: historico = [] } = trpc.auditLog.listarPorObra.useQuery({ obraId, take: 20 })
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Histórico de Alterações</h3>
      <div className="space-y-3">
        {historico.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] italic">Nenhum registro ainda.</p>
        )}
        {historico.map(log => (
          <div key={log.id} className="flex items-start gap-2.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-[var(--text-primary)]">{log.usuarioNome}</span>
              {" "}<span className="text-[var(--text-muted)]">{log.acao}</span>
              {" "}<span className="text-[var(--text-muted)] lowercase">{log.entityType}</span>
              <span className="text-[var(--text-muted)] ml-2 opacity-70">· {formatDataCurta(log.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ObraOverviewPage() {
  const params = useParams()
  const id = params.id as string

  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    nome: "", descricao: "", endereco: "", cidade: "", estado: "",
    status: "", progresso: "", orcamento: "", dataInicio: "", dataFim: "",
    grupo: "", numContrato: "", prazoContratualDias: "",
  })
  const [editImagemUrl, setEditImagemUrl] = useState<string | null>(null)
  const [uploadandoCapa, setUploadandoCapa] = useState(false)
  const capaInputRef = useRef<HTMLInputElement>(null)

  const { canEditObra } = useRole()
  const utils = trpc.useUtils()
  const { data: obra, isLoading, isError, refetch } = trpc.obra.buscarPorId.useQuery({ id })

  // Sienge queries — sempre chamados (Rules of Hooks), enabled só quando siengeId existe
  const hasSienge = !!obra?.siengeId
  const { data: pedidosSienge = [] }   = trpc.sienge.listarPedidosPorObra.useQuery({ obraId: id }, { enabled: hasSienge })
  const { data: cotacoesSienge = [] }  = trpc.sienge.listarCotacoes.useQuery({ obraId: id }, { enabled: hasSienge })
  const { data: contratosSienge = [] } = trpc.sienge.listarContratos.useQuery({ obraId: id }, { enabled: hasSienge })
  const { data: estoqueSienge = [] }   = trpc.sienge.listarEstoque.useQuery({ obraId: id }, { enabled: hasSienge })

  const atualizar = trpc.obra.atualizar.useMutation({
    onSuccess: () => {
      utils.obra.buscarPorId.invalidate({ id })
      utils.obra.listar.invalidate()
      setEditOpen(false)
      toast.success("Obra atualizada")
    },
    onError: (e) => toast.error(e.message),
  })

  function abrirModal() {
    if (!obra) return
    setForm({
      nome:               obra.nome,
      descricao:          obra.descricao ?? "",
      endereco:           obra.endereco ?? "",
      cidade:             obra.cidade ?? "",
      estado:             obra.estado ?? "",
      status:             obra.status,
      progresso:          String(obra.progresso ?? 0),
      orcamento:          obra.orcamento ? String(obra.orcamento) : "",
      dataInicio:         obra.dataInicio ? new Date(obra.dataInicio).toISOString().slice(0, 10) : "",
      dataFim:            obra.dataFim    ? new Date(obra.dataFim).toISOString().slice(0, 10) : "",
      grupo:              obra.grupo ?? "",
      numContrato:        obra.numContrato ?? "",
      prazoContratualDias: obra.prazoContratualDias ? String(obra.prazoContratualDias) : "",
    })
    setEditImagemUrl(obra.imagemUrl ?? null)
    setEditOpen(true)
  }

  async function handleUploadCapa(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith("image/")) return
    setUploadandoCapa(true)
    try {
      const ext = file.name.split(".").pop() ?? "jpg"
      const fd = new FormData()
      fd.append("file", file)
      fd.append("path", `obras/capas/${id}-${Date.now()}.${ext}`)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json() as { url?: string; error?: string }
      if (res.ok && json.url) setEditImagemUrl(json.url)
    } finally {
      setUploadandoCapa(false)
    }
  }

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    atualizar.mutate({
      id,
      nome:       form.nome || undefined,
      descricao:  form.descricao || undefined,
      endereco:   form.endereco || undefined,
      cidade:     form.cidade || undefined,
      estado:     form.estado || undefined,
      status:     form.status as "PLANEJAMENTO" | "EM_ANDAMENTO" | "PAUSADA" | "CONCLUIDA" | "CANCELADA" || undefined,
      progresso:  form.progresso ? Number(form.progresso) : undefined,
      orcamento:  form.orcamento ? Number(form.orcamento) : undefined,
      dataInicio: form.dataInicio || undefined,
      dataFim:    form.dataFim    || undefined,
      imagemUrl:           editImagemUrl,
      grupo:               form.grupo || undefined,
      numContrato:         form.numContrato || undefined,
      prazoContratualDias: form.prazoContratualDias ? parseInt(form.prazoContratualDias, 10) : undefined,
    })
  }

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 animate-pulse">
          <div className="h-6 bg-muted rounded w-2/3 mb-3" />
          <div className="h-4 bg-muted rounded w-1/3 mb-4" />
          <div className="h-2 bg-muted rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-border shadow-sm p-4 h-24 animate-pulse"><div className="h-4 bg-muted rounded" /></div>)}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-red-500">Erro ao carregar a obra. Verifique sua conexão.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-orange-500 text-white text-sm rounded-xl hover:bg-orange-600 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!obra) {
    return <div className="p-6 text-sm text-red-500">Obra não encontrada.</div>
  }

  const progresso = obra.progresso ?? 0
  const rdoTotal = obra._count.rdos
  const fvsTotal = obra._count.fvs
  const ocAbertas = obra.ocorrencias.length
  const fvsConformes = obra.fvs.filter(f => f.status === "APROVADO").length

  return (
    <div className="p-6 space-y-5">

      {/* Header da obra */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold">
                {statusLabel(obra.status)}
              </span>
              {obra.cidade && (
                <span className="text-[var(--text-muted)] text-xs">{obra.cidade}{obra.estado ? `/${obra.estado}` : ""}</span>
              )}
            </div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">{obra.nome}</h1>
            {obra.endereco && (
              <p className="text-[var(--text-muted)] text-xs mt-0.5">{obra.endereco}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-3xl font-extrabold text-[var(--text-primary)]">{progresso}%</p>
              <p className="text-[var(--text-muted)] text-xs">Progresso</p>
            </div>
            {canEditObra && (
              <button
                onClick={abrirModal}
                className="p-2 rounded-xl border border-border text-[var(--text-muted)] hover:bg-muted hover:text-[var(--text-primary)] transition-colors"
                title="Editar obra"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${progresso}%`, background: "var(--orange, #f97316)" }}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "RDOs", value: String(rdoTotal),
            sub: rdoTotal === 0 ? "Nenhum registro" : `${rdoTotal} registros`,
            icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50", trend: rdoTotal > 0 ? "up" : "neutral",
          },
          {
            label: "FVS Total", value: String(fvsTotal),
            sub: fvsTotal > 0 ? `${fvsConformes} conformes (recentes)` : "Nenhuma inspeção",
            icon: CheckSquare, color: "text-purple-600", bg: "bg-purple-50",
            trend: (fvsConformes >= fvsTotal && fvsTotal > 0 ? "up" : "down") as "up" | "down",
          },
          {
            label: "Ocorrências", value: String(ocAbertas),
            sub: ocAbertas === 0 ? "Nenhuma aberta" : "Abertas — requer atenção",
            icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50",
            trend: ocAbertas === 0 ? "up" : "down",
          },
          {
            label: "Equipe", value: String(obra.equipe.length),
            sub: obra.equipe.length === 0 ? "Nenhum membro" : "Membros ativos",
            icon: Users, color: "text-teal-600", bg: "bg-teal-50", trend: obra.equipe.length > 0 ? "up" : "neutral",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg, trend }) => (
          <div key={label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={color} />
              </div>
              {trend === "up"
                ? <TrendingUp size={13} className="text-green-500" />
                : <TrendingDown size={13} className="text-red-400" />
              }
            </div>
            <p className="text-xl font-extrabold text-[var(--text-primary)]">{value}</p>
            <p className="text-[var(--text-muted)] text-[11px] mt-0.5">{label}</p>
            <p className="text-[var(--text-muted)] text-[10px] opacity-70 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Card Sienge — só quando integrado */}
      {hasSienge && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package size={13} className="text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Integração Sienge</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-semibold border border-blue-200 ml-auto">Conectado</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Pedidos",     value: pedidosSienge.length,  color: "text-blue-600" },
              { label: "Cotações",    value: cotacoesSienge.length, color: "text-purple-600" },
              { label: "Contratos",   value: contratosSienge.length,color: "text-teal-600" },
              { label: "Est. itens",  value: estoqueSienge.length,  color: "text-orange-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Coluna esquerda (2/3) */}
        <div className="lg:col-span-2 space-y-5">

          {/* RDO — Últimos registros */}
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ClipboardList size={15} className="text-blue-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Relatório Diário de Obra (RDO)</h3>
              </div>
              <Link href={`/obras/${id}/rdo`} className="flex items-center gap-1 text-xs text-[var(--blue)] hover:underline font-medium">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {obra.rdos.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhum RDO registrado ainda.</p>
              ) : obra.rdos.map((rdo) => (
                <div key={rdo.id} className="flex items-center gap-3 px-5 py-3">
                  <ClimaIcon clima={rdo.clima} chuva={rdo.ocorreuChuva} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{formatDataCurta(rdo.data)}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {rdo.responsavel.nome}
                    </p>
                  </div>
                  <StatusBadgeRDO status={rdo.status} />
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <Link href={`/obras/${id}/rdo/novo`} className="btn-orange w-full justify-center text-sm">
                + Novo RDO de hoje
              </Link>
            </div>
          </div>

          {/* FVS — Últimas inspeções */}
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckSquare size={15} className="text-green-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Fichas de Verificação de Serviço (FVS)</h3>
              </div>
              <Link href={`/obras/${id}/fvs`} className="flex items-center gap-1 text-xs text-[var(--blue)] hover:underline font-medium">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>

            <div className="divide-y divide-border">
              {obra.fvs.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhuma FVS registrada ainda.</p>
              ) : obra.fvs.map((fvs) => (
                <div key={fvs.id} className="flex items-center gap-3 px-5 py-3">
                  {fvs.status === "APROVADO"
                    ? <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                    : fvs.status === "REJEITADO" || fvs.status === "RETRABALHO"
                    ? <XCircle size={15} className="text-red-400 flex-shrink-0" />
                    : <Package size={15} className="text-slate-400 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{fvs.servico}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{formatDataCurta(fvs.data)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    fvs.status === "APROVADO"
                      ? "bg-green-50 text-green-700"
                      : fvs.status === "REJEITADO" || fvs.status === "RETRABALHO"
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-50 text-slate-600"
                  }`}>
                    {fvs.status === "APROVADO" ? "Aprovado" : fvs.status === "REJEITADO" ? "Rejeitado" : fvs.status === "RETRABALHO" ? "Retrabalho" : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna direita (1/3) */}
        <div className="space-y-5">

          {/* Info da obra */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
              <FileText size={14} className="text-[var(--text-muted)]" />
              Informações
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "Início",           value: obra.dataInicio ? formatDataCurta(obra.dataInicio) : "—" },
                { label: "Término previsto", value: obra.dataFim    ? formatDataCurta(obra.dataFim)    : "—" },
                { label: "Orçamento",        value: obra.orcamento  ? `R$ ${obra.orcamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—" },
                ...(obra.numContrato        ? [{ label: "Contrato",  value: obra.numContrato }] : []),
                ...(obra.prazoContratualDias ? [{ label: "Prazo",    value: `${obra.prazoContratualDias} dias` }] : []),
                ...(obra.grupo              ? [{ label: "Grupo",    value: obra.grupo }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                  <span className="text-xs text-[var(--text-muted)]">{label}</span>
                  <span className="text-xs font-medium text-[var(--text-primary)]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ocorrências abertas */}
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ocorrências Abertas</h3>
              </div>
              {ocAbertas > 0 && (
                <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold flex items-center justify-center">
                  {ocAbertas}
                </span>
              )}
            </div>
            <div className="divide-y divide-border">
              {obra.ocorrencias.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[var(--text-muted)]">Nenhuma ocorrência aberta.</p>
              ) : obra.ocorrencias.map((oc) => (
                <div key={oc.id} className="px-5 py-3 flex items-start gap-2">
                  <PrioridadeDot p={oc.prioridade} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">{oc.titulo}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                      <Clock size={9} />
                      {oc.tipo} · {formatDataCurta(oc.data)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <Link href={`/obras/${id}/ocorrencias`} className="text-xs text-[var(--blue)] hover:underline font-medium flex items-center gap-1">
                Ver todas as ocorrências <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* Equipe */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Users size={14} className="text-[var(--text-muted)]" />
                Equipe ({obra.equipe.length})
              </h3>
              <Link href={`/obras/${id}/equipe`} className="text-xs text-[var(--blue)] hover:underline">
                Gerenciar
              </Link>
            </div>
            {obra.equipe.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">Nenhum membro ativo.</p>
            ) : (
              <div className="space-y-2">
                {obra.equipe.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[var(--blue)] rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {iniciais(m.nome)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{m.nome}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{m.funcao}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico de Alterações */}
      <HistoricoObra obraId={id} />

      {/* Modal de edição da obra */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-white">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Edit2 size={16} className="text-orange-500" />
                Editar Obra
              </h2>
              <button onClick={() => setEditOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-[var(--text-muted)] hover:bg-muted transition-colors">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-5 space-y-4">

              {/* Foto de capa */}
              <div>
                <label className={labelCls}>Foto de Capa</label>
                <div
                  onClick={() => !uploadandoCapa && capaInputRef.current?.click()}
                  className="relative w-full h-32 rounded-xl border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-orange-300 transition-colors group"
                >
                  {editImagemUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editImagemUrl} alt="Capa" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-slate-700">
                          <Camera size={13} /> Trocar foto
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditImagemUrl(null) }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                      {uploadandoCapa
                        ? <Loader2 size={20} className="text-orange-500 animate-spin" />
                        : <Camera size={20} className="text-[var(--text-muted)] group-hover:text-orange-500 transition-colors" />
                      }
                      <p className="text-xs text-[var(--text-muted)] group-hover:text-orange-600 transition-colors">
                        {uploadandoCapa ? "Enviando..." : "Adicionar foto de capa"}
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={capaInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleUploadCapa(e.target.files)}
                />
              </div>

              <div>
                <label className={labelCls}>Nome da obra <span className="text-red-500">*</span></label>
                <input required type="text" value={form.nome} onChange={e => set("nome", e.target.value)}
                  className={inputCls} placeholder="Nome da obra" />
              </div>

              <div>
                <label className={labelCls}>Descrição</label>
                <textarea value={form.descricao} onChange={e => set("descricao", e.target.value)}
                  rows={2} className={`${inputCls} resize-none`} placeholder="Descrição opcional" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls}>
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Progresso (%)</label>
                  <input type="number" min="0" max="100" value={form.progresso}
                    onChange={e => set("progresso", e.target.value)} className={inputCls} placeholder="0" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Endereço</label>
                <input type="text" value={form.endereco} onChange={e => set("endereco", e.target.value)}
                  className={inputCls} placeholder="Rua, número..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input type="text" value={form.cidade} onChange={e => set("cidade", e.target.value)}
                    className={inputCls} placeholder="São Paulo" />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <input type="text" value={form.estado} onChange={e => set("estado", e.target.value)}
                    className={inputCls} placeholder="SP" maxLength={2} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Grupo / Regional</label>
                <input type="text" value={form.grupo} onChange={e => set("grupo", e.target.value)}
                  className={inputCls} placeholder="Ex: Goiânia, FNDE, Cliente ABC..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>N° do Contrato</label>
                  <input type="text" value={form.numContrato} onChange={e => set("numContrato", e.target.value)}
                    className={inputCls} placeholder="Ex: 034/2025" />
                </div>
                <div>
                  <label className={labelCls}>Prazo Contratual (dias)</label>
                  <input type="number" min="1" value={form.prazoContratualDias} onChange={e => set("prazoContratualDias", e.target.value)}
                    className={inputCls} placeholder="Ex: 389" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Orçamento (R$)</label>
                <input type="number" min="0" step="0.01" value={form.orcamento}
                  onChange={e => set("orcamento", e.target.value)} className={inputCls} placeholder="0,00" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Data de início</label>
                  <input type="date" value={form.dataInicio} onChange={e => set("dataInicio", e.target.value)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Previsão de término</label>
                  <input type="date" value={form.dataFim} onChange={e => set("dataFim", e.target.value)}
                    className={inputCls} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={atualizar.isPending}
                  className="btn-orange min-h-[44px] flex-1 justify-center disabled:opacity-60">
                  {atualizar.isPending ? "Salvando..." : "Salvar alterações"}
                </button>
                <button type="button" onClick={() => setEditOpen(false)}
                  className="btn-ghost min-h-[44px] flex-1 justify-center">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
