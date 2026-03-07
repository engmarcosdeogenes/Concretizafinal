import Link from "next/link"
import {
  ClipboardList, CheckSquare, AlertTriangle, Users,
  Package, Sun, CloudRain, Wind, TrendingUp, TrendingDown,
  ArrowRight, Clock, CheckCircle2, XCircle, FileText,
} from "lucide-react"

// Mock — substituir por dados reais via tRPC
const OBRA = {
  nome: "Edifício Residencial Aurora",
  status: "Em Andamento",
  endereco: "Av. T-10, 1.234 — Setor Bueno, Goiânia/GO",
  progresso: 38,
  dataInicio: "01/03/2025",
  terminoPrevisto: "30/06/2026",
  orcamento: "R$ 4.800.000",
  area: "8.420 m²",
}

const RDOS_RECENTES = [
  { data: "05/03/2026", clima: "sol",  servicos: 5, fotos: 12, responsavel: "Rafael Costa",    status: "APROVADO" },
  { data: "04/03/2026", clima: "chuva",servicos: 2, fotos: 4,  responsavel: "Rafael Costa",    status: "ENVIADO" },
  { data: "03/03/2026", clima: "sol",  servicos: 7, fotos: 19, responsavel: "Ana Freitas",     status: "APROVADO" },
]

const FVS_RECENTES = [
  { servico: "Concretagem de Laje — Pav. 3", responsavel: "Rafael Costa", itens: 18, conformes: 16, status: "NAO_CONFORME" },
  { servico: "Elevação de Alvenaria — Pav. 4",responsavel: "Ana Freitas",  itens: 12, conformes: 12, status: "CONFORME" },
  { servico: "Revestimento Externo Argamassa", responsavel: "Marcos Lima",  itens: 15, conformes: 13, status: "CONFORME" },
]

const OCORRENCIAS = [
  { descricao: "Infiltração na laje do 3º pavimento", tipo: "Técnica", prioridade: "ALTA",  data: "04/03/2026" },
  { descricao: "EPI sem uso — andaime nível 5",       tipo: "Segurança",prioridade: "ALTA",  data: "03/03/2026" },
  { descricao: "Atraso entrega de aço CA-50",         tipo: "Material", prioridade: "MEDIA", data: "02/03/2026" },
]

const EQUIPE = [
  { nome: "Rafael Costa",  cargo: "Engenheiro",       iniciais: "RC" },
  { nome: "Ana Freitas",   cargo: "Mestre de Obras",  iniciais: "AF" },
  { nome: "Marcos Lima",   cargo: "Encarregado",      iniciais: "ML" },
  { nome: "Juliana Pires", cargo: "Administrador",    iniciais: "JP" },
]

function ClimaIcon({ clima }: { clima: string }) {
  if (clima === "chuva") return <CloudRain size={13} className="text-blue-400" />
  if (clima === "vento") return <Wind size={13} className="text-slate-400" />
  return <Sun size={13} className="text-amber-400" />
}

function StatusBadgeRDO({ status }: { status: string }) {
  const map = {
    APROVADO:  { label: "Aprovado",  cls: "bg-green-50 text-green-700" },
    ENVIADO:   { label: "Enviado",   cls: "bg-blue-50 text-blue-700" },
    RASCUNHO:  { label: "Rascunho",  cls: "bg-slate-50 text-slate-600" },
  }
  const s = map[status as keyof typeof map] ?? map.RASCUNHO
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>{s.label}</span>
}

