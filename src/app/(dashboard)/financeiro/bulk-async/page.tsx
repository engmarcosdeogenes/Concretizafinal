"use client"

import { useState } from "react"
import {
  Activity, Search, Loader2, AlertCircle,
  CheckCircle2, Clock, XCircle, ChevronDown, ChevronRight,
  Download,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatDataCurta } from "@/lib/format"

/* ─── Status de progresso visual ───────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; cls: string; Icon: typeof Activity }> = {
  PENDING:    { label: "Pendente",    cls: "bg-slate-100 text-slate-600",    Icon: Clock },
  PROCESSING: { label: "Processando", cls: "bg-blue-100 text-blue-700",      Icon: Loader2 },
  COMPLETED:  { label: "Concluído",   cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  FAILED:     { label: "Falhou",      cls: "bg-red-100 text-red-700",        Icon: XCircle },
  ERROR:      { label: "Erro",        cls: "bg-red-100 text-red-700",        Icon: XCircle },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] ?? STATUS_CONFIG.PENDING
  const Icon = cfg.Icon
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", cfg.cls)}>
      <Icon size={11} className={status?.toUpperCase() === "PROCESSING" ? "animate-spin" : ""} />
      {cfg.label}
    </span>
  )
}

/* ─── Barra de progresso ────────────────────────────────────────────── */

function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.min(Math.max(progress ?? 0, 0), 100)
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ─── Seção de resultado (chunks) ───────────────────────────────────── */

