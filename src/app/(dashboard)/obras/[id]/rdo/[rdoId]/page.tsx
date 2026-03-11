"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Sun, Cloud, CloudRain, Wind, CheckCircle2, Clock, AlertCircle, Users, ClipboardList, Send, ThumbsUp, Download, Camera, Link2, Pen, Package, Plus, Trash2, Save, Eye } from "lucide-react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc/client"
import { formatDataLonga, diaSemanaNome } from "@/lib/format"
import { UploadFotos } from "@/components/obras/UploadFotos"
import { AssinaturaCanvas } from "@/components/obras/AssinaturaCanvas"

function ClimaIcon({ clima }: { clima?: string | null }) {
  if (clima === "chuva")   return <CloudRain size={18} className="text-blue-400" />
  if (clima === "nublado") return <Cloud size={18} className="text-slate-400" />
  if (clima === "vento")   return <Wind size={18} className="text-slate-500" />
  return <Sun size={18} className="text-amber-400" />
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    APROVADO:  { label: "Aprovado",  cls: "bg-green-50 text-green-700 border border-green-200", Icon: CheckCircle2 },
    ENVIADO:   { label: "Enviado",   cls: "bg-blue-50 text-blue-700 border border-blue-200",   Icon: Clock },
    RASCUNHO:  { label: "Rascunho",  cls: "bg-slate-50 text-slate-600 border border-slate-200", Icon: AlertCircle },
    REJEITADO: { label: "Rejeitado", cls: "bg-red-50 text-red-700 border border-red-200",      Icon: AlertCircle },
  }
  const s = map[status as keyof typeof map] ?? map.RASCUNHO
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      <s.Icon size={12} />
      {s.label}
    </span>
  )
}

const PRESENCA_MAP: Record<string, { label: string; cls: string }> = {
  PRESENTE:          { label: "Presente",    cls: "bg-green-50 text-green-700" },
  AFASTADO:          { label: "Afastado",    cls: "bg-orange-50 text-orange-700" },
  ATESTADO:          { label: "Atestado",    cls: "bg-orange-50 text-orange-700" },
  FALTA_JUSTIFICADA: { label: "Falta Just.", cls: "bg-orange-50 text-orange-700" },
  FERIAS:            { label: "Férias",      cls: "bg-blue-50 text-blue-700" },
  FOLGA:             { label: "Folga",       cls: "bg-blue-50 text-blue-700" },
  LICENCA:           { label: "Licença",     cls: "bg-blue-50 text-blue-700" },
  VIAGEM:            { label: "Viagem",      cls: "bg-blue-50 text-blue-700" },
  TREINAMENTO:       { label: "Treinamento", cls: "bg-purple-50 text-purple-700" },
  DESLOCANDO:        { label: "Deslocando",  cls: "bg-slate-50 text-slate-600" },
}

function PresencaBadge({ status }: { status: string }) {
  const s = PRESENCA_MAP[status] ?? PRESENCA_MAP.PRESENTE
  if (status === "PRESENTE") return <span className="text-[10px] text-green-600 font-semibold">Presente</span>
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  )
}

const DEFAULT_LABELS = [
  "Responsável Técnico",
  "Mestre de Obras",
  "Representante do Contratante",
  "Encarregado",
]

type AssinaturaLocal = { label: string; imagemUrl: string | null }
type MaterialLocal = { materialNome: string; quantidade: number; unidade: string; extra: string }

