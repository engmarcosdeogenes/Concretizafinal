"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Package, AlertTriangle, TrendingDown, ClipboardList, ArrowRightLeft, X, CheckCircle2, Zap, PackagePlus, Loader2, FileText, Receipt, ChevronDown, ChevronUp, Send } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatNumero, formatMoeda } from "@/lib/format"
import { toast } from "sonner"

type Tab = "estoque" | "reservas" | "fiscal" | "transferencias"

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

  // Fiscal
  const [nfeDetalheId, setNfeDetalheId] = useState<number | null>(null)

  // Estoque
  const { data: estoque = [], isLoading, refetch: refetchEstoque } = trpc.sienge.listarEstoque.useQuery({ obraId })
  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const siengeObraId = obra?.siengeId ? Number(obra.siengeId) : undefined

  // Reservas
  const { data: reservas = [], isLoading: loadingReservas, refetch: refetchReservas } = trpc.sienge.listarReservas.useQuery({ siengeObraId })
  const atenderMutation = trpc.sienge.atenderReserva.useMutation({
    onSuccess: () => { setAtendendoId(null); setQtdAtender(""); refetchReservas() }
  })

  // Notas Fiscais
  const { data: nfes = [], isLoading: loadingNfes } = trpc.sienge.listarNFe.useQuery({ obraId }, { enabled: tab === "fiscal" })
  const { data: nfeDetalhe, isLoading: loadingDetalhe } = trpc.sienge.buscarNFeDetalhe.useQuery(
    { nfeId: nfeDetalheId! },
    { enabled: nfeDetalheId !== null }
  )

  // Sugestões de transferência
  const { data: pendentesTx = [], refetch: refetchPendentesTx } = trpc.solicitacao.listarPendentesParaTransferencia.useQuery({ obraId })
  const [showSugestoes, setShowSugestoes] = useState(false)

  // Modal de receber transferência de outra obra
  const [txItem, setTxItem] = useState<{ descricao: string; quantidade: number; unidade: string; obraId: string; obraNome: string } | null>(null)
  const [txQtd, setTxQtd] = useState("")
  const [txObs, setTxObs] = useState("")

  // Catálogo de materiais (para matching por nome ao transferir)
  const { data: catalogoMateriais = [] } = trpc.material.listar.useQuery()
  const criarMaterialMutation = trpc.material.criar.useMutation()
  const criarMovimentacaoMutation = trpc.movimentacao.criar.useMutation({
    onSuccess: () => {
      toast.success("Transferência registrada com sucesso!")
      setTxItem(null)
      setTxQtd("")
      setTxObs("")
      refetchPendentesTx()
    },
    onError: (e) => toast.error(e.message ?? "Erro ao registrar transferência"),
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

  // Confirmar recebimento de transferência de outra obra
  async function handleConfirmarTransferencia() {
    if (!txItem || !txQtd) return
    const qtd = Number(txQtd)
    if (isNaN(qtd) || qtd <= 0 || qtd > txItem.quantidade) return

    // Tentar encontrar o material no catálogo pelo nome
    const normalizar = (s: string) => s.toLowerCase().trim()
    let material = catalogoMateriais.find(m =>
      normalizar(m.nome) === normalizar(txItem.descricao) ||
      normalizar(m.nome).includes(normalizar(txItem.descricao)) ||
      normalizar(txItem.descricao).includes(normalizar(m.nome))
    )

    if (!material) {
      // Criar no catálogo automaticamente
      try {
        material = await criarMaterialMutation.mutateAsync({
          nome: txItem.descricao,
          unidade: txItem.unidade || "un",
          categoria: "Transferido",
        })
      } catch {
        toast.error("Erro ao criar material no catálogo")
        return
      }
    }

    criarMovimentacaoMutation.mutate({
      obraId,
      materialId: material.id,
      tipo: "TRANSFERENCIA",
      quantidade: qtd,
      observacao: txObs ? txObs : `Transferido de ${txItem.obraNome}`,
    })
  }

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

      {/* Links de navegação */}
      <div className="flex gap-2 flex-wrap">
        <Link href={`/obras/${obraId}/almoxarifado/saldos`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-xs font-medium text-[var(--text-muted)] hover:border-blue-300 hover:text-blue-600 transition-all">
          <TrendingDown size={14} /> Saldos por Material
        </Link>
        <Link href={`/obras/${obraId}/almoxarifado/inventario`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-xs font-medium text-[var(--text-muted)] hover:border-purple-300 hover:text-purple-600 transition-all">
          <ClipboardList size={14} /> Inventário
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {([
          ["estoque", "Estoque", Package],
          ["reservas", "Reservas", ClipboardList],
          ["fiscal", "Notas Fiscais", Receipt],
          ["transferencias", "Transferências", ArrowRightLeft],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap",
              tab === id ? "border-orange-500 text-orange-600" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}>
            <Icon size={14} />
            {label}
            {id === "transferencias" && pendentesTx.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold leading-none">
                {pendentesTx.reduce((acc, g) => acc + g.itens.length, 0)}
              </span>
            )}
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
        <>
          {/* KPI header */}
          {!loadingReservas && reservas.length > 0 && (() => {
            const pendentes = reservas.filter(r => r.status !== "ATENDIDA")
            const atendidas = reservas.filter(r => r.status === "ATENDIDA")
            const totalReservado = reservas.reduce((s, r) => s + (r.quantidade ?? 0), 0)
            const totalAtendido  = reservas.reduce((s, r) => s + (r.quantidadeAtendida ?? 0), 0)
            return (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide mb-0.5">Pendentes</p>
                  <p className="text-2xl font-extrabold text-amber-700">{pendentes.length}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wide mb-0.5">Atendidas</p>
                  <p className="text-2xl font-extrabold text-green-700">{atendidas.length}</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-3">
                  <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wide mb-0.5">Atend. Geral</p>
                  <p className="text-2xl font-extrabold text-[var(--text-primary)]">
                    {totalReservado > 0 ? Math.round(totalAtendido / totalReservado * 100) : 0}%
                  </p>
                </div>
              </div>
            )
          })()}

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
                <div className="grid grid-cols-[2fr_80px_1fr_80px_80px] gap-3 px-4 py-2.5 bg-muted border-b border-border text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  <span>Material</span>
                  <span className="text-right">Reservado</span>
                  <span>Progresso</span>
                  <span className="text-center">Status</span>
                  <span className="text-center">Ação</span>
                </div>
                <div className="divide-y divide-border">
                  {reservas.map(r => {
                    const pct = r.quantidade ? Math.round((r.quantidadeAtendida ?? 0) / r.quantidade * 100) : 0
                    const atendida = r.status === "ATENDIDA"
                    return (
                      <div key={r.id} className={cn(
                        "grid grid-cols-[2fr_80px_1fr_80px_80px] gap-3 px-4 py-3 items-center text-sm hover:bg-muted/30",
                        atendida ? "opacity-60" : ""
                      )}>
                        <p className="font-medium text-[var(--text-primary)] truncate">{r.materialNome ?? "—"}</p>
                        <p className="text-right text-xs font-semibold text-[var(--text-primary)]">{r.quantidade ?? "—"}</p>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] text-[var(--text-muted)]">{r.quantidadeAtendida ?? 0} atend.</span>
                            <span className="text-[10px] font-semibold text-[var(--text-primary)]">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", atendida ? "bg-green-500" : pct >= 80 ? "bg-amber-400" : "bg-orange-500")}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold",
                            atendida ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>{r.status ?? "Pendente"}</span>
                        </div>
                        <div className="flex justify-center">
                          {atendida ? (
                            <CheckCircle2 size={14} className="text-green-500" />
                          ) : atendendoId === r.id ? (
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
        </>
      )}

      {/* ── Notas Fiscais Tab ── */}
      {tab === "fiscal" && (
        <>
          {nfeDetalheId !== null && nfeDetalhe && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setNfeDetalheId(null)}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <Receipt size={16} className="text-violet-600" />
                    NF-e {nfeDetalhe.numero}{nfeDetalhe.serie ? `/${nfeDetalhe.serie}` : ""} — Dados Fiscais
                  </h3>
                  <button type="button" onClick={() => setNfeDetalheId(null)} className="p-1 rounded hover:bg-muted"><X size={16} /></button>
                </div>

                {/* Header info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><span className="text-[var(--text-muted)]">Fornecedor:</span> <span className="font-semibold">{nfeDetalhe.fornecedorNome}</span></div>
                  <div><span className="text-[var(--text-muted)]">CNPJ:</span> <span className="font-mono">{nfeDetalhe.fornecedorCnpj}</span></div>
                  <div><span className="text-[var(--text-muted)]">Emissão:</span> <span className="font-semibold">{nfeDetalhe.dataEmissao}</span></div>
                  <div><span className="text-[var(--text-muted)]">Valor Total:</span> <span className="font-bold text-emerald-700">{formatMoeda(nfeDetalhe.valor)}</span></div>
                </div>

                {nfeDetalhe.naturezaOperacao && (
                  <p className="text-xs text-[var(--text-muted)]">Natureza: <span className="font-medium text-[var(--text-primary)]">{nfeDetalhe.naturezaOperacao}</span></p>
                )}

                {/* Totais de tributos */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    ["Base ICMS", nfeDetalhe.totalBaseIcms, "blue"],
                    ["ICMS", nfeDetalhe.totalIcms, "blue"],
                    ["IPI", nfeDetalhe.totalIpi, "purple"],
                    ["PIS", nfeDetalhe.totalPis, "amber"],
                    ["COFINS", nfeDetalhe.totalCofins, "amber"],
                    ["ISSQN", nfeDetalhe.totalIssqn, "rose"],
                  ].map(([label, val, color]) => (
                    <div key={label as string} className={`bg-${color as string}-50 border border-${color as string}-200 rounded-lg p-2`}>
                      <p className={`text-[10px] text-${color as string}-600 font-semibold uppercase tracking-wide`}>{label as string}</p>
                      <p className={`text-sm font-bold text-${color as string}-700`}>{formatMoeda(val as number)}</p>
                    </div>
                  ))}
                </div>

                {/* Itens com tributos */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-slate-50 border-b border-border px-4 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Itens — Tributos por Item
                  </div>
                  {nfeDetalhe.itens.length === 0 ? (
                    <p className="p-6 text-center text-sm text-[var(--text-muted)]">Nenhum item encontrado</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {nfeDetalhe.itens.map((item) => (
                        <NFeItemFiscal key={item.itemId} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            {loadingNfes ? (
              <div className="p-8 text-center text-sm text-[var(--text-muted)]">Carregando notas fiscais...</div>
            ) : nfes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={32} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhuma NF-e encontrada</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Notas fiscais eletrônicas desta obra aparecerão aqui.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[1fr_100px_100px_100px_80px_80px] gap-3 px-4 py-2.5 bg-slate-50 border-b border-border text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  <span>Fornecedor</span>
                  <span className="text-center">Número</span>
                  <span className="text-center">Emissão</span>
                  <span className="text-right">Valor</span>
                  <span className="text-center">Status</span>
                  <span className="text-center">Fiscal</span>
                </div>
                <div className="divide-y divide-border">
                  {nfes.map((nf) => (
                    <div key={nf.id} className="grid grid-cols-[1fr_100px_100px_100px_80px_80px] gap-3 px-4 py-3 items-center text-sm hover:bg-muted/30">
                      <div>
                        <p className="font-medium text-[var(--text-primary)] truncate">{nf.fornecedorNome}</p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">{nf.fornecedorCnpj}</p>
                      </div>
                      <p className="text-center text-xs font-semibold text-[var(--text-primary)]">{nf.numero}{nf.serie ? `/${nf.serie}` : ""}</p>
                      <p className="text-center text-xs text-[var(--text-muted)]">{nf.dataEmissao}</p>
                      <p className="text-right text-xs font-semibold text-emerald-700">{formatMoeda(nf.valor)}</p>
                      <div className="flex justify-center">
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          nf.status === "AUTORIZADA" ? "bg-green-100 text-green-700" :
                          nf.status === "CANCELADA" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        )}>{nf.status}</span>
                      </div>
                      <div className="flex justify-center">
                        <button type="button"
                          onClick={() => setNfeDetalheId(nf.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded border border-border text-[10px] font-medium text-[var(--text-muted)] hover:border-violet-300 hover:text-violet-600 transition-all">
                          <Receipt size={11} /> Tributos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Transferências Tab ── */}
      {tab === "transferencias" && (
        <>
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <ArrowRightLeft size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Materiais disponíveis em outras obras</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Lista de solicitações pendentes ou aprovadas em outras obras da mesma empresa. Clique em "Transferir para esta obra" para registrar o recebimento.
              </p>
            </div>
          </div>

          {pendentesTx.length === 0 ? (
            <div className="bg-white border border-border rounded-xl flex flex-col items-center justify-center py-16 text-center">
              <ArrowRightLeft size={32} className="text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhuma transferência disponível</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Quando outras obras tiverem solicitações pendentes ou aprovadas, elas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendentesTx.map((grupo) => (
                <div key={grupo.obraId} className="bg-white border border-border rounded-xl overflow-hidden">
                  {/* Cabeçalho do grupo */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{grupo.obraNome}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      {grupo.itens.length} {grupo.itens.length === 1 ? "item" : "itens"}
                    </span>
                  </div>

                  {/* Itens do grupo */}
                  <div className="divide-y divide-border">
                    {/* Cabeçalho das colunas */}
                    <div className="grid grid-cols-[1fr_80px_60px_130px] gap-3 px-4 py-2 bg-muted/30 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      <span>Material</span>
                      <span className="text-right">Quantidade</span>
                      <span className="text-center">Unid.</span>
                      <span className="text-center">Ação</span>
                    </div>

                    {grupo.itens.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_80px_60px_130px] gap-3 px-4 py-3 items-center text-sm hover:bg-muted/20">
                        <p className="font-medium text-[var(--text-primary)] truncate">{item.descricao}</p>
                        <p className="text-right font-mono text-sm font-semibold text-[var(--text-primary)]">
                          {item.quantidade}
                        </p>
                        <p className="text-center text-xs text-[var(--text-muted)]">{item.unidade}</p>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setTxItem({
                                descricao: item.descricao,
                                quantidade: item.quantidade,
                                unidade: item.unidade,
                                obraId: grupo.obraId,
                                obraNome: grupo.obraNome,
                              })
                              setTxQtd(String(item.quantidade))
                              setTxObs("")
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-300 text-orange-600 text-xs font-semibold hover:bg-orange-50 transition-all"
                          >
                            <Send size={11} /> Transferir para cá
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Confirmar Transferência de Outra Obra */}
      {txItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setTxItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Send size={16} className="text-orange-500" /> Confirmar Transferência
              </h3>
              <button type="button" onClick={() => setTxItem(null)} className="p-1 rounded hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            {/* Info do item (readonly) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Material:</span>
                <span className="font-semibold text-[var(--text-primary)]">{txItem.descricao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Obra de origem:</span>
                <span className="font-semibold text-[var(--text-primary)]">{txItem.obraNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Qtd. disponível:</span>
                <span className="font-semibold text-orange-700">{txItem.quantidade} {txItem.unidade}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  Quantidade a transferir <span className="text-[var(--text-muted)] font-normal">(máx: {txItem.quantidade})</span>
                </label>
                <input
                  type="number"
                  value={txQtd}
                  onChange={e => setTxQtd(e.target.value)}
                  min="0.01"
                  max={txItem.quantidade}
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-orange-400"
                  placeholder="Quantidade"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Observação (opcional)</label>
                <input
                  value={txObs}
                  onChange={e => setTxObs(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-orange-400"
                  placeholder={`Transferido de ${txItem.obraNome}`}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setTxItem(null)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-[var(--text-muted)]">
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  !txQtd ||
                  Number(txQtd) <= 0 ||
                  Number(txQtd) > txItem.quantidade ||
                  criarMovimentacaoMutation.isPending ||
                  criarMaterialMutation.isPending
                }
                onClick={handleConfirmarTransferencia}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {(criarMovimentacaoMutation.isPending || criarMaterialMutation.isPending)
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Send size={13} />
                }
                Confirmar Transferência
              </button>
            </div>
          </div>
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

/* ── Componente de item fiscal com expand/collapse ── */
function NFeItemFiscal({ item }: { item: { itemId: number; materialNome: string; ncm?: string; cfop?: string; quantidade: number; valorUnitario: number; valorTotal: number; unidade: string; icms?: { baseCalculo: number; aliquota: number; valor: number; cst?: string; origem?: string }; ipi?: { baseCalculo: number; aliquota: number; valor: number; cst?: string }; pis?: { baseCalculo: number; aliquota: number; valor: number; cst?: string }; cofins?: { baseCalculo: number; aliquota: number; valor: number; cst?: string }; issqn?: { baseCalculo: number; aliquota: number; valor: number; codigoServico?: string } } }) {
  const [open, setOpen] = useState(false)
  const hasTributos = item.icms || item.ipi || item.pis || item.cofins || item.issqn

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full grid grid-cols-[1fr_60px_80px_80px_28px] gap-3 px-4 py-3 items-center text-sm hover:bg-muted/30 text-left">
        <div>
          <p className="font-medium text-[var(--text-primary)] truncate">{item.materialNome}</p>
          <div className="flex gap-2 text-[10px] text-[var(--text-muted)]">
            {item.ncm && <span>NCM: {item.ncm}</span>}
            {item.cfop && <span>CFOP: {item.cfop}</span>}
          </div>
        </div>
        <p className="text-right text-xs text-[var(--text-muted)]">{formatNumero(item.quantidade)} {item.unidade}</p>
        <p className="text-right text-xs text-[var(--text-muted)]">{formatMoeda(item.valorUnitario)}</p>
        <p className="text-right text-xs font-semibold text-[var(--text-primary)]">{formatMoeda(item.valorTotal)}</p>
        <div className="flex justify-center text-[var(--text-muted)]">
          {hasTributos ? (open ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <span className="text-[10px]">—</span>}
        </div>
      </button>

      {open && hasTributos && (
        <div className="px-4 pb-3 grid grid-cols-2 md:grid-cols-5 gap-2">
          {item.icms && (
            <div className="bg-blue-50 rounded-lg p-2 text-xs">
              <p className="font-semibold text-blue-700 mb-1">ICMS {item.icms.cst ? `(CST ${item.icms.cst})` : ""}</p>
              <p className="text-blue-600">Base: {formatMoeda(item.icms.baseCalculo)}</p>
              <p className="text-blue-600">Alíq: {formatNumero(item.icms.aliquota)}%</p>
              <p className="font-bold text-blue-800">Valor: {formatMoeda(item.icms.valor)}</p>
              {item.icms.origem && <p className="text-blue-500 text-[10px]">Origem: {item.icms.origem}</p>}
            </div>
          )}
          {item.ipi && (
            <div className="bg-purple-50 rounded-lg p-2 text-xs">
              <p className="font-semibold text-purple-700 mb-1">IPI {item.ipi.cst ? `(CST ${item.ipi.cst})` : ""}</p>
              <p className="text-purple-600">Base: {formatMoeda(item.ipi.baseCalculo)}</p>
              <p className="text-purple-600">Alíq: {formatNumero(item.ipi.aliquota)}%</p>
              <p className="font-bold text-purple-800">Valor: {formatMoeda(item.ipi.valor)}</p>
            </div>
          )}
          {item.pis && (
            <div className="bg-amber-50 rounded-lg p-2 text-xs">
              <p className="font-semibold text-amber-700 mb-1">PIS {item.pis.cst ? `(CST ${item.pis.cst})` : ""}</p>
              <p className="text-amber-600">Base: {formatMoeda(item.pis.baseCalculo)}</p>
              <p className="text-amber-600">Alíq: {formatNumero(item.pis.aliquota)}%</p>
              <p className="font-bold text-amber-800">Valor: {formatMoeda(item.pis.valor)}</p>
            </div>
          )}
          {item.cofins && (
            <div className="bg-amber-50 rounded-lg p-2 text-xs">
              <p className="font-semibold text-amber-700 mb-1">COFINS {item.cofins.cst ? `(CST ${item.cofins.cst})` : ""}</p>
              <p className="text-amber-600">Base: {formatMoeda(item.cofins.baseCalculo)}</p>
              <p className="text-amber-600">Alíq: {formatNumero(item.cofins.aliquota)}%</p>
              <p className="font-bold text-amber-800">Valor: {formatMoeda(item.cofins.valor)}</p>
            </div>
          )}
          {item.issqn && (
            <div className="bg-rose-50 rounded-lg p-2 text-xs">
              <p className="font-semibold text-rose-700 mb-1">ISSQN</p>
              <p className="text-rose-600">Base: {formatMoeda(item.issqn.baseCalculo)}</p>
              <p className="text-rose-600">Alíq: {formatNumero(item.issqn.aliquota)}%</p>
              <p className="font-bold text-rose-800">Valor: {formatMoeda(item.issqn.valor)}</p>
              {item.issqn.codigoServico && <p className="text-rose-500 text-[10px]">Serviço: {item.issqn.codigoServico}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
