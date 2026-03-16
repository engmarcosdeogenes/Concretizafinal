"use client"

import { trpc } from "@/lib/trpc/client"

/**
 * Hook centralizado para operações de orçamento via Sienge.
 */
export function useOrcamento(obraId: string) {
  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })

  const orcamentos = trpc.sienge.listarOrcamento.useQuery(
    { obraId },
    { enabled: !!obra?.siengeId },
  )

  return {
    obra,
    orcamentos: orcamentos.data ?? [],
    isLoading: orcamentos.isLoading,
    error: orcamentos.error,
    hasSienge: !!obra?.siengeId,
  }
}

export function useOrcamentoPlanilhas(estimationId: number | null) {
  const planilhas = trpc.sienge.listarPlanilhasOrcamento.useQuery(
    { estimationId: estimationId! },
    { enabled: estimationId != null },
  )

  return {
    planilhas: planilhas.data ?? [],
    isLoading: planilhas.isLoading,
    error: planilhas.error,
  }
}

export function useInsumoOrcamento(estimationId: number, resourceId: number | null) {
  const insumo = trpc.sienge.buscarInsumoOrcamento.useQuery(
    { estimationId, resourceId: resourceId! },
    { enabled: resourceId != null },
  )

  return {
    insumo: insumo.data,
    isLoading: insumo.isLoading,
    error: insumo.error,
  }
}

export function useAdicionarInsumo() {
  const utils = trpc.useUtils()
  return trpc.sienge.adicionarInsumoOrcamento.useMutation({
    onSuccess: () => {
      utils.sienge.listarOrcamento.invalidate()
    },
  })
}

export function useAtualizarInsumo() {
  const utils = trpc.useUtils()
  return trpc.sienge.atualizarInsumoOrcamento.useMutation({
    onSuccess: () => {
      utils.sienge.listarOrcamento.invalidate()
    },
  })
}

export function useBulkBudgetItems(buildingId: number | null) {
  const items = trpc.sienge.listarBulkBudgetItems.useQuery(
    { buildingId: buildingId! },
    { enabled: buildingId != null },
  )

  return {
    items: items.data ?? [],
    isLoading: items.isLoading,
    error: items.error,
  }
}

export function useBulkBusinessBudgets(buildingId: number | null) {
  const budgets = trpc.sienge.listarBulkBusinessBudgets.useQuery(
    { buildingId: buildingId! },
    { enabled: buildingId != null },
  )

  return {
    budgets: budgets.data ?? [],
    isLoading: budgets.isLoading,
    error: budgets.error,
  }
}

export function useBulkBuildingResources(buildingId: number | null) {
  const resources = trpc.sienge.listarBulkBuildingResources.useQuery(
    { buildingId: buildingId! },
    { enabled: buildingId != null },
  )

  return {
    resources: resources.data ?? [],
    isLoading: resources.isLoading,
    error: resources.error,
  }
}
