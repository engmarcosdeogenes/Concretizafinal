"use client"

import { trpc } from "@/lib/trpc/client"

/**
 * Hook centralizado para operações de estoque e inventário via Sienge.
 */
export function useEstoque(obraId: string) {
  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const siengeId = obra?.siengeId ? Number(obra.siengeId) : undefined

  const estoque = trpc.sienge.listarEstoque.useQuery(
    { obraId },
    { enabled: !!siengeId },
  )

  return {
    obra,
    siengeId,
    estoque: estoque.data ?? [],
    isLoading: estoque.isLoading,
    error: estoque.error,
    hasSienge: !!siengeId,
  }
}

export function useSaldoPorMaterial(obraId: string) {
  const saldos = trpc.movimentacao.saldoPorMaterial.useQuery({ obraId })

  return {
    saldos: saldos.data ?? [],
    isLoading: saldos.isLoading,
    error: saldos.error,
  }
}

export function useMovimentacoesInventario(filters: {
  startDate?: string
  endDate?: string
  buildingId?: number
}) {
  const movimentacoes = trpc.sienge.listarMovimentacoesInventario.useQuery(
    filters,
    { enabled: filters.buildingId != null },
  )

  return {
    movimentacoes: movimentacoes.data ?? [],
    isLoading: movimentacoes.isLoading,
    error: movimentacoes.error,
  }
}

export function useBuscarMovimentacaoInventario(movimentacaoId: number | null) {
  const mov = trpc.sienge.buscarMovimentacaoInventario.useQuery(
    { movimentacaoId: movimentacaoId! },
    { enabled: movimentacaoId != null },
  )

  return {
    movimentacao: mov.data,
    isLoading: mov.isLoading,
    error: mov.error,
  }
}

export function useApropriacoesInventario(inventoryCountId: number | null, resourceId: number | null) {
  const apropriacoes = trpc.sienge.listarApropriacoesInventario.useQuery(
    { inventoryCountId: inventoryCountId!, resourceId: resourceId! },
    { enabled: inventoryCountId != null && resourceId != null },
  )

  return {
    apropriacoes: apropriacoes.data ?? [],
    isLoading: apropriacoes.isLoading,
    error: apropriacoes.error,
  }
}

export function useTransferirEstoque() {
  const utils = trpc.useUtils()
  return trpc.sienge.transferirEstoque.useMutation({
    onSuccess: () => {
      utils.sienge.listarEstoque.invalidate()
    },
  })
}

export function useLancarMovimentacao() {
  const utils = trpc.useUtils()
  return trpc.sienge.lancarMovimentacao.useMutation({
    onSuccess: () => {
      utils.sienge.listarEstoque.invalidate()
      utils.movimentacao.listar.invalidate()
    },
  })
}
