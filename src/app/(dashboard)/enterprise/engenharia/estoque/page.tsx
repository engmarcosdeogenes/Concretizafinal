"use client"

import { useState, useMemo } from "react"
import {
  Package,
  ArrowRightLeft,
  ClipboardList,
  Loader2,
  Plus,
  X,
  AlertTriangle,
  Layers,
  FileText,
  ChevronDown,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { toast } from "sonner"

type Tab = "estoque" | "movimentacoes" | "apropriacoes" | "transferencias"

export default function EstoquePage() {
  const [selectedObraId, setSelectedObraId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<Tab>("estoque")

  const { data: obras = [], isLoading: loadingObras } = trpc.obra.listar.useQuery()

  const obraSelecionada = obras.find((o) => o.id === selectedObraId)
  const siengeId = obraSelecionada?.siengeId ? parseInt(obraSelecionada.siengeId) : null

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Package size={18} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Gestão de Estoque e Inventário
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Controle de materiais, movimentações e transferências entre obras
          </p>
        </div>
      </div>

      {/* Obra selector */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 block">
          Selecionar Obra
        </label>
        <div className="relative">
          <select
            value={selectedObraId}
            onChange={(e) => setSelectedObraId(e.target.value)}
            className="w-full appearance-none bg-muted/30 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">
              {loadingObras ? "Carregando obras..." : "Selecione uma obra"}
            </option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nome}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
        {(
          [
            { key: "estoque", label: "Estoque", icon: Package },
            { key: "movimentacoes", label: "Movimentações", icon: ClipboardList },
            { key: "apropriacoes", label: "Apropriações", icon: FileText },
            { key: "transferencias", label: "Transferências", icon: ArrowRightLeft },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === key
                ? "bg-white text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {!selectedObraId ? (
        <div className="text-center py-16">
          <Package size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Selecione uma obra
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Escolha uma obra acima para visualizar o estoque e movimentações.
          </p>
        </div>
      ) : (
        <>
          {activeTab === "estoque" && (
            <TabEstoque obraId={selectedObraId} />
          )}
          {activeTab === "movimentacoes" && (
            <TabMovimentacoes obraId={selectedObraId} buildingId={siengeId} />
          )}
          {activeTab === "apropriacoes" && (
            <TabApropriacoes buildingId={siengeId} />
          )}
          {activeTab === "transferencias" && (
            <TabTransferencias obras={obras} />
          )}
        </>
      )}
    </div>
  )
}

/* ─── Tab Estoque ─── */
function TabEstoque({ obraId }: { obraId: string }) {
  const [showModal, setShowModal] = useState(false)

  const { data: estoque = [], isLoading: loadingEstoque } =
    trpc.sienge.listarEstoque.useQuery({ obraId })
  const { data: saldos = [], isLoading: loadingSaldos } =
    trpc.movimentacao.saldoPorMaterial.useQuery({ obraId })

  const saldoMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of saldos) {
      map.set(String(s.material.id), s.saldo)
    }
    return map
  }, [saldos])

  const mergedItems = useMemo(() => {
    const items: Array<{
      id: number
      nome: string
      unidade: string
      categoria: string
      saldo: number
    }> = []

    const seen = new Set<string>()

    for (const item of estoque as Array<{
      id?: number
      materialId?: number
      nome?: string
      material?: string
      unidade?: string
      categoria?: string
      saldo?: number
      quantidade?: number
    }>) {
      const id = item.id ?? item.materialId ?? 0
      const idStr = String(id)
      seen.add(idStr)
      items.push({
        id,
        nome: item.nome ?? item.material ?? "—",
        unidade: item.unidade ?? "—",
        categoria: item.categoria ?? "Geral",
        saldo: item.saldo ?? item.quantidade ?? saldoMap.get(idStr) ?? 0,
      })
    }

    for (const s of saldos) {
      if (!seen.has(String(s.material.id))) {
        items.push({
          id: 0,
          nome: s.material.nome,
          unidade: s.material.unidade ?? "—",
          categoria: s.material.categoria ?? "Geral",
          saldo: s.saldo,
        })
        seen.add(String(s.material.id))
      }
    }

    return items
  }, [estoque, saldos, saldoMap])

  const totalItens = mergedItems.length
  const itensCriticos = mergedItems.filter((i) => i.saldo < 0).length
  const categorias = new Set(mergedItems.map((i) => i.categoria)).size

  const isLoading = loadingEstoque || loadingSaldos

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Total Itens"
          value={isLoading ? "…" : String(totalItens)}
          icon={Package}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KpiCard
          label="Itens Críticos"
          value={isLoading ? "…" : String(itensCriticos)}
          icon={AlertTriangle}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
        <KpiCard
          label="Categorias"
          value={isLoading ? "…" : String(categorias)}
          icon={Layers}
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Itens em Estoque
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus size={12} />
            Lançar Movimentação
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : mergedItems.length === 0 ? (
          <div className="text-center py-12">
            <Package size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Nenhum item no estoque
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Lance uma movimentação para adicionar itens ao estoque.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                    Material
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                    Unidade
                  </th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                    Saldo
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                    Categoria
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mergedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-semibold text-[var(--text-primary)]">
                      {item.nome}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">
                      {item.unidade}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-mono font-semibold ${
                        item.saldo < 0 ? "text-red-600" : "text-[var(--text-primary)]"
                      }`}
                    >
                      {item.saldo.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-[var(--text-muted)]">
                        {item.categoria}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Lançar Movimentação */}
      {showModal && (
        <ModalLancarMovimentacao
          obraId={obraId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

/* ─── Modal Lançar Movimentação ─── */
function ModalLancarMovimentacao({
  obraId,
  onClose,
}: {
  obraId: string
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const [materialId, setMaterialId] = useState("")
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA">("ENTRADA")
  const [quantidade, setQuantidade] = useState("")
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [observacao, setObservacao] = useState("")

  const mutation = trpc.sienge.lancarMovimentacao.useMutation({
    onSuccess: () => {
      toast.success("Movimentação lançada com sucesso!")
      utils.sienge.listarEstoque.invalidate()
      utils.movimentacao.saldoPorMaterial.invalidate()
      utils.sienge.listarMovimentacoesInventario.invalidate()
      onClose()
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao lançar movimentação")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialId || !quantidade) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    mutation.mutate({
      obraId,
      materialId: Number(materialId),
      tipo,
      quantidade: Number(quantidade),
      data,
      observacao: observacao || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Lançar Movimentação
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
              ID do Material *
            </label>
            <input
              type="number"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              placeholder="Ex: 1234"
              className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
              Tipo *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "ENTRADA" | "SAIDA")}
              className="w-full appearance-none bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
              Quantidade *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
              className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
              Data
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              placeholder="Observações opcionais..."
              className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Lançar
          </button>
        </form>
      </div>
    </div>
  )
}

/* ─── Tab Movimentações ─── */
function TabMovimentacoes({
  obraId,
  buildingId,
}: {
  obraId: string
  buildingId: number | null
}) {
  const [page, setPage] = useState(0)
  const [selectedMovId, setSelectedMovId] = useState<number | null>(null)

  const enabled = buildingId != null
  const { data: movimentacoes, isLoading } =
    trpc.sienge.listarMovimentacoesInventario.useQuery(
      { buildingId: buildingId ?? 0 },
      { enabled }
    )

  const { data: detalhe, isLoading: loadingDetalhe } =
    trpc.sienge.buscarMovimentacaoInventario.useQuery(
      { movimentacaoId: selectedMovId ?? 0 },
      { enabled: enabled && selectedMovId != null }
    )

  const items = (movimentacoes as Array<{
    id?: number
    movimentacaoId?: number
    data?: string
    material?: string
    tipo?: string
    quantidade?: number
  }>) ?? []

  if (!enabled) {
    return (
      <div className="text-center py-12">
        <ClipboardList size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Obra sem integração Sienge
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          A obra selecionada não possui um ID Sienge vinculado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Movimentações de Inventário
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Nenhuma movimentação encontrada
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                      Data
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                      Material
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                      Tipo
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                      Quantidade
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((mov, idx) => {
                    const movId = mov.id ?? mov.movimentacaoId ?? idx
                    return (
                      <tr
                        key={movId}
                        onClick={() => setSelectedMovId(typeof movId === "number" ? movId : null)}
                        className="hover:bg-muted/20 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3 text-[var(--text-muted)]">
                          {mov.data ?? "—"}
                        </td>
                        <td className="px-5 py-3 font-semibold text-[var(--text-primary)]">
                          {mov.material ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              mov.tipo === "ENTRADA"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {mov.tipo ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-[var(--text-primary)]">
                          {mov.quantidade != null
                            ? mov.quantidade.toLocaleString("pt-BR")
                            : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                Página {page + 1}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={items.length < 20}
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </div>

      {/* Detail panel */}
      {selectedMovId != null && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Detalhe da Movimentação #{selectedMovId}
            </h3>
            <button
              onClick={() => setSelectedMovId(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {loadingDetalhe ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : detalhe ? (
            <pre className="text-xs text-[var(--text-muted)] bg-muted/30 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(detalhe, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Nenhum detalhe disponível.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Tab Apropriações ─── */
function TabApropriacoes({ buildingId }: { buildingId: number | null }) {
  const [page, setPage] = useState(0)

  const enabled = buildingId != null
  const { data: apropriacoes, isLoading } =
    trpc.sienge.listarApropriacoesInventario.useQuery(
      { inventoryCountId: 0, resourceId: 0 },
      { enabled: false }
    )

  const items = (apropriacoes as Array<{
    id?: number
    data?: string
    material?: string
    quantidade?: number
    destino?: string
    responsavel?: string
  }>) ?? []

  if (!enabled) {
    return (
      <div className="text-center py-12">
        <FileText size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Obra sem integração Sienge
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          A obra selecionada não possui um ID Sienge vinculado.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">
          Apropriações de Inventário
        </h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Nenhuma apropriação encontrada
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                    Data
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                    Material
                  </th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                    Quantidade
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                    Destino
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                    Responsável
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((ap, idx) => (
                  <tr key={ap.id ?? idx} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 text-[var(--text-muted)]">
                      {ap.data ?? "—"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[var(--text-primary)]">
                      {ap.material ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[var(--text-primary)]">
                      {ap.quantidade != null
                        ? ap.quantidade.toLocaleString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">
                      {ap.destino ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">
                      {ap.responsavel ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
            >
              Anterior
            </button>
            <span className="text-xs text-[var(--text-muted)]">
              Página {page + 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={items.length < 20}
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Tab Transferências ─── */
function TabTransferencias({
  obras,
}: {
  obras: Array<{ id: string; nome: string; siengeId?: string | number | null }>
}) {
  const utils = trpc.useUtils()
  const [fromBuildingId, setFromBuildingId] = useState("")
  const [toBuildingId, setToBuildingId] = useState("")
  const [materialId, setMaterialId] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [observacao, setObservacao] = useState("")

  const obrasComSienge = obras.filter((o) => o.siengeId != null)

  const mutation = trpc.sienge.transferirEstoque.useMutation({
    onSuccess: () => {
      toast.success("Transferência realizada com sucesso!")
      utils.sienge.listarEstoque.invalidate()
      utils.movimentacao.saldoPorMaterial.invalidate()
      setFromBuildingId("")
      setToBuildingId("")
      setMaterialId("")
      setQuantidade("")
      setObservacao("")
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao transferir estoque")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromBuildingId || !toBuildingId || !materialId || !quantidade) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    if (fromBuildingId === toBuildingId) {
      toast.error("Obra de origem e destino devem ser diferentes")
      return
    }
    mutation.mutate({
      fromBuildingId: Number(fromBuildingId),
      toBuildingId: Number(toBuildingId),
      materialId: Number(materialId),
      quantidade: Number(quantidade),
      observacao: observacao || undefined,
    })
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Transferir Estoque entre Obras
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
                Obra Origem *
              </label>
              <select
                value={fromBuildingId}
                onChange={(e) => setFromBuildingId(e.target.value)}
                className="w-full appearance-none bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                required
              >
                <option value="">Selecione</option>
                {obrasComSienge.map((o) => (
                  <option key={o.id} value={String(o.siengeId)}>
                    {o.nome} (Sienge #{o.siengeId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
                Obra Destino *
              </label>
              <select
                value={toBuildingId}
                onChange={(e) => setToBuildingId(e.target.value)}
                className="w-full appearance-none bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                required
              >
                <option value="">Selecione</option>
                {obrasComSienge.map((o) => (
                  <option key={o.id} value={String(o.siengeId)}>
                    {o.nome} (Sienge #{o.siengeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
                ID do Material *
              </label>
              <input
                type="number"
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                placeholder="Ex: 1234"
                className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
                Quantidade *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="0"
                className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              placeholder="Motivo da transferência..."
              className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            <ArrowRightLeft size={14} />
            Transferir
          </button>
        </form>
      </div>

      {/* Info card */}
      <div className="bg-muted/30 rounded-2xl border border-border p-5">
        <div className="flex items-start gap-3">
          <ArrowRightLeft size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              Sobre Transferências
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              As transferências movem materiais entre obras integradas ao Sienge.
              Apenas obras com ID Sienge vinculado aparecem nas opções. Após a
              transferência, os saldos de ambas as obras serão atualizados
              automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Shared KPI Card ─── */
function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}
