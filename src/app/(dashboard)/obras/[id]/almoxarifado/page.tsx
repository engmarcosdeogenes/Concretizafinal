"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Package, AlertTriangle, TrendingDown, ClipboardList, ArrowRightLeft, X, CheckCircle2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatNumero } from "@/lib/format"

type Tab = "estoque" | "reservas"

export default function AlmoxarifadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: obraId } = use(params)
  const [tab, setTab] = useState<Tab>("estoque")
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [atendendoId, setAtendendoId] = useState<number | null>(null)
  const [qtdAtender, setQtdAtender] = useState("")

  // Estoque
  const { data: estoque = [], isLoading } = trpc.sienge.listarEstoque.useQuery({ obraId })
  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const siengeObraId = obra?.siengeId ? Number(obra.siengeId) : undefined

  // Reservas
  const { data: reservas = [], isLoading: loadingReservas, refetch: refetchReservas } = trpc.sienge.listarReservas.useQuery({ siengeObraId })
  const atenderMutation = trpc.sienge.atenderReserva.useMutation({
    onSuccess: () => { setAtendendoId(null); setQtdAtender(""); refetchReservas() }
  })

  // Transferência
  const { data: obras = [] } = trpc.obra.listar.useQuery()
  const [tfObraDestino, setTfObraDestino] = useState("")
  const [tfMaterial, setTfMaterial] = useState("")
  const [tfQtd, setTfQtd] = useState("")
  const [tfObs, setTfObs] = useState("")
  const transferirMutation = trpc.sienge.transferirEstoque.useMutation({
    onSuccess: () => { setShowTransferModal(false); setTfObraDestino(""); setTfMaterial(""); setTfQtd(""); setTfObs("") }
  })

  const abaixoMinimo = estoque.filter((e) => e.saldoAtual < e.saldoMinimo)
  const zerado      = estoque.filter((e) => e.saldoAtual === 0)

  const obrasDestino = obras.filter(o => o.id !== obraId && o.siengeId)

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Link href={`/obras/${obraId}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Almoxarifado</h1>
            <p className="text-sm text-[var(--text-muted)]">Estoque real via Sienge</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowTransferModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-xs font-medium text-[var(--text-muted)] hover:border-orange-300 hover:text-orange-600 transition-all">
          <ArrowRightLeft size={14} /> Transferir Estoque
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([["estoque", "Estoque", Package], ["reservas", "Reservas", ClipboardList]] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
              tab === id ? "border-orange-500 text-orange-600" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Estoque Tab ── */}
      {tab === "estoque" && (
        <>
          {!isLoading && (abaixoMinimo.length > 0 || zerado.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {zerado.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">{zerado.length} item(ns) zerado(s)</p>
                    <p className="text-xs text-red-500">Estoque esgotado</p>
                  </div>
                </div>
              )}
              {abaixoMinimo.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <TrendingDown size={18} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">{abaixoMinimo.length} abaixo do mínimo</p>
                    <p className="text-xs text-amber-500">Reposição necessária</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <div className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
                    <div className="w-20 h-4 bg-slate-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : estoque.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package size={32} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhum item em estoque</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Configure a integração com o Sienge para ver o estoque.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[1fr_80px_80px_100px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-border text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  <span>Material</span>
                  <span className="text-right">Saldo</span>
                  <span className="text-right">Mínimo</span>
                  <span className="text-right">Situação</span>
                </div>
                <div className="divide-y divide-border">
                  {estoque.map((item, i) => {
                    const critico = item.saldoAtual === 0
                    const alerta  = item.saldoAtual < item.saldoMinimo && !critico
                    return (
                      <div key={i} className={cn(
                        "grid grid-cols-[1fr_80px_80px_100px] gap-4 px-4 py-3 items-center text-sm",
                        critico ? "bg-red-50/50" : alerta ? "bg-amber-50/50" : ""
                      )}>
                        <div>
                          <p className="font-medium text-[var(--text-primary)] truncate">{item.materialNome}</p>
                          <p className="text-xs text-[var(--text-muted)]">{item.localEstoque}{item.centroEstoque ? ` · ${item.centroEstoque}` : ""}</p>
                        </div>
                        <p className="text-right font-mono text-sm font-semibold text-[var(--text-primary)]">
                          {formatNumero(item.saldoAtual)} <span className="text-xs font-normal text-[var(--text-muted)]">{item.unidade}</span>
                        </p>
                        <p className="text-right text-xs text-[var(--text-muted)]">{formatNumero(item.saldoMinimo)} {item.unidade}</p>
                        <div className="flex justify-end">
                          {critico ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Zerado</span>
                          ) : alerta ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Baixo</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">OK</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Reservas Tab ── */}
      {tab === "reservas" && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {loadingReservas ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">Carregando reservas...</div>
          ) : reservas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList size={32} className="text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhuma reserva de estoque</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Reservas de materiais para esta obra aparecerão aqui.</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[2fr_80px_80px_80px_80px] gap-3 px-4 py-2.5 bg-muted border-b border-border text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                <span>Material</span>
                <span className="text-right">Reservado</span>
                <span className="text-right">Atendido</span>
                <span className="text-center">Status</span>
                <span className="text-center">Ação</span>
              </div>
              <div className="divide-y divide-border">
                {reservas.map(r => {
                  const pct = r.quantidade ? Math.round((r.quantidadeAtendida ?? 0) / r.quantidade * 100) : 0
                  return (
                    <div key={r.id} className="grid grid-cols-[2fr_80px_80px_80px_80px] gap-3 px-4 py-3 items-center text-sm hover:bg-muted/30">
                      <p className="font-medium text-[var(--text-primary)] truncate">{r.materialNome ?? "—"}</p>
                      <p className="text-right text-xs font-semibold text-[var(--text-primary)]">{r.quantidade ?? "—"}</p>
                      <p className="text-right text-xs text-[var(--text-muted)]">{r.quantidadeAtendida ?? 0} ({pct}%)</p>
                      <div className="flex justify-center">
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          r.status === "ATENDIDA" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>{r.status ?? "Pendente"}</span>
                      </div>
                      <div className="flex justify-center">
                        {atendendoId === r.id ? (
                          <div className="flex items-center gap-1">
                            <input type="number" value={qtdAtender} onChange={e => setQtdAtender(e.target.value)}
                              className="w-14 px-2 py-1 border border-border rounded text-xs focus:outline-none focus:border-orange-400"
                              placeholder="Qtd" min="0.01" step="0.01" />
                            <button type="button"
                              onClick={() => atenderMutation.mutate({ reservaId: r.id, quantidade: Number(qtdAtender) })}
                              className="p-1 rounded bg-green-500 text-white hover:bg-green-600">
                              <CheckCircle2 size={12} />
                            </button>
                            <button type="button" onClick={() => { setAtendendoId(null); setQtdAtender("") }}
                              className="p-1 rounded bg-gray-200 text-gray-500 hover:bg-gray-300">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setAtendendoId(r.id)}
                            className="px-2.5 py-1 rounded border border-border text-[10px] font-medium text-[var(--text-muted)] hover:border-orange-300 hover:text-orange-600 transition-all">
                            Atender
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)] text-center">Dados fornecidos em tempo real pelo Sienge</p>

      {/* Modal Transferência */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <ArrowRightLeft size={16} className="text-orange-500" /> Transferir Estoque
              </h3>
              <button type="button" onClick={() => setShowTransferModal(false)} className="p-1 rounded hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Obra destino</label>
                <select value={tfObraDestino} onChange={e => setTfObraDestino(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-orange-400">
                  <option value="">Selecionar obra...</option>
                  {obrasDestino.map(o => <option key={o.id} value={o.siengeId ?? ""}>{o.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Material (ID Sienge)</label>
                <input type="number" value={tfMaterial} onChange={e => setTfMaterial(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-orange-400"
                  placeholder="ID do material no Sienge" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Quantidade</label>
                <input type="number" value={tfQtd} onChange={e => setTfQtd(e.target.value)} min="0.01" step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-orange-400"
                  placeholder="Quantidade a transferir" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Observação (opcional)</label>
                <input value={tfObs} onChange={e => setTfObs(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-orange-400"
                  placeholder="Motivo da transferência" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-[var(--text-muted)]">
                Cancelar
              </button>
              <button type="button"
                disabled={!tfObraDestino || !tfMaterial || !tfQtd || transferirMutation.isPending}
                onClick={() => {
                  if (!siengeObraId || !tfObraDestino || !tfMaterial || !tfQtd) return
                  transferirMutation.mutate({
                    fromBuildingId: siengeObraId,
                    toBuildingId: Number(tfObraDestino),
                    materialId: Number(tfMaterial),
                    quantidade: Number(tfQtd),
                    observacao: tfObs || undefined,
                  })
                }}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
                <ArrowRightLeft size={13} /> Confirmar Transferência
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
