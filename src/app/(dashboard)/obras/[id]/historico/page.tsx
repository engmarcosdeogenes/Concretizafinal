"use client"

import { useParams } from "next/navigation"
import { Clock, Loader2, FileText, User } from "lucide-react"
import { useHistoricoObra } from "@/hooks/useObrasGestao"

function formatDate(d: string | Date) {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function HistoricoObraPage() {
  const { id } = useParams<{ id: string }>()
  const { historico, isLoading, error } = useHistoricoObra(id)

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
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

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Erro ao carregar histórico: {error.message}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && historico.length === 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-12 text-center">
          <FileText size={36} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Nenhum registro de histórico
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Ações realizadas nesta obra aparecerão aqui.
          </p>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && historico.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Últimas {historico.length} atividades
            </h2>
          </div>
          <div className="divide-y divide-border">
            {historico.map((entry: Record<string, unknown>, idx: number) => (
              <div
                key={String(entry.id ?? idx)}
                className="px-5 py-4 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={14} className="text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {String(entry.action ?? entry.acao ?? "Ação")}
                    </p>
                    <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0">
                      {entry.createdAt
                        ? formatDate(entry.createdAt as string)
                        : ""}
                    </span>
                  </div>
                  {entry.descricao != null && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                      {String(entry.descricao)}
                    </p>
                  )}
                  {entry.usuario != null && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      por{" "}
                      <span className="font-medium">
                        {typeof entry.usuario === "object"
                          ? String(
                              (entry.usuario as Record<string, unknown>).nome ??
                                "Usuário"
                            )
                          : String(entry.usuario)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