export default function RdoDetalhePage() {
  const params = useParams()
  const obraId = params.id as string
  const rdoId  = params.rdoId as string
  const router = useRouter()

  // Assinaturas state
  const [assinaturas, setAssinaturas] = useState<AssinaturaLocal[]>([])
  const [assinaturasIniciadas, setAssinaturasIniciadas] = useState(false)

  // Materiais state
  const [recebidos, setRecebidos] = useState<MaterialLocal[]>([])
  const [utilizados, setUtilizados] = useState<MaterialLocal[]>([])
  const [materiaisIniciados, setMateriaisIniciados] = useState(false)

  const utils = trpc.useUtils()

  const { data: rdo, isLoading, error } = trpc.rdo.buscarPorId.useQuery({ id: rdoId })
  const { data: camposPersonalizados = [] } = trpc.configuracoes.buscarCamposPersonalizados.useQuery()

  // Registrar visualização ao montar
  const registrarView = trpc.rdo.registrarVisualizacao.useMutation()
  useEffect(() => {
    if (rdoId) registrarView.mutate({ id: rdoId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdoId])

  // Inicializar assinaturas e materiais quando o RDO carregar
  useEffect(() => {
    if (!rdo) return
    if (!assinaturasIniciadas) {
      setAssinaturas(
        rdo.assinaturas.length > 0
          ? rdo.assinaturas.map(a => ({ label: a.label, imagemUrl: a.imagemUrl }))
          : [{ label: DEFAULT_LABELS[0], imagemUrl: null }]
      )
      setAssinaturasIniciadas(true)
    }
    if (!materiaisIniciados) {
      setRecebidos(rdo.materiaisRecebidos.map(m => ({
        materialNome: m.materialNome, quantidade: m.quantidade,
        unidade: m.unidade ?? "", extra: m.fornecedor ?? "",
      })))
      setUtilizados(rdo.materiaisUtilizados.map(m => ({
        materialNome: m.materialNome, quantidade: m.quantidade,
        unidade: m.unidade ?? "", extra: m.localAplicado ?? "",
      })))
      setMateriaisIniciados(true)
    }
  }, [rdo, assinaturasIniciadas, materiaisIniciados])

  const atualizarStatus = trpc.rdo.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.rdo.buscarPorId.invalidate({ id: rdoId })
      utils.rdo.listar.invalidate({ obraId })
    },
  })

  const salvarAssinaturas = trpc.rdo.salvarAssinaturas.useMutation({
    onSuccess: () => { utils.rdo.buscarPorId.invalidate({ id: rdoId }); toast.success("Assinaturas salvas!") },
    onError: (e) => toast.error(e.message),
  })

  const salvarMateriais = trpc.rdo.salvarMateriais.useMutation({
    onSuccess: () => { utils.rdo.buscarPorId.invalidate({ id: rdoId }); toast.success("Materiais salvos!") },
    onError: (e) => toast.error(e.message),
  })

  function handleSalvarAssinaturas() {
    salvarAssinaturas.mutate({
      rdoId,
      assinaturas: assinaturas.map((a, i) => ({ label: a.label, imagemUrl: a.imagemUrl, ordem: i })),
    })
  }

  function handleSalvarMateriais() {
    salvarMateriais.mutate({
      rdoId,
      recebidos: recebidos.filter(m => m.materialNome.trim()).map(m => ({
        materialNome: m.materialNome, quantidade: m.quantidade,
        unidade: m.unidade || undefined, fornecedor: m.extra || undefined,
      })),
      utilizados: utilizados.filter(m => m.materialNome.trim()).map(m => ({
        materialNome: m.materialNome, quantidade: m.quantidade,
        unidade: m.unidade || undefined, localAplicado: m.extra || undefined,
      })),
    })
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Carregando RDO...</p>
      </div>
    )
  }

  if (error || !rdo) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">RDO não encontrado.</p>
        <Link href={`/obras/${obraId}/rdo`} className="text-sm text-orange-500 mt-2 inline-block">← Voltar para lista</Link>
      </div>
    )
  }

  const totalEquipe = rdo.equipe.reduce((sum, e) => sum + e.quantidade, 0)
  const nextStatus = rdo.status === "RASCUNHO" ? "ENVIADO" : rdo.status === "ENVIADO" ? "APROVADO" : null

  // Prazo contratual
  const diasDecorridos = rdo.obra.dataInicio
    ? Math.floor((Date.now() - new Date(rdo.obra.dataInicio).getTime()) / 86_400_000)
    : 0
  const diasAVencer = rdo.obra.prazoContratualDias != null
    ? rdo.obra.prazoContratualDias - diasDecorridos
    : null
  const pctDecorrido = rdo.obra.prazoContratualDias
    ? Math.min(100, Math.round((diasDecorridos / rdo.obra.prazoContratualDias) * 100))
    : 0
  const prazoColor = diasAVencer == null ? "" : diasAVencer <= 0 ? "text-red-600" : pctDecorrido >= 70 ? "text-amber-600" : "text-green-600"

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/obras/${obraId}/rdo`}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-border bg-white hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-bold text-xl flex items-center gap-2">
            <ClipboardList size={20} className="text-orange-500 flex-shrink-0" />
            RDO — {diaSemanaNome(rdo.data)}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{formatDataLonga(rdo.data)}</p>
        </div>
        {rdo.siengeReportId && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
            <Link2 size={11} />
            Sienge #{rdo.siengeReportId}
          </span>
        )}
        <a
          href={`/api/pdf/rdo/${rdoId}`}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost min-h-[44px] flex-shrink-0"
          title="Baixar PDF"
        >
          <Download size={15} />
          Baixar PDF
        </a>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Clima */}
            <div className="flex items-center gap-2">
              <ClimaIcon clima={rdo.clima} />
              <span className="text-sm font-medium text-[var(--text-primary)] capitalize">
                {rdo.clima ?? "—"}
              </span>
            </div>

            {/* Temperatura */}
            {(rdo.temperaturaMin != null || rdo.temperaturaMax != null) && (
              <span className="text-sm text-[var(--text-muted)]">
                {rdo.temperaturaMin != null && rdo.temperaturaMax != null
                  ? `${rdo.temperaturaMin}°C / ${rdo.temperaturaMax}°C`
                  : rdo.temperaturaMax != null
                  ? `${rdo.temperaturaMax}°C`
                  : `${rdo.temperaturaMin}°C`}
              </span>
            )}

            {/* Chuva */}
            {rdo.ocorreuChuva && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                🌧️ Ocorreu chuva
              </span>
            )}

            {/* Status */}
            <StatusBadge status={rdo.status} />
          </div>

          {/* Responsável */}
          <p className="text-xs text-[var(--text-muted)]">
            Responsável: <span className="font-medium text-[var(--text-primary)]">{rdo.responsavel.nome}</span>
          </p>
        </div>

        {/* Status action */}
        {nextStatus && (
          <div className="mt-4 pt-4 border-t border-border">
            <button
              type="button"
              disabled={atualizarStatus.isPending}
              onClick={() => atualizarStatus.mutate({ id: rdoId, status: nextStatus })}
              className="btn-orange min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {nextStatus === "ENVIADO" ? <Send size={14} /> : <ThumbsUp size={14} />}
              {atualizarStatus.isPending
                ? "Salvando..."
                : nextStatus === "ENVIADO"
                ? "Enviar RDO"
                : "Aprovar RDO"}
            </button>
          </div>
        )}
      </div>

      {/* Prazo Contratual */}
      {(rdo.obra.numContrato || rdo.obra.prazoContratualDias) && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
          <div className="flex items-center flex-wrap gap-x-5 gap-y-1 text-sm">
            {rdo.obra.numContrato && (
              <span className="text-[var(--text-muted)]">
                Contrato: <span className="font-semibold text-[var(--text-primary)]">{rdo.obra.numContrato}</span>
              </span>
            )}
            {rdo.obra.prazoContratualDias && (
              <>
                <span className="text-[var(--text-muted)]">
                  Prazo: <span className="font-semibold text-[var(--text-primary)]">{rdo.obra.prazoContratualDias} dias</span>
                </span>
                <span className="text-[var(--text-muted)]">
                  Decorrido: <span className="font-semibold text-[var(--text-primary)]">{diasDecorridos} dias ({pctDecorrido}%)</span>
                </span>
                {diasAVencer != null && (
                  <span className={`font-semibold ${prazoColor}`}>
                    {diasAVencer <= 0 ? `Vencido há ${Math.abs(diasAVencer)} dias` : `A vencer: ${diasAVencer} dias`}
                  </span>
                )}
              </>
            )}
          </div>
          {rdo.obra.prazoContratualDias && (
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pctDecorrido >= 100 ? "bg-red-500" : pctDecorrido >= 70 ? "bg-amber-400" : "bg-green-500"}`}
                style={{ width: `${Math.min(100, pctDecorrido)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Atividades */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Atividades realizadas</h3>
        {rdo.atividades.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic">Nenhuma atividade registrada.</p>
        ) : (
          <div className="space-y-2">
            {rdo.atividades.map((a, i) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <span className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5 w-5 text-right flex-shrink-0">{i + 1}.</span>
                <p className="text-sm text-[var(--text-primary)] flex-1">{a.descricao}</p>
                {(a.quantidade != null || a.unidade) && (
                  <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                    {a.quantidade != null ? a.quantidade : ""}{a.unidade ? ` ${a.unidade}` : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipe */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Equipe</h3>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
            <Users size={14} className="text-orange-500" />
            {totalEquipe} total
          </div>
        </div>
        {rdo.equipe.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic">Nenhum membro registrado.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Função</th>
                  <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Qtd.</th>
                  <th className="text-right px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {rdo.equipe.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-4 py-2.5 text-[var(--text-primary)]">{e.funcao}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">{e.quantidade}</td>
                    <td className="px-4 py-2.5 text-right">
                      <PresencaBadge status={e.statusPresenca} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campos Personalizados */}
      {camposPersonalizados.length > 0 && rdo.valoresCamposPersonalizados && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Campos Personalizados</h3>
          <div className="grid grid-cols-2 gap-3">
            {camposPersonalizados.map(campo => {
              const valores = rdo.valoresCamposPersonalizados as Record<string, unknown>
              const val = valores?.[campo.id]
              if (val == null || val === "") return null
              return (
                <div key={campo.id}>
                  <p className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wide mb-0.5">{campo.nome}</p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {campo.tipo === "BOOLEAN" ? (val ? "Sim" : "Não") : String(val)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Observações */}
      {rdo.observacoes && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Observações</h3>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{rdo.observacoes}</p>
        </div>
      )}

      {/* Fotos */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Camera size={16} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Fotos do dia</h3>
        </div>
        <UploadFotos obraId={obraId} rdoId={rdoId} />
      </div>

      {/* Materiais no RDO */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-orange-500" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Materiais do dia</h3>
          </div>
          <button
            type="button"
            onClick={handleSalvarMateriais}
            disabled={salvarMateriais.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Save size={12} /> {salvarMateriais.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>

        {/* Recebidos */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Recebidos</p>
          {recebidos.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_120px_28px] gap-2 items-center">
              <input value={m.materialNome} onChange={e => setRecebidos(prev => prev.map((x, j) => j===i ? {...x, materialNome: e.target.value} : x))}
                placeholder="Material" className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400" />
              <input type="number" value={m.quantidade || ""} onChange={e => setRecebidos(prev => prev.map((x, j) => j===i ? {...x, quantidade: Number(e.target.value)} : x))}
                placeholder="Qtd" className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400" />
              <input value={m.unidade} onChange={e => setRecebidos(prev => prev.map((x, j) => j===i ? {...x, unidade: e.target.value} : x))}
                placeholder="Un." className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400" />
              <input value={m.extra} onChange={e => setRecebidos(prev => prev.map((x, j) => j===i ? {...x, extra: e.target.value} : x))}
                placeholder="Fornecedor" className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400" />
              <button type="button" onClick={() => setRecebidos(prev => prev.filter((_, j) => j!==i))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setRecebidos(prev => [...prev, { materialNome: "", quantidade: 0, unidade: "", extra: "" }])}
            className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors cursor-pointer">
            <Plus size={13} /> Adicionar material recebido
          </button>
        </div>

        {/* Utilizados */}
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Utilizados</p>
          {utilizados.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_120px_28px] gap-2 items-center">
              <input value={m.materialNome} onChange={e => setUtilizados(prev => prev.map((x, j) => j===i ? {...x, materialNome: e.target.value} : x))}
                placeholder="Material" className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400" />
              <input type="number" value={m.quantidade || ""} onChange={e => setUtilizados(prev => prev.map((x, j) => j===i ? {...x, quantidade: Number(e.target.value)} : x))}
                placeholder="Qtd" className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400" />
              <input value={m.unidade} onChange={e => setUtilizados(prev => prev.map((x, j) => j===i ? {...x, unidade: e.target.value} : x))}
                placeholder="Un." className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400" />
              <input value={m.extra} onChange={e => setUtilizados(prev => prev.map((x, j) => j===i ? {...x, extra: e.target.value} : x))}
                placeholder="Local aplicado" className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400" />
              <button type="button" onClick={() => setUtilizados(prev => prev.filter((_, j) => j!==i))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setUtilizados(prev => [...prev, { materialNome: "", quantidade: 0, unidade: "", extra: "" }])}
            className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors cursor-pointer">
            <Plus size={13} /> Adicionar material utilizado
          </button>
        </div>
      </div>

      {/* Assinaturas */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pen size={16} className="text-orange-500" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Assinaturas</h3>
          </div>
          <div className="flex items-center gap-2">
            {assinaturas.length < 6 && (
              <button type="button"
                onClick={() => setAssinaturas(prev => [...prev, { label: DEFAULT_LABELS[prev.length] ?? `Assinatura ${prev.length + 1}`, imagemUrl: null }])}
                className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-orange-500 transition-colors cursor-pointer">
                <Plus size={13} /> Adicionar
              </button>
            )}
            <button type="button" onClick={handleSalvarAssinaturas}
              disabled={salvarAssinaturas.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">
              <Save size={12} /> {salvarAssinaturas.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assinaturas.map((a, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  value={a.label}
                  onChange={e => setAssinaturas(prev => prev.map((x, j) => j===i ? {...x, label: e.target.value} : x))}
                  className="flex-1 px-2.5 py-1.5 bg-[var(--input-bg)] border border-border rounded-lg text-xs font-semibold text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-orange-400"
                />
                {assinaturas.length > 1 && (
                  <button type="button" onClick={() => setAssinaturas(prev => prev.filter((_, j) => j!==i))}
                    className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <AssinaturaCanvas
                label={a.label}
                imagemUrl={a.imagemUrl}
                onSave={dataUrl => setAssinaturas(prev => prev.map((x, j) => j===i ? {...x, imagemUrl: dataUrl} : x))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer de visualizações */}
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1 pb-4">
        <span className="flex items-center gap-1.5">
          <Eye size={12} />
          {(rdo.visualizacoes ?? 0)} visualizações
        </span>
        <span>Criado por {rdo.responsavel.nome}</span>
      </div>

    </div>
  )
}
