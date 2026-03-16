import { trpc } from "@/lib/trpc/client"

/**
 * Hook para buscar dados do histograma de mão de obra (por função e por mês).
 * Usa a rota analises.histogramaMO.
 */
export function useHistogramaMO(obraId?: string) {
  const { data, isLoading, error } = trpc.analises.histogramaMO.useQuery(
    { obraId },
    { enabled: true }
  )

  return {
    porFuncao: data?.porFuncao ?? [],
    porMes: data?.porMes ?? [],
    isLoading,
    error,
  }
}
