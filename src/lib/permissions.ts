import type { RoleEmpresa } from "@prisma/client"

// Hierarquia de roles (maior número = mais permissão)
const ROLE_LEVEL: Record<RoleEmpresa, number> = {
  ENCARREGADO: 1,
  MESTRE:      2,
  ENGENHEIRO:  3,
  ADMIN:       4,
  DONO:        5,
}

export function hasRole(userRole: RoleEmpresa, required: RoleEmpresa): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[required]
}

export function canManageUsers(role: RoleEmpresa): boolean {
  return hasRole(role, "ADMIN")
}

export function canInviteMembers(role: RoleEmpresa): boolean {
  return hasRole(role, "ADMIN")
}

export function canManageObras(role: RoleEmpresa): boolean {
  return hasRole(role, "ENGENHEIRO")
}

export function canViewFinanceiro(role: RoleEmpresa): boolean {
  return hasRole(role, "ADMIN")
}

export const ROLE_LABELS: Record<RoleEmpresa, string> = {
  DONO:        "Dono",
  ADMIN:       "Administrador",
  ENGENHEIRO:  "Engenheiro",
  MESTRE:      "Mestre de Obras",
  ENCARREGADO: "Encarregado",
}

export const ROLE_COLORS: Record<RoleEmpresa, string> = {
  DONO:        "bg-purple-50 text-purple-700",
  ADMIN:       "bg-blue-50 text-blue-700",
  ENGENHEIRO:  "bg-green-50 text-green-700",
  MESTRE:      "bg-yellow-50 text-yellow-700",
  ENCARREGADO: "bg-slate-50 text-slate-600",
}
