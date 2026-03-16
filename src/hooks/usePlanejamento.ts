"use client"

import { trpc } from "@/lib/trpc/client"

/**
 * Hook centralizado para operações de Planejamento via Sienge.
 * Cobre: listarTarefas (Sienge), inserirTarefasPlanilha, salvarMateriais (RDO).
 */
export function useTarefasSienge(obraId: string) {
  const { data: obra } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  const siengeId = obra?.siengeId ? Number(obra.siengeId) : undefined

  const tarefas = trpc.sienge.listarTarefas.useQuery(
    { obraId },
    { enabled: !!siengeId },
  )

  return {
    obra,
    siengeId,
    projetos: tarefas.data ?? [],
    isLoading: tarefas.isLoading,
    error: tarefas.error,
    hasSienge: !!siengeId,
  }
}

export function useInserirTarefasPlanilha() {
  const utils = trpc.useUtils()
  return trpc.sienge.inserirTarefasPlanilha.useMutation({
    onSuccess: () => {
      utils.sienge.listarTarefas.invalidate()
    },
  })
}

export function useSalvarMateriaisRdo() {
  const utils = trpc.useUtils()
  return trpc.rdo.salvarMateriais.useMutation({
    onSuccess: () => {
      utils.rdo.buscarDiarioObra.invalidate()
    },
  })
}

export function useTarefasObra(obraId: string) {
  const tarefas = trpc.tarefaObra.listar.useQuery({ obraId })

  return {
    tarefas: tarefas.data ?? [],
    isLoading: tarefas.isLoading,
    error: tarefas.error,
    refetch: tarefas.refetch,
  }
}
