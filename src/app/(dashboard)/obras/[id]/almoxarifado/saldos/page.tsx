"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Package } from "lucide-react"
import { useSaldoPorMaterial } from "@/hooks/useEstoque"

export default function SaldosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: obraId } = use(params)
  const { saldos, isLoading, error } = useSaldoPorMaterial(obraId)

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/obras/${obraId}/almoxarifado`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Saldos por Material</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada do saldo de cada material no estoque</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Carregando saldos...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
          Erro ao carregar saldos: {error.message}
        </div>
      ) : saldos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma movimentação registrada para esta obra.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Material</th>
                <th className="text-left px-4 py-3 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 font-medium">Unidade</th>
                <th className="text-right px-4 py-3 font-medium">Saldo</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {saldos.map((item) => (
                <tr key={item.material.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{item.material.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.material.categoria ?? "-"}</td>
                  <td className="px-4 py-3">{item.material.unidade}</td>
                  <td className="px-4 py-3 text-right font-mono">{item.saldo.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    {item.saldo <= 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Zerado
                      </span>
                    ) : item.saldo < 10 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Baixo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