function PrioridadeDot({ p }: { p: string }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${p === "ALTA" ? "bg-red-500" : p === "MEDIA" ? "bg-amber-400" : "bg-slate-300"}`} />
  )
}

export default async function ObraOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const scoreGeral   = 8.4
  const rdoTotal     = 24
  const fvsTotal     = 12
  const fvsConformes = 9
  const ocAbertas    = OCORRENCIAS.length

  return (
    <div className="p-6 space-y-5">

      {/* ── Header da obra ── */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold">
                {OBRA.status}
              </span>
              <span className="text-[var(--text-muted)] text-xs">{OBRA.area}</span>
            </div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">{OBRA.nome}</h1>
            <p className="text-[var(--text-muted)] text-xs mt-0.5">{OBRA.endereco}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-extrabold text-[var(--text-primary)]">{OBRA.progresso}%</p>
            <p className="text-[var(--text-muted)] text-xs">Progresso</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${OBRA.progresso}%`, background: "var(--orange, #f97316)" }}
          />
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Score Geral",
            value: `${scoreGeral}/10`,
            sub: "Qualidade + Segurança",
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
            trend: "up",
          },
          {
            label: "RDOs",
            value: String(rdoTotal),
            sub: "Último há 1 dia",
            icon: ClipboardList,
            color: "text-blue-600",
            bg: "bg-blue-50",
            trend: "up",
          },
          {
            label: "FVS Conformes",
            value: `${fvsConformes}/${fvsTotal}`,
            sub: `${fvsTotal - fvsConformes} não conformes`,
            icon: CheckSquare,
            color: "text-purple-600",
            bg: "bg-purple-50",
            trend: (fvsConformes >= fvsTotal ? "up" : "down") as "up" | "down",
          },
          {
            label: "Ocorrências",
            value: String(ocAbertas),
            sub: "Abertas — requer atenção",
            icon: AlertTriangle,
            color: "text-orange-600",
            bg: "bg-orange-50",
            trend: "down",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg, trend }) => (
          <div key={label} className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-4">
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

      {/* ── Grid principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Coluna esquerda (2/3) */}
        <div className="lg:col-span-2 space-y-5">

          {/* RDO — Últimos registros */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ClipboardList size={15} className="text-blue-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Relatório Diário de Obra (RDO)</h3>
              </div>
              <Link
                href={`/obras/${id}/rdo`}
                className="flex items-center gap-1 text-xs text-[var(--blue)] hover:underline font-medium"
              >
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {RDOS_RECENTES.map((rdo, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <ClimaIcon clima={rdo.clima} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{rdo.data}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {rdo.servicos} serviços · {rdo.fotos} fotos · {rdo.responsavel}
                    </p>
                  </div>
                  <StatusBadgeRDO status={rdo.status} />
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[var(--border)]">
              <Link
                href={`/obras/${id}/rdo/novo`}
                className="btn-orange w-full justify-center text-sm"
              >
                + Novo RDO de hoje
              </Link>
            </div>
          </div>

          {/* FVS — Últimas inspeções */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <CheckSquare size={15} className="text-green-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Fichas de Verificação de Serviço (FVS)</h3>
              </div>
              <Link
                href={`/obras/${id}/fvs`}
                className="flex items-center gap-1 text-xs text-[var(--blue)] hover:underline font-medium"
              >
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>

            {/* Score bar */}
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-6">
              <div>
                <p className="text-2xl font-extrabold text-[var(--text-primary)]">8.2</p>
                <p className="text-[10px] text-[var(--text-muted)]">Nota de conformidade</p>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                  <span>{fvsConformes} conformes</span>
                  <span>{fvsTotal - fvsConformes} não conformes</span>
                </div>
                <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${(fvsConformes / fvsTotal) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {FVS_RECENTES.map((fvs, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  {fvs.status === "CONFORME"
                    ? <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                    : <XCircle size={15} className="text-red-400 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{fvs.servico}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {fvs.conformes}/{fvs.itens} itens conformes · {fvs.responsavel}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    fvs.status === "CONFORME" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  }`}>
                    {fvs.status === "CONFORME" ? "Conforme" : "Não Conforme"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna direita (1/3) */}
        <div className="space-y-5">

          {/* Info da obra */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
              <FileText size={14} className="text-[var(--text-muted)]" />
              Informações
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "Início",          value: OBRA.dataInicio },
                { label: "Término previsto",value: OBRA.terminoPrevisto },
                { label: "Orçamento",       value: OBRA.orcamento },
                { label: "Área",            value: OBRA.area },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-[var(--border)] last:border-0">
                  <span className="text-xs text-[var(--text-muted)]">{label}</span>
                  <span className="text-xs font-medium text-[var(--text-primary)]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ocorrências abertas */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ocorrências Abertas</h3>
              </div>
              <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold flex items-center justify-center">
                {ocAbertas}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {OCORRENCIAS.map((oc, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-2">
                  <PrioridadeDot p={oc.prioridade} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">{oc.descricao}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                      <Clock size={9} />
                      {oc.tipo} · {oc.data}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[var(--border)]">
              <Link
                href={`/obras/${id}/ocorrencias`}
                className="text-xs text-[var(--blue)] hover:underline font-medium flex items-center gap-1"
              >
                Ver todas as ocorrências <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* Equipe */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Users size={14} className="text-[var(--text-muted)]" />
                Equipe ({EQUIPE.length})
              </h3>
              <Link href={`/obras/${id}/equipe`} className="text-xs text-[var(--blue)] hover:underline">
                Gerenciar
              </Link>
            </div>
            <div className="space-y-2">
              {EQUIPE.map((m) => (
                <div key={m.nome} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-[var(--blue)] rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {m.iniciais}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{m.nome}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{m.cargo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
