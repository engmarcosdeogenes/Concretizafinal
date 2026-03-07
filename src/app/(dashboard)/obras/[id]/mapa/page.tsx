"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Map, Upload, AlertTriangle, ArrowRight, Info } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

const TIPO_CLS: Record<string, string> = {
  SEGURANCA: "bg-red-50 text-red-700 border border-red-200",
  QUALIDADE: "bg-purple-50 text-purple-700 border border-purple-200",
  PRAZO:     "bg-amber-50 text-amber-700 border border-amber-200",
  CUSTO:     "bg-blue-50 text-blue-700 border border-blue-200",
  AMBIENTAL: "bg-green-50 text-green-700 border border-green-200",
  OUTRO:     "bg-slate-50 text-slate-600 border border-slate-200",
}
const TIPO_LABEL: Record<string, string> = {
  SEGURANCA: "Segurança", QUALIDADE: "Qualidade", PRAZO: "Prazo",
  CUSTO: "Custo", AMBIENTAL: "Ambiental", OUTRO: "Outro",
}
const PRIORIDADE_LABEL: Record<number, string> = { 1: "Baixa", 2: "Média", 3: "Alta" }
const PRIORIDADE_CLS:   Record<number, string> = {
  1: "bg-slate-50 text-slate-600 border border-slate-200",
  2: "bg-amber-50 text-amber-700 border border-amber-200",
  3: "bg-red-50 text-red-700 border border-red-200",
}

export default function MapaPage() {
  const params = useParams()
  const obraId = params.id as string

  const { data: ocorrencias = [], isLoading } = trpc.ocorrencia.listar.useQuery({ obraId })

  const comPosicao    = ocorrencias.filter(o => o.posX !== null && o.posY !== null)
  const abertas       = ocorrencias.filter(o => o.status === "ABERTA" || o.status === "EM_ANALISE")

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Mapa Visual</h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Plantas baixas com marcação de ocorrências</p>
        </div>
        <button disabled
          className="btn-ghost min-h-[44px] flex-shrink-0 opacity-50 cursor-not-allowed">
          <Upload size={15} />
          Enviar Planta
        </button>
      </div>

      {/* Info sobre Supabase Storage */}
      <div className="flex items-start gap-3 px-4 py-3.5 bg-blue-50 border border-blue-200 rounded-xl">
        <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">Upload de plantas disponível após conectar Supabase Storage</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Quando o banco estiver conectado, você poderá enviar plantas baixas em PDF ou imagem e marcar ocorrências diretamente no mapa interativo.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Ocorrências",      val: ocorrencias.length,  color: "text-slate-600" },
          { label: "Abertas",          val: abertas.length,       color: "text-amber-600" },
          { label: "Com localização",  val: comPosicao.length,    color: "text-blue-600" },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-4">
            <p className={`text-2xl font-extrabold ${color}`}>{val}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Lista de ocorrências */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Ocorrências desta obra</h2>
          </div>
          <Link href={`/obras/${obraId}/ocorrencias`}
            className="text-xs text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1 cursor-pointer">
            Ver todas <ArrowRight size={11} />
          </Link>
        </div>

        {isLoading && <div className="py-8 text-center text-sm text-[var(--text-muted)]">Carregando...</div>}

        {!isLoading && ocorrencias.length === 0 && (
          <div className="py-12 text-center">
            <Map size={28} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma ocorrência registrada</p>
            <Link href={`/obras/${obraId}/ocorrencias/nova`}
              className="text-xs text-orange-500 mt-2 inline-block cursor-pointer">
              Registrar ocorrência →
            </Link>
          </div>
        )}

        {ocorrencias.map(oc => {
          const tipoCls   = TIPO_CLS[oc.tipo]   ?? TIPO_CLS.OUTRO
          const tipoLabel = TIPO_LABEL[oc.tipo]  ?? oc.tipo
          const prioCls   = PRIORIDADE_CLS[oc.prioridade]   ?? PRIORIDADE_CLS[2]
          const prioLabel = PRIORIDADE_LABEL[oc.prioridade]  ?? "Média"

          return (
            <Link key={oc.id} href={`/obras/${obraId}/ocorrencias/${oc.id}`}
              className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors no-underline cursor-pointer">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{oc.titulo}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${tipoCls}`}>{tipoLabel}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${prioCls}`}>{prioLabel}</span>
                  {(oc.posX !== null && oc.posY !== null) && (
                    <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                      <Map size={9} /> Localizada
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--text-muted)]">{formatDataCurta(oc.data)}</span>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                oc.status === "ABERTA" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                oc.status === "EM_ANALISE" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                oc.status === "RESOLVIDA" ? "bg-green-50 text-green-700 border border-green-200" :
                "bg-slate-50 text-slate-600 border border-slate-200"
              }`}>
                {oc.status === "ABERTA" ? "Aberta" : oc.status === "EM_ANALISE" ? "Em Análise" :
                  oc.status === "RESOLVIDA" ? "Resolvida" : "Fechada"}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
