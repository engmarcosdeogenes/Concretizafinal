"use client"

import { trpc } from "@/lib/trpc/client"

/**
 * Hook centralizado para gestão de obras e importação via Sienge.
 * Rotas: obra.listar, integracoes.importarObras, auditLog.listarPorObra
 */
export function useObrasListar(grupo?: string) {
  const query = trpc.obra.listar.useQuery(grupo ? { grupo } : undefined)

  return {
    obras: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useImportarObras() {
  const utils = trpc.useUtils()
  return trpc.integracoes.importarObras.useMutation({
    onSuccess: () => {
      utils.obra.listar.invalidate()
    },
  })
}

export function useHistoricoObra(obraId: string, take = 30) {
  const query = trpc.auditLog.listarPorObra.useQuery(
    { obraId, take },
    { enabled: !!obraId },
  )

  return {
    historico: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
