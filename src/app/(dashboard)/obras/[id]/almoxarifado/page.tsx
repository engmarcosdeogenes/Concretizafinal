"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Package, AlertTriangle, TrendingDown, ClipboardList, ArrowRightLeft, X, CheckCircle2, Zap, PackagePlus, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatNumero } from "@/lib/format"
import { toast } from "sonner"

type Tab = "estoque" | "reservas"

export default function AlmoxarifadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: obraId } = use(params)
  const [tab, setTab] = useState<Tab>("estoque")
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [atendendoId, setAtendendoId] = useState<number | null>(null)
  const [qtdAtender, setQtdAtender] = useState("")

  // Movimentação
  const [showMovModal, setShowMovModal]   = useState(false)
  const [movMaterialId, setMovMaterialId] = useState("")
  const [movTipo, setMovTipo]             = useState<"ENTRADA" | "SAIDA">("ENTRADA")
  const [movQtd, setMovQtd]               = useState("")
  const [movData, setMovData]             = useState(new Date().toISOString().slice(0, 10))
  const [movObs, setMovObs]               = useState("")

  // Estoque
  const { data: estoque = [], isLoading, refetch: refetchEstoque } = trpc.sienge.listarEstoque.useQuery({ obraId })
  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const siengeObraId = obra?.siengeId ? Number(obra.siengeId) : undefined

  // Reservas
  const { data: reservas = [], isLoading: loadingReservas, refetch: refetchReservas } = trpc.sienge.listarReservas.useQuery({ siengeObraId })
  const atenderMutation = trpc.sienge.atenderReserva.useMutation({
    onSuccess: () => { setAtendendoId(null); setQtdAtender(""); refetchReservas() }
  })

  // Sugestões de transferência
  const { data: pendentesTx = [] } = trpc.solicitacao.listarPendentesParaTransferencia.useQuery({ obraId })
  const [showSugestoes, setShowSugestoes] = useState(false)

  // Transferência
  const { data: obras = [] } = trpc.obra.listar.useQuery()
  const [tfObraDestino, setTfObraDestino] = useState("")
  const [tfMaterial, setTfMaterial] = useState("")
  const [tfQtd, setTfQtd] = useState("")
  const [tfObs, setTfObs] = useState("")
  const transferirMutation = trpc.sienge.transferirEstoque.useMutation({
    onSuccess: () => { setShowTransferModal(false); setTfObraDestino(""); setTfMaterial(""); setTfQtd(""); setTfObs("") }
  })

  const lancarMovMutation = trpc.sienge.lancarMovimentacao.useMutation({
    onSuccess: () => {
      toast.success("Movimentação lançada no Sienge!")
      setShowMovModal(false)
      setMovMaterialId("")
      setMovQtd("")
      setMovObs("")
      refetchEstoque()
    },
    onError: (e) => toast.error(e.message ?? "Erro ao lançar movimentação"),
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
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setMovMaterialId(""); setShowMovModal(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-xs font-medium text-[var(--text-muted)] hover:border-emerald-300 hover:text-emerald-600 transition-all">
            <PackagePlus size={14} /> Nova Movimentação
          </button>
          <button type="button" onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-xs font-medium text-[var(--text-muted)] hover:border-orange-300 hover:text-orange-600 transition-all">
            <ArrowRightLeft size={14} /> Transferir Estoque
          </button>
        </div>
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
          {/* Banner sugestões de transferência */}
          {(() => {
            if (!pendentesTx.length) return null
            // Cruzar nomes de materiais do estoque com solicitações pendentes
            const matches: { materialNome: string; saldoAtual: number; unidade: string; obraNome: string; quantidade: number }[] = []
            for (const obra of pendentesTx) {
              for (const item of obra.itens) {
                const estoqueItem = estoque.find(e => e.materialNome.toLowerCase().includes(item.descricao.toLowerCase()) || item.descricao.toLowerCase().includes(e.materialNome.toLowerCase()))
                if (estoqueItem && estoqueItem.saldoAtual > 0) {
                  matches.push({ materialNome: estoqueItem.materialNome, saldoAtual: estoqueItem.saldoAtual, unidade: estoqueItem.unidade, obraNome: obra.obraNome, quantidade: item.quantidade })
                }
              }
            }
            if (!matches.length) return null
            return (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Zap size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    Sugestões: {matches.length} {matches.length === 1 ? "material" : "materiais"} desta obra {matches.length === 1 ? "pode atender" : "podem atender"} solicitações de outras obras
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSugestoes(true)}
                    className="mt-1 text-xs text-amber-700 underline hover:text-amber-900 transition-colors"
                  >
                    Ver sugestões
                  </button>
                </div>

                {/* Modal Sugestões */}
                {showSugestoes && (
                  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSugestoes(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                          <Zap size={16} className="text-amber-500" /> Sugestões de Transferência
                        </h3>
                        <button type="button" onClick={() => setShowSugestoes(false)} className="p-1 rounded hover:bg-muted"><X size={16} /></button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted text-[var(--text-muted)] uppercase tracking-wide text-[10px]">
                              <th className="px-3 py-2 text-left font-semibold">Material</th>
                              <th className="px-3 py-2 text-right font-semibold">Saldo aqui</th>
                              <th className="px-3 py-2 text-left font-semibold">Obra destino</th>
                              <th className="px-3 py-2 text-right font-semibold">Qtd solicit.</th>
                              <th className="px-3 py-2 text-center font-semibold">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {matches.map((m, i) => (
                              <tr key={i} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{m.materialNome}</td>
                                <td className="px-3 py-2 text-right font-semibold text-emerald-700">{m.saldoAtual} {m.unidade}</td>
                                <td className="px-3 py-2 text-[var(--text-muted)]">{m.obraNome}</td>
                                <td className="px-3 py-2 text-right text-[var(--text-muted)]">{m.quantidade}</td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => { setShowSugestoes(false); setShowTransferModal(true) }}
                                    className="px-2 py-1 rounded border border-border text-[10px] font-medium text-[var(--text-muted)] hover:border-orange-300 hover:text-orange-600 transition-all"
                                  >
                                    Transferir
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

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
                <div className="grid grid-cols-[1fr_80px_80px_90px_90px_36px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-border text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  <span>Material</span>
                  <span className="text-right">Saldo</span>
                  <span className="text-right">Mínimo</span>
                  <span className="text-right">Saldo Real</span>
                  <span className="text-right">Situação</span>
                  <span />
                </div>
                <div className="divide-y divide-border">
                  {estoque.map((item, i) => {
                    const critico = item.saldoAtual === 0
                    const alerta  = item.saldoAtual < item.saldoMinimo && !critico
                    // Saldo real = saldo atual - reservas do mesmo material
                    const somaReservas = reservas
                      .filter(r => (r.materialNome ?? "").toLowerCase() === item.materialNome.toLowerCase())
                      .reduce((s, r) => s + (r.quantidade ?? 0) - (r.quantidadeAtendida ?? 0), 0)
                    const saldoReal = item.saldoAtual - somaReservas
                    const alertaAmbar = saldoReal < item.saldoMinimo && item.saldoAtual >= item.saldoMinimo
                    return (
                      <div key={i} className={cn(
                        "grid grid-cols-[1fr_80px_80px_90px_90px_36px] gap-4 px-4 py-3 items-center text-sm",
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
                        <p className={cn("text-right text-xs font-semibold", alertaAmbar ? "text-amber-600" : saldoReal < 0 ? "text-red-600" : "text-[var(--text-primary)]")}>
                          {formatNumero(saldoReal)}
                        </p>
                        <div className="flex justify-end">
                          {critico ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Zerado</span>
                          ) : alerta ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Baixo</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">OK</span>
                          )}
                        </div>
                        <button
                          type="button"
                          title="Lançar movimentação no Sienge"
                          onClick={() => { setMovMaterialId(String(item.materialId)); setShowMovModal(true) }}
                          className="flex items-center justify-center w-7 h-7 rounded-lg border border-border hover:border-emerald-400 hover:text-emerald-600 text-[var(--text-muted)] transition-all"
                        >
                          <PackagePlus size={12} />
                        </button>
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

      {/* Modal Nova Movimentação */}
      {showMovModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowMovModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <PackagePlus size={16} className="text-emerald-600" /> Nova Movimentação de Estoque
              </h3>
              <button type="button" onClick={() => setShowMovModal(false)} className="p-1 rounded hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Material</label>
                <select value={movMaterialId} onChange={e => setMovMaterialId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-emerald-400">
                  <option value="">Selecionar material...</option>
                  {estoque.map(it => (
                    <option key={it.materialId} value={String(it.materialId)}>
                      {it.materialNome} ({formatNumero(it.saldoAtual)} {it.unidade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Tipo</label>
                <div className="flex gap-2">
                  {(["ENTRADA", "SAIDA"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setMovTipo(t)}
                      className={cn("flex-1 py-2 rounded-lg border text-xs font-semibold transition-all",
                        movTipo === t
                          ? t === "ENTRADA" ? "bg-emerald-500 border-emerald-500 text-white" : "bg-red-500 border-red-500 text-white"
                          : "border-border text-[var(--text-muted)] hover:border-slate-400"
                      )}>
                      {t === "ENTRADA" ? "↓ Entrada" : "↑ Saída"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Quantidade</label>
                  <input type="number" value={movQtd} onChange={e => setMovQtd(e.target.value)} min="0.01" step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-emerald-400"
                    placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Data</label>
                  <input type="date" value={movData} onChange={e => setMovData(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-emerald-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Observação (opcional)</label>
                <input value={movObs} onChange={e => setMovObs(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-emerald-400"
                  placeholder="ex: Recebimento NF 1234" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowMovModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-[var(--text-muted)]">
                Cancelar
              </button>
              <button type="button"
                disabled={!movMaterialId || !movQtd || !siengeObraId || lancarMovMutation.isPending}
                onClick={() => {
                  if (!movMaterialId || !movQtd || !siengeObraId) return
                  lancarMovMutation.mutate({
                    obraId,
                    materialId: Number(movMaterialId),
                    tipo:       movTipo,
                    quantidade: Number(movQtd),
                    data:       movData,
                    observacao: movObs || undefined,
                  })
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors",
                  movTipo === "ENTRADA" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
                )}>
                {lancarMovMutation.isPending
                  ? <Loader2 size={13} className="animate-spin" />
                  : <PackagePlus size={13} />}
                Confirmar {movTipo === "ENTRADA" ? "Entrada" : "Saída"}
              </button>
            </div>
          </div>
        </div>
      )}

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
