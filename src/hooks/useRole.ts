import { trpc } from "@/lib/trpc/client"

type Role = "DONO" | "ADMIN" | "ENGENHEIRO" | "MESTRE" | "ENCARREGADO"

export function useRole() {
  const { data } = trpc.configuracoes.buscarPerfil.useQuery()
  const role = (data?.role ?? "ENCARREGADO") as Role
  return {
    role,
    /** Pode excluir registros (FVS, FVM, Ocorrências, RDO) */
    canDelete:   ["DONO", "ADMIN", "ENGENHEIRO"].includes(role),
    /** Pode editar dados da obra (nome, status, datas) */
    canEditObra: ["DONO", "ADMIN"].includes(role),
    /** Pode criar/editar FVS e FVM (controle de qualidade) */
    canFvs:      ["DONO", "ADMIN", "ENGENHEIRO", "MESTRE"].includes(role),
  }
}
