import { cn } from "@/lib/utils"

type StatusObra = "PLANEJAMENTO" | "EM_ANDAMENTO" | "PAUSADA" | "CONCLUIDA" | "CANCELADA"

const statusConfig: Record<StatusObra, { label: string; className: string }> = {
  EM_ANDAMENTO: { label: "Em Andamento", className: "bg-orange-50 text-orange-600" },
  PLANEJAMENTO: { label: "Planejamento",  className: "bg-blue-50 text-blue-600" },
  PAUSADA:      { label: "Pausada",       className: "bg-yellow-50 text-yellow-700" },
  CONCLUIDA:    { label: "Concluída",     className: "bg-green-50 text-green-700" },
  CANCELADA:    { label: "Cancelada",     className: "bg-red-50 text-red-600" },
}

interface StatusBadgeProps {
  status: StatusObra
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", config.className, className)}>
      {config.label}
    </span>
  )
}
