"use client"

import { AlertTriangle, Clock, Package, ClipboardList, ChevronRight } from "lucide-react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"

type Alerta = {
  tipo:    "critico" | "aviso" | "info"
  icon:    React.ElementType
  titulo:  string
  sub:     string
  href?:   string
}

export function AlertasObra() {
  const { data: obras = [] }    = trpc.obra.listar.useQuery()
  const { data: analises }      = trpc.analises.resumo.useQuery()

  const alertas: Alerta[] = []
  const hoje = new Date()

  // 1. Obras com prazo próximo (< 30 dias)
  obras.forEach(obra => {
    if (!obra.dataFim || obra.status === "CONCLUIDA" || obra.status === "CANCELADA") return
    const dias = Math.ceil((new Date(obra.dataFim).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    if (dias < 0) {
      alertas.push({
        tipo:   "critico",
        icon:   Clock,
        titulo: `Prazo vencido — ${obra.nome}`,
        sub:    `Entrega era ${new Date(obra.dataFim).toLocaleDateString("pt-BR")}`,
        href:   `/obras/${obra.id}`,
      })
    } else if (dias <= 30) {
      alertas.push({
        tipo:   "aviso",
        icon:   Clock,
        titulo: `Entrega em ${dias} dias — ${obra.nome}`,
        sub:    `Prazo: ${new Date(obra.dataFim).toLocaleDateString("pt-BR")}`,
        href:   `/obras/${obra.id}`,
      })
    }
  })

  // 2. Ocorrências abertas (do resumo de análises)
  if (analises?.kpis.ocAbertas && analises.kpis.ocAbertas > 0) {
    alertas.push({
      tipo:   analises.kpis.ocAbertas >= 5 ? "critico" : "aviso",
      icon:   AlertTriangle,
      titulo: `${analises.kpis.ocAbertas} ocorrência${analises.kpis.ocAbertas > 1 ? "s" : ""} em aberto`,
      sub:    "Requer atenção da equipe",
      href:   "/obras",
    })
  }

  // 3. RDOs pendentes (enviados aguardando aprovação)
  if (analises) {
    const pendentes = analises.statusOc?.EM_ANALISE ?? 0
    if (pendentes > 0) {
      alertas.push({
        tipo:  "info",
        icon:  ClipboardList,
        titulo: `${pendentes} ocorrência${pendentes > 1 ? "s" : ""} em análise`,
        sub:   "Aguardando resolução",
      })
    }
  }

  // 4. FVS em retrabalho
  if (analises?.statusFvs?.RETRABALHO && analises.statusFvs.RETRABALHO > 0) {
    alertas.push({
      tipo:   "aviso",
      icon:   Package,
      titulo: `${analises.statusFvs.RETRABALHO} FVS em retrabalho`,
      sub:    "Inspeções que precisam ser refeitas",
    })
  }

  if (alertas.length === 0) return null

  const COR = {
    critico: { bg: "bg-red-50",    border: "border-red-200",   icon: "text-red-500",    dot: "bg-red-500" },
    aviso:   { bg: "bg-amber-50",  border: "border-amber-200", icon: "text-amber-500",  dot: "bg-amber-500" },
    info:    { bg: "bg-blue-50",   border: "border-blue-200",  icon: "text-blue-500",   dot: "bg-blue-500" },
  }

  return (
    <div className="space-y-2">
      {alertas.slice(0, 5).map((a, i) => {
        const c    = COR[a.tipo]
        const Icon = a.icon
        const inner = (
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
            <Icon size={14} className={`flex-shrink-0 ${c.icon}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{a.titulo}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{a.sub}</p>
            </div>
            {a.href && <ChevronRight size={14} className="text-[var(--text-muted)] flex-shrink-0" />}
          </div>
        )
        return a.href
          ? <Link key={i} href={a.href} className="block no-underline">{inner}</Link>
          : <div key={i}>{inner}</div>
      })}
    </div>
  )
}