function ResultSection({ asyncId }: { asyncId: string }) {
  const [chunk, setChunk] = useState(0)
  const [enabled, setEnabled] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const { data: resultado, isLoading, isError } = trpc.sienge.consultarBulkAsyncResult.useQuery(
    { asyncId, chunk },
    { enabled, retry: false },
  )

  const rows = (resultado?.data as Record<string, unknown>[] | undefined) ?? []

  function handleExportCsv() {
    if (rows.length === 0) return
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(";"),
      ...rows.map(row => headers.map(h => String(row[h] ?? "")).join(";")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `bulk-async-${asyncId}-chunk${chunk}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(o => !o)}
        className="w-full flex items-center gap-2 px-5 py-3.5 border-b border-border hover:bg-slate-50 transition-colors"
      >
        <Download size={14} className="text-slate-400" />
        <span className="text-sm font-semibold text-[var(--text-primary)]">Buscar Resultado (chunks)</span>
        {expanded
          ? <ChevronDown size={14} className="ml-auto text-[var(--text-muted)]" />
          : <ChevronRight size={14} className="ml-auto text-[var(--text-muted)]" />
        }
      </button>

      {expanded && (
        <div className="p-5 space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Número do Chunk</label>
              <input
                type="number"
                min={0}
                value={chunk}
                onChange={e => setChunk(Number(e.target.value))}
                className="w-24 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
            <button
              type="button"
              onClick={() => { setEnabled(false); setTimeout(() => setEnabled(true), 50) }}
              className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              <Search size={14} /> Buscar Chunk
            </button>
            {rows.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <Download size={14} /> Exportar CSV
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8 text-[var(--text-muted)]">
              <Loader2 size={18} className="animate-spin mr-2" /> Carregando dados do chunk {chunk}...
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={14} />
              Não foi possível obter os dados deste chunk. Verifique se a operação já foi concluída.
            </div>
          )}

          {!isLoading && !isError && enabled && resultado && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span>Chunk {resultado.chunkIndex ?? chunk} de {resultado.totalChunks ?? "?"}</span>
                <span className="text-orange-500 font-semibold">{rows.length} registros</span>
              </div>

              {rows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-xs">
                    <thead className="bg-[var(--bg-surface)]">
                      <tr>
                        {Object.keys(rows[0]).map(key => (
                          <th key={key} className="px-3 py-2 text-left font-semibold text-[var(--text-muted)] whitespace-nowrap uppercase tracking-wide">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {rows.slice(0, 100).map((row, i) => (
                        <tr key={i} className="hover:bg-[var(--bg-surface-hover)]">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-3 py-2 whitespace-nowrap text-[var(--text-primary)]">
                              {String(val ?? "—")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 100 && (
                    <p className="text-xs text-[var(--text-muted)] px-3 py-2 bg-slate-50 border-t border-[var(--border)]">
                      Exibindo 100 de {rows.length} registros. Exporte o CSV para ver todos.
                    </p>
                  )}
                </div>
              )}

              {rows.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">Chunk sem dados.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Página principal ─────────────────────────────────────────────── */

export default function BulkAsyncMonitorPage() {
  const [asyncIdInput, setAsyncIdInput] = useState("")
  const [asyncId, setAsyncId] = useState("")
  const [enabled, setEnabled] = useState(false)

  const { data: status, isLoading, isError, refetch } = trpc.sienge.consultarBulkAsyncStatus.useQuery(
    { asyncId },
    { enabled: enabled && asyncId.length > 0, retry: false, refetchInterval: false },
  )

  function handleConsultar() {
    const trimmed = asyncIdInput.trim()
    if (!trimmed) return
    setAsyncId(trimmed)
    setEnabled(true)
  }

  function handleRefresh() {
    refetch()
  }

  const progress = status?.progress ?? 0
  const totalChunks = status?.totalChunks

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Activity size={20} className="text-violet-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Monitor de Operações Bulk</h1>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">Sienge</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Acompanhe o status de operações assíncronas de dados em lote.
          </p>
        </div>
      </div>

      {/* Formulário de consulta */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Consultar Operação</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="ID da operação assíncrona (asyncId)"
            value={asyncIdInput}
            onChange={e => setAsyncIdInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleConsultar()}
            className="flex-1 min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-400"
          />
          <button
            type="button"
            onClick={handleConsultar}
            disabled={!asyncIdInput.trim() || isLoading}
            className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading
              ? <><Loader2 size={14} className="animate-spin" /> Consultando...</>
              : <><Search size={14} /> Consultar</>
            }
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          O ID é retornado ao iniciar uma operação bulk assíncrona no Sienge
          (ex: relatórios financeiros em lote).
        </p>
      </div>

      {/* Estado de erro */}
      {isError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <div>
            <p className="font-semibold">Operação não encontrada</p>
            <p className="text-xs text-red-500 mt-0.5">
              Verifique se o asyncId está correto e se a integração Sienge está configurada.
            </p>
          </div>
        </div>
      )}

      {/* Resultado do status */}
      {status && !isError && (
        <div className="bg-white border border-border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Status da Operação</h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={status.status ?? ""} />
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-border rounded-md px-2.5 py-1 hover:bg-slate-50"
              >
                <Activity size={12} className={isLoading ? "animate-spin" : ""} />
                Atualizar
              </button>
            </div>
          </div>

          {/* ID e datas */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-0.5">Async ID</p>
              <p className="font-mono text-xs text-[var(--text-primary)] break-all bg-slate-50 p-1.5 rounded-md">
                {status.id ?? asyncId}
              </p>
            </div>
            {status.createdAt && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Iniciado em</p>
                <p className="text-[var(--text-primary)]">{formatDataCurta(status.createdAt)}</p>
              </div>
            )}
            {status.completedAt && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Concluído em</p>
                <p className="text-[var(--text-primary)]">{formatDataCurta(status.completedAt)}</p>
              </div>
            )}
            {totalChunks !== undefined && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Chunks gerados</p>
                <p className="font-semibold text-[var(--text-primary)]">{totalChunks}</p>
              </div>
            )}
          </div>

          {/* Barra de progresso */}
          {progress > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Progresso</span>
                <span className="font-semibold text-[var(--text-primary)]">{progress}%</span>
              </div>
              <ProgressBar progress={progress} />
            </div>
          )}

          {/* Mensagem de erro da operação */}
          {status.errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <XCircle size={14} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erro na operação</p>
                <p className="text-xs text-red-600 mt-0.5">{status.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Dados extras do objeto de status */}
          {(() => {
            const knownKeys = new Set(["id", "status", "progress", "totalChunks", "createdAt", "completedAt", "errorMessage"])
            const extras = Object.entries(status).filter(
              ([k, v]) => !knownKeys.has(k) && v !== undefined && v !== null
            )
            if (extras.length === 0) return null
            return (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Dados Adicionais</p>
                <div className="bg-slate-50 rounded-lg border border-border divide-y divide-border">
                  {extras.map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="font-mono text-xs text-[var(--text-muted)] w-36 flex-shrink-0">{k}</span>
                      <span className="text-[var(--text-primary)] break-all text-xs">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Seção de resultado — só exibe quando a operação estiver concluída */}
      {status && status.status?.toUpperCase() === "COMPLETED" && (
        <ResultSection asyncId={asyncId} />
      )}

    </div>
  )
}
