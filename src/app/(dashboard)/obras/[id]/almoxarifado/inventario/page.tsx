"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ClipboardList, Search, Loader2, FileText } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { useMovimentacoesInventario, useBuscarMovimentacaoInventario, useApropriacoesInventario } from "@/hooks/useEstoque"

type Tab = "movimentacoes" | "apropriacoes"

export default function InventarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: obraId } = use(params)
  const [tab, setTab] = useState<Tab>("movimentacoes")

  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const siengeId = obra?.siengeId ? Number(obra.siengeId) : undefined

  // Filtros de movimentações
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const { movimentacoes, isLoading: loadingMovs } = useMovimentacoesInventario({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    buildingId: siengeId,
  })

  // Detalhe de movimentação
  const [selectedMovId, setSelectedMovId] = useState<number | null>(null)
  const { movimentacao: movDetalhe, isLoading: loadingDetalhe } = useBuscarMovimentacaoInventario(selectedMovId)

  // Apropriações
  const [inventoryCountId, setInventoryCountId] = useState("")
  const [resourceId, setResourceId] = useState("")
  const { apropriacoes, isLoading: loadingAprop } = useApropriacoesInventario(
    inventoryCountId ? Number(inventoryCountId) : null,
    resourceId ? Number(resourceId) : null,
  )

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "movimentacoes", label: "Movimentações", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "apropriacoes", label: "Apropriações", icon: <FileText className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/obras/${obraId}/almoxarifado`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Inventário</h1>
          <p className="text-sm text-muted-foreground">Movimentações e apropriações do inventário Sienge</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {!siengeId && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 text-sm">
          Esta obra não possui integração Sienge configurada. Configure o ID Sienge nas configurações da obra.
        </div>
      )}

      {/* Movimentações */}
      {tab === "movimentacoes" && siengeId && (
        <div className="space-y-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-xs text-muted-foreground">Data início</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="block border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Data fim</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="block border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>

          {loadingMovs ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Carregando movimentações...
            </div>
          ) : movimentacoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma movimentação encontrada.</p>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">ID</th>
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium">Data</th>
                    <th className="text-left px-4 py-3 font-medium">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(movimentacoes as any[]).map((mov: any, i: number) => (
                    <tr key={mov.id ?? i} className="hover:bg-muted/30">
                      <td className="px-4 py-3">{mov.id ?? "-"}</td>
                      <td className="px-4 py-3">{mov.type ?? mov.tipo ?? "-"}</td>
                      <td className="px-4 py-3">{mov.date ?? mov.data ?? "-"}</td>
                      <td className="px-4 py-3">{mov.description ?? mov.descricao ?? "-"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedMovId(mov.id)} className="text-blue-600 hover:underline flex items-center gap-1">
                          <Search className="w-3 h-3" /> Detalhe
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detalhe da movimentação */}
          {selectedMovId && (
            <div className="border rounded-lg p-4 bg-muted/20 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Detalhe da Movimentação #{selectedMovId}</h3>
                <button onClick={() => setSelectedMovId(null)} className="text-muted-foreground hover:text-foreground text-sm">
                  Fechar
                </button>
              </div>
              {loadingDetalhe ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : movDetalhe ? (
                <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-60">
                  {JSON.stringify(movDetalhe, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-sm">Movimentação não encontrada.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Apropriações */}
      {tab === "apropriacoes" && siengeId && (
        <div className="space-y-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-xs text-muted-foreground">ID Inventário</label>
              <input type="number" value={inventoryCountId} onChange={(e) => setInventoryCountId(e.target.value)}
                placeholder="Ex: 1001" className="block border rounded-md px-3 py-2 text-sm w-40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">ID Recurso</label>
              <input type="number" value={resourceId} onChange={(e) => setResourceId(e.target.value)}
                placeholder="Ex: 5002" className="block border rounded-md px-3 py-2 text-sm w-40" />
            </div>
          </div>

          {!inventoryCountId || !resourceId ? (
            <p className="text-muted-foreground text-center py-8">Informe o ID do inventário e do recurso para consultar apropriações.</p>
          ) : loadingAprop ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Carregando apropriações...
            </div>
          ) : apropriacoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma apropriação encontrada.</p>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Obra</th>
                    <th className="text-left px-4 py-3 font-medium">Quantidade</th>
                    <th className="text-left px-4 py-3 font-medium">Valor</th>
                    <th className="text-left px-4 py-3 font-medium">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(apropriacoes as any[]).map((ap: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-3">{ap.buildingName ?? ap.obraNome ?? "-"}</td>
                      <td className="px-4 py-3">{ap.quantity ?? ap.quantidade ?? "-"}</td>
                      <td className="px-4 py-3">{ap.value ?? ap.valor ?? "-"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{ap.description ?? ap.descricao ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
